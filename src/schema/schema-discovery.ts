import type { Kysely } from '../kysely.js'
import { DatabaseIntrospector } from '../dialect/database-introspector'
import { SchemaInfo, TableInfo, ColumnInfo, RelationshipInfo, IntrospectionConfig } from '../types'

/**
 * Schema discovery engine that introspects database structure
 */
export class SchemaDiscovery {
  constructor(
    private db: Kysely<any>,
    private config: IntrospectionConfig = {}
  ) {}

  /**
   * Discover the complete database schema
   */
  async discoverSchema(): Promise<SchemaInfo> {
    const introspector = new DatabaseIntrospector(this.db)
    
    // Get all tables
    const tables = await this.discoverTables(introspector)
    
    // Get all relationships
    const relationships = await this.discoverRelationships(tables, introspector)
    
    // Get views if requested
    const views = this.config.includeViews ? await this.discoverViews(introspector) : []

    return {
      tables,
      relationships,
      views
    }
  }

  /**
   * Discover all tables in the database
   */
  private async discoverTables(introspector: DatabaseIntrospector): Promise<TableInfo[]> {
    const tables = await introspector.getTables()
    const tableInfos: TableInfo[] = []

    for (const table of tables) {
      // Skip excluded tables
      if (this.config.excludeTables?.includes(table.name)) {
        continue
      }

      const columns = await introspector.getColumns(table.name)
      const indexes = await introspector.getIndexes(table.name)
      const foreignKeys = await introspector.getForeignKeys(table.name)

      // Find primary key columns
      const primaryKeyColumns = columns
        .filter(col => col.isPrimaryKey)
        .map(col => col.name)

      tableInfos.push({
        name: table.name,
        schema: table.schema,
        columns: columns.map(col => this.mapColumnInfo(col)),
        primaryKey: primaryKeyColumns.length > 0 ? primaryKeyColumns : undefined,
        indexes: indexes.map(idx => ({
          name: idx.name,
          columns: idx.columns,
          unique: idx.unique
        })),
        foreignKeys: foreignKeys.map(fk => ({
          name: fk.name,
          column: fk.column,
          referencedTable: fk.referencedTable,
          referencedColumn: fk.referencedColumn,
          onDelete: fk.onDelete,
          onUpdate: fk.onUpdate
        }))
      })
    }

    return tableInfos
  }

  /**
   * Discover relationships between tables
   */
  private async discoverRelationships(
    tables: TableInfo[], 
    introspector: DatabaseIntrospector
  ): Promise<RelationshipInfo[]> {
    const relationships: RelationshipInfo[] = []

    for (const table of tables) {
      for (const fk of table.foreignKeys) {
        // Find the referenced table
        const referencedTable = tables.find(t => t.name === fk.referencedTable)
        if (!referencedTable) continue

        // Create relationship name based on column name
        const relationshipName = this.generateRelationshipName(fk.column, fk.referencedTable)

        // Determine relationship type
        const isUnique = referencedTable.primaryKey?.includes(fk.referencedColumn) || false
        const relationshipType = isUnique ? 'many-to-one' : 'one-to-many'

        relationships.push({
          name: relationshipName,
          type: relationshipType,
          fromTable: table.name,
          fromColumn: fk.column,
          toTable: fk.referencedTable,
          toColumn: fk.referencedColumn
        })

        // Add reverse relationship
        const reverseName = this.generateReverseRelationshipName(table.name, fk.column)
        relationships.push({
          name: reverseName,
          type: relationshipType === 'many-to-one' ? 'one-to-many' : 'many-to-one',
          fromTable: fk.referencedTable,
          fromColumn: fk.referencedColumn,
          toTable: table.name,
          toColumn: fk.column
        })
      }
    }

    return relationships
  }

  /**
   * Discover views in the database
   */
  private async discoverViews(introspector: DatabaseIntrospector): Promise<any[]> {
    // TODO: Implement view discovery
    return []
  }

  /**
   * Map database column info to our ColumnInfo interface
   */
  private mapColumnInfo(dbColumn: any): ColumnInfo {
    return {
      name: dbColumn.name,
      type: this.mapColumnType(dbColumn.type),
      nullable: dbColumn.nullable,
      defaultValue: dbColumn.defaultValue,
      isPrimaryKey: dbColumn.isPrimaryKey,
      isAutoIncrement: dbColumn.isAutoIncrement,
      maxLength: dbColumn.maxLength,
      precision: dbColumn.precision,
      scale: dbColumn.scale
    }
  }

  /**
   * Map database column types to TypeScript types
   */
  private mapColumnType(dbType: string): string {
    const typeMapping = {
      // PostgreSQL types
      'varchar': 'string',
      'text': 'string',
      'char': 'string',
      'integer': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'boolean': 'boolean',
      'date': 'Date',
      'timestamp': 'Date',
      'timestamptz': 'Date',
      'time': 'Date',
      'json': 'any',
      'jsonb': 'any',
      'uuid': 'string',

      // MySQL types
      'varchar': 'string',
      'char': 'string',
      'text': 'string',
      'longtext': 'string',
      'mediumtext': 'string',
      'tinytext': 'string',
      'int': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'tinyint': 'number',
      'decimal': 'number',
      'float': 'number',
      'double': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'date': 'Date',
      'datetime': 'Date',
      'timestamp': 'Date',
      'time': 'Date',
      'json': 'any',

      // SQLite types
      'text': 'string',
      'integer': 'number',
      'real': 'number',
      'blob': 'Buffer',
      'boolean': 'boolean',

      // MSSQL types
      'varchar': 'string',
      'nvarchar': 'string',
      'char': 'string',
      'nchar': 'string',
      'text': 'string',
      'ntext': 'string',
      'int': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'tinyint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'float': 'number',
      'real': 'number',
      'bit': 'boolean',
      'date': 'Date',
      'datetime': 'Date',
      'datetime2': 'Date',
      'smalldatetime': 'Date',
      'timestamp': 'Date',
      'time': 'Date'
    }

    // Handle custom type mappings
    if (this.config.customTypeMappings?.[dbType]) {
      return this.config.customTypeMappings[dbType]
    }

    // Try exact match first
    if (typeMapping[dbType.toLowerCase()]) {
      return typeMapping[dbType.toLowerCase()]
    }

    // Handle parameterized types (e.g., varchar(255), decimal(10,2))
    const baseType = dbType.toLowerCase().split('(')[0]
    if (typeMapping[baseType]) {
      return typeMapping[baseType]
    }

    // Default to any for unknown types
    return 'any'
  }

  /**
   * Generate relationship name from foreign key column
   */
  private generateRelationshipName(columnName: string, referencedTable: string): string {
    // Remove common foreign key suffixes
    let name = columnName
    if (name.endsWith('_id')) {
      name = name.slice(0, -3)
    }
    if (name.endsWith('Id')) {
      name = name.slice(0, -2)
    }

    // Convert to camelCase
    return this.toCamelCase(name)
  }

  /**
   * Generate reverse relationship name
   */
  private generateReverseRelationshipName(tableName: string, columnName: string): string {
    // Convert table name to plural for one-to-many relationships
    const pluralTableName = this.pluralize(this.toCamelCase(tableName))
    return pluralTableName
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '')
  }

  /**
   * Simple pluralization (basic implementation)
   */
  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies'
    }
    if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('x') || str.endsWith('z')) {
      return str + 'es'
    }
    return str + 's'
  }
}
