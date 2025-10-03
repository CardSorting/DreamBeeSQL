# Configuration Manager Architecture

## Overview

The Configuration Manager provides centralized configuration management using a singleton pattern. It focuses on essential configuration without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single configuration instance
- **Centralized Configuration** - Single source of truth
- **Type Safety** - Full TypeScript support
- **Minimal Overhead** - Efficient configuration storage
- **Lazy Loading** - Load configuration only when needed
- **No Database Queries** - Configuration stored in memory

## Architecture

```typescript
// Configuration Manager (Singleton)
export class ConfigurationManager {
  private static instance: ConfigurationManager | null = null
  private config: PseudoORMConfig
  private configValidators = new Map<string, ConfigValidator>()
  
  private constructor() {
    this.config = this.getDefaultConfig()
    this.registerDefaultValidators()
  }
  
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager()
    }
    return ConfigurationManager.instance
  }
  
  // Core methods
  getConfig(): PseudoORMConfig
  updateConfig(updates: Partial<PseudoORMConfig>): void
  validateConfig(config: PseudoORMConfig): ValidationResult
  registerValidator(name: string, validator: ConfigValidator): void
  resetToDefaults(): void
}
```

## Configuration Structure

```typescript
export interface PseudoORMConfig {
  // Core configuration
  entities: EntityConfig[]
  repositories: RepositoryConfig[]
  
  // Database configuration
  database: DatabaseConfig
  
  // Feature configuration
  features: FeatureConfig
  
  // Performance configuration
  performance: PerformanceConfig
  
  // Logging configuration
  logging: LoggingConfig
  
  // Cache configuration
  cache: CacheConfig
  
  // Validation configuration
  validation: ValidationConfig
  
  // Relationship configuration
  relationships: RelationshipConfig
}

export interface EntityConfig {
  name: string
  tableName: string
  primaryKey: string
  enabled: boolean
}

export interface RepositoryConfig {
  name: string
  entityName: string
  enabled: boolean
  customMethods: string[]
}

export interface DatabaseConfig {
  dialect: string
  connection: ConnectionConfig
  pool: PoolConfig
  migrations: MigrationConfig
}

export interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
}

export interface PoolConfig {
  min: number
  max: number
  idleTimeout: number
  acquireTimeout: number
}

export interface MigrationConfig {
  directory: string
  tableName: string
  timeout: number
  maxRetries: number
  retryDelay: number
}

export interface FeatureConfig {
  entities: boolean
  repositories: boolean
  relationships: boolean
  validation: boolean
  caching: boolean
  migrations: boolean
  schemaSync: boolean
}

export interface PerformanceConfig {
  queryOptimization: boolean
  queryCaching: boolean
  batchOperations: boolean
  lazyLoading: boolean
  eagerLoading: boolean
}

export interface LoggingConfig {
  enabled: boolean
  level: LogLevel
  console: boolean
  file: boolean
  filePath?: string
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: CacheStrategy
}

export interface ValidationConfig {
  enabled: boolean
  strictMode: boolean
  customValidators: string[]
  skipOnSave: boolean
  skipOnUpdate: boolean
}

export interface RelationshipConfig {
  enabled: boolean
  lazyLoading: boolean
  eagerLoading: boolean
  batchSize: number
  maxDepth: number
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export enum CacheStrategy {
  LRU = 'LRU',
  LFU = 'LFU',
  TTL = 'TTL'
}
```

## Configuration Validators

```typescript
export interface ConfigValidator {
  name: string
  validate: (config: any) => ValidationResult
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  path: string
  message: string
  value: any
}

export interface ValidationWarning {
  path: string
  message: string
  value: any
}

export class DefaultConfigValidators {
  static databaseValidator: ConfigValidator = {
    name: 'database',
    validate: (config: DatabaseConfig) => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      
      if (!config.dialect) {
        errors.push({
          path: 'database.dialect',
          message: 'Database dialect is required',
          value: config.dialect
        })
      }
      
      if (!config.connection) {
        errors.push({
          path: 'database.connection',
          message: 'Database connection is required',
          value: config.connection
        })
      }
      
      if (config.connection && !config.connection.host) {
        errors.push({
          path: 'database.connection.host',
          message: 'Database host is required',
          value: config.connection.host
        })
      }
      
      if (config.pool && config.pool.min > config.pool.max) {
        errors.push({
          path: 'database.pool',
          message: 'Pool min cannot be greater than max',
          value: config.pool
        })
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    }
  }
  
  static performanceValidator: ConfigValidator = {
    name: 'performance',
    validate: (config: PerformanceConfig) => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      
      if (config.queryCaching && !config.queryOptimization) {
        warnings.push({
          path: 'performance.queryCaching',
          message: 'Query caching without optimization may not provide optimal performance',
          value: config.queryCaching
        })
      }
      
      if (config.lazyLoading && config.eagerLoading) {
        warnings.push({
          path: 'performance.lazyLoading',
          message: 'Both lazy and eager loading enabled, this may cause performance issues',
          value: config.lazyLoading
        })
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    }
  }
  
  static cacheValidator: ConfigValidator = {
    name: 'cache',
    validate: (config: CacheConfig) => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      
      if (config.enabled && config.ttl <= 0) {
        errors.push({
          path: 'cache.ttl',
          message: 'Cache TTL must be greater than 0',
          value: config.ttl
        })
      }
      
      if (config.enabled && config.maxSize <= 0) {
        errors.push({
          path: 'cache.maxSize',
          message: 'Cache max size must be greater than 0',
          value: config.maxSize
        })
      }
      
      if (config.enabled && config.maxSize > 10000) {
        warnings.push({
          path: 'cache.maxSize',
          message: 'Large cache size may consume significant memory',
          value: config.maxSize
        })
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    }
  }
}
```

## Configuration Builder

```typescript
export class ConfigurationBuilder {
  private config: Partial<PseudoORMConfig> = {}
  
  // Database configuration
  withDatabase(config: DatabaseConfig): ConfigurationBuilder {
    this.config.database = config
    return this
  }
  
  withConnection(config: ConnectionConfig): ConfigurationBuilder {
    if (!this.config.database) {
      this.config.database = {} as DatabaseConfig
    }
    this.config.database.connection = config
    return this
  }
  
  withPool(config: PoolConfig): ConfigurationBuilder {
    if (!this.config.database) {
      this.config.database = {} as DatabaseConfig
    }
    this.config.database.pool = config
    return this
  }
  
  // Feature configuration
  withFeatures(config: FeatureConfig): ConfigurationBuilder {
    this.config.features = config
    return this
  }
  
  enableEntities(): ConfigurationBuilder {
    if (!this.config.features) {
      this.config.features = {} as FeatureConfig
    }
    this.config.features.entities = true
    return this
  }
  
  enableRepositories(): ConfigurationBuilder {
    if (!this.config.features) {
      this.config.features = {} as FeatureConfig
    }
    this.config.features.repositories = true
    return this
  }
  
  enableRelationships(): ConfigurationBuilder {
    if (!this.config.features) {
      this.config.features = {} as FeatureConfig
    }
    this.config.features.relationships = true
    return this
  }
  
  enableValidation(): ConfigurationBuilder {
    if (!this.config.features) {
      this.config.features = {} as FeatureConfig
    }
    this.config.features.validation = true
    return this
  }
  
  enableCaching(): ConfigurationBuilder {
    if (!this.config.features) {
      this.config.features = {} as FeatureConfig
    }
    this.config.features.caching = true
    return this
  }
  
  // Performance configuration
  withPerformance(config: PerformanceConfig): ConfigurationBuilder {
    this.config.performance = config
    return this
  }
  
  enableQueryOptimization(): ConfigurationBuilder {
    if (!this.config.performance) {
      this.config.performance = {} as PerformanceConfig
    }
    this.config.performance.queryOptimization = true
    return this
  }
  
  enableQueryCaching(): ConfigurationBuilder {
    if (!this.config.performance) {
      this.config.performance = {} as PerformanceConfig
    }
    this.config.performance.queryCaching = true
    return this
  }
  
  // Logging configuration
  withLogging(config: LoggingConfig): ConfigurationBuilder {
    this.config.logging = config
    return this
  }
  
  enableLogging(level: LogLevel = LogLevel.INFO): ConfigurationBuilder {
    this.config.logging = {
      enabled: true,
      level,
      console: true,
      file: false
    }
    return this
  }
  
  // Cache configuration
  withCache(config: CacheConfig): ConfigurationBuilder {
    this.config.cache = config
    return this
  }
  
  enableCache(ttl: number = 300000, maxSize: number = 1000): ConfigurationBuilder {
    this.config.cache = {
      enabled: true,
      ttl,
      maxSize,
      strategy: CacheStrategy.LRU
    }
    return this
  }
  
  // Validation configuration
  withValidation(config: ValidationConfig): ConfigurationBuilder {
    this.config.validation = config
    return this
  }
  
  enableValidation(strictMode: boolean = true): ConfigurationBuilder {
    this.config.validation = {
      enabled: true,
      strictMode,
      customValidators: [],
      skipOnSave: false,
      skipOnUpdate: false
    }
    return this
  }
  
  // Relationship configuration
  withRelationships(config: RelationshipConfig): ConfigurationBuilder {
    this.config.relationships = config
    return this
  }
  
  enableRelationships(lazyLoading: boolean = true, eagerLoading: boolean = false): ConfigurationBuilder {
    this.config.relationships = {
      enabled: true,
      lazyLoading,
      eagerLoading,
      batchSize: 100,
      maxDepth: 3
    }
    return this
  }
  
  // Build configuration
  build(): PseudoORMConfig {
    const manager = ConfigurationManager.getInstance()
    const defaultConfig = manager.getConfig()
    
    return {
      ...defaultConfig,
      ...this.config
    }
  }
}
```

## Usage Examples

### Basic Configuration

```typescript
// Get configuration manager
const configManager = ConfigurationManager.getInstance()

// Get current configuration
const config = configManager.getConfig()
console.log('Current config:', config)

// Update configuration
configManager.updateConfig({
  logging: {
    enabled: true,
    level: LogLevel.DEBUG,
    console: true,
    file: false
  }
})

// Validate configuration
const validation = configManager.validateConfig(config)
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors)
}
```

### Configuration Builder

```typescript
// Build configuration using builder
const config = new ConfigurationBuilder()
  .withDatabase({
    dialect: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      username: 'user',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeout: 30000,
      acquireTimeout: 60000
    },
    migrations: {
      directory: './migrations',
      tableName: 'migrations',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 2000
    }
  })
  .enableEntities()
  .enableRepositories()
  .enableRelationships()
  .enableValidation()
  .enableCaching()
  .enableQueryOptimization()
  .enableLogging(LogLevel.INFO)
  .build()

// Apply configuration
const configManager = ConfigurationManager.getInstance()
configManager.updateConfig(config)
```

### Environment-Based Configuration

```typescript
// Load configuration from environment
function loadConfigFromEnvironment(): PseudoORMConfig {
  const builder = new ConfigurationBuilder()
  
  // Database configuration from environment
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL)
    builder.withConnection({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
      ssl: process.env.NODE_ENV === 'production'
    })
  }
  
  // Feature flags from environment
  if (process.env.ENABLE_ENTITIES === 'true') {
    builder.enableEntities()
  }
  
  if (process.env.ENABLE_REPOSITORIES === 'true') {
    builder.enableRepositories()
  }
  
  if (process.env.ENABLE_RELATIONSHIPS === 'true') {
    builder.enableRelationships()
  }
  
  if (process.env.ENABLE_VALIDATION === 'true') {
    builder.enableValidation()
  }
  
  if (process.env.ENABLE_CACHING === 'true') {
    builder.enableCache(
      parseInt(process.env.CACHE_TTL) || 300000,
      parseInt(process.env.CACHE_MAX_SIZE) || 1000
    )
  }
  
  // Logging configuration
  const logLevel = process.env.LOG_LEVEL as LogLevel || LogLevel.INFO
  builder.enableLogging(logLevel)
  
  return builder.build()
}

// Apply environment configuration
const config = loadConfigFromEnvironment()
const configManager = ConfigurationManager.getInstance()
configManager.updateConfig(config)
```

### Custom Configuration Validator

```typescript
// Register custom validator
const configManager = ConfigurationManager.getInstance()

configManager.registerValidator('customValidator', {
  name: 'customValidator',
  validate: (config: any) => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Custom validation logic
    if (config.customProperty && config.customProperty.length < 5) {
      errors.push({
        path: 'customProperty',
        message: 'Custom property must be at least 5 characters',
        value: config.customProperty
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
})

// Validate configuration
const validation = configManager.validateConfig(config)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

## Performance Characteristics

- **Configuration Access**: O(1) - Direct property access
- **Configuration Update**: O(1) - Direct property update
- **Validation**: O(n) - Depends on number of validators
- **Memory Usage**: Minimal - Only configuration data
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Centralized Management** - Single source of truth for configuration
2. **Type Safety** - Full TypeScript support
3. **Validation** - Built-in configuration validation
4. **Builder Pattern** - Fluent configuration building
5. **Environment Support** - Easy environment-based configuration
6. **Minimal Overhead** - Efficient configuration storage

## Limitations

1. **Static Configuration** - Configuration must be known at compile time
2. **Memory Usage** - Configuration stored in memory
3. **No Runtime Changes** - Cannot modify configuration at runtime

## Integration Points

- **Entity Manager** - Uses entity configuration
- **Repository Registry** - Uses repository configuration
- **Relationship Engine** - Uses relationship configuration
- **Validation Core** - Uses validation configuration
- **Query Optimizer** - Uses performance configuration
- **Schema Registry** - Uses database configuration
