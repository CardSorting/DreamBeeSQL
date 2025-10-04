import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { SchemaDiscoveryCoordinator } from '../core/coordinators/schema-discovery.coordinator.js'
import { DiscoveryFactory } from '../core/factories/discovery-factory.js'
import { PostgreSQLDiscoveryCoordinator } from '../dialects/postgresql/postgresql-discovery.coordinator.js'
import { SQLiteDiscoveryCoordinator } from '../dialects/sqlite/sqlite-discovery.coordinator.js'

// Mock Kysely and related dependencies
const mockKysely = {
  selectFrom: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue([]),
  withSchema: jest.fn().mockReturnThis()
} as any

// Mock DatabaseIntrospector
const mockIntrospector = {
  getTables: jest.fn().mockResolvedValue([
    {
      name: 'users',
      schema: 'public',
      columns: [
        { name: 'id', type: 'integer', isPrimaryKey: true, isNullable: false },
        { name: 'email', type: 'varchar(255)', isNullable: false },
        { name: 'created_at', type: 'timestamp', isNullable: false }
      ]
    },
    {
      name: 'posts',
      schema: 'public',
      columns: [
        { name: 'id', type: 'integer', isPrimaryKey: true, isNullable: false },
        { name: 'user_id', type: 'integer', isNullable: false },
        { name: 'title', type: 'varchar(255)', isNullable: false },
        { name: 'content', type: 'text', isNullable: true }
      ]
    }
  ]),
  getTableMetadata: jest.fn().mockResolvedValue({}),
  getViews: jest.fn().mockResolvedValue([
    {
      name: 'user_posts_view',
      schema: 'public',
      definition: 'SELECT u.email, p.title FROM users u JOIN posts p ON u.id = p.user_id',
      columns: [
        { name: 'email', type: 'varchar(255)' },
        { name: 'title', type: 'varchar(255)' }
      ]
    }
  ])
}

jest.mock('../../../dialect/database-introspector.js', () => ({
  DatabaseIntrospector: jest.fn().mockImplementation(() => mockIntrospector)
}))

describe('Schema Strategy Integration Tests', () => {
  let coordinator: SchemaDiscoveryCoordinator
  let factory: DiscoveryFactory
  let postgresCoordinator: PostgreSQLDiscoveryCoordinator
  let sqliteCoordinator: SQLiteDiscoveryCoordinator

  beforeEach(() => {
    // Reset singleton instances
    ;(SchemaDiscoveryCoordinator as any).instance = undefined
    ;(DiscoveryFactory as any).instance = undefined
    ;(PostgreSQLDiscoveryCoordinator as any).instance = undefined
    ;(SQLiteDiscoveryCoordinator as any).instance = undefined

    coordinator = SchemaDiscoveryCoordinator.getInstance()
    factory = DiscoveryFactory.getInstance()
    postgresCoordinator = PostgreSQLDiscoveryCoordinator.getInstance()
    sqliteCoordinator = SQLiteDiscoveryCoordinator.getInstance()

    // Reset mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('End-to-End Schema Discovery', () => {
    describe('PostgreSQL Integration', () => {
      it('should discover complete PostgreSQL schema with all features', async () => {
        const dialect = { name: 'postgresql' } as any
        const config = {
          includeViews: true,
          excludeTables: [],
          customTypeMappings: { 'uuid': 'string' }
        }

        const result = await coordinator.discoverSchema(mockKysely, config, dialect)

        expect(result).toBeDefined()
        expect(result.tables).toBeDefined()
        expect(result.relationships).toBeDefined()
        expect(result.views).toBeDefined()

        // Verify the coordinator was used
        expect(coordinator.getCurrentDialect()).toBe('postgresql')
      })

      it('should handle PostgreSQL-specific configurations', async () => {
        const dialect = { name: 'postgres' } as any
        const config = {
          includeViews: true,
          excludeTables: ['temp_*', 'backup_*'],
          customTypeMappings: {
            'uuid': 'string',
            'jsonb': 'object',
            'tsvector': 'string'
          }
        }

        const result = await coordinator.discoverSchema(mockKysely, config, dialect)

        expect(result).toBeDefined()
        expect(coordinator.getCurrentDialect()).toBe('postgresql') // Should normalize 'postgres' to 'postgresql'
      })

      it('should provide PostgreSQL-specific capabilities', async () => {
        const dialect = { name: 'postgresql' } as any
        await coordinator.discoverSchema(mockKysely, {}, dialect)

        const capabilities = coordinator.getDialectCapabilities()
        expect(capabilities.supportsMaterializedViews).toBe(true)
        expect(capabilities.supportsCustomTypes).toBe(true)
        expect(capabilities.supportsExtensions).toBe(true)
        expect(capabilities.supportsConcurrentIndexCreation).toBe(true)
      })
    })

    describe('SQLite Integration', () => {
      it('should discover complete SQLite schema with all features', async () => {
        const dialect = { name: 'sqlite' } as any
        const config = {
          includeViews: true,
          excludeTables: [],
          customTypeMappings: { 'INTEGER': 'number', 'TEXT': 'string' }
        }

        const result = await coordinator.discoverSchema(mockKysely, config, dialect)

        expect(result).toBeDefined()
        expect(result.tables).toBeDefined()
        expect(result.relationships).toBeDefined()
        expect(result.views).toBeDefined()

        // Verify the coordinator was used
        expect(coordinator.getCurrentDialect()).toBe('sqlite')
      })

      it('should handle SQLite-specific configurations', async () => {
        const dialect = { name: 'sqlite' } as any
        const config = {
          includeViews: false, // SQLite views might be disabled
          excludeTables: ['sqlite_*'],
          customTypeMappings: {
            'INTEGER': 'number',
            'TEXT': 'string',
            'REAL': 'number',
            'BLOB': 'buffer'
          }
        }

        const result = await coordinator.discoverSchema(mockKysely, config, dialect)

        expect(result).toBeDefined()
        expect(coordinator.getCurrentDialect()).toBe('sqlite')
      })

      it('should provide SQLite-specific capabilities', async () => {
        const dialect = { name: 'sqlite' } as any
        await coordinator.discoverSchema(mockKysely, {}, dialect)

        const capabilities = coordinator.getDialectCapabilities()
        expect(capabilities.supportsPRAGMA).toBe(true)
        expect(capabilities.supportsAutoIncrement).toBe(true)
        expect(capabilities.supportsRowId).toBe(true)
        expect(capabilities.supportsMaterializedViews).toBe(false)
        expect(capabilities.supportsCustomTypes).toBe(false)
      })
    })

    describe('Default Behavior', () => {
      it('should default to SQLite when no dialect is provided', async () => {
        const result = await coordinator.discoverSchema(mockKysely, {})

        expect(result).toBeDefined()
        expect(coordinator.getCurrentDialect()).toBe('sqlite')
      })

      it('should use default configuration when none provided', async () => {
        const result = await coordinator.discoverSchema(mockKysely)

        expect(result).toBeDefined()
        expect(result.tables).toBeDefined()
        expect(result.relationships).toBeDefined()
        expect(result.views).toBeDefined()
      })
    })
  })

  describe('Factory Integration', () => {
    it('should create all necessary services for PostgreSQL', () => {
      const services = factory.createDiscoveryServices('postgresql')

      expect(services.tableDiscovery).toBeDefined()
      expect(services.relationshipDiscovery).toBeDefined()
      expect(services.viewDiscovery).toBeDefined()
      expect(services.indexDiscovery).toBeDefined()
      expect(services.constraintDiscovery).toBeDefined()
    })

    it('should create all necessary services for SQLite', () => {
      const services = factory.createDiscoveryServices('sqlite')

      expect(services.tableDiscovery).toBeDefined()
      expect(services.relationshipDiscovery).toBeDefined()
      expect(services.viewDiscovery).toBeDefined()
      expect(services.indexDiscovery).toBeDefined()
      expect(services.constraintDiscovery).toBeDefined()
    })

    it('should provide consistent capabilities across factory and coordinators', () => {
      const postgresCapabilities = factory.getDialectCapabilities('postgresql')
      const postgresCoordinatorCapabilities = postgresCoordinator.getCapabilities()

      // Basic capabilities should match
      expect(postgresCapabilities.supportsViews).toBe(postgresCoordinatorCapabilities.supportsViews)
      expect(postgresCapabilities.supportsIndexes).toBe(postgresCoordinatorCapabilities.supportsIndexes)
      expect(postgresCapabilities.supportsConstraints).toBe(postgresCoordinatorCapabilities.supportsConstraints)

      const sqliteCapabilities = factory.getDialectCapabilities('sqlite')
      const sqliteCoordinatorCapabilities = sqliteCoordinator.getCapabilities()

      // Basic capabilities should match
      expect(sqliteCapabilities.supportsViews).toBe(sqliteCoordinatorCapabilities.supportsViews)
      expect(sqliteCapabilities.supportsIndexes).toBe(sqliteCoordinatorCapabilities.supportsIndexes)
      expect(sqliteCapabilities.supportsConstraints).toBe(sqliteCoordinatorCapabilities.supportsConstraints)
    })
  })

  describe('Configuration Handling', () => {
    it('should pass through all configuration options', async () => {
      const dialect = { name: 'postgresql' } as any
      const config = {
        includeViews: true,
        excludeTables: ['temp_*', 'backup_*', 'test_*'],
        customTypeMappings: {
          'uuid': 'string',
          'jsonb': 'object',
          'tsvector': 'string',
          'inet': 'string'
        }
      }

      await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
      // The configuration should be passed through to the underlying services
    })

    it('should handle partial configuration', async () => {
      const dialect = { name: 'sqlite' } as any
      const config = {
        includeViews: true
        // Other properties undefined
      }

      const result = await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
      expect(result.views).toBeDefined()
    })

    it('should handle empty configuration', async () => {
      const dialect = { name: 'postgresql' } as any
      const config = {}

      const result = await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent schema discoveries', async () => {
      const dialect = { name: 'postgresql' } as any
      const config = { includeViews: true }

      // Create multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        coordinator.discoverSchema(mockKysely, config, dialect)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.tables).toBeDefined()
        expect(result.relationships).toBeDefined()
        expect(result.views).toBeDefined()
      })
    })

    it('should reuse singleton instances efficiently', async () => {
      const dialect1 = { name: 'postgresql' } as any
      const dialect2 = { name: 'sqlite' } as any

      // Multiple calls should reuse the same coordinator instance
      const coordinator1 = coordinator.getFactory()
      const coordinator2 = coordinator.getFactory()

      expect(coordinator1).toBe(coordinator2)

      // But should create different dialect-specific coordinators
      const postgresCoord1 = factory.createDiscoveryCoordinator('postgresql')
      const postgresCoord2 = factory.createDiscoveryCoordinator('postgresql')
      const sqliteCoord = factory.createDiscoveryCoordinator('sqlite')

      expect(postgresCoord1).toBe(postgresCoord2) // Same instance
      expect(postgresCoord1).not.toBe(sqliteCoord) // Different dialect
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from partial failures gracefully', async () => {
      const dialect = { name: 'postgresql' } as any
      const config = { includeViews: true }

      // Mock partial failure scenario
      mockIntrospector.getTables.mockResolvedValueOnce([
        {
          name: 'users',
          schema: 'public',
          columns: [
            { name: 'id', type: 'integer', isPrimaryKey: true, isNullable: false }
          ]
        }
      ])

      const result = await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
      expect(result.tables).toBeDefined()
      // Should still return a valid result even if some operations fail
    })

    it('should handle database connection issues gracefully', async () => {
      const dialect = { name: 'postgresql' } as any
      const mockKyselyWithError = {
        selectFrom: jest.fn().mockImplementation(() => {
          throw new Error('Connection timeout')
        })
      } as any

      await expect(
        coordinator.discoverSchema(mockKyselyWithError, {}, dialect)
      ).rejects.toThrow('Connection timeout')
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with existing NOORMME API', async () => {
      // This test ensures the new schema strategy doesn't break existing usage
      const dialect = { name: 'postgresql' } as any

      // Simulate existing usage patterns
      const result1 = await coordinator.discoverSchema(mockKysely, {}, dialect)
      const result2 = await coordinator.discoverSchema(mockKysely, { includeViews: true }, dialect)
      const result3 = await coordinator.discoverSchema(mockKysely, { excludeTables: ['temp_*'] }, dialect)

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(result3).toBeDefined()

      // All results should have the same structure
      [result1, result2, result3].forEach(result => {
        expect(result).toHaveProperty('tables')
        expect(result).toHaveProperty('relationships')
        expect(result).toHaveProperty('views')
      })
    })

    it('should support legacy dialect names', async () => {
      // Test that 'postgres' still works (legacy name)
      const dialect = { name: 'postgres' } as any

      const result = await coordinator.discoverSchema(mockKysely, {}, dialect)

      expect(result).toBeDefined()
      expect(coordinator.getCurrentDialect()).toBe('postgresql') // Should normalize
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical web application schema', async () => {
      // Simulate a typical web app with users, posts, comments, etc.
      const dialect = { name: 'postgresql' } as any
      const config = {
        includeViews: true,
        excludeTables: ['migrations', 'sessions'],
        customTypeMappings: {
          'uuid': 'string',
          'jsonb': 'object',
          'timestamp': 'string'
        }
      }

      const result = await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
      expect(result.tables).toBeDefined()
      expect(result.relationships).toBeDefined()
      expect(result.views).toBeDefined()
    })

    it('should handle data warehouse schema', async () => {
      // Simulate a data warehouse with many tables and views
      const dialect = { name: 'postgresql' } as any
      const config = {
        includeViews: true,
        excludeTables: ['temp_*', 'staging_*', 'backup_*'],
        customTypeMappings: {
          'uuid': 'string',
          'jsonb': 'object',
          'numeric': 'number',
          'timestamp': 'string'
        }
      }

      const result = await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
      expect(result.tables).toBeDefined()
      expect(result.relationships).toBeDefined()
      expect(result.views).toBeDefined()
    })

    it('should handle mobile app schema (SQLite)', async () => {
      // Simulate a mobile app using SQLite
      const dialect = { name: 'sqlite' } as any
      const config = {
        includeViews: false, // Mobile apps might not use views
        excludeTables: ['sqlite_*'],
        customTypeMappings: {
          'INTEGER': 'number',
          'TEXT': 'string',
          'REAL': 'number',
          'BLOB': 'buffer'
        }
      }

      const result = await coordinator.discoverSchema(mockKysely, config, dialect)

      expect(result).toBeDefined()
      expect(result.tables).toBeDefined()
      expect(result.relationships).toBeDefined()
      expect(result.views).toBeDefined()
    })
  })
})
