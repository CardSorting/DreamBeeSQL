# Fallback System Architecture

## Overview

The Fallback System provides graceful degradation when schema discovery fails or database introspection is unavailable. It uses a singleton pattern with simple fallback strategies without heavy monitoring or aggressive collection.

## Design Principles

- **Singleton Pattern** - Single fallback instance
- **Minimal Overhead** - Simple fallback strategies
- **Graceful Degradation** - Continue operation with reduced functionality
- **Centralized Management** - Single fallback coordinator
- **No Background Processes** - On-demand fallback only

## Architecture

```typescript
// Fallback System (Singleton)
export class FallbackSystem {
  private static instance: FallbackSystem | null = null
  private fallbackStrategies = new Map<string, FallbackStrategy>()
  private fallbackState = new Map<string, FallbackState>()
  
  private constructor() {
    this.registerDefaultStrategies()
  }
  
  static getInstance(): FallbackSystem {
    if (!FallbackSystem.instance) {
      FallbackSystem.instance = new FallbackSystem()
    }
    return FallbackSystem.instance
  }
  
  // Core methods
  async handleDiscoveryFailure(error: Error, context: FallbackContext): Promise<FallbackResult>
  async handleIntrospectionFailure(error: Error, context: FallbackContext): Promise<FallbackResult>
  async handleTypeGenerationFailure(error: Error, context: FallbackContext): Promise<FallbackResult>
  registerFallbackStrategy(name: string, strategy: FallbackStrategy): void
  getFallbackState(component: string): FallbackState | undefined
}
```

## Fallback Structure

```typescript
export interface FallbackResult {
  success: boolean
  fallbackType: FallbackType
  result?: any
  error?: Error
  warnings: FallbackWarning[]
}

export type FallbackType = 
  | 'SCHEMA_DISCOVERY'
  | 'TYPE_GENERATION'
  | 'ENTITY_GENERATION'
  | 'REPOSITORY_GENERATION'
  | 'RELATIONSHIP_DETECTION'

export interface FallbackContext {
  component: string
  operation: string
  tableName?: string
  database?: Kysely<any>
  previousResult?: any
}

export interface FallbackStrategy {
  name: string
  canHandle: (error: Error, context: FallbackContext) => boolean
  execute: (error: Error, context: FallbackContext) => Promise<FallbackResult>
  priority: number
}

export interface FallbackState {
  component: string
  isInFallbackMode: boolean
  fallbackStrategy?: string
  lastError?: Error
  fallbackStartTime?: Date
  attempts: number
}

export interface FallbackWarning {
  message: string
  component: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

## Implementation

```typescript
export class FallbackSystem {
  private static instance: FallbackSystem | null = null
  private fallbackStrategies = new Map<string, FallbackStrategy>()
  private fallbackState = new Map<string, FallbackState>()
  
  private constructor() {
    this.registerDefaultStrategies()
  }
  
  static getInstance(): FallbackSystem {
    if (!FallbackSystem.instance) {
      FallbackSystem.instance = new FallbackSystem()
    }
    return FallbackSystem.instance
  }
  
  async handleDiscoveryFailure(error: Error, context: FallbackContext): Promise<FallbackResult> {
    const strategy = this.findBestStrategy(error, context)
    
    if (!strategy) {
      return {
        success: false,
        fallbackType: 'SCHEMA_DISCOVERY',
        error: new Error('No fallback strategy available for schema discovery failure'),
        warnings: [{
          message: 'Schema discovery failed and no fallback strategy available',
          component: context.component,
          severity: 'HIGH'
        }]
      }
    }
    
    try {
      const result = await strategy.execute(error, context)
      
      // Update fallback state
      this.updateFallbackState(context.component, strategy.name, error)
      
      return result
    } catch (fallbackError) {
      return {
        success: false,
        fallbackType: 'SCHEMA_DISCOVERY',
        error: fallbackError,
        warnings: [{
          message: `Fallback strategy ${strategy.name} also failed`,
          component: context.component,
          severity: 'HIGH'
        }]
      }
    }
  }
  
  async handleIntrospectionFailure(error: Error, context: FallbackContext): Promise<FallbackResult> {
    const strategy = this.findBestStrategy(error, context)
    
    if (!strategy) {
      return {
        success: false,
        fallbackType: 'TYPE_GENERATION',
        error: new Error('No fallback strategy available for introspection failure'),
        warnings: [{
          message: 'Introspection failed and no fallback strategy available',
          component: context.component,
          severity: 'HIGH'
        }]
      }
    }
    
    try {
      const result = await strategy.execute(error, context)
      
      // Update fallback state
      this.updateFallbackState(context.component, strategy.name, error)
      
      return result
    } catch (fallbackError) {
      return {
        success: false,
        fallbackType: 'TYPE_GENERATION',
        error: fallbackError,
        warnings: [{
          message: `Fallback strategy ${strategy.name} also failed`,
          component: context.component,
          severity: 'HIGH'
        }]
      }
    }
  }
  
  async handleTypeGenerationFailure(error: Error, context: FallbackContext): Promise<FallbackResult> {
    const strategy = this.findBestStrategy(error, context)
    
    if (!strategy) {
      return {
        success: false,
        fallbackType: 'TYPE_GENERATION',
        error: new Error('No fallback strategy available for type generation failure'),
        warnings: [{
          message: 'Type generation failed and no fallback strategy available',
          component: context.component,
          severity: 'HIGH'
        }]
      }
    }
    
    try {
      const result = await strategy.execute(error, context)
      
      // Update fallback state
      this.updateFallbackState(context.component, strategy.name, error)
      
      return result
    } catch (fallbackError) {
      return {
        success: false,
        fallbackType: 'TYPE_GENERATION',
        error: fallbackError,
        warnings: [{
          message: `Fallback strategy ${strategy.name} also failed`,
          component: context.component,
          severity: 'HIGH'
        }]
      }
    }
  }
  
  private findBestStrategy(error: Error, context: FallbackContext): FallbackStrategy | undefined {
    const applicableStrategies = Array.from(this.fallbackStrategies.values())
      .filter(strategy => strategy.canHandle(error, context))
      .sort((a, b) => b.priority - a.priority)
    
    return applicableStrategies[0]
  }
  
  private updateFallbackState(component: string, strategyName: string, error: Error): void {
    const currentState = this.fallbackState.get(component)
    
    if (currentState) {
      currentState.isInFallbackMode = true
      currentState.fallbackStrategy = strategyName
      currentState.lastError = error
      currentState.attempts += 1
    } else {
      this.fallbackState.set(component, {
        component,
        isInFallbackMode: true,
        fallbackStrategy: strategyName,
        lastError: error,
        fallbackStartTime: new Date(),
        attempts: 1
      })
    }
  }
  
  private registerDefaultStrategies(): void {
    // Basic schema fallback
    this.registerFallbackStrategy('basic_schema_fallback', {
      name: 'basic_schema_fallback',
      priority: 1,
      canHandle: (error, context) => {
        return context.operation === 'discoverDatabase' && 
               error.message.includes('connection')
      },
      execute: async (error, context) => {
        return {
          success: true,
          fallbackType: 'SCHEMA_DISCOVERY',
          result: new Map(), // Empty schema map
          warnings: [{
            message: 'Using empty schema fallback due to connection issues',
            component: context.component,
            severity: 'MEDIUM'
          }]
        }
      }
    })
    
    // Type generation fallback
    this.registerFallbackStrategy('basic_type_fallback', {
      name: 'basic_type_fallback',
      priority: 1,
      canHandle: (error, context) => {
        return context.operation === 'generateTypes' && 
               error.message.includes('schema')
      },
      execute: async (error, context) => {
        return {
          success: true,
          fallbackType: 'TYPE_GENERATION',
          result: {
            database: 'export interface Database {}\n',
            entities: '// No entity types available\n',
            repositories: '// No repository types available\n',
            relationships: '// No relationship types available\n',
            utilities: '// No utility types available\n'
          },
          warnings: [{
            message: 'Using basic type fallback due to schema issues',
            component: context.component,
            severity: 'MEDIUM'
          }]
        }
      }
    })
    
    // Entity generation fallback
    this.registerFallbackStrategy('basic_entity_fallback', {
      name: 'basic_entity_fallback',
      priority: 1,
      canHandle: (error, context) => {
        return context.operation === 'generateEntity' && 
               error.message.includes('table')
      },
      execute: async (error, context) => {
        const tableName = context.tableName || 'unknown_table'
        const entityName = this.toPascalCase(tableName)
        
        const fallbackEntity = `
// Fallback entity for ${tableName}
export class ${entityName} extends Entity<any> {
  id!: string
  
  toRow(): any {
    return { id: this.id }
  }
  
  fromRow(row: any): this {
    this.id = row.id
    return this
  }
}
`
        
        return {
          success: true,
          fallbackType: 'ENTITY_GENERATION',
          result: {
            className: entityName,
            fileName: `${tableName}.entity.ts`,
            content: fallbackEntity,
            dependencies: [],
            schema: null,
            relationships: []
          },
          warnings: [{
            message: `Using basic entity fallback for table ${tableName}`,
            component: context.component,
            severity: 'MEDIUM'
          }]
        }
      }
    })
    
    // Repository generation fallback
    this.registerFallbackStrategy('basic_repository_fallback', {
      name: 'basic_repository_fallback',
      priority: 1,
      canHandle: (error, context) => {
        return context.operation === 'generateRepository' && 
               error.message.includes('table')
      },
      execute: async (error, context) => {
        const tableName = context.tableName || 'unknown_table'
        const entityName = this.toPascalCase(tableName)
        const repositoryName = `${entityName}Repository`
        
        const fallbackRepository = `
// Fallback repository for ${tableName}
export class ${repositoryName} extends BaseRepository<${entityName}, any> {
  getTableName(): string {
    return '${tableName}'
  }
  
  getPrimaryKey(): string {
    return 'id'
  }
  
  protected rowToEntity(row: any): ${entityName} {
    return new ${entityName}().fromRow(row)
  }
}
`
        
        return {
          success: true,
          fallbackType: 'REPOSITORY_GENERATION',
          result: {
            className: repositoryName,
            fileName: `${tableName}.repository.ts`,
            content: fallbackRepository,
            dependencies: [entityName],
            tableName: tableName,
            schema: null,
            relationships: []
          },
          warnings: [{
            message: `Using basic repository fallback for table ${tableName}`,
            component: context.component,
            severity: 'MEDIUM'
          }]
        }
      }
    })
  }
  
  registerFallbackStrategy(name: string, strategy: FallbackStrategy): void {
    this.fallbackStrategies.set(name, strategy)
  }
  
  getFallbackState(component: string): FallbackState | undefined {
    return this.fallbackState.get(component)
  }
  
  getAllFallbackStates(): Map<string, FallbackState> {
    return new Map(this.fallbackState)
  }
  
  clearFallbackState(component: string): void {
    this.fallbackState.delete(component)
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}
```

## Usage Examples

### Handle Schema Discovery Failure

```typescript
// Handle schema discovery failure
const fallbackSystem = FallbackSystem.getInstance()

try {
  const discoveryResult = await introspectionEngine.discoverDatabase(db)
  // Use discovery result
} catch (error) {
  const fallbackResult = await fallbackSystem.handleDiscoveryFailure(error, {
    component: 'SchemaIntrospectionEngine',
    operation: 'discoverDatabase',
    database: db
  })
  
  if (fallbackResult.success) {
    console.log('Using fallback schema discovery')
    // Use fallback result
  } else {
    console.error('Fallback also failed:', fallbackResult.error)
  }
}
```

### Handle Type Generation Failure

```typescript
// Handle type generation failure
const fallbackSystem = FallbackSystem.getInstance()

try {
  const typeResult = await typeSystem.generateTypesFromDatabase(db)
  // Use type result
} catch (error) {
  const fallbackResult = await fallbackSystem.handleTypeGenerationFailure(error, {
    component: 'DynamicTypeSystem',
    operation: 'generateTypes',
    database: db
  })
  
  if (fallbackResult.success) {
    console.log('Using fallback type generation')
    // Use fallback result
  } else {
    console.error('Fallback also failed:', fallbackResult.error)
  }
}
```

### Check Fallback State

```typescript
// Check if component is in fallback mode
const fallbackSystem = FallbackSystem.getInstance()
const state = fallbackSystem.getFallbackState('SchemaIntrospectionEngine')

if (state?.isInFallbackMode) {
  console.log(`Component is in fallback mode using strategy: ${state.fallbackStrategy}`)
  console.log(`Fallback attempts: ${state.attempts}`)
}
```

### Custom Fallback Strategy

```typescript
// Register custom fallback strategy
const fallbackSystem = FallbackSystem.getInstance()

fallbackSystem.registerFallbackStrategy('custom_fallback', {
  name: 'custom_fallback',
  priority: 2,
  canHandle: (error, context) => {
    return error.message.includes('custom_error')
  },
  execute: async (error, context) => {
    // Custom fallback logic
    return {
      success: true,
      fallbackType: 'SCHEMA_DISCOVERY',
      result: { /* custom result */ },
      warnings: []
    }
  }
})
```

## Performance Characteristics

- **Fallback Execution**: O(1) - Simple strategy execution
- **Strategy Lookup**: O(n) - Linear with number of strategies
- **Memory Usage**: Minimal - Only stores fallback state
- **No Background Processes**: On-demand only

## Benefits

1. **Graceful Degradation** - Continue operation with reduced functionality
2. **Minimal Overhead** - Simple fallback strategies
3. **Centralized** - Single fallback coordinator
4. **Extensible** - Custom fallback strategies
5. **State Tracking** - Monitor fallback usage

## Limitations

1. **Reduced Functionality** - Fallback may provide limited features
2. **Error Propagation** - Fallback failures still cause errors
3. **Manual Recovery** - May require manual intervention

## Integration Points

- **Schema Introspection Engine** - Uses for discovery failures
- **Dynamic Type System** - Uses for type generation failures
- **Entity Updater** - Uses for entity generation failures
- **Repository Updater** - Uses for repository generation failures
