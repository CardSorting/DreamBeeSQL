# Type System Architecture

## Overview

The Type System provides centralized type generation and management using a singleton pattern. It focuses on essential type operations without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single type system instance
- **Code Generation** - Generate types from schema and entities
- **Type Safety** - Full TypeScript support
- **Minimal Overhead** - Efficient type generation
- **Lazy Generation** - Generate types only when needed
- **No Database Queries** - Use existing schema information

## Architecture

```typescript
// Type System (Singleton)
export class TypeSystem {
  private static instance: TypeSystem | null = null
  private typeCache = new Map<string, GeneratedType>()
  private schemaRegistry: SchemaRegistry
  private entityManager: EntityManager
  
  private constructor() {
    this.schemaRegistry = SchemaRegistry.getInstance()
    this.entityManager = EntityManager.getInstance()
  }
  
  static getInstance(): TypeSystem {
    if (!TypeSystem.instance) {
      TypeSystem.instance = new TypeSystem()
    }
    return TypeSystem.instance
  }
  
  // Core methods
  async generateDatabaseTypes(): Promise<string>
  async generateEntityTypes(): Promise<string>
  async generateRepositoryTypes(): Promise<string>
  async generateAllTypes(): Promise<GeneratedTypes>
  clearCache(): void
  getCachedType(name: string): GeneratedType | undefined
}
```

## Type Generation

```typescript
export interface GeneratedType {
  name: string
  content: string
  dependencies: string[]
  timestamp: number
}

export interface GeneratedTypes {
  database: string
  entities: string
  repositories: string
  relationships: string
  validations: string
}

export class DatabaseTypeGenerator {
  private schemaRegistry: SchemaRegistry
  
  constructor(schemaRegistry: SchemaRegistry) {
    this.schemaRegistry = schemaRegistry
  }
  
  async generate(): Promise<string> {
    const schemas = await this.schemaRegistry.getAllTableSchemas()
    
    let code = '// Generated database types\n'
    code += 'export interface Database {\n'
    
    for (const [tableName, schema] of schemas) {
      code += `  ${tableName}: {\n`
      
      for (const column of schema.columns) {
        const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
        code += `    ${column.name}: ${tsType}\n`
      }
      
      code += '  }\n'
    }
    
    code += '}\n'
    return code
  }
  
  private mapDbTypeToTsType(dbType: string, nullable: boolean): string {
    const baseType = this.getBaseType(dbType)
    return nullable ? `${baseType} | null` : baseType
  }
  
  private getBaseType(dbType: string): string {
    const type = dbType.toLowerCase()
    
    if (type.includes('int') || type.includes('serial')) return 'number'
    if (type.includes('float') || type.includes('double') || type.includes('decimal')) return 'number'
    if (type.includes('bool')) return 'boolean'
    if (type.includes('date') || type.includes('time')) return 'Date'
    if (type.includes('json')) return 'any'
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'string'
    
    return 'any'
  }
}

export class EntityTypeGenerator {
  private entityManager: EntityManager
  
  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager
  }
  
  async generate(): Promise<string> {
    const entities = this.entityManager.getAllEntities()
    
    let code = '// Generated entity types\n'
    
    for (const [tableName, entityClass] of entities) {
      const entityName = this.toPascalCase(tableName)
      const rowType = `${entityName}Row`
      const insertableType = `Insertable${entityName}Row`
      const updateableType = `Updateable${entityName}Row`
      
      // Generate row type
      code += `export interface ${rowType} {\n`
      const metadata = this.entityManager.getEntityMetadata(tableName)
      if (metadata) {
        for (const column of metadata.columns) {
          const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
          code += `  ${column.name}: ${tsType}\n`
        }
      }
      code += '}\n\n'
      
      // Generate insertable type
      code += `export interface ${insertableType} {\n`
      if (metadata) {
        for (const column of metadata.columns) {
          if (!column.primaryKey && !column.autoIncrement) {
            const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
            code += `  ${column.name}: ${tsType}\n`
          }
        }
      }
      code += '}\n\n'
      
      // Generate updateable type
      code += `export interface ${updateableType} {\n`
      if (metadata) {
        for (const column of metadata.columns) {
          if (!column.primaryKey) {
            const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
            code += `  ${column.name}?: ${tsType}\n`
          }
        }
      }
      code += '}\n\n'
    }
    
    return code
  }
  
  private mapDbTypeToTsType(dbType: string, nullable: boolean): string {
    const baseType = this.getBaseType(dbType)
    return nullable ? `${baseType} | null` : baseType
  }
  
  private getBaseType(dbType: string): string {
    const type = dbType.toLowerCase()
    
    if (type.includes('int') || type.includes('serial')) return 'number'
    if (type.includes('float') || type.includes('double') || type.includes('decimal')) return 'number'
    if (type.includes('bool')) return 'boolean'
    if (type.includes('date') || type.includes('time')) return 'Date'
    if (type.includes('json')) return 'any'
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'string'
    
    return 'any'
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

export class RepositoryTypeGenerator {
  private entityManager: EntityManager
  
  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager
  }
  
  async generate(): Promise<string> {
    const entities = this.entityManager.getAllEntities()
    
    let code = '// Generated repository types\n'
    code += 'import { BaseRepository } from \'./base-repository\'\n'
    code += 'import { Kysely } from \'kysely\'\n\n'
    
    for (const [tableName, entityClass] of entities) {
      const entityName = this.toPascalCase(tableName)
      const repositoryName = `${entityName}Repository`
      const rowType = `${entityName}Row`
      
      code += `export class ${repositoryName} extends BaseRepository<${entityName}, ${rowType}> {\n`
      code += `  getTableName(): string { return '${tableName}' }\n`
      code += `  getPrimaryKey(): string { return 'id' }\n\n`
      code += `  protected rowToEntity(row: ${rowType}): ${entityName} {\n`
      code += `    return new ${entityName}().fromRow(row)\n`
      code += `  }\n`
      code += `}\n\n`
    }
    
    return code
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

export class RelationshipTypeGenerator {
  private entityManager: EntityManager
  
  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager
  }
  
  async generate(): Promise<string> {
    const entities = this.entityManager.getAllEntities()
    
    let code = '// Generated relationship types\n'
    
    for (const [tableName, entityClass] of entities) {
      const entityName = this.toPascalCase(tableName)
      const metadata = this.entityManager.getEntityMetadata(tableName)
      
      if (metadata && metadata.relationships.length > 0) {
        code += `export interface ${entityName}Relations {\n`
        
        for (const relationship of metadata.relationships) {
          const targetEntityName = this.toPascalCase(relationship.targetEntity)
          
          switch (relationship.type) {
            case 'hasOne':
              code += `  ${relationship.property}: ${targetEntityName} | null\n`
              break
            case 'hasMany':
              code += `  ${relationship.property}: ${targetEntityName}[]\n`
              break
            case 'belongsTo':
              code += `  ${relationship.property}: ${targetEntityName} | null\n`
              break
          }
        }
        
        code += '}\n\n'
      }
    }
    
    return code
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

export class ValidationTypeGenerator {
  private entityManager: EntityManager
  
  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager
  }
  
  async generate(): Promise<string> {
    const entities = this.entityManager.getAllEntities()
    
    let code = '// Generated validation types\n'
    
    for (const [tableName, entityClass] of entities) {
      const entityName = this.toPascalCase(tableName)
      const metadata = this.entityManager.getEntityMetadata(tableName)
      
      if (metadata && metadata.validations.length > 0) {
        code += `export interface ${entityName}Validation {\n`
        
        for (const validation of metadata.validations) {
          code += `  ${validation.property}: {\n`
          
          for (const rule of validation.rules) {
            code += `    ${rule.type}: ${JSON.stringify(rule.options || {})}\n`
          }
          
          code += `  }\n`
        }
        
        code += '}\n\n'
      }
    }
    
    return code
  }
}
```

## Usage Examples

### Basic Type Generation

```typescript
// Get type system
const typeSystem = TypeSystem.getInstance()

// Generate database types
const databaseTypes = await typeSystem.generateDatabaseTypes()
console.log(databaseTypes)

// Generate entity types
const entityTypes = await typeSystem.generateEntityTypes()
console.log(entityTypes)

// Generate all types
const allTypes = await typeSystem.generateAllTypes()
console.log(allTypes)
```

### Type Generation with Caching

```typescript
// Generate types with caching
const typeSystem = TypeSystem.getInstance()

// Check if types are cached
const cachedDatabaseTypes = typeSystem.getCachedType('database')
if (cachedDatabaseTypes) {
  console.log('Using cached database types')
} else {
  console.log('Generating database types')
  const databaseTypes = await typeSystem.generateDatabaseTypes()
  console.log(databaseTypes)
}
```

### Custom Type Generation

```typescript
// Custom type generator
class CustomTypeGenerator {
  async generateCustomTypes(): Promise<string> {
    let code = '// Custom types\n'
    
    // Generate custom interfaces
    code += 'export interface CustomUser {\n'
    code += '  id: string\n'
    code += '  email: string\n'
    code += '  profile: CustomProfile\n'
    code += '}\n\n'
    
    code += 'export interface CustomProfile {\n'
    code += '  userId: string\n'
    code += '  firstName: string\n'
    code += '  lastName: string\n'
    code += '}\n\n'
    
    return code
  }
}

// Use custom generator
const customGenerator = new CustomTypeGenerator()
const customTypes = await customGenerator.generateCustomTypes()
console.log(customTypes)
```

### Type Generation in Build Process

```typescript
// Generate types during build
async function generateTypesForBuild() {
  const typeSystem = TypeSystem.getInstance()
  
  try {
    console.log('Generating types...')
    
    const types = await typeSystem.generateAllTypes()
    
    // Write types to files
    await writeFile('generated/database.types.ts', types.database)
    await writeFile('generated/entities.types.ts', types.entities)
    await writeFile('generated/repositories.types.ts', types.repositories)
    await writeFile('generated/relationships.types.ts', types.relationships)
    await writeFile('generated/validations.types.ts', types.validations)
    
    console.log('Types generated successfully')
  } catch (error) {
    console.error('Type generation failed:', error)
    process.exit(1)
  }
}

// Run type generation
generateTypesForBuild()
```

### Type Generation with Schema Changes

```typescript
// Generate types when schema changes
async function handleSchemaChange(tableName: string) {
  const typeSystem = TypeSystem.getInstance()
  
  // Clear cache for affected types
  typeSystem.clearCache()
  
  // Regenerate types
  const types = await typeSystem.generateAllTypes()
  
  // Update generated files
  await updateGeneratedFiles(types)
  
  console.log(`Types updated for schema change: ${tableName}`)
}

// Listen for schema changes
schemaRegistry.onSchemaChange(handleSchemaChange)
```

## Performance Characteristics

- **Type Generation**: O(n) - Depends on schema complexity
- **Cache Lookup**: O(1) - Map-based cache
- **Memory Usage**: Minimal - Only generated type content
- **Database Queries**: None - Uses existing schema information
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Centralized Type Management** - Single system for all type generation
2. **Code Generation** - Automatic type generation from schema
3. **Type Safety** - Full TypeScript support
4. **Caching** - Efficient type caching
5. **Minimal Overhead** - No database queries for type generation
6. **Extensible** - Custom type generators

## Limitations

1. **Static Generation** - Types generated at build time
2. **Memory Usage** - Generated types cached in memory
3. **Schema Dependency** - Requires schema information

## Integration Points

- **Schema Registry** - Uses schema information for type generation
- **Entity Manager** - Uses entity metadata for type generation
- **Repository Registry** - Uses repository information for type generation
- **Configuration Manager** - Uses configuration for type generation settings
