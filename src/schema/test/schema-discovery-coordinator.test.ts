import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { SchemaDiscoveryCoordinator } from '../core/coordinators/schema-discovery.coordinator.js'
import { DiscoveryFactory } from '../core/factories/discovery-factory.js'
import { PostgreSQLDiscoveryCoordinator } from '../dialects/postgresql/postgresql-discovery.coordinator.js'
import { SQLiteDiscoveryCoordinator } from '../dialects/sqlite/sqlite-discovery.coordinator.js'

// Mock Kysely and related types
const mockKysely = {
  selectFrom: jest.fn(),
  select: jest.fn(),
  execute: jest.fn()
} as any

const mockDialect = {
  name: 'postgresql'
} as any

const mockSchemaInfo = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'integer', isPrimaryKey: true },
        { name: 'email', type: 'varchar', isNullable: false }
      ],
      primaryKey: ['id']
    }
  ],
  relationships: [],
  views: []
}

describe('SchemaDiscoveryCoordinator', () => {
  let coordinator: SchemaDiscoveryCoordinator
  let mockFactory: jest.Mocked<DiscoveryFactory>
  let mockPostgresCoordinator: jest.Mocked<PostgreSQLDiscoveryCoordinator>
  let mockSQLiteCoordinator: jest.Mocked<SQLiteDiscoveryCoordinator>

  beforeEach(() => {
    // Reset singleton instance
    ;(SchemaDiscoveryCoordinator as any).instance = undefined

    // Create mocks
    mockPostgresCoordinator = {
      discoverSchema: jest.fn().mockResolvedValue(mockSchemaInfo),
      getCapabilities: jest.fn().mockReturnValue({
        supportsViews: true,
        supportsIndexes: true,
        supportsConstraints: true,
        supportsForeignKeys: true,
        supportsCheckConstraints: true,
        supportsDeferredConstraints: true
      }),
      getRecommendations: jest.fn().mockResolvedValue([])
    } as any

    mockSQLiteCoordinator = {
      discoverSchema: jest.fn().mockResolvedValue(mockSchemaInfo),
      getCapabilities: jest.fn().mockReturnValue({
        supportsViews: true,
        supportsIndexes: true,
        supportsConstraints: true,
        supportsForeignKeys: false,
        supportsCheckConstraints: true,
        supportsDeferredConstraints: false
      }),
      getRecommendations: jest.fn().mockResolvedValue([])
    } as any

    mockFactory = {
      createDiscoveryCoordinator: jest.fn(),
      isDialectSupported: jest.fn(),
      getDialectCapabilities: jest.fn()
    } as any

    // Mock the factory creation
    jest.spyOn(DiscoveryFactory, 'getInstance').mockReturnValue(mockFactory)
    
    coordinator = SchemaDiscoveryCoordinator.getInstance()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SchemaDiscoveryCoordinator.getInstance()
      const instance2 = SchemaDiscoveryCoordinator.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should maintain state across multiple calls', () => {
      const instance1 = SchemaDiscoveryCoordinator.getInstance()
      const instance2 = SchemaDiscoveryCoordinator.getInstance()
      expect(instance1.getFactory()).toBe(instance2.getFactory())
    })
  })

  describe('Factory Access', () => {
    it('should return the discovery factory instance', () => {
      const factory = coordinator.getFactory()
      expect(factory).toBe(mockFactory)
    })
  })

  describe('Dialect Management', () => {
    it('should set current dialect from dialect parameter', () => {
      const dialect = { name: 'postgresql' } as any
      coordinator.discoverSchema(mockKysely, {}, dialect)
      expect(coordinator.getCurrentDialect()).toBe('postgresql')
    })

    it('should default to sqlite when no dialect provided', () => {
      coordinator.discoverSchema(mockKysely)
      expect(coordinator.getCurrentDialect()).toBe('sqlite')
    })

    it('should handle dialect without name property', () => {
      const dialect = {} as any
      coordinator.discoverSchema(mockKysely, {}, dialect)
      expect(coordinator.getCurrentDialect()).toBe('sqlite')
    })
  })

  describe('Schema Discovery', () => {
    describe('PostgreSQL Discovery', () => {
      beforeEach(() => {
        mockFactory.isDialectSupported.mockReturnValue(true)
        mockFactory.createDiscoveryCoordinator.mockReturnValue(mockPostgresCoordinator)
      })

      it('should delegate to PostgreSQL coordinator for postgresql dialect', async () => {
        const dialect = { name: 'postgresql' } as any
        const config = { includeViews: true }

        const result = await coordinator.discoverSchema(mockKysely, config, dialect)

        expect(mockFactory.isDialectSupported).toHaveBeenCalledWith('postgresql')
        expect(mockFactory.createDiscoveryCoordinator).toHaveBeenCalledWith('postgresql')
        expect(mockPostgresCoordinator.discoverSchema).toHaveBeenCalledWith(mockKysely, config)
        expect(result).toEqual(mockSchemaInfo)
      })

      it('should delegate to PostgreSQL coordinator for postgres dialect', async () => {
        const dialect = { name: 'postgres' } as any

        await coordinator.discoverSchema(mockKysely, {}, dialect)

        expect(mockFactory.createDiscoveryCoordinator).toHaveBeenCalledWith('postgres')
      })

      it('should use default config when none provided', async () => {
        const dialect = { name: 'postgresql' } as any

        await coordinator.discoverSchema(mockKysely, undefined, dialect)

        expect(mockPostgresCoordinator.discoverSchema).toHaveBeenCalledWith(mockKysely, {})
      })
    })

    describe('SQLite Discovery', () => {
      beforeEach(() => {
        mockFactory.isDialectSupported.mockReturnValue(true)
        mockFactory.createDiscoveryCoordinator.mockReturnValue(mockSQLiteCoordinator)
      })

      it('should delegate to SQLite coordinator for sqlite dialect', async () => {
        const dialect = { name: 'sqlite' } as any
        const config = { excludeTables: ['temp_*'] }

        const result = await coordinator.discoverSchema(mockKysely, config, dialect)

        expect(mockFactory.isDialectSupported).toHaveBeenCalledWith('sqlite')
        expect(mockFactory.createDiscoveryCoordinator).toHaveBeenCalledWith('sqlite')
        expect(mockSQLiteCoordinator.discoverSchema).toHaveBeenCalledWith(mockKysely, config)
        expect(result).toEqual(mockSchemaInfo)
      })

      it('should default to sqlite when no dialect provided', async () => {
        await coordinator.discoverSchema(mockKysely)

        expect(mockFactory.createDiscoveryCoordinator).toHaveBeenCalledWith('sqlite')
        expect(mockSQLiteCoordinator.discoverSchema).toHaveBeenCalledWith(mockKysely, {})
      })
    })

    describe('Error Handling', () => {
      it('should throw error for unsupported dialects', async () => {
        mockFactory.isDialectSupported.mockReturnValue(false)
        const dialect = { name: 'oracle' } as any

        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).rejects.toThrow('Unsupported database dialect: oracle')

        expect(mockFactory.isDialectSupported).toHaveBeenCalledWith('oracle')
      })

      it('should throw error when coordinator creation fails', async () => {
        mockFactory.isDialectSupported.mockReturnValue(true)
        mockFactory.createDiscoveryCoordinator.mockImplementation(() => {
          throw new Error('Failed to create coordinator')
        })
        const dialect = { name: 'postgresql' } as any

        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).rejects.toThrow('Failed to create coordinator')
      })

      it('should throw error when discovery fails', async () => {
        mockFactory.isDialectSupported.mockReturnValue(true)
        mockFactory.createDiscoveryCoordinator.mockReturnValue(mockPostgresCoordinator)
        mockPostgresCoordinator.discoverSchema.mockRejectedValue(new Error('Discovery failed'))
        const dialect = { name: 'postgresql' } as any

        await expect(
          coordinator.discoverSchema(mockKysely, {}, dialect)
        ).rejects.toThrow('Discovery failed')
      })
    })
  })

  describe('Dialect Capabilities', () => {
    it('should return capabilities for current dialect', () => {
      const mockCapabilities = {
        supportsViews: true,
        supportsIndexes: true,
        supportsConstraints: true,
        supportsForeignKeys: true,
        supportsCheckConstraints: true,
        supportsDeferredConstraints: true
      }

      mockFactory.getDialectCapabilities.mockReturnValue(mockCapabilities)
      
      // Set current dialect
      coordinator.discoverSchema(mockKysely, {}, { name: 'postgresql' } as any)
      
      const capabilities = coordinator.getDialectCapabilities()
      expect(capabilities).toEqual(mockCapabilities)
      expect(mockFactory.getDialectCapabilities).toHaveBeenCalledWith('postgresql')
    })

    it('should return capabilities for sqlite when no dialect set', () => {
      const mockCapabilities = {
        supportsViews: true,
        supportsIndexes: true,
        supportsConstraints: true,
        supportsForeignKeys: false,
        supportsCheckConstraints: true,
        supportsDeferredConstraints: false
      }

      mockFactory.getDialectCapabilities.mockReturnValue(mockCapabilities)
      
      const capabilities = coordinator.getDialectCapabilities()
      expect(capabilities).toEqual(mockCapabilities)
      expect(mockFactory.getDialectCapabilities).toHaveBeenCalledWith('sqlite')
    })
  })

  describe('Integration with Factory', () => {
    it('should use factory for dialect validation', async () => {
      mockFactory.isDialectSupported.mockReturnValue(true)
      mockFactory.createDiscoveryCoordinator.mockReturnValue(mockPostgresCoordinator)
      
      const dialect = { name: 'postgresql' } as any
      await coordinator.discoverSchema(mockKysely, {}, dialect)

      expect(mockFactory.isDialectSupported).toHaveBeenCalledWith('postgresql')
    })

    it('should use factory for coordinator creation', async () => {
      mockFactory.isDialectSupported.mockReturnValue(true)
      mockFactory.createDiscoveryCoordinator.mockReturnValue(mockPostgresCoordinator)
      
      const dialect = { name: 'postgresql' } as any
      await coordinator.discoverSchema(mockKysely, {}, dialect)

      expect(mockFactory.createDiscoveryCoordinator).toHaveBeenCalledWith('postgresql')
    })

    it('should handle factory method failures gracefully', async () => {
      mockFactory.isDialectSupported.mockImplementation(() => {
        throw new Error('Factory error')
      })

      const dialect = { name: 'postgresql' } as any
      await expect(
        coordinator.discoverSchema(mockKysely, {}, dialect)
      ).rejects.toThrow('Factory error')
    })
  })
})
