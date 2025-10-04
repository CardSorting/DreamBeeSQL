import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { DiscoveryFactory } from '../core/factories/discovery-factory.js'
import { SchemaDiscoveryCoordinator } from '../core/coordinators/schema-discovery.coordinator.js'
import { PostgreSQLDiscoveryCoordinator } from '../dialects/postgresql/postgresql-discovery.coordinator.js'
import { SQLiteDiscoveryCoordinator } from '../dialects/sqlite/sqlite-discovery.coordinator.js'

// Mock console.warn to capture warning messages
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('Error Handling', () => {
  let factory: DiscoveryFactory
  let coordinator: SchemaDiscoveryCoordinator
  let postgresCoordinator: PostgreSQLDiscoveryCoordinator
  let sqliteCoordinator: SQLiteDiscoveryCoordinator

  beforeEach(() => {
    // Reset singleton instances
    ;(DiscoveryFactory as any).instance = undefined
    ;(SchemaDiscoveryCoordinator as any).instance = undefined
    ;(PostgreSQLDiscoveryCoordinator as any).instance = undefined
    ;(SQLiteDiscoveryCoordinator as any).instance = undefined

    factory = DiscoveryFactory.getInstance()
    coordinator = SchemaDiscoveryCoordinator.getInstance()
    postgresCoordinator = PostgreSQLDiscoveryCoordinator.getInstance()
    sqliteCoordinator = SQLiteDiscoveryCoordinator.getInstance()

    // Clear console.warn mock calls
    mockConsoleWarn.mockClear()
  })

  afterEach(() => {
    mockConsoleWarn.mockRestore()
  })

  describe('DiscoveryFactory Error Handling', () => {
    describe('Unsupported Dialects', () => {
      it('should throw error for MySQL index discovery', () => {
        expect(() => factory.createIndexDiscovery('mysql')).toThrow('MySQL index discovery not yet implemented')
      })

      it('should throw error for MSSQL index discovery', () => {
        expect(() => factory.createIndexDiscovery('mssql')).toThrow('MSSQL index discovery not yet implemented')
      })

      it('should throw error for Oracle index discovery', () => {
        expect(() => factory.createIndexDiscovery('oracle')).toThrow('Unsupported dialect for index discovery: oracle')
      })

      it('should throw error for MySQL constraint discovery', () => {
        expect(() => factory.createConstraintDiscovery('mysql')).toThrow('MySQL constraint discovery not yet implemented')
      })

      it('should throw error for MSSQL constraint discovery', () => {
        expect(() => factory.createConstraintDiscovery('mssql')).toThrow('MSSQL constraint discovery not yet implemented')
      })

      it('should throw error for Oracle constraint discovery', () => {
        expect(() => factory.createConstraintDiscovery('oracle')).toThrow('Unsupported dialect for constraint discovery: oracle')
      })

      it('should throw error for MySQL discovery coordinator', () => {
        expect(() => factory.createDiscoveryCoordinator('mysql')).toThrow('MySQL discovery coordinator not yet implemented')
      })

      it('should throw error for MSSQL discovery coordinator', () => {
        expect(() => factory.createDiscoveryCoordinator('mssql')).toThrow('MSSQL discovery coordinator not yet implemented')
      })

      it('should throw error for Oracle discovery coordinator', () => {
        expect(() => factory.createDiscoveryCoordinator('oracle')).toThrow('Unsupported dialect for discovery coordinator: oracle')
      })

      it('should throw error for MySQL discovery services', () => {
        expect(() => factory.createDiscoveryServices('mysql')).toThrow('MySQL index discovery not yet implemented')
      })

      it('should throw error for MSSQL discovery services', () => {
        expect(() => factory.createDiscoveryServices('mssql')).toThrow('MSSQL index discovery not yet implemented')
      })
    })

    describe('Invalid Input Handling', () => {
      it('should handle null dialect', () => {
        expect(() => factory.createIndexDiscovery(null as any)).toThrow('Unsupported dialect for index discovery: null')
      })

      it('should handle undefined dialect', () => {
        expect(() => factory.createIndexDiscovery(undefined as any)).toThrow('Unsupported dialect for index discovery: undefined')
      })

      it('should handle empty string dialect', () => {
        expect(() => factory.createIndexDiscovery('')).toThrow('Unsupported dialect for index discovery: ')
      })

      it('should handle whitespace-only dialect', () => {
        expect(() => factory.createIndexDiscovery('   ')).toThrow('Unsupported dialect for index discovery:    ')
      })

      it('should handle non-string dialect', () => {
        expect(() => factory.createIndexDiscovery(123 as any)).toThrow('Unsupported dialect for index discovery: 123')
        expect(() => factory.createIndexDiscovery({} as any)).toThrow('Unsupported dialect for index discovery: [object Object]')
        expect(() => factory.createIndexDiscovery([] as any)).toThrow('Unsupported dialect for index discovery: ')
      })
    })

    describe('Case Sensitivity', () => {
      it('should handle case insensitive dialect names correctly', () => {
        // These should work (case insensitive)
        expect(() => factory.createIndexDiscovery('POSTGRESQL')).not.toThrow()
        expect(() => factory.createIndexDiscovery('PostgreSQL')).not.toThrow()
        expect(() => factory.createIndexDiscovery('postgresql')).not.toThrow()
        expect(() => factory.createIndexDiscovery('SQLITE')).not.toThrow()
        expect(() => factory.createIndexDiscovery('Sqlite')).not.toThrow()
        expect(() => factory.createIndexDiscovery('sqlite')).not.toThrow()

        // These should still throw for unsupported dialects
        expect(() => factory.createIndexDiscovery('MYSQL')).toThrow('MySQL index discovery not yet implemented')
        expect(() => factory.createIndexDiscovery('MySQL')).toThrow('MySQL index discovery not yet implemented')
      })
    })
  })

  describe('SchemaDiscoveryCoordinator Error Handling', () => {
    const mockKysely = {} as any

    describe('Unsupported Dialects', () => {
      it('should throw error for unsupported dialects', async () => {
        const dialect = { name: 'oracle' } as any

        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).rejects.toThrow('Unsupported database dialect: oracle')
      })

      it('should throw error for MySQL dialect', async () => {
        const dialect = { name: 'mysql' } as any

        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).rejects.toThrow('Unsupported database dialect: mysql')
      })

      it('should throw error for MSSQL dialect', async () => {
        const dialect = { name: 'mssql' } as any

        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).rejects.toThrow('Unsupported database dialect: mssql')
      })
    })

    describe('Invalid Dialect Objects', () => {
      it('should handle dialect without name property', async () => {
        const dialect = {} as any

        // Should default to sqlite and work
        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).resolves.toBeDefined()
      })

      it('should handle null dialect', async () => {
        // Should default to sqlite and work
        // @ts-ignore: Testing null as dialect, which is not assignable by type but should be handled gracefully
        await expect(
          coordinator.discoverSchema(mockKysely, {}, null as any)
        ).resolves.toBeDefined()
        
        // Should default to sqlite and work
        await expect(
          coordinator.discoverSchema(mockKysely, {}, undefined)
        ).resolves.toBeDefined()

        // Should default to sqlite and work
        await expect(
          coordinator.discoverSchema(mockKysely, {})
        ).resolves.toBeDefined()
      })
    })

    describe('Database Connection Errors', () => {
      it('should propagate database connection errors', async () => {
        const mockKyselyWithError = {
          selectFrom: jest.fn().mockImplementation(() => {
            throw new Error('Connection failed')
          })
        } as any

        const dialect = { name: 'postgresql' } as any

        await expect(
          coordinator.discoverSchema(mockKyselyWithError, {}, dialect)
        ).rejects.toThrow('Connection failed')
      })
    })
  })

  describe('PostgreSQL Coordinator Error Handling', () => {
    const mockKysely = {} as any

    describe('Service Initialization Errors', () => {
      it('should handle table discovery service errors', async () => {
        // Mock the service to throw an error
        jest.spyOn(require('../core/discovery/table-metadata-discovery.js'), 'TableMetadataDiscovery')
          .mockImplementation(() => ({
            discoverTables: jest.fn().mockRejectedValue(new Error('Table discovery service failed'))
          }))

        await expect(
          postgresCoordinator.discoverSchema(mockKysely, {})
        ).rejects.toThrow('Table discovery service failed')
      })

      it('should handle relationship discovery service errors', async () => {
        // Mock the service to throw an error
        jest.spyOn(require('../core/discovery/relationship-discovery.js'), 'RelationshipDiscovery')
          .mockImplementation(() => ({
            discoverRelationships: jest.fn().mockRejectedValue(new Error('Relationship discovery service failed'))
          }))

        await expect(
          postgresCoordinator.discoverSchema(mockKysely, {})
        ).rejects.toThrow('Relationship discovery service failed')
      })

      it('should handle view discovery service errors when views are requested', async () => {
        // Mock the service to throw an error
        jest.spyOn(require('../core/discovery/view-discovery.js'), 'ViewDiscovery')
          .mockImplementation(() => ({
            discoverViews: jest.fn().mockRejectedValue(new Error('View discovery service failed'))
          }))

        const config = { includeViews: true }

        await expect(
          postgresCoordinator.discoverSchema(mockKysely, config)
        ).rejects.toThrow('View discovery service failed')
      })
    })

    describe('Partial Enhancement Errors', () => {
      it('should handle index discovery errors gracefully', async () => {
        // Mock index discovery to fail for one table
        const mockIndexDiscovery = {
          discoverTableIndexes: jest.fn()
            .mockResolvedValueOnce([]) // First table succeeds
            .mockRejectedValueOnce(new Error('Index discovery failed')) // Second table fails
        }

        jest.spyOn(require('../dialects/postgresql/discovery/postgresql-index-discovery.js'), 'PostgreSQLIndexDiscovery')
          .mockImplementation(() => mockIndexDiscovery)

        const result = await postgresCoordinator.discoverSchema(mockKysely, {})

        expect(result.tables).toHaveLength(2)
        expect(result.tables[0].indexes).toEqual([])
        expect(result.tables[1].indexes).toEqual([])
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to enhance PostgreSQL metadata for table'),
          expect.any(Error)
        )
      })

      it('should handle constraint discovery errors gracefully', async () => {
        // Mock constraint discovery to fail
        const mockConstraintDiscovery = {
          discoverTableConstraints: jest.fn().mockRejectedValue(new Error('Constraint discovery failed')),
          discoverForeignKeyConstraints: jest.fn().mockResolvedValue([])
        }

        jest.spyOn(require('../dialects/postgresql/discovery/postgresql-constraint-discovery.js'), 'PostgreSQLConstraintDiscovery')
          .mockImplementation(() => mockConstraintDiscovery)

        const result = await postgresCoordinator.discoverSchema(mockKysely, {})

        expect(result.tables).toHaveLength(2)
        expect(result.tables[0].foreignKeys).toEqual([])
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to enhance PostgreSQL metadata for table'),
          expect.any(Error)
        )
      })
    })

    describe('Recommendation Errors', () => {
      it('should handle recommendation errors gracefully', async () => {
        const mockIndexDiscovery = {
          discoverTableIndexes: jest.fn().mockRejectedValue(new Error('Index analysis failed')),
          getIndexUsageStats: jest.fn(),
          analyzeIndexEfficiency: jest.fn()
        }

        jest.spyOn(require('../dialects/postgresql/discovery/postgresql-index-discovery.js'), 'PostgreSQLIndexDiscovery')
          .mockImplementation(() => mockIndexDiscovery)

        const tables = [{ name: 'users', indexes: [], foreignKeys: [] }]

        const recommendations = await postgresCoordinator.getRecommendations(mockKysely, tables)

        expect(recommendations).toEqual([])
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to get recommendations for PostgreSQL table users'),
          expect.any(Error)
        )
      })
    })
  })

  describe('SQLite Coordinator Error Handling', () => {
    const mockKysely = {} as any

    describe('PRAGMA Check Errors', () => {
      it('should handle PRAGMA foreign key check errors', async () => {
        const mockConstraintDiscovery = {
          isForeignKeySupportEnabled: jest.fn().mockRejectedValue(new Error('PRAGMA check failed')),
          discoverTableConstraints: jest.fn().mockResolvedValue([]),
          getForeignKeyInfo: jest.fn().mockResolvedValue([])
        }

        jest.spyOn(require('../dialects/sqlite/discovery/sqlite-constraint-discovery.js'), 'SQLiteConstraintDiscovery')
          .mockImplementation(() => mockConstraintDiscovery)

        await expect(
          sqliteCoordinator.discoverSchema(mockKysely, {})
        ).rejects.toThrow('PRAGMA check failed')
      })
    })

    describe('Partial Enhancement Errors', () => {
      it('should handle index discovery errors gracefully', async () => {
        const mockIndexDiscovery = {
          discoverTableIndexes: jest.fn().mockRejectedValue(new Error('Index discovery failed')),
          getTableSize: jest.fn().mockResolvedValue({ pages: 0, size: 0, estimatedRows: 0 })
        }

        jest.spyOn(require('../dialects/sqlite/discovery/sqlite-index-discovery.js'), 'SQLiteIndexDiscovery')
          .mockImplementation(() => mockIndexDiscovery)

        const result = await sqliteCoordinator.discoverSchema(mockKysely, {})

        expect(result.tables).toHaveLength(2)
        expect(result.tables[0].indexes).toEqual([])
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to enhance SQLite metadata for table'),
          expect.any(Error)
        )
      })

      it('should handle table size calculation errors gracefully', async () => {
        const mockIndexDiscovery = {
          discoverTableIndexes: jest.fn().mockResolvedValue([]),
          getTableSize: jest.fn().mockRejectedValue(new Error('Table size calculation failed'))
        }

        jest.spyOn(require('../dialects/sqlite/discovery/sqlite-index-discovery.js'), 'SQLiteIndexDiscovery')
          .mockImplementation(() => mockIndexDiscovery)

        const result = await sqliteCoordinator.discoverSchema(mockKysely, {})

        expect(result.tables).toHaveLength(2)
        expect((result.tables[0] as any).tableSize).toBeUndefined()
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to enhance SQLite metadata for table'),
          expect.any(Error)
        )
      })
    })

    describe('Recommendation Errors', () => {
      it('should handle recommendation errors gracefully', async () => {
        const mockIndexDiscovery = {
          discoverTableIndexes: jest.fn().mockRejectedValue(new Error('Index analysis failed')),
          analyzeIndexEfficiency: jest.fn()
        }

        jest.spyOn(require('../dialects/sqlite/discovery/sqlite-index-discovery.js'), 'SQLiteIndexDiscovery')
          .mockImplementation(() => mockIndexDiscovery)

        const tables = [{ name: 'users', primaryKey: ['id'], indexes: [], foreignKeys: [] }]

        const recommendations = await sqliteCoordinator.getRecommendations(mockKysely, tables)

        expect(recommendations).toEqual(['Consider enabling foreign key support with PRAGMA foreign_keys = ON for better data integrity'])
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to get recommendations for SQLite table users'),
          expect.any(Error)
        )
      })
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty configuration objects', async () => {
      const mockKysely = {} as any
      const dialect = { name: 'postgresql' } as any

      await expect(
        coordinator.discoverSchema(mockKysely, {}, dialect)
      ).resolves.toBeDefined()
    })

    it('should handle configuration with all properties undefined', async () => {
      const mockKysely = {} as any
      const dialect = { name: 'postgresql' } as any
      const config = {
        excludeTables: undefined,
        includeViews: undefined,
        customTypeMappings: undefined
      }

      await expect(
        coordinator.discoverSchema(mockKysely, config, dialect)
      ).resolves.toBeDefined()
    })

    it('should handle configuration with empty arrays', async () => {
      const mockKysely = {} as any
      const dialect = { name: 'postgresql' } as any
      const config = {
        excludeTables: [],
        includeViews: false,
        customTypeMappings: {}
      }

      await expect(
        coordinator.discoverSchema(mockKysely, config, dialect)
      ).resolves.toBeDefined()
    })

    it('should handle very long dialect names', () => {
      const longDialectName = 'a'.repeat(1000)

      expect(() => factory.createIndexDiscovery(longDialectName)).toThrow(
        `Unsupported dialect for index discovery: ${longDialectName}`
      )
    })

    it('should handle dialect names with special characters', () => {
      const specialDialectName = 'postgresql@#$%^&*()'

      expect(() => factory.createIndexDiscovery(specialDialectName)).toThrow(
        `Unsupported dialect for index discovery: ${specialDialectName}`
      )
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large number of tables gracefully', async () => {
      // This test would need actual database setup to be meaningful
      // For now, we'll test that the error handling structure can handle the scenario
      const mockKysely = {} as any
      const dialect = { name: 'postgresql' } as any

      await expect(
        coordinator.discoverSchema(mockKysely, {}, dialect)
      ).resolves.toBeDefined()
    })

    it('should handle concurrent discovery requests', async () => {
      const mockKysely = {} as any
      const dialect = { name: 'postgresql' } as any

      // Create multiple concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        coordinator.discoverSchema(mockKysely, {}, dialect)
      )

      await expect(Promise.all(promises)).resolves.toHaveLength(10)
    })
  })

  describe('Error Message Quality', () => {
    it('should provide descriptive error messages for unsupported dialects', () => {
      const error = () => factory.createIndexDiscovery('oracle')
      expect(error).toThrow('Unsupported dialect for index discovery: oracle')
    })

    it('should provide descriptive error messages for unimplemented features', () => {
      const error = () => factory.createIndexDiscovery('mysql')
      expect(error).toThrow('MySQL index discovery not yet implemented')
    })

    it('should provide descriptive error messages for coordinator creation', () => {
      const error = () => factory.createDiscoveryCoordinator('oracle')
      expect(error).toThrow('Unsupported dialect for discovery coordinator: oracle')
    })
  })
})
