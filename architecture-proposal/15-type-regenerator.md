# Type Regenerator Architecture

## Overview

The Type Regenerator provides centralized, minimal-overhead type regeneration when schema changes are detected. It uses a singleton pattern with simple type invalidation and regeneration without heavy monitoring or aggressive collection.

## Design Principles

- **Singleton Pattern** - Single regenerator instance
- **Minimal Overhead** - Simple type invalidation and regeneration
- **Change-Driven** - Only regenerates when changes detected
- **Centralized Cache** - Single type cache management
- **No Background Processes** - On-demand regeneration only

## Architecture

```typescript
// Type Regenerator (Singleton)
export class TypeRegenerator {
  private static instance: TypeRegenerator | null = null
  private typeCache = new Map<string, CachedType>()
  private dynamicTypeSystem: DynamicTypeSystem
  
  private constructor() {
    this.dynamicTypeSystem = DynamicTypeSystem.getInstance()
  }
  
  static getInstance(): TypeRegenerator {
    if (!TypeRegenerator.instance) {
      TypeRegenerator.instance = new TypeRegenerator()
    }
    return TypeRegenerator.instance
  }
  
  // Core methods
  async regenerateTypesForChanges(changes: SchemaChange[], db: Kysely<any>): Promise<RegenerationResult>
  async regenerateAllTypes(db: Kysely<any>): Promise<RegenerationResult>
  invalidateTypeCache(tableName?: string): void
  getCachedType(typeName: string): CachedType | undefined
}
```

## Regeneration Structure

```typescript
export interface RegenerationResult {
  success: boolean
  regeneratedTypes: RegeneratedType[]
  errors: RegenerationError[]
}

export interface RegeneratedType {
  typeName: string
  tableName: string
  content: string
  filePath: string
  dependencies: string[]
}

export interface RegenerationError {
  typeName: string
  tableName?: string
  message: string
  error: Error
}

export interface CachedType {
  content: string
  timestamp: number
  version: number
  dependencies: string[]
}
```

## Implementation

```typescript
export class TypeRegenerator {
  private static instance: TypeRegenerator | null = null
  private typeCache = new Map<string, CachedType>()
  private dynamicTypeSystem: DynamicTypeSystem
  
  private constructor() {
    this.dynamicTypeSystem = DynamicTypeSystem.getInstance()
  }
  
  static getInstance(): TypeRegenerator {
    if (!TypeRegenerator.instance) {
      TypeRegenerator.instance = new TypeRegenerator()
    }
    return TypeRegenerator.instance
  }
  
  async regenerateTypesForChanges(changes: SchemaChange[], db: Kysely<any>): Promise<RegenerationResult> {
    const regeneratedTypes: RegeneratedType[] = []
    const errors: RegenerationError[] = []
    
    try {
      // Group changes by table
      const changesByTable = this.groupChangesByTable(changes)
      
      // Regenerate types for affected tables
      for (const [tableName, tableChanges] of changesByTable) {
        try {
          const tableResult = await this.regenerateTableTypes(tableName, tableChanges, db)
          regeneratedTypes.push(...tableResult.regeneratedTypes)
          
          if (tableResult.errors.length > 0) {
            errors.push(...tableResult.errors)
          }
        } catch (error) {
          errors.push({
            typeName: `table_${tableName}`,
            tableName,
            message: `Failed to regenerate types for table ${tableName}`,
            error: error as Error
          })
        }
      }
      
      // Regenerate global types if needed
      const needsGlobalRegeneration = this.needsGlobalRegeneration(changes)
      if (needsGlobalRegeneration) {
        const globalResult = await this.regenerateGlobalTypes(db)
        regeneratedTypes.push(...globalResult.regeneratedTypes)
        
        if (globalResult.errors.length > 0) {
          errors.push(...globalResult.errors)
        }
      }
      
      return {
        success: errors.length === 0,
        regeneratedTypes,
        errors
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: 'global_regeneration',
          message: 'Failed to regenerate types',
          error: error as Error
        }]
      }
    }
  }
  
  async regenerateAllTypes(db: Kysely<any>): Promise<RegenerationResult> {
    try {
      // Clear all cached types
      this.typeCache.clear()
      
      // Regenerate all types from database
      const result = await this.dynamicTypeSystem.generateTypesFromDatabase(db)
      
      if (!result.success) {
        return {
          success: false,
          regeneratedTypes: [],
          errors: result.errors.map(err => ({
            typeName: 'all_types',
            message: err.message,
            error: new Error(err.message)
          }))
        }
      }
      
      // Convert to regenerated types
      const regeneratedTypes: RegeneratedType[] = []
      
      // Database types
      regeneratedTypes.push({
        typeName: 'database_types',
        tableName: '',
        content: result.types.database,
        filePath: 'generated/types/database.types.ts',
        dependencies: []
      })
      
      // Entity types
      regeneratedTypes.push({
        typeName: 'entity_types',
        tableName: '',
        content: result.types.entities,
        filePath: 'generated/types/entities.types.ts',
        dependencies: []
      })
      
      // Repository types
      regeneratedTypes.push({
        typeName: 'repository_types',
        tableName: '',
        content: result.types.repositories,
        filePath: 'generated/types/repositories.types.ts',
        dependencies: []
      })
      
      // Relationship types
      regeneratedTypes.push({
        typeName: 'relationship_types',
        tableName: '',
        content: result.types.relationships,
        filePath: 'generated/types/relationships.types.ts',
        dependencies: []
      })
      
      return {
        success: true,
        regeneratedTypes,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: 'all_types',
          message: 'Failed to regenerate all types',
          error: error as Error
        }]
      }
    }
  }
  
  private async regenerateTableTypes(
    tableName: string,
    changes: SchemaChange[],
    db: Kysely<any>
  ): Promise<RegenerationResult> {
    const regeneratedTypes: RegeneratedType[] = []
    const errors: RegenerationError[] = []
    
    try {
      // Get current table schema
      const currentSchemas = await this.dynamicTypeSystem.introspectionEngine.getCurrentSchemas(db)
      const tableSchema = currentSchemas.get(tableName)
      
      if (!tableSchema) {
        throw new Error(`Table ${tableName} not found`)
      }
      
      // Get relationships for the table
      const relationships = await this.dynamicTypeSystem.introspectionEngine.detectRelationships(
        new Map([[tableName, tableSchema]])
      )
      
      // Regenerate entity class
      const entityResult = await this.regenerateEntityClass(tableName, tableSchema, relationships.get(tableName) || [])
      if (entityResult.success) {
        regeneratedTypes.push(...entityResult.regeneratedTypes)
      } else {
        errors.push(...entityResult.errors)
      }
      
      // Regenerate repository class
      const repoResult = await this.regenerateRepositoryClass(tableName, tableSchema, relationships.get(tableName) || [])
      if (repoResult.success) {
        regeneratedTypes.push(...repoResult.regeneratedTypes)
      } else {
        errors.push(...repoResult.errors)
      }
      
      // Regenerate table-specific types
      const typeResult = await this.regenerateTableTypes(tableName, tableSchema)
      if (typeResult.success) {
        regeneratedTypes.push(...typeResult.regeneratedTypes)
      } else {
        errors.push(...typeResult.errors)
      }
      
      return {
        success: errors.length === 0,
        regeneratedTypes,
        errors
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: `table_${tableName}`,
          tableName,
          message: `Failed to regenerate types for table ${tableName}`,
          error: error as Error
        }]
      }
    }
  }
  
  private async regenerateEntityClass(
    tableName: string,
    schema: DiscoveredTableSchema,
    relationships: RelationshipInfo[]
  ): Promise<RegenerationResult> {
    try {
      const entityGenerator = new EntityClassGenerator()
      const entityClass = await entityGenerator.generateEntityClass(schema, relationships)
      
      return {
        success: true,
        regeneratedTypes: [{
          typeName: entityClass.className,
          tableName,
          content: entityClass.content,
          filePath: `generated/entities/${entityClass.fileName}`,
          dependencies: entityClass.dependencies
        }],
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: `entity_${tableName}`,
          tableName,
          message: `Failed to regenerate entity class for ${tableName}`,
          error: error as Error
        }]
      }
    }
  }
  
  private async regenerateRepositoryClass(
    tableName: string,
    schema: DiscoveredTableSchema,
    relationships: RelationshipInfo[]
  ): Promise<RegenerationResult> {
    try {
      const repoGenerator = new RepositoryClassGenerator()
      const repoClass = await repoGenerator.generateRepositoryClass(tableName, schema, relationships)
      
      return {
        success: true,
        regeneratedTypes: [{
          typeName: repoClass.className,
          tableName,
          content: repoClass.content,
          filePath: `generated/repositories/${repoClass.fileName}`,
          dependencies: repoClass.dependencies
        }],
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: `repository_${tableName}`,
          tableName,
          message: `Failed to regenerate repository class for ${tableName}`,
          error: error as Error
        }]
      }
    }
  }
  
  private async regenerateTableTypes(
    tableName: string,
    schema: DiscoveredTableSchema
  ): Promise<RegenerationResult> {
    try {
      const entityName = this.toPascalCase(tableName)
      const typeGenerator = new AdvancedTypeGenerator()
      
      // Generate row type
      const rowType = await typeGenerator.generateRowType(`${entityName}Row`, schema)
      
      // Generate insertable type
      const insertableType = await typeGenerator.generateInsertableType(`Insertable${entityName}Row`, schema)
      
      // Generate updateable type
      const updateableType = await typeGenerator.generateUpdateableType(`Updateable${entityName}Row`, schema)
      
      const combinedTypes = `${rowType}\n\n${insertableType}\n\n${updateableType}`
      
      return {
        success: true,
        regeneratedTypes: [{
          typeName: `${tableName}_types`,
          tableName,
          content: combinedTypes,
          filePath: `generated/types/${tableName}.types.ts`,
          dependencies: []
        }],
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: `types_${tableName}`,
          tableName,
          message: `Failed to regenerate types for ${tableName}`,
          error: error as Error
        }]
      }
    }
  }
  
  private async regenerateGlobalTypes(db: Kysely<any>): Promise<RegenerationResult> {
    try {
      const result = await this.dynamicTypeSystem.generateTypesFromDatabase(db)
      
      if (!result.success) {
        return {
          success: false,
          regeneratedTypes: [],
          errors: result.errors.map(err => ({
            typeName: 'global_types',
            message: err.message,
            error: new Error(err.message)
          }))
        }
      }
      
      const regeneratedTypes: RegeneratedType[] = []
      
      // Database types
      regeneratedTypes.push({
        typeName: 'database_types',
        tableName: '',
        content: result.types.database,
        filePath: 'generated/types/database.types.ts',
        dependencies: []
      })
      
      // Utility types
      regeneratedTypes.push({
        typeName: 'utility_types',
        tableName: '',
        content: result.types.utilities,
        filePath: 'generated/types/utility.types.ts',
        dependencies: []
      })
      
      return {
        success: true,
        regeneratedTypes,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        regeneratedTypes: [],
        errors: [{
          typeName: 'global_types',
          message: 'Failed to regenerate global types',
          error: error as Error
        }]
      }
    }
  }
  
  private groupChangesByTable(changes: SchemaChange[]): Map<string, SchemaChange[]> {
    const changesByTable = new Map<string, SchemaChange[]>()
    
    for (const change of changes) {
      if (!changesByTable.has(change.tableName)) {
        changesByTable.set(change.tableName, [])
      }
      changesByTable.get(change.tableName)!.push(change)
    }
    
    return changesByTable
  }
  
  private needsGlobalRegeneration(changes: SchemaChange[]): boolean {
    return changes.some(change => 
      change.type === 'TABLE_ADDED' || 
      change.type === 'TABLE_REMOVED'
    )
  }
  
  invalidateTypeCache(tableName?: string): void {
    if (tableName) {
      // Invalidate cache for specific table
      for (const key of this.typeCache.keys()) {
        if (key.includes(tableName)) {
          this.typeCache.delete(key)
        }
      }
    } else {
      // Clear entire cache
      this.typeCache.clear()
    }
  }
  
  getCachedType(typeName: string): CachedType | undefined {
    return this.typeCache.get(typeName)
  }
  
  setCachedType(typeName: string, type: CachedType): void {
    this.typeCache.set(typeName, type)
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}
```

## Usage Examples

### Regenerate Types for Schema Changes

```typescript
// Detect changes and regenerate types
const detector = SchemaChangeDetector.getInstance()
const regenerator = TypeRegenerator.getInstance()

const changeResult = await detector.detectChanges(db)
if (changeResult.hasChanges) {
  const regenResult = await regenerator.regenerateTypesForChanges(changeResult.changes, db)
  
  if (regenResult.success) {
    console.log('Types regenerated successfully')
    
    // Save regenerated types
    for (const type of regenResult.regeneratedTypes) {
      await writeFile(type.filePath, type.content)
    }
  } else {
    console.error('Type regeneration failed:', regenResult.errors)
  }
}
```

### Regenerate All Types

```typescript
// Regenerate all types from scratch
const regenerator = TypeRegenerator.getInstance()
const result = await regenerator.regenerateAllTypes(db)

if (result.success) {
  console.log('All types regenerated successfully')
  
  // Save all regenerated types
  for (const type of result.regeneratedTypes) {
    await writeFile(type.filePath, type.content)
  }
}
```

### Cache Management

```typescript
// Invalidate cache for specific table
const regenerator = TypeRegenerator.getInstance()
regenerator.invalidateTypeCache('users')

// Clear entire cache
regenerator.invalidateTypeCache()
```

## Performance Characteristics

- **Type Regeneration**: O(n) - Linear with affected tables
- **Cache Operations**: O(1) - Map-based cache
- **Memory Usage**: Minimal - Only caches type content
- **Database Queries**: Only during schema introspection

## Benefits

1. **Minimal Overhead** - Simple type invalidation and regeneration
2. **Change-Driven** - Only regenerates when needed
3. **Centralized** - Single regenerator instance
4. **Error Handling** - Graceful failure handling
5. **Cache Management** - Simple type caching

## Limitations

1. **No Incremental Updates** - Regenerates entire types
2. **Memory Usage** - Caches type content in memory
3. **Database Dependency** - Requires database connection

## Integration Points

- **Schema Change Detector** - Triggers regeneration on changes
- **Dynamic Type System** - Uses for type generation
- **Entity Updater** - Coordinates entity updates
- **Repository Updater** - Coordinates repository updates
