import { SchemaInfo, GeneratedTypes, EntityType, IntrospectionConfig, ColumnInfo, RelationshipInfo, TableInfo } from '../types'

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
      const entity = this.generateEntityType(table, schemaInfo.relationships)
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
  private generateEntityType(table: TableInfo, relationships: RelationshipInfo[]): EntityType {
    const entityName = this.toPascalCase(table.name)
    const tableName = table.name

    // Generate main entity interface
    const interfaceCode = this.generateEntityInterface(table, entityName, relationships)
    
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
  private generateEntityInterface(table: TableInfo, entityName: string, relationships: RelationshipInfo[]): string {
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
    const tableRelationships = this.getRelationshipsForTable(table.name, relationships)
    for (const rel of tableRelationships) {
      const relType = this.getRelationshipType(rel)
      interfaceCode += `  ${rel.name}?: ${relType}\n`
    }

    interfaceCode += '}'
    return interfaceCode
  }

  /**
   * Generate insert type
   */
  private generateInsertType(table: TableInfo, entityName: string): string {
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
  private generateUpdateType(table: TableInfo, entityName: string): string {
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
  private generateSelectType(table: TableInfo, entityName: string): string {
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

    // Handle PostgreSQL array types
    if (column.type.endsWith('[]')) {
      const baseType = column.type.slice(0, -2)
      const elementType = this.mapColumnToTypeScript({ ...column, type: baseType, nullable: false })
      const arrayType = `Array<${elementType}>`
      return column.nullable ? `${arrayType} | null` : arrayType
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
      'json': 'Record<string, unknown>',
      'jsonb': 'Record<string, unknown>',
      'uuid': 'string',
      'tsvector': 'string',
      'tsquery': 'string',

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

      // SQLite specific types (enhanced)
      'blob': 'Buffer',
      'int2': 'number',
      'int8': 'number',
      'clob': 'string',

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
      let mappedType = typeMapping[column.type.toLowerCase()]
      
      // Handle nullable columns
      if (column.nullable && mappedType !== 'unknown') {
        mappedType = `${mappedType} | null`
      }
      
      return mappedType
    }

    // Handle parameterized types (e.g., varchar(255), decimal(10,2))
    const baseType = column.type.toLowerCase().split('(')[0]
    if (typeMapping[baseType]) {
      let mappedType = typeMapping[baseType]
      
      // Handle nullable columns
      if (column.nullable && mappedType !== 'unknown') {
        mappedType = `${mappedType} | null`
      }
      
      return mappedType
    }

    // Default to unknown for unknown types
    return column.nullable ? 'unknown | null' : 'unknown'
  }

  /**
   * Get relationships for a specific table
   */
  private getRelationshipsForTable(tableName: string, relationships: RelationshipInfo[]): RelationshipInfo[] {
    return relationships.filter(rel => 
      rel.fromTable === tableName || rel.toTable === tableName
    )
  }

  /**
   * Generate relationship interfaces
   */
  private generateRelationshipInterfaces(relationships: RelationshipInfo[]): string {
    if (relationships.length === 0) {
      return ''
    }

    let relationshipInterfaces = '// Relationship Types\n\n'

    // Group relationships by type
    const groupedRelationships = relationships.reduce((acc, rel) => {
      const key = `${rel.fromTable}_${rel.toTable}_${rel.type}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(rel)
      return acc
    }, {} as Record<string, RelationshipInfo[]>)

    for (const [key, rels] of Object.entries(groupedRelationships)) {
      const rel = rels[0] // Use first relationship as template
      
      const fromEntity = this.toPascalCase(rel.fromTable)
      const toEntity = this.toPascalCase(rel.toTable)
      
      switch (rel.type) {
        case 'one-to-many':
          relationshipInterfaces += `export interface ${fromEntity}With${toEntity}s extends ${fromEntity} {\n`
          relationshipInterfaces += `  ${this.toCamelCase(rel.toTable)}s: ${toEntity}[]\n`
          relationshipInterfaces += `}\n\n`
          
          relationshipInterfaces += `export interface ${toEntity}With${fromEntity} extends ${toEntity} {\n`
          relationshipInterfaces += `  ${this.toCamelCase(rel.fromTable)}: ${fromEntity}\n`
          relationshipInterfaces += `}\n\n`
          break
          
        case 'many-to-one':
          relationshipInterfaces += `export interface ${fromEntity}With${toEntity} extends ${fromEntity} {\n`
          relationshipInterfaces += `  ${this.toCamelCase(rel.toTable)}: ${toEntity}\n`
          relationshipInterfaces += `}\n\n`
          
          relationshipInterfaces += `export interface ${toEntity}With${fromEntity}s extends ${toEntity} {\n`
          relationshipInterfaces += `  ${this.toCamelCase(rel.fromTable)}s: ${fromEntity}[]\n`
          relationshipInterfaces += `}\n\n`
          break
          
        case 'many-to-many':
          relationshipInterfaces += `export interface ${fromEntity}With${toEntity}s extends ${fromEntity} {\n`
          relationshipInterfaces += `  ${this.toCamelCase(rel.toTable)}s: ${toEntity}[]\n`
          relationshipInterfaces += `}\n\n`
          
          relationshipInterfaces += `export interface ${toEntity}With${fromEntity}s extends ${toEntity} {\n`
          relationshipInterfaces += `  ${this.toCamelCase(rel.fromTable)}s: ${fromEntity}[]\n`
          relationshipInterfaces += `}\n\n`
          break
      }
    }

    return relationshipInterfaces
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/gi, ($1) => {
      return $1.toUpperCase().replace('-', '').replace('_', '')
    })
  }

  /**
   * Get relationship type name
   */
  private getRelationshipType(relationship: RelationshipInfo): string {
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
