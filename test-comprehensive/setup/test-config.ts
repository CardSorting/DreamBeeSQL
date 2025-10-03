/**
 * Test configuration for NOORM comprehensive testing suite
 */

export interface TestConfig {
  // Database configuration
  database: {
    sqlite: {
      enabled: boolean
      database: string
    }
    postgresql: {
      enabled: boolean
      host: string
      port: number
      database: string
      username: string
      password: string
    }
    mysql: {
      enabled: boolean
      host: string
      port: number
      database: string
      username: string
      password: string
    }
    mssql: {
      enabled: boolean
      host: string
      port: number
      database: string
      username: string
      password: string
    }
  }
  
  // Test execution configuration
  execution: {
    timeout: number
    parallel: number
    retries: number
    slowThreshold: number
  }
  
  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    enabled: boolean
    verbose: boolean
  }
  
  // Performance testing configuration
  performance: {
    enableBenchmarks: boolean
    benchmarkIterations: number
    stressTestDuration: number
    memoryThreshold: number
  }
  
  // Test data configuration
  testData: {
    smallDataset: number
    mediumDataset: number
    largeDataset: number
    cleanupAfterTests: boolean
  }
}

/**
 * Default test configuration
 */
export const defaultTestConfig: TestConfig = {
  database: {
    sqlite: {
      enabled: true,
      database: ':memory:'
    },
    postgresql: {
      enabled: process.env.TEST_POSTGRESQL === 'true',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'noorm_test',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password'
    },
    mysql: {
      enabled: process.env.TEST_MYSQL === 'true',
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      database: process.env.MYSQL_DB || 'noorm_test',
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password'
    },
    mssql: {
      enabled: process.env.TEST_MSSQL === 'true',
      host: process.env.MSSQL_HOST || 'localhost',
      port: parseInt(process.env.MSSQL_PORT || '1433'),
      database: process.env.MSSQL_DB || 'noorm_test',
      username: process.env.MSSQL_USER || 'sa',
      password: process.env.MSSQL_PASSWORD || 'Password123!'
    }
  },
  
  execution: {
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    parallel: parseInt(process.env.TEST_PARALLEL || '4'),
    retries: parseInt(process.env.TEST_RETRIES || '2'),
    slowThreshold: parseInt(process.env.TEST_SLOW_THRESHOLD || '1000')
  },
  
  logging: {
    level: (process.env.TEST_LOG_LEVEL as any) || 'info',
    enabled: process.env.TEST_LOGGING !== 'false',
    verbose: process.env.TEST_VERBOSE === 'true'
  },
  
  performance: {
    enableBenchmarks: process.env.TEST_BENCHMARKS !== 'false',
    benchmarkIterations: parseInt(process.env.TEST_BENCHMARK_ITERATIONS || '100'),
    stressTestDuration: parseInt(process.env.TEST_STRESS_DURATION || '30000'),
    memoryThreshold: parseInt(process.env.TEST_MEMORY_THRESHOLD || '100') // MB
  },
  
  testData: {
    smallDataset: parseInt(process.env.TEST_SMALL_DATASET || '10'),
    mediumDataset: parseInt(process.env.TEST_MEDIUM_DATASET || '100'),
    largeDataset: parseInt(process.env.TEST_LARGE_DATASET || '1000'),
    cleanupAfterTests: process.env.TEST_CLEANUP !== 'false'
  }
}

/**
 * Get test configuration with environment overrides
 */
export function getTestConfig(): TestConfig {
  return {
    ...defaultTestConfig,
    // Allow environment variable overrides
    ...(process.env.TEST_CONFIG ? JSON.parse(process.env.TEST_CONFIG) : {})
  }
}

/**
 * Check if a database dialect is enabled for testing
 */
export function isDatabaseEnabled(dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql'): boolean {
  const config = getTestConfig()
  return config.database[dialect].enabled
}

/**
 * Get enabled database dialects
 */
export function getEnabledDatabases(): Array<'sqlite' | 'postgresql' | 'mysql' | 'mssql'> {
  const config = getTestConfig()
  const enabled: Array<'sqlite' | 'postgresql' | 'mysql' | 'mssql'> = []
  
  if (config.database.sqlite.enabled) enabled.push('sqlite')
  if (config.database.postgresql.enabled) enabled.push('postgresql')
  if (config.database.mysql.enabled) enabled.push('mysql')
  if (config.database.mssql.enabled) enabled.push('mssql')
  
  return enabled
}

/**
 * Get database connection configuration for a dialect
 */
export function getDatabaseConfig(dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql') {
  const config = getTestConfig()
  return config.database[dialect]
}

/**
 * Test environment detection
 */
export const testEnvironment = {
  isCI: process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true',
  isLocal: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  isProduction: process.env.NODE_ENV === 'production',
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch
}

/**
 * Performance thresholds for different test types
 */
export const performanceThresholds = {
  // Unit tests should be very fast
  unit: {
    maxDuration: 100, // ms
    maxMemory: 10 // MB
  },
  
  // Integration tests can be slower
  integration: {
    maxDuration: 1000, // ms
    maxMemory: 50 // MB
  },
  
  // Performance tests have different thresholds
  performance: {
    maxDuration: 5000, // ms
    maxMemory: 100 // MB
  },
  
  // E2E tests can be slowest
  e2e: {
    maxDuration: 10000, // ms
    maxMemory: 200 // MB
  }
}

/**
 * Test data sizes for different scenarios
 */
export const testDataSizes = {
  tiny: 1,
  small: 10,
  medium: 100,
  large: 1000,
  xlarge: 10000,
  stress: 100000
}

/**
 * Common test timeouts
 */
export const testTimeouts = {
  unit: 5000,
  integration: 15000,
  performance: 30000,
  e2e: 60000,
  stress: 300000 // 5 minutes
}
