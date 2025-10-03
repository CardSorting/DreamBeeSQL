import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import {
  PostgresCursorConstructor,
  PostgresDialectConfig,
  PostgresPool,
  PostgresPoolClient,
} from './postgres-dialect-config.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class PostgresDriver implements Driver {
  readonly #config: PostgresDialectConfig
  readonly #connections = new WeakMap<PostgresPoolClient, DatabaseConnection>()
  #pool?: PostgresPool
  #isInitialized = false
  #isDestroyed = false

  constructor(config: PostgresDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    if (this.#isInitialized) {
      return
    }

    try {
      this.#pool = isFunction(this.#config.pool)
        ? await this.#config.pool()
        : this.#config.pool

      // Test the connection
      const testConnection = await this.#pool!.connect()
      await testConnection.query('SELECT 1', [])
      testConnection.release()

      this.#isInitialized = true
      console.log('✅ PostgreSQL driver initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL driver:', error)
      throw error
    }
  }

  async destroy(): Promise<void> {
    if (this.#isDestroyed || !this.#pool) {
      return
    }

    try {
      await this.#pool.end()
      this.#isDestroyed = true
      console.log('✅ PostgreSQL driver destroyed successfully')
    } catch (error) {
      console.error('❌ Failed to destroy PostgreSQL driver:', error)
      throw error
    }
  }

  get isInitialized(): boolean {
    return this.#isInitialized && !this.#isDestroyed
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client, {
        cursor: this.#config.cursor ?? null,
      })
      this.#connections.set(client, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    if (this.#config.onReserveConnection) {
      await this.#config.onReserveConnection(connection)
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    if (settings.isolationLevel || settings.accessMode) {
      let sql = 'start transaction'

      if (settings.isolationLevel) {
        sql += ` isolation level ${settings.isolationLevel}`
      }

      if (settings.accessMode) {
        sql += ` ${settings.accessMode}`
      }

      await connection.executeQuery(CompiledQuery.raw(sql))
    } else {
      await connection.executeQuery(CompiledQuery.raw('begin'))
    }
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async savepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('savepoint', savepointName),
        createQueryId(),
      ),
    )
  }

  async rollbackToSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('rollback to', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('release', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseConnection(connection: PostgresConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]()
  }
}

interface PostgresConnectionOptions {
  cursor: PostgresCursorConstructor | null
}

class PostgresConnection implements DatabaseConnection {
  #client: PostgresPoolClient
  #options: PostgresConnectionOptions
  #isReleased = false
  #queryCount = 0

  constructor(client: PostgresPoolClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    // Allow queries even if connection is marked as released, 
    // as the actual client might still be available

    const startTime = Date.now()
    this.#queryCount++

    try {
      const { command, rowCount, rows } = await this.#client.query<O>(
        compiledQuery.sql,
        [...compiledQuery.parameters],
      )

      const duration = Date.now() - startTime
      
      // Log slow queries (>100ms)
      if (duration > 100) {
        console.warn(`🐌 Slow PostgreSQL query (${duration}ms): ${compiledQuery.sql.substring(0, 100)}...`)
      }

      return {
        numAffectedRows:
          command === 'INSERT' ||
          command === 'UPDATE' ||
          command === 'DELETE' ||
          command === 'MERGE'
            ? BigInt(rowCount)
            : undefined,
        rows: rows ?? [],
      }
    } catch (err) {
      const duration = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error(`❌ PostgreSQL query failed (${duration}ms):`, {
        sql: compiledQuery.sql.substring(0, 200) + '...',
        parameters: compiledQuery.parameters,
        error: errorMessage
      })
      throw extendStackTrace(err as Error, new Error())
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    if (!this.#isReleased) {
      this.#isReleased = true
      this.#client.release()
      console.log(`🔌 PostgreSQL connection released (${this.#queryCount} queries executed)`)
    }
  }

  get isReleased(): boolean {
    return this.#isReleased
  }

  get queryCount(): number {
    return this.#queryCount
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres.",
      )
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    const cursor = this.#client.query(
      new this.#options.cursor<O>(
        compiledQuery.sql,
        compiledQuery.parameters.slice(),
      ),
    )

    try {
      while (true) {
        const rows = await cursor.read(chunkSize)

        if (rows.length === 0) {
          break
        }

        yield {
          rows,
        }
      }
    } finally {
      await cursor.close()
    }
  }
}
