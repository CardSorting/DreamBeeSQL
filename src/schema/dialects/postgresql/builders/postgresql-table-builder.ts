import type { Kysely } from '../../../../kysely.js'
import { CreateTableBuilder } from '../../../../schema/builders/create-table-builder.js'

/**
 * PostgreSQL-specific table builder with enhanced features
 */
export class PostgreSQLTableBuilder extends CreateTableBuilder {
  constructor(db: Kysely<any>) {
    super(db)
  }

  /**
   * Add PostgreSQL-specific column options
   */
  withGeneratedColumn(column: string, expression: string, type: 'STORED' | 'VIRTUAL' = 'STORED'): this {
    return this.addColumn(column, sql`GENERATED ALWAYS AS (${sql.raw(expression)}) ${sql.raw(type)}`)
  }

  /**
   * Add array column
   */
  withArrayColumn(column: string, elementType: string, nullable: boolean = true): this {
    return this.addColumn(column, sql`${sql.raw(elementType)}[]${nullable ? '' : ' NOT NULL'}`)
  }

  /**
   * Add JSONB column with index
   */
  withJsonbColumn(column: string, nullable: boolean = true): this {
    return this.addColumn(column, sql`JSONB${nullable ? '' : ' NOT NULL'}`)
  }

  /**
   * Add UUID column with default
   */
  withUuidColumn(column: string, nullable: boolean = false): this {
    return this.addColumn(column, sql`UUID${nullable ? '' : ' NOT NULL'} DEFAULT gen_random_uuid()`)
  }

  /**
   * Add timestamp with timezone
   */
  withTimestamptzColumn(column: string, nullable: boolean = true): this {
    return this.addColumn(column, sql`TIMESTAMPTZ${nullable ? '' : ' NOT NULL'}`)
  }

  /**
   * Add PostgreSQL-specific constraints
   */
  withExcludeConstraint(columns: string[], expression: string): this {
    return this.addConstraint(sql`EXCLUDE (${sql.raw(columns.join(', '))}) WITH ${sql.raw(expression)}`)
  }

  /**
   * Add check constraint with custom name
   */
  withNamedCheckConstraint(name: string, expression: string): this {
    return this.addConstraint(sql`CONSTRAINT ${sql.raw(name)} CHECK (${sql.raw(expression)})`)
  }

  /**
   * Add inheritance
   */
  inherits(parentTable: string): this {
    return this.addConstraint(sql`INHERITS (${sql.raw(parentTable)})`)
  }

  /**
   * Add PostgreSQL-specific table options
   */
  withTableOptions(options: {
    tablespace?: string
    fillfactor?: number
    autovacuum?: boolean
    toastAutovacuum?: boolean
    parallelWorkers?: number
  }): this {
    let optionsSql = ''

    if (options.tablespace) {
      optionsSql += ` TABLESPACE ${options.tablespace}`
    }

    if (options.fillfactor) {
      optionsSql += ` WITH (fillfactor = ${options.fillfactor})`
    }

    if (options.autovacuum !== undefined) {
      optionsSql += ` WITH (autovacuum_enabled = ${options.autovacuum})`
    }

    if (options.toastAutovacuum !== undefined) {
      optionsSql += ` WITH (toast.autovacuum_enabled = ${options.toastAutovacuum})`
    }

    if (options.parallelWorkers) {
      optionsSql += ` WITH (parallel_workers = ${options.parallelWorkers})`
    }

    if (optionsSql) {
      return this.addConstraint(sql.raw(optionsSql))
    }

    return this
  }

  /**
   * Add partitioning (PostgreSQL 10+)
   */
  withPartitioning(type: 'RANGE' | 'LIST' | 'HASH', column: string): this {
    return this.addConstraint(sql`PARTITION BY ${sql.raw(type)} (${sql.raw(column)})`)
  }

  /**
   * Add row level security
   */
  withRowLevelSecurity(enabled: boolean = true): this {
    return this.addConstraint(sql`ENABLE ROW LEVEL SECURITY`)
  }

  /**
   * Create table with PostgreSQL-specific optimizations
   */
  async executeWithOptimizations(): Promise<void> {
    await this.execute()

    // Add additional optimizations after table creation
    const tableName = (this as any).tableName

    try {
      // Create statistics on the table
      await this.db.executeQuery({
        sql: `ANALYZE ${tableName}`,
        parameters: []
      })
    } catch (error) {
      console.warn(`Failed to analyze table ${tableName}:`, error)
    }
  }
}
