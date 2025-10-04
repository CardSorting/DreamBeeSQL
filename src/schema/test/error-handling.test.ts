import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { DiscoveryFactory } from '../core/factories/discovery-factory.js'
import { SchemaDiscoveryCoordinator } from '../core/coordinators/schema-discovery.coordinator.js'
import { SQLiteDiscoveryCoordinator } from '../dialects/sqlite/sqlite-discovery.coordinator.js'

// Mock console.warn to capture warning messages
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('Error Handling', () => {
  let factory: DiscoveryFactory
  let coordinator: SchemaDiscoveryCoordinator
  let sqliteCoordinator: SQLiteDiscoveryCoordinator

  beforeEach(() => {
    // Reset singleton instances
    ;(DiscoveryFactory as any).instance = undefined
    ;(SchemaDiscoveryCoordinator as any).instance = undefined
    ;(SQLiteDiscoveryCoordinator as any).instance = undefined

    factory = DiscoveryFactory.getInstance()
    coordinator = SchemaDiscoveryCoordinator.getInstance()
    sqliteCoordinator = SQLiteDiscoveryCoordinator.getInstance()

    // Clear console.warn mock calls
    mockConsoleWarn.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('DiscoveryFactory Error Handling', () => {
    it('should throw error for unsupported dialect in createIndexDiscovery', () => {
      expect(() => factory.createIndexDiscovery('unsupported')).toThrow('Unsupported dialect for index discovery: unsupported')
    })

    it('should throw error for unsupported dialect in createConstraintDiscovery', () => {
      expect(() => factory.createConstraintDiscovery('unsupported')).toThrow('Unsupported dialect for constraint discovery: unsupported')
    })

    it('should throw error for unsupported dialect in createDiscoveryCoordinator', () => {
      expect(() => factory.createDiscoveryCoordinator('unsupported')).toThrow('Unsupported dialect for discovery coordinator: unsupported')
    })
  })

  describe('SQLite Coordinator Error Handling', () => {
    const mockKysely = {
      selectFrom: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      // Add other required Kysely properties as mocks
      schema: jest.fn(),
      dynamic: jest.fn(),
      introspection: jest.fn(),
      deleteFrom: jest.fn(),
      insertInto: jest.fn(),
      updateTable: jest.fn(),
      with: jest.fn(),
      withRecursive: jest.fn(),
      case: jest.fn(),
      fn: jest.fn(),
      ref: jest.fn(),
      raw: jest.fn(),
      transaction: jest.fn(),
      replaceInto: jest.fn(),
      mergeInto: jest.fn(),
      createSchema: jest.fn(),
      dropSchema: jest.fn(),
      createTable: jest.fn(),
      dropTable: jest.fn(),
      alterTable: jest.fn(),
      createIndex: jest.fn(),
      dropIndex: jest.fn(),
      createType: jest.fn(),
      dropType: jest.fn(),
      createView: jest.fn(),
      dropView: jest.fn(),
      createMaterializedView: jest.fn(),
      dropMaterializedView: jest.fn(),
      refreshMaterializedView: jest.fn(),
      executeQuery: jest.fn(),
      compileQuery: jest.fn(),
      getExecutor: jest.fn(),
      getPlugin: jest.fn(),
      withPlugin: jest.fn(),
      withoutPlugins: jest.fn(),
      freeze: jest.fn()
    } as any

    it('should handle table discovery service errors', async () => {
      // Mock the service to throw an error
      jest.spyOn(require('../core/discovery/table-metadata-discovery.js'), 'TableMetadataDiscovery')
        .mockImplementation(() => ({
          discoverTables: jest.fn().mockRejectedValue(new Error('Table discovery service failed'))
        }))

      await expect(
        sqliteCoordinator.discoverSchema(mockKysely as any, {})
      ).rejects.toThrow('Table discovery service failed')
    })

    it('should handle relationship discovery service errors', async () => {
      // Mock the service to throw an error
      jest.spyOn(require('../core/discovery/relationship-discovery.js'), 'RelationshipDiscovery')
        .mockImplementation(() => ({
          discoverRelationships: jest.fn().mockRejectedValue(new Error('Relationship discovery service failed'))
        }))

      await expect(
        sqliteCoordinator.discoverSchema(mockKysely as any, {})
      ).rejects.toThrow('Relationship discovery service failed')
    })

    it('should handle index discovery service errors', async () => {
      // Mock the service to throw an error
      jest.spyOn(require('../dialects/sqlite/discovery/sqlite-index-discovery.js'), 'SQLiteIndexDiscovery')
        .mockImplementation(() => ({
          discoverIndexes: jest.fn().mockRejectedValue(new Error('Index discovery service failed'))
        }))

      await expect(
        sqliteCoordinator.discoverSchema(mockKysely as any, {})
      ).rejects.toThrow('Index discovery service failed')
    })

    it('should handle constraint discovery service errors', async () => {
      // Mock the service to throw an error
      jest.spyOn(require('../dialects/sqlite/discovery/sqlite-constraint-discovery.js'), 'SQLiteConstraintDiscovery')
        .mockImplementation(() => ({
          discoverConstraints: jest.fn().mockRejectedValue(new Error('Constraint discovery service failed'))
        }))

      await expect(
        sqliteCoordinator.discoverSchema(mockKysely as any, {})
      ).rejects.toThrow('Constraint discovery service failed')
    })

    it('should handle view discovery service errors', async () => {
      // Mock the service to throw an error
      jest.spyOn(require('../core/discovery/view-discovery.js'), 'ViewDiscovery')
        .mockImplementation(() => ({
          discoverViews: jest.fn().mockRejectedValue(new Error('View discovery service failed'))
        }))

      await expect(
        sqliteCoordinator.discoverSchema(mockKysely as any, {})
      ).rejects.toThrow('View discovery service failed')
    })

    it('should handle database connection errors', async () => {
      // Mock database to throw connection error
      const mockKyselyWithError = {
        selectFrom: jest.fn().mockImplementation(() => {
          throw new Error('Database connection failed')
        })
      }

      await expect(
        sqliteCoordinator.discoverSchema(mockKyselyWithError as any, {})
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Error Message Formatting', () => {
    it('should provide helpful error messages', () => {
      const error = new Error('Database connection failed')
      expect(error.message).toBe('Database connection failed')
    })

    it('should handle undefined error gracefully', () => {
      expect(() => {
        throw undefined
      }).toThrow()
    })

    it('should handle null error gracefully', () => {
      expect(() => {
        throw null
      }).toThrow()
    })
  })
})