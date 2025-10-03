# Simplified DreamBeeSQL Architecture

## 🎯 Simplified Component Structure

The original architecture had 18 separate components, which can be overwhelming. This simplified version consolidates related functionality into **5 core components** that are easier to understand and implement.

## 🏗️ Core Components

### 1. **DreamBeeSQL Core** (Main Entry Point)
```typescript
export class DreamBeeSQL {
  private introspectionEngine: SchemaIntrospectionEngine
  private typeSystem: DynamicTypeSystem
  private entityManager: EntityManager
  private repositoryRegistry: RepositoryRegistry
  
  constructor(config: DreamBeeSQLConfig) {
    this.introspectionEngine = new SchemaIntrospectionEngine()
    this.typeSystem = new DynamicTypeSystem()
    this.entityManager = new EntityManager()
    this.repositoryRegistry = new RepositoryRegistry()
  }
  
  async initialize(): Promise<void>
  getRepository<T>(tableName: string): T
  getEntity<T>(tableName: string): T
  onSchemaChange(callback: (changes: SchemaChange[]) => void): void
}
```

**Responsibilities:**
- Main entry point for the library
- Coordinates between all components
- Provides simple API for users
- Handles initialization and configuration

### 2. **Schema Discovery Engine** (Consolidated)
```typescript
export class SchemaDiscoveryEngine {
  private strategies = new Map<string, IntrospectionStrategy>()
  private discoveredSchemas = new Map<string, TableSchema>()
  private relationships = new Map<string, RelationshipInfo[]>()
  
  async discoverDatabase(db: Kysely<any>): Promise<DiscoveryResult>
  async detectSchemaChanges(db: Kysely<any>): Promise<SchemaChange[]>
  getSchema(tableName: string): TableSchema | undefined
  getRelationships(tableName: string): RelationshipInfo[]
  registerStrategy(dialect: string, strategy: IntrospectionStrategy): void
}
```

**Responsibilities:**
- Database schema introspection
- Relationship detection
- Schema change monitoring
- Multi-database support

### 3. **Type & Entity Generator** (Consolidated)
```typescript
export class TypeEntityGenerator {
  private typeMapper: DatabaseTypeMapper
  private entityGenerator: EntityClassGenerator
  private repositoryGenerator: RepositoryClassGenerator
  
  async generateTypes(schemas: Map<string, TableSchema>): Promise<GeneratedTypes>
  async generateEntities(schemas: Map<string, TableSchema>): Promise<GeneratedEntities>
  async generateRepositories(schemas: Map<string, TableSchema>): Promise<GeneratedRepositories>
  async updateForSchemaChange(change: SchemaChange): Promise<UpdateResult>
}
```

**Responsibilities:**
- TypeScript type generation
- Entity class generation
- Repository class generation
- Schema evolution updates

### 4. **Runtime Manager** (Consolidated)
```typescript
export class RuntimeManager {
  private entities = new Map<string, EntityMetadata>()
  private repositories = new Map<string, BaseRepository>()
  private relationships = new Map<string, RelationshipMetadata[]>()
  private cache = new Map<string, any>()
  
  registerEntity<T>(entityClass: new () => T): void
  getRepository<T>(tableName: string): T
  getEntity<T>(tableName: string): T
  loadRelationships<T>(entities: T[], relationshipNames: string[]): Promise<T[]>
  clearCache(): void
}
```

**Responsibilities:**
- Entity and repository management
- Relationship loading
- Caching and performance
- Runtime operations

### 5. **Configuration & Utilities** (Consolidated)
```typescript
export class ConfigurationManager {
  private config: DreamBeeSQLConfig
  private validators = new Map<string, ConfigValidator>()
  
  getConfig(): DreamBeeSQLConfig
  updateConfig(updates: Partial<DreamBeeSQLConfig>): void
  validateConfig(config: DreamBeeSQLConfig): ValidationResult
  resetToDefaults(): void
}

export class ErrorHandler {
  static handleDiscoveryError(error: Error): DiscoveryError
  static handleTypeGenerationError(error: Error): TypeGenerationError
  static handleRuntimeError(error: Error): RuntimeError
  static createFallbackResponse<T>(error: Error): FallbackResponse<T>
}
```

**Responsibilities:**
- Configuration management
- Error handling and fallbacks
- Validation and utilities
- Logging and monitoring

## 🔄 Simplified Data Flow

### 1. **Initialization Flow**
```
DreamBeeSQL.initialize()
├── SchemaDiscoveryEngine.discoverDatabase()
├── TypeEntityGenerator.generateTypes()
├── TypeEntityGenerator.generateEntities()
├── TypeEntityGenerator.generateRepositories()
└── RuntimeManager.registerAll()
```

### 2. **Runtime Operation Flow**
```
User Query
├── RuntimeManager.getRepository()
├── Repository.execute()
├── RuntimeManager.loadRelationships() (if needed)
└── Return Results
```

### 3. **Schema Evolution Flow**
```
Schema Change Detected
├── SchemaDiscoveryEngine.detectSchemaChanges()
├── TypeEntityGenerator.updateForSchemaChange()
├── RuntimeManager.updateEntities()
└── Cache Invalidation
```

## 🎯 Simplified API

### Basic Usage
```typescript
import { DreamBeeSQL } from 'dreambeesql'

// 1. Initialize with zero configuration
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

await db.initialize()

// 2. Use auto-generated repositories
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()

// 3. Type-safe operations
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// 4. Relationship loading
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])
```

### Advanced Usage
```typescript
// Schema change monitoring
db.onSchemaChange((changes) => {
  console.log('Schema changed:', changes)
  // Types and entities are automatically updated
})

// Custom configuration
db.updateConfig({
  cache: { ttl: 300000 },
  introspection: { includeViews: true }
})

// Manual type generation
const types = await db.generateTypes()
console.log('Generated types:', types)
```

## 📊 Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    DreamBeeSQL Core                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │
│  │   Schema        │  │   Type &        │  │  Runtime │ │
│  │   Discovery     │  │   Entity        │  │  Manager │ │
│  │   Engine        │  │   Generator     │  │          │ │
│  └─────────────────┘  └─────────────────┘  └──────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │
│  │   Configuration │  │   Error         │  │   Cache  │ │
│  │   Manager       │  │   Handler       │  │  Manager │ │
│  └─────────────────┘  └─────────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Implementation Priority

### Phase 1: Core Functionality (Week 1-2)
1. **DreamBeeSQL Core** - Main entry point and coordination
2. **Schema Discovery Engine** - Basic database introspection
3. **Type & Entity Generator** - Simple type and entity generation

### Phase 2: Runtime Operations (Week 3-4)
1. **Runtime Manager** - Entity and repository management
2. **Configuration Manager** - Basic configuration support
3. **Error Handler** - Error handling and fallbacks

### Phase 3: Advanced Features (Week 5-6)
1. **Schema Evolution** - Change detection and updates
2. **Relationship Loading** - Advanced relationship support
3. **Performance Optimization** - Caching and optimization

### Phase 4: Production Ready (Week 7-8)
1. **Comprehensive Testing** - Full test coverage
2. **Documentation** - Complete documentation
3. **Performance Tuning** - Production optimization

## 🎨 Design Benefits

### 1. **Simplified Mental Model**
- 5 components instead of 18
- Clear responsibilities for each component
- Easy to understand and implement

### 2. **Reduced Complexity**
- Fewer interfaces and abstractions
- Consolidated related functionality
- Streamlined data flow

### 3. **Better Developer Experience**
- Single entry point (DreamBeeSQL)
- Simple API for common operations
- Clear error messages and fallbacks

### 4. **Easier Maintenance**
- Fewer components to maintain
- Clear separation of concerns
- Simplified testing and debugging

## 🔧 Configuration Options

### Basic Configuration
```typescript
interface DreamBeeSQLConfig {
  dialect: 'postgresql' | 'mysql' | 'sqlite' | 'mssql'
  connection: ConnectionConfig
  introspection?: IntrospectionConfig
  cache?: CacheConfig
  logging?: LoggingConfig
}
```

### Advanced Configuration
```typescript
interface IntrospectionConfig {
  includeViews: boolean
  includeSystemTables: boolean
  customTypeMappings: Record<string, string>
  relationshipDepth: number
}

interface CacheConfig {
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'ttl'
}
```

## 🚧 Migration from Original Architecture

### Component Mapping
- **Schema Introspection Engine** → **Schema Discovery Engine**
- **Dynamic Type System** → **Type & Entity Generator**
- **Entity Manager** → **Runtime Manager**
- **Repository Registry** → **Runtime Manager**
- **Configuration Manager** → **Configuration Manager**
- **Error Handling** → **Error Handler**
- **Relationship Engine** → **Runtime Manager**
- **Validation Core** → **Runtime Manager**
- **Schema Registry** → **Schema Discovery Engine**
- **Query Optimizer** → **Runtime Manager**
- **Type System** → **Type & Entity Generator**
- **Migration Integration** → **Schema Discovery Engine**
- **Lifecycle Hooks** → **Runtime Manager**
- **Fallback System** → **Error Handler**
- **Schema Change Detector** → **Schema Discovery Engine**
- **Type Regenerator** → **Type & Entity Generator**
- **Entity Updater** → **Type & Entity Generator**
- **Repository Updater** → **Type & Entity Generator**

### Benefits of Consolidation
1. **Reduced Complexity** - 18 components → 5 components
2. **Clearer Responsibilities** - Related functionality grouped together
3. **Easier Implementation** - Fewer interfaces and abstractions
4. **Better Performance** - Reduced overhead and complexity
5. **Simpler Testing** - Fewer components to test and maintain

## 🎯 Next Steps

1. **Implement Core Components** - Start with the 5 simplified components
2. **Create Basic Examples** - Simple usage examples for each component
3. **Add Comprehensive Tests** - Test coverage for all functionality
4. **Documentation** - Clear documentation for each component
5. **Performance Optimization** - Optimize for production use

This simplified architecture maintains all the functionality of the original design while being much easier to understand, implement, and maintain.
