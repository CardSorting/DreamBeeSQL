// Configuration Example Implementation
// This file demonstrates how to use the Configuration Manager system

import { ConfigurationManager } from '../src/configuration/configuration-manager'
import { ConfigurationBuilder } from '../src/configuration/configuration-builder'
import { PseudoORMConfig, LogLevel, CacheStrategy } from '../src/configuration/configuration-types'

// Configuration Examples
export class ConfigurationExamples {
  private configManager: ConfigurationManager
  
  constructor() {
    this.configManager = ConfigurationManager.getInstance()
  }
  
  // Basic configuration example
  demonstrateBasicConfiguration() {
    console.log('=== Basic Configuration Example ===')
    
    // Get current configuration
    const config = this.configManager.getConfig()
    console.log('Current configuration:', JSON.stringify(config, null, 2))
    
    // Update configuration
    this.configManager.updateConfig({
      logging: {
        enabled: true,
        level: LogLevel.DEBUG,
        console: true,
        file: false
      }
    })
    
    console.log('Updated configuration:', JSON.stringify(this.configManager.getConfig(), null, 2))
  }
  
  // Configuration builder example
  demonstrateConfigurationBuilder() {
    console.log('=== Configuration Builder Example ===')
    
    // Build configuration using builder
    const config = new ConfigurationBuilder()
      .withDatabase({
        dialect: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'myapp',
          username: 'user',
          password: 'password',
          ssl: false
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
    
    console.log('Built configuration:', JSON.stringify(config, null, 2))
    
    // Apply configuration
    this.configManager.updateConfig(config)
    console.log('Configuration applied successfully')
  }
  
  // Environment-based configuration example
  demonstrateEnvironmentConfiguration() {
    console.log('=== Environment Configuration Example ===')
    
    // Load configuration from environment
    const config = this.loadConfigFromEnvironment()
    console.log('Environment configuration:', JSON.stringify(config, null, 2))
    
    // Apply configuration
    this.configManager.updateConfig(config)
    console.log('Environment configuration applied')
  }
  
  // Custom configuration example
  demonstrateCustomConfiguration() {
    console.log('=== Custom Configuration Example ===')
    
    // Create custom configuration
    const customConfig: Partial<PseudoORMConfig> = {
      features: {
        entities: true,
        repositories: true,
        relationships: true,
        validation: true,
        caching: true,
        migrations: true,
        schemaSync: false
      },
      performance: {
        queryOptimization: true,
        queryCaching: true,
        batchOperations: true,
        lazyLoading: true,
        eagerLoading: false
      },
      cache: {
        enabled: true,
        ttl: 600000, // 10 minutes
        maxSize: 2000,
        strategy: CacheStrategy.LRU
      },
      validation: {
        enabled: true,
        strictMode: true,
        customValidators: ['uniqueEmail', 'strongPassword'],
        skipOnSave: false,
        skipOnUpdate: false
      },
      relationships: {
        enabled: true,
        lazyLoading: true,
        eagerLoading: false,
        batchSize: 50,
        maxDepth: 2
      }
    }
    
    console.log('Custom configuration:', JSON.stringify(customConfig, null, 2))
    
    // Apply custom configuration
    this.configManager.updateConfig(customConfig)
    console.log('Custom configuration applied')
  }
  
  // Configuration validation example
  demonstrateConfigurationValidation() {
    console.log('=== Configuration Validation Example ===')
    
    // Create invalid configuration
    const invalidConfig: Partial<PseudoORMConfig> = {
      database: {
        dialect: 'postgresql',
        connection: {
          host: '', // Invalid: empty host
          port: 5432,
          database: 'myapp',
          username: 'user',
          password: 'password'
        },
        pool: {
          min: 10, // Invalid: min > max
          max: 5,
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
      }
    }
    
    // Validate configuration
    const validation = this.configManager.validateConfig(invalidConfig as PseudoORMConfig)
    
    if (!validation.isValid) {
      console.log('Configuration validation failed:')
      validation.errors.forEach(error => {
        console.log(`  - ${error.path}: ${error.message}`)
      })
    }
    
    if (validation.warnings.length > 0) {
      console.log('Configuration warnings:')
      validation.warnings.forEach(warning => {
        console.log(`  - ${warning.path}: ${warning.message}`)
      })
    }
  }
  
  // Configuration reset example
  demonstrateConfigurationReset() {
    console.log('=== Configuration Reset Example ===')
    
    // Get current configuration
    const currentConfig = this.configManager.getConfig()
    console.log('Current configuration:', JSON.stringify(currentConfig, null, 2))
    
    // Reset to defaults
    this.configManager.resetToDefaults()
    console.log('Configuration reset to defaults')
    
    // Get default configuration
    const defaultConfig = this.configManager.getConfig()
    console.log('Default configuration:', JSON.stringify(defaultConfig, null, 2))
  }
  
  // Custom validator example
  demonstrateCustomValidator() {
    console.log('=== Custom Validator Example ===')
    
    // Register custom validator
    this.configManager.registerValidator('customValidator', {
      name: 'customValidator',
      validate: (config: any) => {
        const errors: any[] = []
        const warnings: any[] = []
        
        // Custom validation logic
        if (config.customProperty && config.customProperty.length < 5) {
          errors.push({
            path: 'customProperty',
            message: 'Custom property must be at least 5 characters',
            value: config.customProperty
          })
        }
        
        if (config.customProperty && config.customProperty.length > 100) {
          warnings.push({
            path: 'customProperty',
            message: 'Custom property is very long',
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
    
    // Test custom validator
    const testConfig = {
      customProperty: 'abc' // Too short
    }
    
    const validation = this.configManager.validateConfig(testConfig as any)
    
    if (!validation.isValid) {
      console.log('Custom validation failed:')
      validation.errors.forEach(error => {
        console.log(`  - ${error.path}: ${error.message}`)
      })
    }
    
    if (validation.warnings.length > 0) {
      console.log('Custom validation warnings:')
      validation.warnings.forEach(warning => {
        console.log(`  - ${warning.path}: ${warning.message}`)
      })
    }
  }
  
  // Load configuration from environment
  private loadConfigFromEnvironment(): PseudoORMConfig {
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
}

// Usage Example
export function demonstrateConfigurationUsage() {
  const configExamples = new ConfigurationExamples()
  
  // Run all examples
  try {
    configExamples.demonstrateBasicConfiguration()
    configExamples.demonstrateConfigurationBuilder()
    configExamples.demonstrateEnvironmentConfiguration()
    configExamples.demonstrateCustomConfiguration()
    configExamples.demonstrateConfigurationValidation()
    configExamples.demonstrateConfigurationReset()
    configExamples.demonstrateCustomValidator()
  } catch (error) {
    console.error('Configuration examples error:', error)
  }
}

// Production configuration example
export function createProductionConfiguration(): PseudoORMConfig {
  return new ConfigurationBuilder()
    .withDatabase({
      dialect: 'postgresql',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'myapp',
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.NODE_ENV === 'production'
      },
      pool: {
        min: parseInt(process.env.DB_POOL_MIN || '5'),
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000')
      },
      migrations: {
        directory: process.env.MIGRATIONS_DIR || './migrations',
        tableName: process.env.MIGRATIONS_TABLE || 'migrations',
        timeout: parseInt(process.env.MIGRATION_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.MIGRATION_MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.MIGRATION_RETRY_DELAY || '2000')
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
}

// Development configuration example
export function createDevelopmentConfiguration(): PseudoORMConfig {
  return new ConfigurationBuilder()
    .withDatabase({
      dialect: 'postgresql',
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'myapp_dev',
        username: 'dev_user',
        password: 'dev_password',
        ssl: false
      },
      pool: {
        min: 1,
        max: 5,
        idleTimeout: 10000,
        acquireTimeout: 30000
      },
      migrations: {
        directory: './migrations',
        tableName: 'migrations',
        timeout: 10000,
        maxRetries: 1,
        retryDelay: 1000
      }
    })
    .enableEntities()
    .enableRepositories()
    .enableRelationships()
    .enableValidation()
    .enableCaching()
    .enableQueryOptimization()
    .enableLogging(LogLevel.DEBUG)
    .build()
}

// Test configuration example
export function createTestConfiguration(): PseudoORMConfig {
  return new ConfigurationBuilder()
    .withDatabase({
      dialect: 'postgresql',
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'myapp_test',
        username: 'test_user',
        password: 'test_password',
        ssl: false
      },
      pool: {
        min: 1,
        max: 2,
        idleTimeout: 5000,
        acquireTimeout: 10000
      },
      migrations: {
        directory: './migrations',
        tableName: 'migrations',
        timeout: 5000,
        maxRetries: 1,
        retryDelay: 500
      }
    })
    .enableEntities()
    .enableRepositories()
    .enableRelationships()
    .enableValidation()
    .enableCaching()
    .enableQueryOptimization()
    .enableLogging(LogLevel.ERROR)
    .build()
}
