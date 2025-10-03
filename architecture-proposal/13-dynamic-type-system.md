# Dynamic Type System Architecture

## Overview

The Dynamic Type System provides runtime type generation and management based on discovered database schemas. It eliminates the need for pre-defined types by automatically generating TypeScript interfaces, entity classes, and repository types from live database introspection.

## Design Principles

- **Runtime Generation** - Generate types based on live database schema
- **Zero Configuration** - No manual type definitions required
- **Dynamic Updates** - Types update automatically with schema changes
- **Type Safety** - Full TypeScript support with proper type inference
- **Performance Optimized** - Efficient type generation and caching
- **Fallback Support** - Graceful handling of introspection failures

## Architecture

```typescript
// Dynamic Type System (Singleton)
export class DynamicTypeSystem {
  private static instance: DynamicTypeSystem | null = null
  private typeCache = new Map<string, CachedTypeDefinition>()
  private generatedTypes = new Map<string, GeneratedTypeDefinition>()
  private introspectionEngine: SchemaIntrospectionEngine
  private entityGenerator: EntityClassGenerator
  private repositoryGenerator: RepositoryClassGenerator
  
  private constructor() {
    this.introspectionEngine = SchemaIntrospectionEngine.getInstance()
    this.entityGenerator = new EntityClassGenerator()
    this.repositoryGenerator = new RepositoryClassGenerator()
  }
  
  static getInstance(): DynamicTypeSystem {
    if (!DynamicTypeSystem.instance) {
      DynamicTypeSystem.instance = new DynamicTypeSystem()
    }
    return DynamicTypeSystem.instance
  }
  
  // Core methods
  async generateTypesFromDatabase(db: Kysely<any>): Promise<DynamicTypeGenerationResult>
  async generateTypesForTable(tableName: string, db: Kysely<any>): Promise<TableTypeDefinitions>
  async updateTypesForSchemaChange(change: SchemaChange): Promise<TypeUpdateResult>
  getGeneratedType(typeName: string): GeneratedTypeDefinition | undefined
  getAllGeneratedTypes(): Map<string, GeneratedTypeDefinition>
  clearTypeCache(): void
  invalidateTypeCache(tableName?: string): void
}
```

## Type Generation Result Structure

```typescript
export interface DynamicTypeGenerationResult {
  success: boolean
  types: GeneratedTypeDefinitions
  entities: Map<string, GeneratedEntityClass>
  repositories: Map<string, GeneratedRepositoryClass>
  relationships: Map<string, RelationshipTypeDefinitions>
  errors: TypeGenerationError[]
  warnings: TypeGenerationWarning[]
  metadata: TypeGenerationMetadata
}

export interface GeneratedTypeDefinitions {
  database: string
  entities: string
  repositories: string
  relationships: string
  validations: string
  utilities: string
}

export interface TableTypeDefinitions {
  rowType: string
  insertableType: string
  updateableType: string
  selectableType: string
  whereType: string
  orderByType: string
  entityClass: string
  repositoryClass: string
}

export interface GeneratedTypeDefinition {
  name: string
  content: string
  dependencies: string[]
  timestamp: number
  version: number
  tableName?: string
  isGenerated: boolean
}

export interface RelationshipTypeDefinitions {
  sourceTable: string
  targetTable: string
  relationshipType: string
  foreignKeyType: string
  joinType: string
}

export interface TypeGenerationMetadata {
  generationTime: Date
  totalTables: number
  totalTypes: number
  totalRelationships: number
  cacheHitRate: number
  generationDuration: number
}
```

## Advanced Type Generator

```typescript
export class AdvancedTypeGenerator {
  private typeMapper: DatabaseTypeMapper
  private relationshipAnalyzer: RelationshipAnalyzer
  private validationGenerator: ValidationTypeGenerator
  
  constructor() {
    this.typeMapper = new DatabaseTypeMapper()
    this.relationshipAnalyzer = new RelationshipAnalyzer()
    this.validationGenerator = new ValidationTypeGenerator()
  }
  
  async generateDatabaseTypes(schemas: Map<string, DiscoveredTableSchema>): Promise<string> {
    let code = '// Auto-generated database types\n'
    code += '// Generated from live database schema introspection\n\n'
    
    code += 'export interface Database {\n'
    
    for (const [tableName, schema] of schemas) {
      code += `  ${tableName}: {\n`
      
      for (const column of schema.columns) {
        const tsType = this.typeMapper.mapToTypeScript(column)
        const comment = this.generateColumnComment(column)
        code += `    ${column.name}: ${tsType}${comment}\n`
      }
      
      code += '  }\n'
    }
    
    code += '}\n\n'
    
    // Generate utility types
    code += this.generateUtilityTypes(schemas)
    
    return code
  }
  
  async generateEntityTypes(schemas: Map<string, DiscoveredTableSchema>): Promise<string> {
    let code = '// Auto-generated entity types\n'
    code += '// Generated from live database schema introspection\n\n'
    
    for (const [tableName, schema] of schemas) {
      const entityName = this.toPascalCase(tableName)
      
      // Generate row type
      code += `export interface ${entityName}Row {\n`
      for (const column of schema.columns) {
        const tsType = this.typeMapper.mapToTypeScript(column)
        const comment = this.generateColumnComment(column)
        code += `  ${column.name}: ${tsType}${comment}\n`
      }
      code += '}\n\n'
      
      // Generate insertable type
      code += `export interface Insertable${entityName}Row {\n`
      for (const column of schema.columns) {
        if (column.isPrimaryKey && column.isAutoIncrement) continue
        
        const tsType = this.typeMapper.mapToTypeScript(column)
        const comment = this.generateColumnComment(column)
        code += `  ${column.name}: ${tsType}${comment}\n`
      }
      code += '}\n\n'
      
      // Generate updateable type
      code += `export interface Updateable${entityName}Row {\n`
      for (const column of schema.columns) {
        if (column.isPrimaryKey) continue
        
        const tsType = this.typeMapper.mapToTypeScript(column, true)
        const comment = this.generateColumnComment(column)
        code += `  ${column.name}?: ${tsType}${comment}\n`
      }
      code += '}\n\n'
      
      // Generate selectable type (with computed fields)
      code += `export interface Selectable${entityName}Row extends ${entityName}Row {\n`
      code += `  // Computed fields can be added here\n`
      code += '}\n\n'
      
      // Generate where clause type
      code += `export interface ${entityName}WhereClause {\n`
      for (const column of schema.columns) {
        const tsType = this.typeMapper.mapToTypeScript(column, true)
        code += `  ${column.name}?: ${tsType} | { equals?: ${tsType}, not?: ${tsType}, in?: ${tsType}[], notIn?: ${tsType}[] }\n`
      }
      code += '}\n\n'
      
      // Generate order by type
      code += `export interface ${entityName}OrderByClause {\n`
      for (const column of schema.columns) {
        code += `  ${column.name}?: 'asc' | 'desc'\n`
      }
      code += '}\n\n'
    }
    
    return code
  }
  
  async generateRelationshipTypes(
    schemas: Map<string, DiscoveredTableSchema>,
    relationships: Map<string, RelationshipInfo[]>
  ): Promise<string> {
    let code = '// Auto-generated relationship types\n'
    code += '// Generated from foreign key analysis\n\n'
    
    for (const [tableName, tableRelationships] of relationships) {
      const entityName = this.toPascalCase(tableName)
      
      if (tableRelationships.length > 0) {
        code += `export interface ${entityName}Relations {\n`
        
        for (const rel of tableRelationships) {
          const targetEntityName = this.toPascalCase(rel.targetTable)
          const propertyName = this.toCamelCase(rel.targetTable)
          
          switch (rel.type) {
            case 'one-to-one':
              code += `  ${propertyName}: ${targetEntityName} | null\n`
              break
            case 'one-to-many':
              code += `  ${propertyName}: ${targetEntityName}[]\n`
              break
            case 'many-to-one':
              code += `  ${propertyName}: ${targetEntityName} | null\n`
              break
            case 'many-to-many':
              code += `  ${propertyName}: ${targetEntityName}[]\n`
              break
          }
        }
        
        code += '}\n\n'
      }
    }
    
    // Generate join types for complex relationships
    code += this.generateJoinTypes(relationships)
    
    return code
  }
  
  async generateValidationTypes(schemas: Map<string, DiscoveredTableSchema>): Promise<string> {
    let code = '// Auto-generated validation types\n'
    code += '// Generated from column constraints and types\n\n'
    
    for (const [tableName, schema] of schemas) {
      const entityName = this.toPascalCase(tableName)
      
      code += `export interface ${entityName}Validation {\n`
      
      for (const column of schema.columns) {
        code += `  ${column.name}: {\n`
        
        // Type-based validations
        if (column.type.includes('varchar') && column.maxLength) {
          code += `    maxLength: ${column.maxLength}\n`
        }
        
        if (column.type.includes('int') || column.type.includes('numeric')) {
          if (column.precision) {
            code += `    precision: ${column.precision}\n`
          }
          if (column.scale) {
            code += `    scale: ${column.scale}\n`
          }
        }
        
        // Constraint-based validations
        if (!column.nullable) {
          code += `    required: true\n`
        }
        
        if (column.enumValues && column.enumValues.length > 0) {
          code += `    enum: [${column.enumValues.map(v => `'${v}'`).join(', ')}]\n`
        }
        
        // Unique constraints
        const isUnique = schema.uniqueConstraints.some(uc => uc.columns.includes(column.name))
        if (isUnique) {
          code += `    unique: true\n`
        }
        
        code += `  }\n`
      }
      
      code += '}\n\n'
    }
    
    return code
  }
  
  private generateUtilityTypes(schemas: Map<string, DiscoveredTableSchema>): string {
    let code = '// Utility types for common operations\n\n'
    
    // Generate table name union type
    code += `export type TableName = ${Array.from(schemas.keys()).map(name => `'${name}'`).join(' | ')}\n\n`
    
    // Generate entity name union type
    const entityNames = Array.from(schemas.keys()).map(name => this.toPascalCase(name))
    code += `export type EntityName = ${entityNames.join(' | ')}\n\n`
    
    // Generate row type union
    const rowTypes = entityNames.map(name => `${name}Row`)
    code += `export type RowType = ${rowTypes.join(' | ')}\n\n`
    
    // Generate insertable type union
    const insertableTypes = entityNames.map(name => `Insertable${name}Row`)
    code += `export type InsertableType = ${insertableTypes.join(' | ')}\n\n`
    
    // Generate updateable type union
    const updateableTypes = entityNames.map(name => `Updateable${name}Row`)
    code += `export type UpdateableType = ${updateableTypes.join(' | ')}\n\n`
    
    // Generate generic query types
    code += `export interface QueryOptions {\n`
    code += `  limit?: number\n`
    code += `  offset?: number\n`
    code += `  orderBy?: Record<string, 'asc' | 'desc'>\n`
    code += `  select?: string[]\n`
    code += `}\n\n`
    
    code += `export interface QueryResult<T> {\n`
    code += `  data: T[]\n`
    code += `  total: number\n`
    code += `  hasMore: boolean\n`
    code += `}\n\n`
    
    return code
  }
  
  private generateJoinTypes(relationships: Map<string, RelationshipInfo[]>): string {
    let code = '// Join types for complex queries\n\n'
    
    for (const [tableName, tableRelationships] of relationships) {
      if (tableRelationships.length > 0) {
        const entityName = this.toPascalCase(tableName)
        const relatedEntities = tableRelationships.map(rel => this.toPascalCase(rel.targetTable))
        
        code += `export interface ${entityName}WithRelations {\n`
        code += `  ${entityName.toLowerCase()}: ${entityName}Row\n`
        
        for (const rel of tableRelationships) {
          const targetEntityName = this.toPascalCase(rel.targetTable)
          const propertyName = this.toCamelCase(rel.targetTable)
          
          switch (rel.type) {
            case 'one-to-one':
            case 'many-to-one':
              code += `  ${propertyName}: ${targetEntityName}Row | null\n`
              break
            case 'one-to-many':
            case 'many-to-many':
              code += `  ${propertyName}: ${targetEntityName}Row[]\n`
              break
          }
        }
        
        code += '}\n\n'
      }
    }
    
    return code
  }
  
  private generateColumnComment(column: DiscoveredColumn): string {
    const comments: string[] = []
    
    if (column.comment) {
      comments.push(column.comment)
    }
    
    if (column.isPrimaryKey) {
      comments.push('Primary key')
    }
    
    if (column.isAutoIncrement) {
      comments.push('Auto-increment')
    }
    
    if (column.isGenerated) {
      comments.push('Generated column')
    }
    
    if (column.enumValues && column.enumValues.length > 0) {
      comments.push(`Enum: ${column.enumValues.join(', ')}`)
    }
    
    return comments.length > 0 ? ` // ${comments.join(', ')}` : ''
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}
```

## Database Type Mapper

```typescript
export class DatabaseTypeMapper {
  private typeMappings = new Map<string, TypeMapping>()
  
  constructor() {
    this.registerDefaultMappings()
  }
  
  mapToTypeScript(column: DiscoveredColumn, optional: boolean = false): string {
    const baseType = this.getBaseType(column)
    const nullableType = column.nullable ? `${baseType} | null` : baseType
    return optional ? `${nullableType}` : nullableType
  }
  
  private getBaseType(column: DiscoveredColumn): string {
    const type = column.type.toLowerCase()
    const nativeType = column.nativeType?.toLowerCase() || ''
    
    // Handle specific database types
    if (nativeType.includes('uuid')) return 'string'
    if (nativeType.includes('json') || nativeType.includes('jsonb')) return 'any'
    if (nativeType.includes('bytea')) return 'Buffer'
    
    // Handle PostgreSQL specific types
    if (nativeType.includes('serial') || nativeType.includes('bigserial')) return 'number'
    if (nativeType.includes('money')) return 'number'
    if (nativeType.includes('inet') || nativeType.includes('cidr')) return 'string'
    if (nativeType.includes('macaddr')) return 'string'
    if (nativeType.includes('point') || nativeType.includes('polygon')) return 'string'
    
    // Handle MySQL specific types
    if (nativeType.includes('year')) return 'number'
    if (nativeType.includes('set')) return 'string[]'
    if (nativeType.includes('enum')) return 'string'
    
    // Handle generic types
    if (type.includes('int') || type.includes('serial') || type.includes('bigint')) {
      return 'number'
    }
    
    if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) {
      return 'number'
    }
    
    if (type.includes('bool')) return 'boolean'
    
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return 'Date'
    }
    
    if (type.includes('text') || type.includes('varchar') || type.includes('char') || type.includes('string')) {
      return 'string'
    }
    
    // Handle enum types
    if (column.enumValues && column.enumValues.length > 0) {
      const enumValues = column.enumValues.map(v => `'${v}'`).join(' | ')
      return enumValues
    }
    
    // Fallback to any for unknown types
    return 'any'
  }
  
  private registerDefaultMappings(): void {
    // PostgreSQL mappings
    this.typeMappings.set('uuid', { tsType: 'string', description: 'UUID' })
    this.typeMappings.set('jsonb', { tsType: 'any', description: 'JSONB' })
    this.typeMappings.set('json', { tsType: 'any', description: 'JSON' })
    this.typeMappings.set('bytea', { tsType: 'Buffer', description: 'Binary data' })
    this.typeMappings.set('serial', { tsType: 'number', description: 'Auto-increment integer' })
    this.typeMappings.set('bigserial', { tsType: 'number', description: 'Auto-increment big integer' })
    this.typeMappings.set('money', { tsType: 'number', description: 'Money' })
    this.typeMappings.set('inet', { tsType: 'string', description: 'IP address' })
    this.typeMappings.set('cidr', { tsType: 'string', description: 'Network address' })
    this.typeMappings.set('macaddr', { tsType: 'string', description: 'MAC address' })
    
    // MySQL mappings
    this.typeMappings.set('year', { tsType: 'number', description: 'Year' })
    this.typeMappings.set('set', { tsType: 'string[]', description: 'Set of strings' })
    
    // Common mappings
    this.typeMappings.set('varchar', { tsType: 'string', description: 'Variable character string' })
    this.typeMappings.set('text', { tsType: 'string', description: 'Text' })
    this.typeMappings.set('char', { tsType: 'string', description: 'Fixed character string' })
    this.typeMappings.set('int', { tsType: 'number', description: 'Integer' })
    this.typeMappings.set('bigint', { tsType: 'number', description: 'Big integer' })
    this.typeMappings.set('smallint', { tsType: 'number', description: 'Small integer' })
    this.typeMappings.set('decimal', { tsType: 'number', description: 'Decimal number' })
    this.typeMappings.set('numeric', { tsType: 'number', description: 'Numeric' })
    this.typeMappings.set('float', { tsType: 'number', description: 'Floating point number' })
    this.typeMappings.set('double', { tsType: 'number', description: 'Double precision number' })
    this.typeMappings.set('boolean', { tsType: 'boolean', description: 'Boolean' })
    this.typeMappings.set('bool', { tsType: 'boolean', description: 'Boolean' })
    this.typeMappings.set('date', { tsType: 'Date', description: 'Date' })
    this.typeMappings.set('time', { tsType: 'Date', description: 'Time' })
    this.typeMappings.set('timestamp', { tsType: 'Date', description: 'Timestamp' })
    this.typeMappings.set('datetime', { tsType: 'Date', description: 'Date and time' })
  }
  
  registerTypeMapping(databaseType: string, mapping: TypeMapping): void {
    this.typeMappings.set(databaseType, mapping)
  }
}

interface TypeMapping {
  tsType: string
  description: string
}
```

## Repository Class Generator

```typescript
export class RepositoryClassGenerator {
  async generateRepositoryClass(
    tableName: string, 
    schema: DiscoveredTableSchema, 
    relationships: RelationshipInfo[]
  ): Promise<GeneratedRepositoryClass> {
    const entityName = this.toPascalCase(tableName)
    const repositoryName = `${entityName}Repository`
    const rowTypeName = `${entityName}Row`
    const insertableTypeName = `Insertable${entityName}Row`
    const updateableTypeName = `Updateable${entityName}Row`
    
    let code = `// Auto-generated repository class\n`
    code += `// Generated from database schema introspection\n\n`
    
    code += `import { BaseRepository } from '../base-repository'\n`
    code += `import { Kysely } from 'kysely'\n`
    code += `import { ${entityName}, ${rowTypeName}, ${insertableTypeName}, ${updateableTypeName} } from '../entities/${this.toKebabCase(entityName)}.entity'\n`
    
    // Add relationship imports
    const relationshipImports = new Set<string>()
    for (const rel of relationships) {
      relationshipImports.add(this.toPascalCase(rel.targetTable))
    }
    
    for (const importName of relationshipImports) {
      code += `import { ${importName} } from '../entities/${this.toKebabCase(importName)}.entity'\n`
    }
    
    code += `\nexport class ${repositoryName} extends BaseRepository<${entityName}, ${rowTypeName}> {\n`
    
    // Constructor
    code += `  constructor(db: Kysely<any>) {\n`
    code += `    super(db)\n`
    code += `  }\n\n`
    
    // Table name method
    code += `  getTableName(): string {\n`
    code += `    return '${tableName}'\n`
    code += `  }\n\n`
    
    // Primary key method
    const primaryKeys = schema.columns.filter(col => col.isPrimaryKey)
    if (primaryKeys.length === 1) {
      code += `  getPrimaryKey(): string {\n`
      code += `    return '${primaryKeys[0].name}'\n`
      code += `  }\n\n`
    } else {
      code += `  getPrimaryKeys(): string[] {\n`
      code += `    return [${primaryKeys.map(pk => `'${pk.name}'`).join(', ')}]\n`
      code += `  }\n\n`
    }
    
    // Row to entity conversion
    code += `  protected rowToEntity(row: ${rowTypeName}): ${entityName} {\n`
    code += `    return new ${entityName}().fromRow(row)\n`
    code += `  }\n\n`
    
    // Custom query methods based on schema
    code += this.generateCustomQueryMethods(schema, relationships, entityName, rowTypeName)
    
    // Relationship methods
    if (relationships.length > 0) {
      code += this.generateRelationshipMethods(relationships, entityName, rowTypeName)
    }
    
    // Validation methods
    code += this.generateValidationMethods(schema, entityName)
    
    code += `}\n`
    
    return {
      className: repositoryName,
      fileName: `${this.toKebabCase(repositoryName)}.ts`,
      content: code,
      dependencies: Array.from(relationshipImports),
      tableName: tableName,
      schema: schema,
      relationships: relationships
    }
  }
  
  private generateCustomQueryMethods(
    schema: DiscoveredTableSchema,
    relationships: RelationshipInfo[],
    entityName: string,
    rowTypeName: string
  ): string {
    let code = ''
    
    // Generate find by unique columns
    const uniqueColumns = schema.columns.filter(col => 
      schema.uniqueConstraints.some(uc => uc.columns.includes(col.name)) && !col.isPrimaryKey
    )
    
    for (const column of uniqueColumns) {
      const propertyName = this.toCamelCase(column.name)
      const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
      
      code += `  async findBy${this.toPascalCase(column.name)}(${propertyName}: ${tsType}): Promise<${entityName} | null> {\n`
      code += `    const row = await this.db\n`
      code += `      .selectFrom('${schema.name}')\n`
      code += `      .selectAll()\n`
      code += `      .where('${column.name}', '=', ${propertyName})\n`
      code += `      .executeTakeFirst()\n\n`
      code += `    return row ? this.rowToEntity(row) : null\n`
      code += `  }\n\n`
    }
    
    // Generate find by foreign key methods
    for (const fk of schema.foreignKeys) {
      const propertyName = this.toCamelCase(fk.columnName)
      const tsType = this.mapDbTypeToTsType(fk.columnName, false)
      
      code += `  async findBy${this.toPascalCase(fk.columnName)}(${propertyName}: ${tsType}): Promise<${entityName}[]> {\n`
      code += `    const rows = await this.db\n`
      code += `      .selectFrom('${schema.name}')\n`
      code += `      .selectAll()\n`
      code += `      .where('${fk.columnName}', '=', ${propertyName})\n`
      code += `      .execute()\n\n`
      code += `    return rows.map(row => this.rowToEntity(row))\n`
      code += `  }\n\n`
    }
    
    // Generate search methods for text columns
    const textColumns = schema.columns.filter(col => 
      col.type.includes('text') || col.type.includes('varchar') || col.type.includes('char')
    )
    
    for (const column of textColumns) {
      const propertyName = this.toCamelCase(column.name)
      
      code += `  async searchBy${this.toPascalCase(column.name)}(query: string): Promise<${entityName}[]> {\n`
      code += `    const rows = await this.db\n`
      code += `      .selectFrom('${schema.name}')\n`
      code += `      .selectAll()\n`
      code += `      .where('${column.name}', 'ilike', \`%$\{query}%\`)\n`
      code += `      .execute()\n\n`
      code += `    return rows.map(row => this.rowToEntity(row))\n`
      code += `  }\n\n`
    }
    
    return code
  }
  
  private generateRelationshipMethods(
    relationships: RelationshipInfo[],
    entityName: string,
    rowTypeName: string
  ): string {
    let code = ''
    
    for (const rel of relationships) {
      const targetEntityName = this.toPascalCase(rel.targetTable)
      const propertyName = this.toCamelCase(rel.targetTable)
      const targetRepositoryName = `${targetEntityName}Repository`
      
      switch (rel.type) {
        case 'one-to-one':
        case 'many-to-one':
          code += `  async load${this.toPascalCase(propertyName)}(entity: ${entityName}): Promise<${targetEntityName} | null> {\n`
          code += `    const targetRepo = new ${targetRepositoryName}(this.db)\n`
          code += `    return await targetRepo.findById(entity.${this.toCamelCase(rel.sourceColumn)})\n`
          code += `  }\n\n`
          break
          
        case 'one-to-many':
          code += `  async load${this.toPascalCase(propertyName)}(entity: ${entityName}): Promise<${targetEntityName}[]> {\n`
          code += `    const targetRepo = new ${targetRepositoryName}(this.db)\n`
          code += `    return await targetRepo.findBy${this.toPascalCase(rel.targetColumn)}(entity.${this.toCamelCase(rel.sourceColumn)})\n`
          code += `  }\n\n`
          break
      }
    }
    
    return code
  }
  
  private generateValidationMethods(schema: DiscoveredTableSchema, entityName: string): string {
    let code = ''
    
    // Generate validation method for required fields
    const requiredFields = schema.columns.filter(col => !col.nullable)
    
    if (requiredFields.length > 0) {
      code += `  validateRequiredFields(entity: ${entityName}): string[] {\n`
      code += `    const errors: string[] = []\n\n`
      
      for (const field of requiredFields) {
        const propertyName = this.toCamelCase(field.name)
        code += `    if (!entity.${propertyName}) {\n`
        code += `      errors.push('${field.name} is required')\n`
        code += `    }\n\n`
      }
      
      code += `    return errors\n`
      code += `  }\n\n`
    }
    
    // Generate validation method for enum values
    const enumColumns = schema.columns.filter(col => col.enumValues && col.enumValues.length > 0)
    
    for (const column of enumColumns) {
      const propertyName = this.toCamelCase(column.name)
      const enumValues = column.enumValues!.map(v => `'${v}'`).join(', ')
      
      code += `  validate${this.toPascalCase(column.name)}(value: string): boolean {\n`
      code += `    const validValues = [${enumValues}]\n`
      code += `    return validValues.includes(value)\n`
      code += `  }\n\n`
    }
    
    return code
  }
  
  private mapDbTypeToTsType(dbType: string, nullable: boolean): string {
    // Simplified type mapping - in real implementation, use the DatabaseTypeMapper
    if (dbType.includes('int') || dbType.includes('serial')) return 'number'
    if (dbType.includes('float') || dbType.includes('decimal')) return 'number'
    if (dbType.includes('bool')) return 'boolean'
    if (dbType.includes('date') || dbType.includes('time')) return 'Date'
    if (dbType.includes('json')) return 'any'
    if (dbType.includes('text') || dbType.includes('varchar')) return 'string'
    return 'any'
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }
}
```

## Type Cache Management

```typescript
export class TypeCacheManager {
  private cache = new Map<string, CachedTypeDefinition>()
  private cacheTimestamps = new Map<string, number>()
  private readonly DEFAULT_TTL = 300000 // 5 minutes
  
  getCachedType(key: string): CachedTypeDefinition | undefined {
    const cached = this.cache.get(key)
    const timestamp = this.cacheTimestamps.get(key)
    
    if (!cached || !timestamp) {
      return undefined
    }
    
    // Check if cache is expired
    if (Date.now() - timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key)
      this.cacheTimestamps.delete(key)
      return undefined
    }
    
    return cached
  }
  
  setCachedType(key: string, type: CachedTypeDefinition): void {
    this.cache.set(key, type)
    this.cacheTimestamps.set(key, Date.now())
  }
  
  invalidateCache(tableName?: string): void {
    if (tableName) {
      // Invalidate cache for specific table
      for (const key of this.cache.keys()) {
        if (key.includes(tableName)) {
          this.cache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    } else {
      // Clear entire cache
      this.cache.clear()
      this.cacheTimestamps.clear()
    }
  }
  
  getCacheStats(): CacheStats {
    const now = Date.now()
    let expired = 0
    let valid = 0
    
    for (const [key, timestamp] of this.cacheTimestamps) {
      if (now - timestamp > this.DEFAULT_TTL) {
        expired++
      } else {
        valid++
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries: valid,
      expiredEntries: expired,
      hitRate: this.calculateHitRate()
    }
  }
  
  private calculateHitRate(): number {
    // This would need to track hits/misses in a real implementation
    return 0.85 // Placeholder
  }
}

interface CachedTypeDefinition {
  content: string
  dependencies: string[]
  timestamp: number
  version: number
}

interface CacheStats {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  hitRate: number
}
```

## Usage Examples

### Basic Type Generation

```typescript
// Generate types from live database
const dynamicTypeSystem = DynamicTypeSystem.getInstance()
const result = await dynamicTypeSystem.generateTypesFromDatabase(db)

if (result.success) {
  console.log('Generated types for', result.entities.size, 'entities')
  
  // Save generated files
  await writeFile('generated/types/database.types.ts', result.types.database)
  await writeFile('generated/types/entities.types.ts', result.types.entities)
  await writeFile('generated/types/repositories.types.ts', result.types.repositories)
  
  // Save entity classes
  for (const [tableName, entityClass] of result.entities) {
    await writeFile(`generated/entities/${entityClass.fileName}`, entityClass.content)
  }
  
  // Save repository classes
  for (const [tableName, repoClass] of result.repositories) {
    await writeFile(`generated/repositories/${repoClass.fileName}`, repoClass.content)
  }
}
```

### Incremental Type Updates

```typescript
// Update types for specific table changes
const changeResult = await dynamicTypeSystem.updateTypesForSchemaChange(schemaChange)

if (changeResult.success) {
  console.log('Types updated successfully')
  
  // Save updated files
  for (const updatedFile of changeResult.updatedFiles) {
    await writeFile(updatedFile.path, updatedFile.content)
  }
}
```

### Custom Type Mappings

```typescript
// Register custom type mappings
const typeMapper = new DatabaseTypeMapper()
typeMapper.registerTypeMapping('custom_type', {
  tsType: 'CustomTypeInterface',
  description: 'Custom database type'
})

// Use in type generation
const generator = new AdvancedTypeGenerator()
generator.setTypeMapper(typeMapper)
```

## Performance Characteristics

- **Type Generation**: O(n) - Linear with schema complexity
- **Cache Lookup**: O(1) - Map-based cache
- **Cache Management**: O(1) - Efficient cache operations
- **Memory Usage**: Moderate - Caches generated types and schemas
- **Database Queries**: Minimal - Only during schema introspection

## Benefits

1. **Zero Configuration** - No manual type definitions required
2. **Dynamic Updates** - Types update automatically with schema changes
3. **Full Type Safety** - Complete TypeScript support
4. **Performance Optimized** - Efficient caching and generation
5. **Relationship Awareness** - Automatically detects and types relationships
6. **Validation Support** - Generates validation types from constraints
7. **Multi-Database Support** - Pluggable type mapping system

## Limitations

1. **Database Dependency** - Requires database connection for type generation
2. **Initial Generation Time** - First generation can be slow for large schemas
3. **Complex Types** - May not handle all database-specific types perfectly
4. **Memory Usage** - Caches generated types in memory

## Integration Points

- **Schema Introspection Engine** - Uses discovered schemas for type generation
- **Entity Manager** - Registers generated entity classes
- **Repository Registry** - Uses generated repository classes
- **Configuration Manager** - Configures type generation behavior
- **Migration System** - Updates types when schema changes
