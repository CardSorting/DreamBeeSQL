import { SchemaInfo, GeneratedTypes, EntityType, IntrospectionConfig, ColumnInfo, RelationshipInfo } from '../types'

/**
 * Type generation system that creates TypeScript types from database schema
 */
export class TypeGenerator {
  constructor(private config: IntrospectionConfig = {}) {}

  /**
   * Generate TypeScript types from schema information
   */
  generateTypes(schemaInfo: SchemaInfo): GeneratedTypes {
    const entities: EntityType[] = []
    let interfaces = ''
    let types = ''

    // Generate entity types for each table
    for (const table of schemaInfo.tables) {
      const entity = this.generateEntityType(table)
      entities.push(entity)
      
      interfaces += entity.interface + '\n\n'
      types += entity.insertType + '\n\n'
      types += entity.updateType + '\n\n'
      types += entity.selectType + '\n\n'
    }

    // Add relationship types
    interfaces += this.generateRelationshipTypes(schemaInfo.relationships)

    return {
      entities,
      interfaces,
      types
    }
  }

  /**
   * Generate entity type for a table
   */
  private generateEntityType(table: any): EntityType {
    const entityName = this.toPascalCase(table.name)
    const tableName = table.name

    // Generate main entity interface
    const interfaceCode = this.generateEntityInterface(table, entityName)
    
    // Generate insert type (all columns except auto-generated ones)
    const insertType = this.generateInsertType(table, entityName)
    
    // Generate update type (all columns optional except primary key)
    const updateType = this.generateUpdateType(table, entityName)
    
    // Generate select type (all columns as they appear in database)
    const selectType = this.generateSelectType(table, entityName)

    return {
      name: entityName,
      tableName,
      interface: interfaceCode,
      insertType,
      updateType,
      selectType
    }
  }

  /**
   * Generate main entity interface
   */
  private generateEntityInterface(table: any, entityName: string): string {
    let interfaceCode = `export interface ${entityName} {\n`

    // Add primary key columns first
    for (const column of table.columns) {
      if (column.isPrimaryKey) {
        const tsType = this.mapColumnToTypeScript(column)
        const optional = column.nullable ? '?' : ''
        interfaceCode += `  ${column.name}${optional}: ${tsType}\n`
      }
    }

    // Add non-primary key columns
    for (const column of table.columns) {
      if (!column.isPrimaryKey) {
        const tsType = this.mapColumnToTypeScript(column)
        const optional = column.nullable ? '?' : ''
        interfaceCode += `  ${column.name}${optional}: ${tsType}\n`
      }
    }

    // Add relationship properties
    const relationships = this.getRelationshipsForTable(table.name)
    for (const rel of relationships) {
      const relType = this.getRelationshipType(rel)
      interfaceCode += `  ${rel.name}?: ${relType}\n`
    }

    interfaceCode += '}'
    return interfaceCode
  }

  /**
   * Generate insert type
   */
  private generateInsertType(table: any, entityName: string): string {
    let insertType = `export type ${entityName}Insert = {\n`

    for (const column of table.columns) {
      // Skip auto-generated columns
      if (column.isAutoIncrement) continue

      const tsType = this.mapColumnToTypeScript(column)
      const optional = column.nullable || column.defaultValue ? '?' : ''
      insertType += `  ${column.name}${optional}: ${tsType}\n`
    }

    insertType += '}'
    return insertType
  }

  /**
   * Generate update type
   */
  private generateUpdateType(table: any, entityName: string): string {
    let updateType = `export type ${entityName}Update = {\n`

    for (const column of table.columns) {
      const tsType = this.mapColumnToTypeScript(column)
      const optional = column.isPrimaryKey ? '' : '?'
      updateType += `  ${column.name}${optional}: ${tsType}\n`
    }

    updateType += '}'
    return updateType
  }

  /**
   * Generate select type
   */
  private generateSelectType(table: any, entityName: string): string {
    let selectType = `export type ${entityName}Select = {\n`

    for (const column of table.columns) {
      const tsType = this.mapColumnToTypeScript(column)
      const optional = column.nullable ? '?' : ''
      selectType += `  ${column.name}${optional}: ${tsType}\n`
    }

    selectType += '}'
    return selectType
  }

  /**
   * Generate relationship types
   */
  private generateRelationshipTypes(relationships: RelationshipInfo[]): string {
    let relationshipTypes = '// Relationship types\n'

    // Group relationships by table
    const relationshipsByTable = new Map<string, RelationshipInfo[]>()
    for (const rel of relationships) {
      if (!relationshipsByTable.has(rel.fromTable)) {
        relationshipsByTable.set(rel.fromTable, [])
      }
      relationshipsByTable.get(rel.fromTable)!.push(rel)
    }

    for (const [tableName, tableRelationships] of relationshipsByTable) {
      const entityName = this.toPascalCase(tableName)
      
      for (const rel of tableRelationships) {
        const targetEntityName = this.toPascalCase(rel.toTable)
        let relType: string

        switch (rel.type) {
          case 'one-to-many':
            relType = `${targetEntityName}[]`
            break
          case 'many-to-one':
            relType = targetEntityName
            break
          case 'many-to-many':
            relType = `${targetEntityName}[]`
            break
          default:
            relType = targetEntityName
        }

        relationshipTypes += `export type ${entityName}${this.toPascalCase(rel.name)} = ${relType}\n`
      }
    }

    return relationshipTypes
  }

  /**
   * Map database column to TypeScript type
   */
  private mapColumnToTypeScript(column: ColumnInfo): string {
    // Handle custom type mappings
    if (this.config.customTypeMappings?.[column.type]) {
      return this.config.customTypeMappings[column.type]
    }

    const typeMapping: Record<string, string> = {
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

      // MySQL specific types
      'longtext': 'string',
      'mediumtext': 'string',
      'tinytext': 'string',
      'int': 'number',
      'tinyint': 'number',
      'float': 'number',
      'double': 'number',
      'bool': 'boolean',
      'datetime': 'Date',

      // SQLite specific types
      'blob': 'Buffer',

      // MSSQL specific types
      'nvarchar': 'string',
      'nchar': 'string',
      'ntext': 'string',
      'bit': 'boolean',
      'datetime2': 'Date',
      'smalldatetime': 'Date'
    }

    // Try exact match first
    if (typeMapping[column.type.toLowerCase()]) {
      return typeMapping[column.type.toLowerCase()]
    }

    // Handle parameterized types (e.g., varchar(255), decimal(10,2))
    const baseType = column.type.toLowerCase().split('(')[0]
    if (typeMapping[baseType]) {
      return typeMapping[baseType]
    }

    // Default to any for unknown types
    return 'any'
  }

  /**
   * Get relationships for a specific table
   */
  private getRelationshipsForTable(tableName: string): RelationshipInfo[] {
    // This would be passed from the schema discovery
    // For now, return empty array
    return []
  }

  /**
   * Get relationship type name
   */
  private getRelationshipType(relationship: any): string {
    const targetEntityName = this.toPascalCase(relationship.toTable)
    
    switch (relationship.type) {
      case 'one-to-many':
        return `${targetEntityName}[]`
      case 'many-to-one':
        return targetEntityName
      case 'many-to-many':
        return `${targetEntityName}[]`
      default:
        return targetEntityName
    }
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '')
  }
}
