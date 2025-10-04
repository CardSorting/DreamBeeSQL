import { jest } from '@jest/globals'

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }

beforeEach(() => {
  // Mock console methods
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks()
})

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit
beforeAll(() => {
  process.exit = jest.fn() as any
})

afterAll(() => {
  process.exit = originalExit
})

// Global test utilities
declare global {
  var createMockDatabase: () => string
  var createMockSchemaInfo: () => any
  var createMockNOORMME: () => any
}

// Test utilities
global.createMockDatabase = () => {
  return ':memory:' // Use in-memory SQLite for tests
}

global.createMockSchemaInfo = () => {
  return {
    tables: [
      {
        name: 'users',
        schema: 'main',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isAutoIncrement: true },
          { name: 'name', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', nullable: false },
          { name: 'status', type: 'TEXT', nullable: true, defaultValue: 'active' },
          { name: 'created_at', type: 'DATETIME', nullable: false }
        ],
        primaryKey: ['id'],
        foreignKeys: [],
        indexes: [
          { name: 'idx_users_email', columns: ['email'], unique: true },
          { name: 'idx_users_status', columns: ['status'], unique: false }
        ]
      },
      {
        name: 'posts',
        schema: 'main',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isAutoIncrement: true },
          { name: 'title', type: 'TEXT', nullable: false },
          { name: 'content', type: 'TEXT', nullable: true },
          { name: 'user_id', type: 'INTEGER', nullable: false },
          { name: 'status', type: 'TEXT', nullable: false, defaultValue: 'draft' },
          { name: 'created_at', type: 'DATETIME', nullable: false }
        ],
        primaryKey: ['id'],
        foreignKeys: [
          { column: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' }
        ],
        indexes: [
          { name: 'idx_posts_user_id', columns: ['user_id'], unique: false },
          { name: 'idx_posts_status', columns: ['status'], unique: false }
        ]
      }
    ],
    relationships: [
      {
        name: 'user_posts',
        fromTable: 'users',
        fromColumn: 'id',
        toTable: 'posts',
        toColumn: 'user_id',
        type: 'one-to-many'
      }
    ]
  }
}

global.createMockNOORMME = () => {
  const mockSchemaInfo = global.createMockSchemaInfo()
  
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    getSchemaInfo: jest.fn().mockResolvedValue(mockSchemaInfo),
    getSQLiteOptimizations: jest.fn().mockResolvedValue({
      appliedOptimizations: [
        'Enabled WAL mode',
        'Set cache size to 64MB',
        'Enabled foreign key constraints'
      ],
      warnings: [],
      walMode: true,
      foreignKeys: true,
      autoVacuum: 'INCREMENTAL',
      journalMode: 'WAL',
      synchronous: 'NORMAL',
      cacheSize: -64000
    }),
    getSQLiteIndexRecommendations: jest.fn().mockResolvedValue({
      recommendations: [
        { table: 'users', column: 'created_at', reason: 'Frequently queried for sorting', impact: 'high' },
        { table: 'posts', column: 'created_at', reason: 'Used in date range queries', impact: 'medium' }
      ]
    }),
    getSQLitePerformanceMetrics: jest.fn().mockResolvedValue({
      cacheHitRate: 0.85,
      averageQueryTime: 45.2,
      totalQueries: 1250,
      slowQueries: 5,
      databaseSize: 2048000, // 2MB
      pageCount: 500,
      freePages: 50,
      walMode: true,
      foreignKeys: true,
      autoVacuum: 'INCREMENTAL',
      journalMode: 'WAL',
      synchronous: 'NORMAL'
    }),
    applySQLiteOptimizations: jest.fn().mockResolvedValue({
      appliedOptimizations: ['Enabled WAL mode', 'Set optimal cache size'],
      warnings: []
    }),
    applySQLiteIndexRecommendations: jest.fn().mockResolvedValue([
      { table: 'users', column: 'created_at' },
      { table: 'posts', column: 'created_at' }
    ]),
    runSQLiteAnalyze: jest.fn().mockResolvedValue(undefined),
    enableSQLiteWALMode: jest.fn().mockResolvedValue(undefined),
    getQueryAnalyzer: jest.fn().mockReturnValue({
      getQueryPatterns: jest.fn().mockReturnValue({
        totalQueries: 100,
        uniquePatterns: 25,
        averageExecutionTime: 45.2,
        frequentQueries: [
          { sql: 'SELECT * FROM users WHERE email = ?', count: 50, avgTime: 12.5 },
          { sql: 'SELECT * FROM posts WHERE user_id = ?', count: 30, avgTime: 8.3 }
        ],
        slowQueries: [
          { sql: 'SELECT * FROM users ORDER BY created_at DESC', maxTime: 1500, avgTime: 850 }
        ],
        nPlusOneQueries: [
          { description: 'User posts query without join', occurrences: 5 }
        ]
      })
    }),
    getSlowQueries: jest.fn().mockResolvedValue([
      {
        sql: 'SELECT * FROM users ORDER BY created_at DESC',
        executionTime: 1500,
        suggestions: ['Add index on created_at column', 'Consider pagination']
      }
    ]),
    getKysely: jest.fn().mockReturnValue({
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([])
    }),
    getRepository: jest.fn().mockReturnValue({
      findById: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
      findAll: jest.fn().mockResolvedValue([{ id: 1, name: 'Test User' }]),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
      update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated User' }),
      delete: jest.fn().mockResolvedValue(true),
      count: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(true)
    }),
    getMigrationManager: jest.fn().mockReturnValue({
      getMigrationStatus: jest.fn().mockResolvedValue({
        currentVersion: '001',
        appliedMigrations: [
          { version: '001', name: 'initial_schema', appliedAt: '2024-01-01T00:00:00Z' }
        ],
        pendingMigrations: [],
        availableMigrations: [
          { version: '001', name: 'initial_schema' }
        ]
      }),
      generateMigration: jest.fn().mockResolvedValue({
        fileName: '001_initial_schema.ts',
        filePath: '/tmp/migrations/001_initial_schema.ts',
        description: 'Initial database schema',
        content: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);'
      }),
      migrateToLatest: jest.fn().mockResolvedValue({
        migrationsApplied: [],
        migrationsRolledBack: [],
        currentVersion: '001'
      }),
      migrateToVersion: jest.fn().mockResolvedValue({
        migrationsApplied: [],
        migrationsRolledBack: [],
        currentVersion: '001'
      }),
      rollbackLastMigration: jest.fn().mockResolvedValue({
        success: false,
        migration: null,
        currentVersion: '001'
      })
    })
  }
}
