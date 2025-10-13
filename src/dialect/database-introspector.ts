import type { Kysely } from '../kysely.js'
import { sql } from '../raw-builder/sql.js'

export interface SchemaMetadata {
  name: string
}

export interface TableMetadata {
  name: string
  schema?: string
}

export interface ColumnMetadata {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  maxLength?: number
  precision?: number
  scale?: number
}

export interface IndexMetadata {
  name: string
  columns: string[]
  unique: boolean
}

export interface ForeignKeyMetadata {
  name: string
  column: string
  referencedTable: string
  referencedColumn: string
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

export interface DatabaseMetadataOptions {
  withInternalKyselyTables?: boolean
}

export interface DatabaseMetadata {
  tables: TableMetadata[]
}

/**
 * Database introspector that queries database metadata
 */
export class DatabaseIntrospector {
  constructor(protected db: Kysely<any>) {}

  /**
   * Get all tables in the database
   */
  async getTables(): Promise<TableMetadata[]> {
    // SQLite
    const sqliteTables = await this.db
      .selectFrom('sqlite_master')
      .select('name')
      .where('type', '=', 'table')
      .where('name', 'not like', 'sqlite_%')
      .execute()

    return sqliteTables.map(t => ({
      name: t.name
    }))
  }

  /**
   * Get columns for a specific table
   */
  async getColumns(tableName: string): Promise<ColumnMetadata[]> {
    try {
      // SQLite - use raw SQL for PRAGMA table_info
      const result = await sql`PRAGMA table_info(${sql.lit(tableName)})`.execute(this.db)
      const sqliteColumns = result.rows as any[]

      return sqliteColumns.map((col: any) => ({
        name: col.name,
        type: col.type,
        nullable: !col.notnull,
        defaultValue: col.dflt_value,
        isPrimaryKey: !!col.pk,
        isAutoIncrement: col.type.toLowerCase().includes('integer') && col.pk
      }))
    } catch (error) {
      console.warn('SQLite column discovery failed:', error)
      // Return empty array instead of throwing for non-existent tables
      return []
    }
  }

  /**
   * Get indexes for a specific table
   */
  async getIndexes(tableName: string): Promise<IndexMetadata[]> {
    // TODO: Implement index discovery for different databases
    return []
  }

  /**
   * Get foreign keys for a specific table
   */
  async getForeignKeys(tableName: string): Promise<ForeignKeyMetadata[]> {
    try {
      // SQLite - use raw SQL for PRAGMA foreign_key_list
      const result = await sql`PRAGMA foreign_key_list(${sql.lit(tableName)})`.execute(this.db)
      const sqliteFks = result.rows as any[]

      return sqliteFks.map((fk: any) => ({
        name: `fk_${tableName}_${fk.from}`,
        column: fk.from,
        referencedTable: fk.table,
        referencedColumn: fk.to
      }))
    } catch (error) {
      console.warn('SQLite foreign key discovery failed:', error)
      // Return empty array if foreign key discovery fails
      return []
    }
  }
}