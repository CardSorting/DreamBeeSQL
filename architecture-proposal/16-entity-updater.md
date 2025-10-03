# Entity Updater Architecture

## Overview

The Entity Updater provides centralized, minimal-overhead entity class updates when schema changes are detected. It uses a singleton pattern with simple entity registration and update without heavy monitoring or aggressive collection.

## Design Principles

- **Singleton Pattern** - Single updater instance
- **Minimal Overhead** - Simple entity registration and updates
- **Change-Driven** - Only updates when changes detected
- **Centralized Management** - Single entity registry
- **No Background Processes** - On-demand updates only

## Architecture

```typescript
// Entity Updater (Singleton)
export class EntityUpdater {
  private static instance: EntityUpdater | null = null
  private entityRegistry = new Map<string, RegisteredEntity>()
  private entityManager: EntityManager
  
  private constructor() {
    this.entityManager = EntityManager.getInstance()
  }
  
  static getInstance(): EntityUpdater {
    if (!EntityUpdater.instance) {
      EntityUpdater.instance = new EntityUpdater()
    }
    return EntityUpdater.instance
  }
  
  // Core methods
  async updateEntitiesForChanges(changes: SchemaChange[]): Promise<EntityUpdateResult>
  async registerNewEntity(tableName: string, entityClass: GeneratedEntityClass): Promise<RegistrationResult>
  async updateExistingEntity(tableName: string, entityClass: GeneratedEntityClass): Promise<UpdateResult>
  async removeEntity(tableName: string): Promise<RemovalResult>
  getRegisteredEntity(tableName: string): RegisteredEntity | undefined
  getAllRegisteredEntities(): Map<string, RegisteredEntity>
}
```

## Update Structure

```typescript
export interface EntityUpdateResult {
  success: boolean
  updatedEntities: UpdatedEntity[]
  errors: EntityUpdateError[]
}

export interface UpdatedEntity {
  tableName: string
  action: EntityAction
  entityClass: GeneratedEntityClass
  timestamp: Date
}

export type EntityAction = 'REGISTERED' | 'UPDATED' | 'REMOVED'

export interface EntityUpdateError {
  tableName: string
  action: EntityAction
  message: string
  error: Error
}

export interface RegistrationResult {
  success: boolean
  entity: RegisteredEntity
  error?: Error
}

export interface UpdateResult {
  success: boolean
  entity: RegisteredEntity
  error?: Error
}

export interface RemovalResult {
  success: boolean
  tableName: string
  error?: Error
}

export interface RegisteredEntity {
  tableName: string
  entityClass: GeneratedEntityClass
  registeredAt: Date
  lastUpdated: Date
  version: number
}
```

## Implementation

```typescript
export class EntityUpdater {
  private static instance: EntityUpdater | null = null
  private entityRegistry = new Map<string, RegisteredEntity>()
  private entityManager: EntityManager
  
  private constructor() {
    this.entityManager = EntityManager.getInstance()
  }
  
  static getInstance(): EntityUpdater {
    if (!EntityUpdater.instance) {
      EntityUpdater.instance = new EntityUpdater()
    }
    return EntityUpdater.instance
  }
  
  async updateEntitiesForChanges(changes: SchemaChange[]): Promise<EntityUpdateResult> {
    const updatedEntities: UpdatedEntity[] = []
    const errors: EntityUpdateError[] = []
    
    try {
      // Group changes by table
      const changesByTable = this.groupChangesByTable(changes)
      
      // Process each table's changes
      for (const [tableName, tableChanges] of changesByTable) {
        try {
          const tableResult = await this.processTableChanges(tableName, tableChanges)
          
          if (tableResult.success) {
            updatedEntities.push(...tableResult.updatedEntities)
          } else {
            errors.push(...tableResult.errors)
          }
        } catch (error) {
          errors.push({
            tableName,
            action: 'UPDATED',
            message: `Failed to process changes for table ${tableName}`,
            error: error as Error
          })
        }
      }
      
      return {
        success: errors.length === 0,
        updatedEntities,
        errors
      }
    } catch (error) {
      return {
        success: false,
        updatedEntities: [],
        errors: [{
          tableName: 'global',
          action: 'UPDATED',
          message: 'Failed to update entities',
          error: error as Error
        }]
      }
    }
  }
  
  private async processTableChanges(
    tableName: string,
    changes: SchemaChange[]
  ): Promise<EntityUpdateResult> {
    const updatedEntities: UpdatedEntity[] = []
    const errors: EntityUpdateError[] = []
    
    // Check if this is a new table
    const isNewTable = changes.some(change => change.type === 'TABLE_ADDED')
    const isRemovedTable = changes.some(change => change.type === 'TABLE_REMOVED')
    
    if (isRemovedTable) {
      // Remove entity for deleted table
      const removeResult = await this.removeEntity(tableName)
      if (removeResult.success) {
        updatedEntities.push({
          tableName,
          action: 'REMOVED',
          entityClass: {} as GeneratedEntityClass,
          timestamp: new Date()
        })
      } else {
        errors.push({
          tableName,
          action: 'REMOVED',
          message: `Failed to remove entity for table ${tableName}`,
          error: removeResult.error!
        })
      }
    } else if (isNewTable) {
      // Generate and register new entity
      const newEntityResult = await this.generateAndRegisterEntity(tableName)
      if (newEntityResult.success) {
        updatedEntities.push({
          tableName,
          action: 'REGISTERED',
          entityClass: newEntityResult.entityClass,
          timestamp: new Date()
        })
      } else {
        errors.push({
          tableName,
          action: 'REGISTERED',
          message: `Failed to register new entity for table ${tableName}`,
          error: newEntityResult.error!
        })
      }
    } else {
      // Update existing entity
      const updateResult = await this.updateExistingEntityFromChanges(tableName, changes)
      if (updateResult.success) {
        updatedEntities.push({
          tableName,
          action: 'UPDATED',
          entityClass: updateResult.entityClass,
          timestamp: new Date()
        })
      } else {
        errors.push({
          tableName,
          action: 'UPDATED',
          message: `Failed to update entity for table ${tableName}`,
          error: updateResult.error!
        })
      }
    }
    
    return {
      success: errors.length === 0,
      updatedEntities,
      errors
    }
  }
  
  async registerNewEntity(tableName: string, entityClass: GeneratedEntityClass): Promise<RegistrationResult> {
    try {
      // Check if entity already exists
      if (this.entityRegistry.has(tableName)) {
        throw new Error(`Entity for table ${tableName} already exists`)
      }
      
      // Register with entity manager
      await this.entityManager.registerGeneratedEntity(tableName, entityClass)
      
      // Store in registry
      const registeredEntity: RegisteredEntity = {
        tableName,
        entityClass,
        registeredAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
      
      this.entityRegistry.set(tableName, registeredEntity)
      
      return {
        success: true,
        entity: registeredEntity
      }
    } catch (error) {
      return {
        success: false,
        entity: {} as RegisteredEntity,
        error: error as Error
      }
    }
  }
  
  async updateExistingEntity(tableName: string, entityClass: GeneratedEntityClass): Promise<UpdateResult> {
    try {
      // Check if entity exists
      const existingEntity = this.entityRegistry.get(tableName)
      if (!existingEntity) {
        throw new Error(`Entity for table ${tableName} not found`)
      }
      
      // Update with entity manager
      await this.entityManager.updateGeneratedEntity(tableName, entityClass)
      
      // Update registry
      const updatedEntity: RegisteredEntity = {
        ...existingEntity,
        entityClass,
        lastUpdated: new Date(),
        version: existingEntity.version + 1
      }
      
      this.entityRegistry.set(tableName, updatedEntity)
      
      return {
        success: true,
        entity: updatedEntity
      }
    } catch (error) {
      return {
        success: false,
        entity: {} as RegisteredEntity,
        error: error as Error
      }
    }
  }
  
  async removeEntity(tableName: string): Promise<RemovalResult> {
    try {
      // Check if entity exists
      if (!this.entityRegistry.has(tableName)) {
        throw new Error(`Entity for table ${tableName} not found`)
      }
      
      // Remove from entity manager
      await this.entityManager.unregisterGeneratedEntity(tableName)
      
      // Remove from registry
      this.entityRegistry.delete(tableName)
      
      return {
        success: true,
        tableName
      }
    } catch (error) {
      return {
        success: false,
        tableName,
        error: error as Error
      }
    }
  }
  
  private async generateAndRegisterEntity(tableName: string): Promise<{ success: boolean; entityClass?: GeneratedEntityClass; error?: Error }> {
    try {
      // Get current schema for the table
      const introspectionEngine = SchemaIntrospectionEngine.getInstance()
      const currentSchemas = await introspectionEngine.getCurrentSchemas(this.getDatabase())
      const tableSchema = currentSchemas.get(tableName)
      
      if (!tableSchema) {
        throw new Error(`Table ${tableName} not found in current schemas`)
      }
      
      // Get relationships
      const relationships = await introspectionEngine.detectRelationships(
        new Map([[tableName, tableSchema]])
      )
      
      // Generate entity class
      const entityGenerator = new EntityClassGenerator()
      const entityClass = await entityGenerator.generateEntityClass(
        tableSchema,
        relationships.get(tableName) || []
      )
      
      // Register the entity
      const registerResult = await this.registerNewEntity(tableName, entityClass)
      
      if (registerResult.success) {
        return {
          success: true,
          entityClass
        }
      } else {
        return {
          success: false,
          error: registerResult.error
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error
      }
    }
  }
  
  private async updateExistingEntityFromChanges(
    tableName: string,
    changes: SchemaChange[]
  ): Promise<{ success: boolean; entityClass?: GeneratedEntityClass; error?: Error }> {
    try {
      // Get current schema for the table
      const introspectionEngine = SchemaIntrospectionEngine.getInstance()
      const currentSchemas = await introspectionEngine.getCurrentSchemas(this.getDatabase())
      const tableSchema = currentSchemas.get(tableName)
      
      if (!tableSchema) {
        throw new Error(`Table ${tableName} not found in current schemas`)
      }
      
      // Get relationships
      const relationships = await introspectionEngine.detectRelationships(
        new Map([[tableName, tableSchema]])
      )
      
      // Generate updated entity class
      const entityGenerator = new EntityClassGenerator()
      const entityClass = await entityGenerator.generateEntityClass(
        tableSchema,
        relationships.get(tableName) || []
      )
      
      // Update the entity
      const updateResult = await this.updateExistingEntity(tableName, entityClass)
      
      if (updateResult.success) {
        return {
          success: true,
          entityClass
        }
      } else {
        return {
          success: false,
          error: updateResult.error
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error
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
  
  getRegisteredEntity(tableName: string): RegisteredEntity | undefined {
    return this.entityRegistry.get(tableName)
  }
  
  getAllRegisteredEntities(): Map<string, RegisteredEntity> {
    return new Map(this.entityRegistry)
  }
  
  private getDatabase(): Kysely<any> {
    // This would be injected or retrieved from a database manager
    // For now, return a placeholder
    throw new Error('Database connection not available')
  }
}
```

## Usage Examples

### Update Entities for Schema Changes

```typescript
// Update entities when schema changes are detected
const detector = SchemaChangeDetector.getInstance()
const updater = EntityUpdater.getInstance()

const changeResult = await detector.detectChanges(db)
if (changeResult.hasChanges) {
  const updateResult = await updater.updateEntitiesForChanges(changeResult.changes)
  
  if (updateResult.success) {
    console.log('Entities updated successfully')
    
    for (const updatedEntity of updateResult.updatedEntities) {
      console.log(`${updatedEntity.action} entity for table ${updatedEntity.tableName}`)
    }
  } else {
    console.error('Entity update failed:', updateResult.errors)
  }
}
```

### Register New Entity

```typescript
// Register a new entity manually
const updater = EntityUpdater.getInstance()
const result = await updater.registerNewEntity('new_table', generatedEntityClass)

if (result.success) {
  console.log('Entity registered successfully')
} else {
  console.error('Entity registration failed:', result.error)
}
```

### Update Existing Entity

```typescript
// Update an existing entity
const updater = EntityUpdater.getInstance()
const result = await updater.updateExistingEntity('existing_table', updatedEntityClass)

if (result.success) {
  console.log('Entity updated successfully')
} else {
  console.error('Entity update failed:', result.error)
}
```

### Remove Entity

```typescript
// Remove an entity
const updater = EntityUpdater.getInstance()
const result = await updater.removeEntity('removed_table')

if (result.success) {
  console.log('Entity removed successfully')
} else {
  console.error('Entity removal failed:', result.error)
}
```

## Performance Characteristics

- **Entity Updates**: O(1) - Direct entity registration/update
- **Registry Operations**: O(1) - Map-based registry
- **Memory Usage**: Minimal - Only stores entity metadata
- **Database Queries**: Only during schema introspection

## Benefits

1. **Minimal Overhead** - Simple entity registration and updates
2. **Change-Driven** - Only updates when changes detected
3. **Centralized** - Single updater instance
4. **Registry Management** - Simple entity tracking
5. **Error Handling** - Graceful failure handling

## Limitations

1. **Database Dependency** - Requires database connection for schema introspection
2. **Memory Usage** - Stores entity metadata in memory
3. **No Incremental Updates** - Regenerates entire entities

## Integration Points

- **Schema Change Detector** - Triggers entity updates on changes
- **Entity Manager** - Registers/updates entities
- **Type Regenerator** - Coordinates type and entity updates
- **Repository Updater** - Coordinates repository updates
