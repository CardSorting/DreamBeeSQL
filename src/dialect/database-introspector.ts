import type { Kysely } from '../kysely.js'
import { sql } from '../raw-builder/sql.js'

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

/**
 * Database introspector that queries database metadata
 */
export class DatabaseIntrospector {
  constructor(private db: Kysely<any>) {}

  /**
   * Get all tables in the database
   */
  async getTables(): Promise<TableMetadata[]> {
    // Try to detect the database type and use appropriate query
    try {
      // PostgreSQL
      const pgTables = await this.db
        .selectFrom('information_schema.tables')
        .select(['table_name as name', 'table_schema as schema'])
        .where('table_type', '=', 'BASE TABLE')
        .where('table_schema', 'not in', ['information_schema', 'pg_catalog'])
        .execute()

      if (pgTables.length > 0) {
        return pgTables.map(t => ({
          name: t.name,
          schema: t.schema
        }))
      }
    } catch (error) {
      // Not PostgreSQL, try MySQL
    }

    try {
      // MySQL
      const mysqlTables = await this.db
        .selectFrom('information_schema.tables')
        .select(['table_name as name', 'table_schema as schema'])
        .where('table_type', '=', 'BASE TABLE')
        .where('table_schema', '=', 'public')
        .execute()

      if (mysqlTables.length > 0) {
        return mysqlTables.map(t => ({
          name: t.name,
          schema: t.schema
        }))
      }
    } catch (error) {
      // Not MySQL, try SQLite
    }

    try {
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
    } catch (error) {
      // If sqlite_master fails, it's not SQLite
      console.warn('SQLite table discovery failed:', error)
    }

    try {
      // MSSQL
      const mssqlTables = await this.db
        .selectFrom('information_schema.tables')
        .select(['table_name as name', 'table_schema as schema'])
        .where('table_type', '=', 'BASE TABLE')
        .execute()

      return mssqlTables.map(t => ({
        name: t.name,
        schema: t.schema
      }))
    } catch (error) {
      throw new Error('Unable to introspect database tables. Unsupported database type.')
    }
  }

  /**
   * Get columns for a specific table
   */
  async getColumns(tableName: string): Promise<ColumnMetadata[]> {
    try {
      // PostgreSQL
      const pgColumns = await this.db
        .selectFrom('information_schema.columns')
        .select([
          'column_name as name',
          'data_type as type',
          'is_nullable as nullable',
          'column_default as defaultValue',
          'character_maximum_length as maxLength',
          'numeric_precision as precision',
          'numeric_scale as scale'
        ])
        .where('table_name', '=', tableName)
        .execute()

      if (pgColumns.length > 0) {
        // Get primary key information
        const pkColumns = await this.db
          .selectFrom('information_schema.key_column_usage')
          .select('column_name')
          .where('table_name', '=', tableName)
          .where('constraint_name', 'in', 
            this.db
              .selectFrom('information_schema.table_constraints')
              .select('constraint_name')
              .where('table_name', '=', tableName)
              .where('constraint_type', '=', 'PRIMARY KEY')
          )
          .execute()

        const pkColumnNames = new Set(pkColumns.map(c => c.column_name))

        return pgColumns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable === 'YES',
          defaultValue: col.defaultValue,
          isPrimaryKey: pkColumnNames.has(col.name),
          isAutoIncrement: col.defaultValue?.includes('nextval') || false,
          maxLength: col.maxLength,
          precision: col.precision,
          scale: col.scale
        }))
      }
    } catch (error) {
      // Not PostgreSQL, try MySQL
    }

    try {
      // MySQL
      const mysqlColumns = await this.db
        .selectFrom('information_schema.columns')
        .select([
          'column_name as name',
          'data_type as type',
          'is_nullable as nullable',
          'column_default as defaultValue',
          'character_maximum_length as maxLength',
          'numeric_precision as precision',
          'numeric_scale as scale',
          'extra'
        ])
        .where('table_name', '=', tableName)
        .execute()

      if (mysqlColumns.length > 0) {
        // Get primary key information
        const pkColumns = await this.db
          .selectFrom('information_schema.key_column_usage')
          .select('column_name')
          .where('table_name', '=', tableName)
          .where('constraint_name', 'in',
            this.db
              .selectFrom('information_schema.table_constraints')
              .select('constraint_name')
              .where('table_name', '=', tableName)
              .where('constraint_type', '=', 'PRIMARY KEY')
          )
          .execute()

        const pkColumnNames = new Set(pkColumns.map(c => c.column_name))

        return mysqlColumns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable === 'YES',
          defaultValue: col.defaultValue,
          isPrimaryKey: pkColumnNames.has(col.name),
          isAutoIncrement: col.extra?.includes('auto_increment') || false,
          maxLength: col.maxLength,
          precision: col.precision,
          scale: col.scale
        }))
      }
    } catch (error) {
      // Not MySQL, try SQLite
    }

    try {
      // SQLite - use raw SQL for pragma_table_info
      const result = await sql`pragma_table_info(${sql.lit(tableName)})`.execute(this.db)
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
      // Not SQLite, try MSSQL
      console.warn('SQLite column discovery failed:', error)
    }

    try {
      // MSSQL
      const mssqlColumns = await this.db
        .selectFrom('information_schema.columns')
        .select([
          'column_name as name',
          'data_type as type',
          'is_nullable as nullable',
          'column_default as defaultValue',
          'character_maximum_length as maxLength',
          'numeric_precision as precision',
          'numeric_scale as scale'
        ])
        .where('table_name', '=', tableName)
        .execute()

      if (mssqlColumns.length > 0) {
        // Get primary key information
        const pkColumns = await this.db
          .selectFrom('information_schema.key_column_usage')
          .select('column_name')
          .where('table_name', '=', tableName)
          .where('constraint_name', 'in',
            this.db
              .selectFrom('information_schema.table_constraints')
              .select('constraint_name')
              .where('table_name', '=', tableName)
              .where('constraint_type', '=', 'PRIMARY KEY')
          )
          .execute()

        const pkColumnNames = new Set(pkColumns.map(c => c.column_name))

        return mssqlColumns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable === 'YES',
          defaultValue: col.defaultValue,
          isPrimaryKey: pkColumnNames.has(col.name),
          isAutoIncrement: col.defaultValue?.includes('IDENTITY') || false,
          maxLength: col.maxLength,
          precision: col.precision,
          scale: col.scale
        }))
      }
    } catch (error) {
      throw new Error(`Unable to introspect columns for table '${tableName}'. Unsupported database type.`)
    }

    return []
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
      // PostgreSQL
      const pgFks = await this.db
        .selectFrom('information_schema.key_column_usage')
        .select([
          'constraint_name as name',
          'column_name as column',
          'referenced_table_name as referencedTable',
          'referenced_column_name as referencedColumn'
        ])
        .where('table_name', '=', tableName)
        .where('referenced_table_name', 'is not', null)
        .execute()

      if (pgFks.length > 0) {
        return pgFks.map(fk => ({
          name: fk.name,
          column: fk.column,
          referencedTable: fk.referencedTable,
          referencedColumn: fk.referencedColumn
        }))
      }
    } catch (error) {
      // Not PostgreSQL, try MySQL
    }

    try {
      // MySQL
      const mysqlFks = await this.db
        .selectFrom('information_schema.key_column_usage')
        .select([
          'constraint_name as name',
          'column_name as column',
          'referenced_table_name as referencedTable',
          'referenced_column_name as referencedColumn'
        ])
        .where('table_name', '=', tableName)
        .where('referenced_table_name', 'is not', null)
        .execute()

      if (mysqlFks.length > 0) {
        return mysqlFks.map(fk => ({
          name: fk.name,
          column: fk.column,
          referencedTable: fk.referencedTable,
          referencedColumn: fk.referencedColumn
        }))
      }
    } catch (error) {
      // Not MySQL, try SQLite
    }

    try {
      // SQLite - use raw SQL for pragma_foreign_key_list
      const result = await sql`pragma_foreign_key_list(${sql.lit(tableName)})`.execute(this.db)
      const sqliteFks = result.rows as any[]

      return sqliteFks.map((fk: any) => ({
        name: `fk_${tableName}_${fk.from}`,
        column: fk.from,
        referencedTable: fk.table,
        referencedColumn: fk.to
      }))
    } catch (error) {
      // Not SQLite, try MSSQL
      console.warn('SQLite foreign key discovery failed:', error)
    }

    try {
      // MSSQL
      const mssqlFks = await this.db
        .selectFrom('information_schema.key_column_usage')
        .select([
          'constraint_name as name',
          'column_name as column',
          'referenced_table_name as referencedTable',
          'referenced_column_name as referencedColumn'
        ])
        .where('table_name', '=', tableName)
        .where('referenced_table_name', 'is not', null)
        .execute()

      return mssqlFks.map(fk => ({
        name: fk.name,
        column: fk.column,
        referencedTable: fk.referencedTable,
        referencedColumn: fk.referencedColumn
      }))
    } catch (error) {
      // Return empty array if foreign key discovery fails
      return []
    }
  }
}