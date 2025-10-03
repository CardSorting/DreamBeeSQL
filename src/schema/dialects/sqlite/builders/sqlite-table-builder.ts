import type { Kysely } from '../../../../kysely.js'
import { CreateTableBuilder } from '../../../../schema/create-table-builder.js'

/**
 * SQLite-specific table builder with enhanced features
 */
export class SQLiteTableBuilder extends CreateTableBuilder {
  constructor(db: Kysely<any>) {
    super(db)
  }

  /**
   * Add SQLite-specific column options
   */
  withAutoIncrement(column: string): this {
    return this.addColumn(column, sql`INTEGER PRIMARY KEY AUTOINCREMENT`)
  }

  /**
   * Add SQLite ROWID column
   */
  withRowId(): this {
    return this.addColumn('rowid', sql`INTEGER PRIMARY KEY`)
  }

  /**
   * Add WITHOUT ROWID table
   */
  withoutRowId(): this {
    return this.addConstraint(sql`WITHOUT ROWID`)
  }

  /**
   * Add STRICT table (SQLite 3.37+)
   */
  withStrict(): this {
    return this.addConstraint(sql`STRICT`)
  }

  /**
   * Add SQLite-specific column types
   */
  withTextColumn(column: string, collation?: 'NOCASE' | 'RTRIM' | 'BINARY'): this {
    let sqlType = 'TEXT'
    if (collation) {
      sqlType += ` COLLATE ${collation}`
    }
    return this.addColumn(column, sql.raw(sqlType))
  }

  /**
   * Add BLOB column
   */
  withBlobColumn(column: string): this {
    return this.addColumn(column, sql`BLOB`)
  }

  /**
   * Add REAL column
   */
  withRealColumn(column: string): this {
    return this.addColumn(column, sql`REAL`)
  }

  /**
   * Add NUMERIC column
   */
  withNumericColumn(column: string, precision?: number, scale?: number): this {
    let sqlType = 'NUMERIC'
    if (precision !== undefined) {
      sqlType += `(${precision}`
      if (scale !== undefined) {
        sqlType += `,${scale}`
      }
      sqlType += ')'
    }
    return this.addColumn(column, sql.raw(sqlType))
  }

  /**
   * Add CHECK constraint with SQLite-specific functions
   */
  withSqliteCheckConstraint(expression: string): this {
    return this.addConstraint(sql`CHECK (${sql.raw(expression)})`)
  }

  /**
   * Add FOREIGN KEY with SQLite-specific options
   */
  withSqliteForeignKey(
    column: string, 
    referencedTable: string, 
    referencedColumn: string,
    options?: {
      onDelete?: 'NO ACTION' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'CASCADE'
      onUpdate?: 'NO ACTION' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'CASCADE'
      deferrable?: boolean
    }
  ): this {
    let fkSql = `FOREIGN KEY (${column}) REFERENCES ${referencedTable}(${referencedColumn})`
    
    if (options?.onDelete) {
      fkSql += ` ON DELETE ${options.onDelete}`
    }
    
    if (options?.onUpdate) {
      fkSql += ` ON UPDATE ${options.onUpdate}`
    }
    
    if (options?.deferrable) {
      fkSql += ' DEFERRABLE'
    }

    return this.addConstraint(sql.raw(fkSql))
  }

  /**
   * Add UNIQUE constraint with conflict resolution
   */
  withUniqueConstraint(columns: string[], conflictResolution?: 'IGNORE' | 'REPLACE' | 'ABORT' | 'FAIL' | 'ROLLBACK'): this {
    let uniqueSql = `UNIQUE (${columns.join(', ')})`
    
    if (conflictResolution) {
      uniqueSql += ` ON CONFLICT ${conflictResolution}`
    }

    return this.addConstraint(sql.raw(uniqueSql))
  }

  /**
   * Create table with SQLite-specific optimizations
   */
  async executeWithOptimizations(): Promise<void> {
    await this.execute()

    // Add additional optimizations after table creation
    const tableName = (this as any).tableName

    try {
      // Enable foreign key constraints if not already enabled
      await this.db.executeQuery({
        sql: 'PRAGMA foreign_keys = ON',
        parameters: []
      })

      // Optimize the database
      await this.db.executeQuery({
        sql: 'PRAGMA optimize',
        parameters: []
      })
    } catch (error) {
      console.warn(`Failed to optimize SQLite table ${tableName}:`, error)
    }
  }

  /**
   * Create temporary table
   */
  temporary(): this {
    return this.addConstraint(sql`TEMPORARY`)
  }

  /**
   * Create table with specific schema
   */
  withSchema(schema: string): this {
    return this.addConstraint(sql.raw(`SCHEMA ${schema}`))
  }

  /**
   * Add SQLite-specific indexes after table creation
   */
  async addSqliteIndexes(indexes: Array<{
    name: string
    columns: string[]
    unique?: boolean
    where?: string
  }>): Promise<void> {
    const tableName = (this as any).tableName

    for (const index of indexes) {
      try {
        let indexSql = `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${index.name} ON ${tableName} (${index.columns.join(', ')})`
        
        if (index.where) {
          indexSql += ` WHERE ${index.where}`
        }

        await this.db.executeQuery({
          sql: indexSql,
          parameters: []
        })
      } catch (error) {
        console.warn(`Failed to create SQLite index ${index.name}:`, error)
      }
    }
  }
}
