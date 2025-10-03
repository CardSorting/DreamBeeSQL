# Repository Updater Architecture

## Overview

The Repository Updater provides centralized, minimal-overhead repository class updates when schema changes are detected. It uses a singleton pattern with simple repository registration and update without heavy monitoring or aggressive collection.

## Design Principles

- **Singleton Pattern** - Single updater instance
- **Minimal Overhead** - Simple repository registration and updates
- **Change-Driven** - Only updates when changes detected
- **Centralized Management** - Single repository registry
- **No Background Processes** - On-demand updates only

## Architecture

```typescript
// Repository Updater (Singleton)
export class RepositoryUpdater {
  private static instance: RepositoryUpdater | null = null
  private repositoryRegistry = new Map<string, RegisteredRepository>()
  private repositoryRegistry: RepositoryRegistry
  
  private constructor() {
    this.repositoryRegistry = RepositoryRegistry.getInstance()
  }
  
  static getInstance(): RepositoryUpdater {
    if (!RepositoryUpdater.instance) {
      RepositoryUpdater.instance = new RepositoryUpdater()
    }
    return RepositoryUpdater.instance
  }
  
  // Core methods
  async updateRepositoriesForChanges(changes: SchemaChange[]): Promise<RepositoryUpdateResult>
  async registerNewRepository(tableName: string, repoClass: GeneratedRepositoryClass): Promise<RegistrationResult>
  async updateExistingRepository(tableName: string, repoClass: GeneratedRepositoryClass): Promise<UpdateResult>
  async removeRepository(tableName: string): Promise<RemovalResult>
  getRegisteredRepository(tableName: string): RegisteredRepository | undefined
  getAllRegisteredRepositories(): Map<string, RegisteredRepository>
}
```

## Update Structure

```typescript
export interface RepositoryUpdateResult {
  success: boolean
  updatedRepositories: UpdatedRepository[]
  errors: RepositoryUpdateError[]
}

export interface UpdatedRepository {
  tableName: string
  action: RepositoryAction
  repositoryClass: GeneratedRepositoryClass
  timestamp: Date
}

export type RepositoryAction = 'REGISTERED' | 'UPDATED' | 'REMOVED'

export interface RepositoryUpdateError {
  tableName: string
  action: RepositoryAction
  message: string
  error: Error
}

export interface RegistrationResult {
  success: boolean
  repository: RegisteredRepository
  error?: Error
}

export interface UpdateResult {
  success: boolean
  repository: RegisteredRepository
  error?: Error
}

export interface RemovalResult {
  success: boolean
  tableName: string
  error?: Error
}

export interface RegisteredRepository {
  tableName: string
  repositoryClass: GeneratedRepositoryClass
  registeredAt: Date
  lastUpdated: Date
  version: number
}
```

## Implementation

```typescript
export class RepositoryUpdater {
  private static instance: RepositoryUpdater | null = null
  private repositoryRegistry = new Map<string, RegisteredRepository>()
  private repositoryRegistry: RepositoryRegistry
  
  private constructor() {
    this.repositoryRegistry = RepositoryRegistry.getInstance()
  }
  
  static getInstance(): RepositoryUpdater {
    if (!RepositoryUpdater.instance) {
      RepositoryUpdater.instance = new RepositoryUpdater()
    }
    return RepositoryUpdater.instance
  }
  
  async updateRepositoriesForChanges(changes: SchemaChange[]): Promise<RepositoryUpdateResult> {
    const updatedRepositories: UpdatedRepository[] = []
    const errors: RepositoryUpdateError[] = []
    
    try {
      // Group changes by table
      const changesByTable = this.groupChangesByTable(changes)
      
      // Process each table's changes
      for (const [tableName, tableChanges] of changesByTable) {
        try {
          const tableResult = await this.processTableChanges(tableName, tableChanges)
          
          if (tableResult.success) {
            updatedRepositories.push(...tableResult.updatedRepositories)
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
        updatedRepositories,
        errors
      }
    } catch (error) {
      return {
        success: false,
        updatedRepositories: [],
        errors: [{
          tableName: 'global',
          action: 'UPDATED',
          message: 'Failed to update repositories',
          error: error as Error
        }]
      }
    }
  }
  
  private async processTableChanges(
    tableName: string,
    changes: SchemaChange[]
  ): Promise<RepositoryUpdateResult> {
    const updatedRepositories: UpdatedRepository[] = []
    const errors: RepositoryUpdateError[] = []
    
    // Check if this is a new table
    const isNewTable = changes.some(change => change.type === 'TABLE_ADDED')
    const isRemovedTable = changes.some(change => change.type === 'TABLE_REMOVED')
    
    if (isRemovedTable) {
      // Remove repository for deleted table
      const removeResult = await this.removeRepository(tableName)
      if (removeResult.success) {
        updatedRepositories.push({
          tableName,
          action: 'REMOVED',
          repositoryClass: {} as GeneratedRepositoryClass,
          timestamp: new Date()
        })
      } else {
        errors.push({
          tableName,
          action: 'REMOVED',
          message: `Failed to remove repository for table ${tableName}`,
          error: removeResult.error!
        })
      }
    } else if (isNewTable) {
      // Generate and register new repository
      const newRepoResult = await this.generateAndRegisterRepository(tableName)
      if (newRepoResult.success) {
        updatedRepositories.push({
          tableName,
          action: 'REGISTERED',
          repositoryClass: newRepoResult.repositoryClass,
          timestamp: new Date()
        })
      } else {
        errors.push({
          tableName,
          action: 'REGISTERED',
          message: `Failed to register new repository for table ${tableName}`,
          error: newRepoResult.error!
        })
      }
    } else {
      // Update existing repository
      const updateResult = await this.updateExistingRepositoryFromChanges(tableName, changes)
      if (updateResult.success) {
        updatedRepositories.push({
          tableName,
          action: 'UPDATED',
          repositoryClass: updateResult.repositoryClass,
          timestamp: new Date()
        })
      } else {
        errors.push({
          tableName,
          action: 'UPDATED',
          message: `Failed to update repository for table ${tableName}`,
          error: updateResult.error!
        })
      }
    }
    
    return {
      success: errors.length === 0,
      updatedRepositories,
      errors
    }
  }
  
  async registerNewRepository(tableName: string, repoClass: GeneratedRepositoryClass): Promise<RegistrationResult> {
    try {
      // Check if repository already exists
      if (this.repositoryRegistry.has(tableName)) {
        throw new Error(`Repository for table ${tableName} already exists`)
      }
      
      // Register with repository registry
      await this.repositoryRegistry.registerGeneratedRepository(tableName, repoClass)
      
      // Store in registry
      const registeredRepository: RegisteredRepository = {
        tableName,
        repositoryClass: repoClass,
        registeredAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
      
      this.repositoryRegistry.set(tableName, registeredRepository)
      
      return {
        success: true,
        repository: registeredRepository
      }
    } catch (error) {
      return {
        success: false,
        repository: {} as RegisteredRepository,
        error: error as Error
      }
    }
  }
  
  async updateExistingRepository(tableName: string, repoClass: GeneratedRepositoryClass): Promise<UpdateResult> {
    try {
      // Check if repository exists
      const existingRepository = this.repositoryRegistry.get(tableName)
      if (!existingRepository) {
        throw new Error(`Repository for table ${tableName} not found`)
      }
      
      // Update with repository registry
      await this.repositoryRegistry.updateGeneratedRepository(tableName, repoClass)
      
      // Update registry
      const updatedRepository: RegisteredRepository = {
        ...existingRepository,
        repositoryClass: repoClass,
        lastUpdated: new Date(),
        version: existingRepository.version + 1
      }
      
      this.repositoryRegistry.set(tableName, updatedRepository)
      
      return {
        success: true,
        repository: updatedRepository
      }
    } catch (error) {
      return {
        success: false,
        repository: {} as RegisteredRepository,
        error: error as Error
      }
    }
  }
  
  async removeRepository(tableName: string): Promise<RemovalResult> {
    try {
      // Check if repository exists
      if (!this.repositoryRegistry.has(tableName)) {
        throw new Error(`Repository for table ${tableName} not found`)
      }
      
      // Remove from repository registry
      await this.repositoryRegistry.unregisterGeneratedRepository(tableName)
      
      // Remove from registry
      this.repositoryRegistry.delete(tableName)
      
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
  
  private async generateAndRegisterRepository(tableName: string): Promise<{ success: boolean; repositoryClass?: GeneratedRepositoryClass; error?: Error }> {
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
      
      // Generate repository class
      const repoGenerator = new RepositoryClassGenerator()
      const repoClass = await repoGenerator.generateRepositoryClass(
        tableName,
        tableSchema,
        relationships.get(tableName) || []
      )
      
      // Register the repository
      const registerResult = await this.registerNewRepository(tableName, repoClass)
      
      if (registerResult.success) {
        return {
          success: true,
          repositoryClass: repoClass
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
  
  private async updateExistingRepositoryFromChanges(
    tableName: string,
    changes: SchemaChange[]
  ): Promise<{ success: boolean; repositoryClass?: GeneratedRepositoryClass; error?: Error }> {
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
      
      // Generate updated repository class
      const repoGenerator = new RepositoryClassGenerator()
      const repoClass = await repoGenerator.generateRepositoryClass(
        tableName,
        tableSchema,
        relationships.get(tableName) || []
      )
      
      // Update the repository
      const updateResult = await this.updateExistingRepository(tableName, repoClass)
      
      if (updateResult.success) {
        return {
          success: true,
          repositoryClass: repoClass
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
  
  getRegisteredRepository(tableName: string): RegisteredRepository | undefined {
    return this.repositoryRegistry.get(tableName)
  }
  
  getAllRegisteredRepositories(): Map<string, RegisteredRepository> {
    return new Map(this.repositoryRegistry)
  }
  
  private getDatabase(): Kysely<any> {
    // This would be injected or retrieved from a database manager
    // For now, return a placeholder
    throw new Error('Database connection not available')
  }
}
```

## Usage Examples

### Update Repositories for Schema Changes

```typescript
// Update repositories when schema changes are detected
const detector = SchemaChangeDetector.getInstance()
const updater = RepositoryUpdater.getInstance()

const changeResult = await detector.detectChanges(db)
if (changeResult.hasChanges) {
  const updateResult = await updater.updateRepositoriesForChanges(changeResult.changes)
  
  if (updateResult.success) {
    console.log('Repositories updated successfully')
    
    for (const updatedRepo of updateResult.updatedRepositories) {
      console.log(`${updatedRepo.action} repository for table ${updatedRepo.tableName}`)
    }
  } else {
    console.error('Repository update failed:', updateResult.errors)
  }
}
```

### Register New Repository

```typescript
// Register a new repository manually
const updater = RepositoryUpdater.getInstance()
const result = await updater.registerNewRepository('new_table', generatedRepoClass)

if (result.success) {
  console.log('Repository registered successfully')
} else {
  console.error('Repository registration failed:', result.error)
}
```

### Update Existing Repository

```typescript
// Update an existing repository
const updater = RepositoryUpdater.getInstance()
const result = await updater.updateExistingRepository('existing_table', updatedRepoClass)

if (result.success) {
  console.log('Repository updated successfully')
} else {
  console.error('Repository update failed:', result.error)
}
```

### Remove Repository

```typescript
// Remove a repository
const updater = RepositoryUpdater.getInstance()
const result = await updater.removeRepository('removed_table')

if (result.success) {
  console.log('Repository removed successfully')
} else {
  console.error('Repository removal failed:', result.error)
}
```

## Performance Characteristics

- **Repository Updates**: O(1) - Direct repository registration/update
- **Registry Operations**: O(1) - Map-based registry
- **Memory Usage**: Minimal - Only stores repository metadata
- **Database Queries**: Only during schema introspection

## Benefits

1. **Minimal Overhead** - Simple repository registration and updates
2. **Change-Driven** - Only updates when changes detected
3. **Centralized** - Single updater instance
4. **Registry Management** - Simple repository tracking
5. **Error Handling** - Graceful failure handling

## Limitations

1. **Database Dependency** - Requires database connection for schema introspection
2. **Memory Usage** - Stores repository metadata in memory
3. **No Incremental Updates** - Regenerates entire repositories

## Integration Points

- **Schema Change Detector** - Triggers repository updates on changes
- **Repository Registry** - Registers/updates repositories
- **Type Regenerator** - Coordinates type and repository updates
- **Entity Updater** - Coordinates entity and repository updates
