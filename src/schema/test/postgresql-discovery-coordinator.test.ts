import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PostgreSQLDiscoveryCoordinator } from '../dialects/postgresql/postgresql-discovery.coordinator.js'
import { TableMetadataDiscovery } from '../core/discovery/table-metadata-discovery.js'
import { RelationshipDiscovery } from '../core/discovery/relationship-discovery.js'
import { ViewDiscovery } from '../core/discovery/view-discovery.js'
import { PostgreSQLIndexDiscovery } from '../dialects/postgresql/discovery/postgresql-index-discovery.js'
import { PostgreSQLConstraintDiscovery } from '../dialects/postgresql/discovery/postgresql-constraint-discovery.js'

// Mock Kysely
const mockKysely = {
  selectFrom: jest.fn(),
  select: jest.fn(),
  execute: jest.fn()
} as any

// Mock DatabaseIntrospector
jest.mock('../../../dialect/database-introspector.js', () => ({
  DatabaseIntrospector: jest.fn().mockImplementation(() => ({
    getTables: jest.fn(),
    getTableMetadata: jest.fn(),
    getViews: jest.fn()
  }))
}))

const mockTableData = [
  {
    name: 'users',
    schema: 'public',
    columns: [
      { name: 'id', type: 'integer', isPrimaryKey: true, isNullable: false },
      { name: 'email', type: 'varchar(255)', isNullable: false },
      { name: 'created_at', type: 'timestamp', isNullable: false }
    ],
    primaryKey: ['id']
  },
  {
    name: 'posts',
    schema: 'public',
    columns: [
      { name: 'id', type: 'integer', isPrimaryKey: true, isNullable: false },
      { name: 'user_id', type: 'integer', isNullable: false },
      { name: 'title', type: 'varchar(255)', isNullable: false }
    ],
    primaryKey: ['id']
  }
]

const mockIndexData = [
  {
    name: 'users_email_idx',
    columns: ['email'],
    unique: true,
    isPrimary: false,
    valid: true,
    definition: 'CREATE UNIQUE INDEX users_email_idx ON users(email)',
    comment: 'Email index for users table'
  },
  {
    name: 'posts_user_id_idx',
    columns: ['user_id'],
    unique: false,
    isPrimary: false,
    valid: true,
    definition: 'CREATE INDEX posts_user_id_idx ON posts(user_id)',
    comment: null
  }
]

const mockConstraintData = [
  {
    name: 'users_email_check',
    type: 'CHECK',
    definition: 'email ~ \'^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$\'',
    valid: true
  }
]

const mockForeignKeyData = [
  {
    name: 'posts_user_id_fkey',
    column: 'user_id',
    referencedTable: 'users',
    referencedColumn: 'id',
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
    deferrable: false,
    deferred: false
  }
]

const mockViewData = [
  {
    name: 'user_posts_view',
    schema: 'public',
    definition: 'SELECT u.email, p.title FROM users u JOIN posts p ON u.id = p.user_id',
    columns: [
      { name: 'email', type: 'varchar(255)' },
      { name: 'title', type: 'varchar(255)' }
    ]
  }
]

const mockRelationshipData = [
  {
    fromTable: 'posts',
    fromColumn: 'user_id',
    toTable: 'users',
    toColumn: 'id',
    type: 'many-to-one'
  }
]

describe('PostgreSQLDiscoveryCoordinator', () => {
  let coordinator: PostgreSQLDiscoveryCoordinator
  let mockTableDiscovery: jest.Mocked<TableMetadataDiscovery>
  let mockRelationshipDiscovery: jest.Mocked<RelationshipDiscovery>
  let mockViewDiscovery: jest.Mocked<ViewDiscovery>
  let mockIndexDiscovery: jest.Mocked<PostgreSQLIndexDiscovery>
  let mockConstraintDiscovery: jest.Mocked<PostgreSQLConstraintDiscovery>

  beforeEach(() => {
    // Reset singleton instance
    ;(PostgreSQLDiscoveryCoordinator as any).instance = undefined

    // Create mocks
    mockTableDiscovery = {
      discoverTables: jest.fn().mockResolvedValue(mockTableData)
    } as any

    mockRelationshipDiscovery = {
      discoverRelationships: jest.fn().mockResolvedValue(mockRelationshipData)
    } as any

    mockViewDiscovery = {
      discoverViews: jest.fn().mockResolvedValue(mockViewData)
    } as any

    mockIndexDiscovery = {
      discoverTableIndexes: jest.fn().mockResolvedValue(mockIndexData),
      getIndexUsageStats: jest.fn().mockResolvedValue({}),
      analyzeIndexEfficiency: jest.fn().mockReturnValue({
        recommendations: ['Consider adding index on frequently queried columns']
      })
    } as any

    mockConstraintDiscovery = {
      discoverTableConstraints: jest.fn().mockResolvedValue(mockConstraintData),
      discoverForeignKeyConstraints: jest.fn().mockResolvedValue(mockForeignKeyData),
      analyzeConstraintPerformance: jest.fn().mockReturnValue({
        recommendations: ['Consider optimizing constraint definitions']
      })
    } as any

    // Mock static methods
    jest.spyOn(TableMetadataDiscovery, 'getInstance').mockReturnValue(mockTableDiscovery)
    jest.spyOn(RelationshipDiscovery, 'getInstance').mockReturnValue(mockRelationshipDiscovery)
    jest.spyOn(ViewDiscovery, 'getInstance').mockReturnValue(mockViewDiscovery)
    jest.spyOn(PostgreSQLIndexDiscovery, 'getInstance').mockReturnValue(mockIndexDiscovery)
    jest.spyOn(PostgreSQLConstraintDiscovery, 'getInstance').mockReturnValue(mockConstraintDiscovery)

    coordinator = PostgreSQLDiscoveryCoordinator.getInstance()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PostgreSQLDiscoveryCoordinator.getInstance()
      const instance2 = PostgreSQLDiscoveryCoordinator.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should maintain state across multiple calls', () => {
      const instance1 = PostgreSQLDiscoveryCoordinator.getInstance()
      const instance2 = PostgreSQLDiscoveryCoordinator.getInstance()
      expect(instance1.getCapabilities()).toEqual(instance2.getCapabilities())
    })
  })

  describe('Schema Discovery', () => {
    it('should discover complete PostgreSQL schema', async () => {
      const config = { includeViews: true, excludeTables: ['temp_*'] }

      const result = await coordinator.discoverSchema(mockKysely, config)

      expect(mockTableDiscovery.discoverTables).toHaveBeenCalled()
      expect(mockIndexDiscovery.discoverTableIndexes).toHaveBeenCalledTimes(2) // users and posts tables
      expect(mockConstraintDiscovery.discoverTableConstraints).toHaveBeenCalledTimes(2)
      expect(mockConstraintDiscovery.discoverForeignKeyConstraints).toHaveBeenCalledTimes(2)
      expect(mockRelationshipDiscovery.discoverRelationships).toHaveBeenCalled()
      expect(mockViewDiscovery.discoverViews).toHaveBeenCalled()

      expect(result.tables).toHaveLength(2)
      expect(result.relationships).toEqual(mockRelationshipData)
      expect(result.views).toHaveLength(1)
    })

    it('should enhance tables with PostgreSQL-specific metadata', async () => {
      const result = await coordinator.discoverSchema(mockKysely, {})

      expect(result.tables[0]).toMatchObject({
        name: 'users',
        indexes: expect.arrayContaining([
          expect.objectContaining({
            name: 'users_email_idx',
            columns: ['email'],
            unique: true,
            valid: true,
            comment: 'Email index for users table'
          })
        ]),
        constraints: mockConstraintData,
        foreignKeys: expect.arrayContaining([
          expect.objectContaining({
            name: 'posts_user_id_fkey',
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
            onDelete: 'CASCADE',
            deferrable: false
          })
        ])
      })
    })

    it('should skip views when includeViews is false', async () => {
      const config = { includeViews: false }

      await coordinator.discoverSchema(mockKysely, config)

      expect(mockViewDiscovery.discoverViews).not.toHaveBeenCalled()
    })

    it('should handle table discovery errors gracefully', async () => {
      mockIndexDiscovery.discoverTableIndexes.mockRejectedValue(new Error('Index discovery failed'))

      // Should not throw, but log warning and continue with basic table data
      const result = await coordinator.discoverSchema(mockKysely, {})

      expect(result.tables).toHaveLength(2)
      expect(result.tables[0]).toMatchObject({
        name: 'users',
        indexes: [], // Should be empty due to error
        foreignKeys: []
      })

      mockConstraintDiscovery.discoverTableConstraints.mockRejectedValue(new Error('Constraint discovery failed'))

      const result2 = await coordinator.discoverSchema(mockKysely, {})

      expect(result2.tables).toHaveLength(2)
      expect(result2.tables[0].foreignKeys).toEqual([])
    })
  })

  describe('Capabilities', () => {
    it('should return PostgreSQL-specific capabilities', () => {
      const capabilities = coordinator.getCapabilities()

      expect(capabilities).toEqual({
        supportsViews: true,
        supportsIndexes: true,
        supportsConstraints: true,
        supportsForeignKeys: true,
        supportsCheckConstraints: true,
        supportsDeferredConstraints: true,
        supportsPartialIndexes: true,
        supportsExpressionIndexes: true,
        supportsConcurrentIndexCreation: true,
        supportsMaterializedViews: true,
        supportsCustomTypes: true,
        supportsExtensions: true
      })
    })
  })

  describe('Recommendations', () => {
    it('should provide PostgreSQL-specific recommendations', async () => {
      const tables = [
        { name: 'users', indexes: [], foreignKeys: [] },
        { name: 'posts', indexes: [], foreignKeys: [] }
      ]

      const recommendations = await coordinator.getRecommendations(mockKysely, tables)

      expect(mockIndexDiscovery.discoverTableIndexes).toHaveBeenCalledTimes(2)
      expect(mockIndexDiscovery.getIndexUsageStats).toHaveBeenCalledTimes(2)
      expect(mockIndexDiscovery.analyzeIndexEfficiency).toHaveBeenCalledTimes(2)
      expect(mockConstraintDiscovery.discoverTableConstraints).toHaveBeenCalledTimes(2)
      expect(mockConstraintDiscovery.analyzeConstraintPerformance).toHaveBeenCalledTimes(2)

      expect(recommendations).toEqual([
        'Consider adding index on frequently queried columns',
        'Consider adding index on frequently queried columns',
        'Consider optimizing constraint definitions',
        'Consider optimizing constraint definitions'
      ])
    })

    it('should handle recommendation errors gracefully', async () => {
      mockIndexDiscovery.discoverTableIndexes.mockRejectedValue(new Error('Index analysis failed'))
      const tables = [{ name: 'users', indexes: [], foreignKeys: [] }]

      const recommendations = await coordinator.getRecommendations(mockKysely, tables)

      expect(recommendations).toEqual([]) // Should return empty array on error
    })

    it('should handle empty tables array', async () => {
      const recommendations = await coordinator.getRecommendations(mockKysely, [])

      expect(recommendations).toEqual([])
      expect(mockIndexDiscovery.discoverTableIndexes).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle table discovery failures', async () => {
      mockTableDiscovery.discoverTables.mockRejectedValue(new Error('Table discovery failed'))

      await expect(
        coordinator.discoverSchema(mockKysely, {})
      ).rejects.toThrow('Table discovery failed')
    })

    it('should handle relationship discovery failures', async () => {
      mockRelationshipDiscovery.discoverRelationships.mockRejectedValue(new Error('Relationship discovery failed'))

      await expect(
        coordinator.discoverSchema(mockKysely, {})
      ).rejects.toThrow('Relationship discovery failed')
    })

    it('should handle view discovery failures when views are requested', async () => {
      mockViewDiscovery.discoverViews.mockRejectedValue(new Error('View discovery failed'))
      const config = { includeViews: true }

      await expect(
        coordinator.discoverSchema(mockKysely, config)
      ).rejects.toThrow('View discovery failed')
    })

    it('should handle partial enhancement failures', async () => {
      // Mock successful table discovery but failed index discovery for one table
      mockIndexDiscovery.discoverTableIndexes
        .mockResolvedValueOnce(mockIndexData) // First call succeeds
        .mockRejectedValueOnce(new Error('Index discovery failed')) // Second call fails

      const result = await coordinator.discoverSchema(mockKysely, {})

      expect(result.tables).toHaveLength(2)
      expect(result.tables[0].indexes).toEqual(mockIndexData) // First table enhanced
      expect(result.tables[1].indexes).toEqual([]) // Second table not enhanced due to error
    })
  })

  describe('Configuration Handling', () => {
    it('should pass configuration to table discovery', async () => {
      const config = { 
        excludeTables: ['temp_*'], 
        includeViews: true,
        customTypeMappings: { 'uuid': 'string' }
      }

      await coordinator.discoverSchema(mockKysely, config)

      expect(mockTableDiscovery.discoverTables).toHaveBeenCalledWith(
        expect.any(Object), // DatabaseIntrospector
        {
          excludeTables: ['temp_*'],
          includeViews: true,
          customTypeMappings: { 'uuid': 'string' }
        }
      )
    })

    it('should use default configuration when none provided', async () => {
      await coordinator.discoverSchema(mockKysely)

      expect(mockTableDiscovery.discoverTables).toHaveBeenCalledWith(
        expect.any(Object),
        {
          excludeTables: undefined,
          includeViews: undefined,
          customTypeMappings: undefined
        }
      )
    })
  })
})
