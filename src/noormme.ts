import type { Kysely } from './kysely.js'
import type { Dialect } from './dialect/dialect.js'
import { DatabaseIntrospector } from './dialect/database-introspector'
import { SchemaDiscovery } from './schema/schema-discovery.js'
import { TypeGenerator } from './types/type-generator.js'
import { RepositoryFactory } from './repository/repository-factory'
import { RelationshipEngine } from './relationships/relationship-engine'
import { CacheManager } from './cache/cache-manager'
import { Logger } from './logging/logger'
import { NOORMConfig, SchemaInfo, Repository, RelationshipInfo } from './types'

/**
 * NOORMME - No ORM, just magic!
 * Zero-configuration pseudo-ORM that works with any existing database
 */
export class NOORMME {
  private db: Kysely<any>
  private config: NOORMConfig
  private schemaDiscovery: SchemaDiscovery
  private typeGenerator: TypeGenerator
  private repositoryFactory: RepositoryFactory
  private relationshipEngine: RelationshipEngine
  private cacheManager: CacheManager
  private logger: Logger
  private initialized = false
  private repositories = new Map<string, Repository<any>>()

  constructor(config: NOORMConfig) {
    this.config = this.mergeConfig(config)
    this.logger = new Logger(this.config.logging)
    this.cacheManager = new CacheManager(this.config.cache)
    
    // Initialize Kysely with the provided dialect
    this.db = new (require('./kysely.js').Kysely)({
      dialect: this.createDialect(),
      log: this.config.logging?.enabled ? this.logger.createKyselyLogger() : undefined
    })

    // Initialize core components
    this.schemaDiscovery = new SchemaDiscovery(this.db, this.config.introspection)
    this.typeGenerator = new TypeGenerator(this.config.introspection)
    this.repositoryFactory = new RepositoryFactory(this.db, this.config.performance)
    this.relationshipEngine = new RelationshipEngine(this.db, this.config.performance)
  }

  /**
   * Initialize NOORMME - discovers schema and generates types
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('NOORMME already initialized')
      return
    }

    try {
      this.logger.info('Initializing NOORMME...')

      // Test database connection
      await this.db.selectFrom('information_schema.tables').select('table_name').limit(1).execute()
      this.logger.info('Database connection successful')

      // Discover schema
      this.logger.info('Discovering database schema...')
      const schemaInfo = await this.schemaDiscovery.discoverSchema()
      this.logger.info(`Discovered ${schemaInfo.tables.length} tables`)

      // Generate types
      this.logger.info('Generating TypeScript types...')
      const generatedTypes = this.typeGenerator.generateTypes(schemaInfo)
      this.logger.info(`Generated types for ${generatedTypes.entities.length} entities`)

      // Cache schema and types
      await this.cacheManager.set('schema', schemaInfo)
      await this.cacheManager.set('types', generatedTypes)

      // Initialize relationship engine
      this.relationshipEngine.initialize(schemaInfo.relationships)

      this.initialized = true
      this.logger.info('NOORMME initialized successfully!')

    } catch (error) {
      this.logger.error('Failed to initialize NOORMME:', error)
      throw error
    }
  }

  /**
   * Get a repository for the specified table
   */
  getRepository<T>(tableName: string): Repository<T> {
    if (!this.initialized) {
      throw new Error('NOORMME must be initialized before getting repositories. Call await db.initialize() first.')
    }

    if (this.repositories.has(tableName)) {
      return this.repositories.get(tableName)!
    }

    const schemaInfo = this.cacheManager.get<SchemaInfo>('schema')
    if (!schemaInfo) {
      throw new Error('Schema not found. Please reinitialize NOORMME.')
    }

    const table = schemaInfo.tables.find(t => t.name === tableName)
    if (!table) {
      throw new Error(`Table '${tableName}' not found in schema. Available tables: ${schemaInfo.tables.map(t => t.name).join(', ')}`)
    }

    const repository = this.repositoryFactory.createRepository<T>(table, schemaInfo.relationships)
    this.repositories.set(tableName, repository)
    
    return repository
  }

  /**
   * Get schema information
   */
  async getSchemaInfo(): Promise<SchemaInfo> {
    if (!this.initialized) {
      throw new Error('NOORMME must be initialized first')
    }

    const cached = this.cacheManager.get<SchemaInfo>('schema')
    if (cached) {
      return cached
    }

    // Re-discover schema if not cached
    return await this.schemaDiscovery.discoverSchema()
  }

  /**
   * Refresh schema (useful when database structure changes)
   */
  async refreshSchema(): Promise<SchemaInfo> {
    this.logger.info('Refreshing schema...')
    
    const schemaInfo = await this.schemaDiscovery.discoverSchema()
    const generatedTypes = this.typeGenerator.generateTypes(schemaInfo)

    // Update cache
    await this.cacheManager.set('schema', schemaInfo)
    await this.cacheManager.set('types', generatedTypes)

    // Clear existing repositories
    this.repositories.clear()

    // Reinitialize relationship engine
    this.relationshipEngine.initialize(schemaInfo.relationships)

    this.logger.info('Schema refreshed successfully')
    return schemaInfo
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<NOORMConfig>): void {
    this.config = this.mergeConfig({ ...this.config, ...updates })
    
    // Update components with new config
    if (this.config.logging) {
      this.logger.updateConfig(this.config.logging)
    }
    if (this.config.cache) {
      this.cacheManager.updateConfig(this.config.cache)
    }
    
    this.logger.info('Configuration updated')
  }

  /**
   * Monitor schema changes (experimental)
   */
  onSchemaChange(callback: (changes: any[]) => void): void {
    // TODO: Implement schema change monitoring
    this.logger.warn('Schema change monitoring not yet implemented')
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      queryCount: this.logger.getQueryCount(),
      averageQueryTime: this.logger.getAverageQueryTime(),
      cacheHitRate: this.cacheManager.getHitRate(),
      repositoryCount: this.repositories.size
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    this.logger.info('Closing NOORMME...')
    
    await this.db.destroy()
    await this.cacheManager.close()
    
    this.initialized = false
    this.repositories.clear()
    
    this.logger.info('NOORMME closed')
  }

  /**
   * Get the underlying Kysely instance for custom queries
   */
  getKysely(): Kysely<any> {
    return this.db
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (trx: Kysely<any>) => Promise<T>): Promise<T> {
    return await this.db.transaction().execute(callback)
  }

  /**
   * Execute raw SQL
   */
  async execute(sql: string, parameters?: any[]): Promise<any> {
    return await this.db.executeQuery({
      sql,
      parameters: parameters || []
    } as any)
  }

  private mergeConfig(config: NOORMConfig): NOORMConfig {
    return {
      dialect: config.dialect,
      connection: config.connection,
      introspection: {
        includeViews: false,
        excludeTables: [],
        customTypeMappings: {},
        ...config.introspection
      },
      cache: {
        ttl: 300000, // 5 minutes
        maxSize: 1000,
        strategy: 'lru',
        ...config.cache
      },
      logging: {
        level: 'info',
        enabled: true,
        ...config.logging
      },
      performance: {
        enableQueryOptimization: true,
        enableBatchLoading: true,
        maxBatchSize: 100,
        ...config.performance
      }
    }
  }

  private createDialect(): Dialect {
    const { dialect, connection } = this.config
    
    switch (dialect) {
      case 'postgresql':
        return new (require('./helpers/postgres').PostgresDialect)({
          connection: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            user: connection.username,
            password: connection.password,
            ssl: connection.ssl,
            ...connection.pool
          }
        })
      
      case 'mysql':
        return new (require('./helpers/mysql').MysqlDialect)({
          connection: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            user: connection.username,
            password: connection.password,
            ssl: connection.ssl,
            ...connection.pool
          }
        })
      
      case 'sqlite':
        return new (require('./helpers/sqlite').SqliteDialect)({
          database: connection.database
        })
      
      case 'mssql':
        return new (require('./helpers/mssql').MssqlDialect)({
          connection: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            user: connection.username,
            password: connection.password,
            ssl: connection.ssl,
            ...connection.pool
          }
        })
      
      default:
        throw new Error(`Unsupported dialect: ${dialect}`)
    }
  }
}

// Export the main class as default
export default NOORMME
