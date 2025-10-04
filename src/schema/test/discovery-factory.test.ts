import { describe, it, expect, beforeEach } from '@jest/globals'
import { DiscoveryFactory } from '../core/factories/discovery-factory.js'
import { PostgreSQLDiscoveryCoordinator } from '../dialects/postgresql/postgresql-discovery.coordinator.js'
import { SQLiteDiscoveryCoordinator } from '../dialects/sqlite/sqlite-discovery.coordinator.js'
import { PostgreSQLIndexDiscovery } from '../dialects/postgresql/discovery/postgresql-index-discovery.js'
import { SQLiteIndexDiscovery } from '../dialects/sqlite/discovery/sqlite-index-discovery.js'
import { PostgreSQLConstraintDiscovery } from '../dialects/postgresql/discovery/postgresql-constraint-discovery.js'
import { SQLiteConstraintDiscovery } from '../dialects/sqlite/discovery/sqlite-constraint-discovery.js'
import { TableMetadataDiscovery } from '../core/discovery/table-metadata-discovery.js'
import { RelationshipDiscovery } from '../core/discovery/relationship-discovery.js'
import { ViewDiscovery } from '../core/discovery/view-discovery.js'

describe('DiscoveryFactory', () => {
  let factory: DiscoveryFactory

  beforeEach(() => {
    // Reset singleton instance for each test
    ;(DiscoveryFactory as any).instance = undefined
    factory = DiscoveryFactory.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DiscoveryFactory.getInstance()
      const instance2 = DiscoveryFactory.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should maintain state across multiple calls', () => {
      const instance1 = DiscoveryFactory.getInstance()
      const instance2 = DiscoveryFactory.getInstance()
      expect(instance1.getSupportedDialects()).toEqual(instance2.getSupportedDialects())
    })
  })

  describe('Service Creation', () => {
    describe('createTableDiscovery', () => {
      it('should create TableMetadataDiscovery instance', () => {
        const discovery = factory.createTableDiscovery()
        expect(discovery).toBeInstanceOf(TableMetadataDiscovery)
      })

      it('should return singleton instance', () => {
        const discovery1 = factory.createTableDiscovery()
        const discovery2 = factory.createTableDiscovery()
        expect(discovery1).toBe(discovery2)
      })
    })

    describe('createRelationshipDiscovery', () => {
      it('should create RelationshipDiscovery instance', () => {
        const discovery = factory.createRelationshipDiscovery()
        expect(discovery).toBeInstanceOf(RelationshipDiscovery)
      })

      it('should return singleton instance', () => {
        const discovery1 = factory.createRelationshipDiscovery()
        const discovery2 = factory.createRelationshipDiscovery()
        expect(discovery1).toBe(discovery2)
      })
    })

    describe('createViewDiscovery', () => {
      it('should create ViewDiscovery instance', () => {
        const discovery = factory.createViewDiscovery()
        expect(discovery).toBeInstanceOf(ViewDiscovery)
      })

      it('should return singleton instance', () => {
        const discovery1 = factory.createViewDiscovery()
        const discovery2 = factory.createViewDiscovery()
        expect(discovery1).toBe(discovery2)
      })
    })
  })

  describe('Dialect-Specific Service Creation', () => {
    describe('createIndexDiscovery', () => {
      it('should create PostgreSQLIndexDiscovery for postgresql dialect', () => {
        const discovery = factory.createIndexDiscovery('postgresql')
        expect(discovery).toBeInstanceOf(PostgreSQLIndexDiscovery)
      })

      it('should create PostgreSQLIndexDiscovery for postgres dialect', () => {
        const discovery = factory.createIndexDiscovery('postgres')
        expect(discovery).toBeInstanceOf(PostgreSQLIndexDiscovery)
      })

      it('should create SQLiteIndexDiscovery for sqlite dialect', () => {
        const discovery = factory.createIndexDiscovery('sqlite')
        expect(discovery).toBeInstanceOf(SQLiteIndexDiscovery)
      })

      it('should handle case insensitive dialect names', () => {
        const discovery = factory.createIndexDiscovery('POSTGRESQL')
        expect(discovery).toBeInstanceOf(PostgreSQLIndexDiscovery)
      })

      it('should throw error for unsupported dialects', () => {
        expect(() => factory.createIndexDiscovery('mysql')).toThrow('MySQL index discovery not yet implemented')
        expect(() => factory.createIndexDiscovery('mssql')).toThrow('MSSQL index discovery not yet implemented')
        expect(() => factory.createIndexDiscovery('oracle')).toThrow('Unsupported dialect for index discovery: oracle')
      })
    })

    describe('createConstraintDiscovery', () => {
      it('should create PostgreSQLConstraintDiscovery for postgresql dialect', () => {
        const discovery = factory.createConstraintDiscovery('postgresql')
        expect(discovery).toBeInstanceOf(PostgreSQLConstraintDiscovery)
      })

      it('should create PostgreSQLConstraintDiscovery for postgres dialect', () => {
        const discovery = factory.createConstraintDiscovery('postgres')
        expect(discovery).toBeInstanceOf(PostgreSQLConstraintDiscovery)
      })

      it('should create SQLiteConstraintDiscovery for sqlite dialect', () => {
        const discovery = factory.createConstraintDiscovery('sqlite')
        expect(discovery).toBeInstanceOf(SQLiteConstraintDiscovery)
      })

      it('should handle case insensitive dialect names', () => {
        const discovery = factory.createConstraintDiscovery('SQLITE')
        expect(discovery).toBeInstanceOf(SQLiteConstraintDiscovery)
      })

      it('should throw error for unsupported dialects', () => {
        expect(() => factory.createConstraintDiscovery('mysql')).toThrow('MySQL constraint discovery not yet implemented')
        expect(() => factory.createConstraintDiscovery('mssql')).toThrow('MSSQL constraint discovery not yet implemented')
        expect(() => factory.createConstraintDiscovery('oracle')).toThrow('Unsupported dialect for constraint discovery: oracle')
      })
    })

    describe('createDiscoveryCoordinator', () => {
      it('should create PostgreSQLDiscoveryCoordinator for postgresql dialect', () => {
        const coordinator = factory.createDiscoveryCoordinator('postgresql')
        expect(coordinator).toBeInstanceOf(PostgreSQLDiscoveryCoordinator)
      })

      it('should create PostgreSQLDiscoveryCoordinator for postgres dialect', () => {
        const coordinator = factory.createDiscoveryCoordinator('postgres')
        expect(coordinator).toBeInstanceOf(PostgreSQLDiscoveryCoordinator)
      })

      it('should create SQLiteDiscoveryCoordinator for sqlite dialect', () => {
        const coordinator = factory.createDiscoveryCoordinator('sqlite')
        expect(coordinator).toBeInstanceOf(SQLiteDiscoveryCoordinator)
      })

      it('should handle case insensitive dialect names', () => {
        const coordinator = factory.createDiscoveryCoordinator('POSTGRESQL')
        expect(coordinator).toBeInstanceOf(PostgreSQLDiscoveryCoordinator)
      })

      it('should throw error for unsupported dialects', () => {
        expect(() => factory.createDiscoveryCoordinator('mysql')).toThrow('MySQL discovery coordinator not yet implemented')
        expect(() => factory.createDiscoveryCoordinator('mssql')).toThrow('MSSQL discovery coordinator not yet implemented')
        expect(() => factory.createDiscoveryCoordinator('oracle')).toThrow('Unsupported dialect for discovery coordinator: oracle')
      })
    })
  })

  describe('createDiscoveryServices', () => {
    it('should create all discovery services for postgresql', () => {
      const services = factory.createDiscoveryServices('postgresql')
      
      expect(services.tableDiscovery).toBeInstanceOf(TableMetadataDiscovery)
      expect(services.relationshipDiscovery).toBeInstanceOf(RelationshipDiscovery)
      expect(services.viewDiscovery).toBeInstanceOf(ViewDiscovery)
      expect(services.indexDiscovery).toBeInstanceOf(PostgreSQLIndexDiscovery)
      expect(services.constraintDiscovery).toBeInstanceOf(PostgreSQLConstraintDiscovery)
    })

    it('should create all discovery services for sqlite', () => {
      const services = factory.createDiscoveryServices('sqlite')
      
      expect(services.tableDiscovery).toBeInstanceOf(TableMetadataDiscovery)
      expect(services.relationshipDiscovery).toBeInstanceOf(RelationshipDiscovery)
      expect(services.viewDiscovery).toBeInstanceOf(ViewDiscovery)
      expect(services.indexDiscovery).toBeInstanceOf(SQLiteIndexDiscovery)
      expect(services.constraintDiscovery).toBeInstanceOf(SQLiteConstraintDiscovery)
    })

    it('should throw error for unsupported dialects', () => {
      expect(() => factory.createDiscoveryServices('mysql')).toThrow('MySQL index discovery not yet implemented')
    })
  })

  describe('Dialect Support', () => {
    describe('getSupportedDialects', () => {
      it('should return supported dialects', () => {
        const dialects = factory.getSupportedDialects()
        expect(dialects).toEqual(['postgresql', 'postgres', 'sqlite'])
      })
    })

    describe('isDialectSupported', () => {
      it('should return true for supported dialects', () => {
        expect(factory.isDialectSupported('postgresql')).toBe(true)
        expect(factory.isDialectSupported('postgres')).toBe(true)
        expect(factory.isDialectSupported('sqlite')).toBe(true)
      })

      it('should handle case insensitive dialect names', () => {
        expect(factory.isDialectSupported('POSTGRESQL')).toBe(true)
        expect(factory.isDialectSupported('PostgreSQL')).toBe(true)
        expect(factory.isDialectSupported('SQLITE')).toBe(true)
      })

      it('should return false for unsupported dialects', () => {
        expect(factory.isDialectSupported('mysql')).toBe(false)
        expect(factory.isDialectSupported('mssql')).toBe(false)
        expect(factory.isDialectSupported('oracle')).toBe(false)
      })
    })
  })

  describe('Dialect Capabilities', () => {
    describe('getDialectCapabilities', () => {
      it('should return PostgreSQL capabilities', () => {
        const capabilities = factory.getDialectCapabilities('postgresql')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: true
        })
      })

      it('should return SQLite capabilities', () => {
        const capabilities = factory.getDialectCapabilities('sqlite')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: false
        })
      })

      it('should return MySQL capabilities', () => {
        const capabilities = factory.getDialectCapabilities('mysql')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: false
        })
      })

      it('should return MSSQL capabilities', () => {
        const capabilities = factory.getDialectCapabilities('mssql')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: true
        })
      })

      it('should return default capabilities for unknown dialects', () => {
        const capabilities = factory.getDialectCapabilities('oracle')
        
        expect(capabilities).toEqual({
          supportsViews: false,
          supportsIndexes: false,
          supportsConstraints: false,
          supportsForeignKeys: false,
          supportsCheckConstraints: false,
          supportsDeferredConstraints: false
        })
      })

      it('should handle case insensitive dialect names', () => {
        const capabilities = factory.getDialectCapabilities('POSTGRESQL')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: true
        })
      })
    })
  })
})
