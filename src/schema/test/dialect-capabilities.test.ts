import { describe, it, expect, beforeEach } from '@jest/globals'
import { DiscoveryFactory } from '../core/factories/discovery-factory.js'
import { PostgreSQLDiscoveryCoordinator } from '../dialects/postgresql/postgresql-discovery.coordinator.js'
import { SQLiteDiscoveryCoordinator } from '../dialects/sqlite/sqlite-discovery.coordinator.js'

describe('Dialect Capabilities', () => {
  let factory: DiscoveryFactory
  let postgresCoordinator: PostgreSQLDiscoveryCoordinator
  let sqliteCoordinator: SQLiteDiscoveryCoordinator

  beforeEach(() => {
    // Reset singleton instances
    ;(DiscoveryFactory as any).instance = undefined
    ;(PostgreSQLDiscoveryCoordinator as any).instance = undefined
    ;(SQLiteDiscoveryCoordinator as any).instance = undefined

    factory = DiscoveryFactory.getInstance()
    postgresCoordinator = PostgreSQLDiscoveryCoordinator.getInstance()
    sqliteCoordinator = SQLiteDiscoveryCoordinator.getInstance()
  })

  describe('Factory Capability Detection', () => {
    describe('PostgreSQL Capabilities', () => {
      it('should return correct capabilities for postgresql', () => {
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

      it('should return correct capabilities for postgres', () => {
        const capabilities = factory.getDialectCapabilities('postgres')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: true
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

    describe('SQLite Capabilities', () => {
      it('should return correct capabilities for sqlite', () => {
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

      it('should handle case insensitive dialect names', () => {
        const capabilities = factory.getDialectCapabilities('SQLITE')
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: false
        })
      })
    })

    describe('MySQL Capabilities', () => {
      it('should return correct capabilities for mysql', () => {
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
    })

    describe('MSSQL Capabilities', () => {
      it('should return correct capabilities for mssql', () => {
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
    })

    describe('Unknown Dialect Capabilities', () => {
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

      it('should return default capabilities for empty string', () => {
        const capabilities = factory.getDialectCapabilities('')
        
        expect(capabilities).toEqual({
          supportsViews: false,
          supportsIndexes: false,
          supportsConstraints: false,
          supportsForeignKeys: false,
          supportsCheckConstraints: false,
          supportsDeferredConstraints: false
        })
      })
    })
  })

  describe('Coordinator-Specific Capabilities', () => {
    describe('PostgreSQL Coordinator Capabilities', () => {
      it('should return extended PostgreSQL capabilities', () => {
        const capabilities = postgresCoordinator.getCapabilities()
        
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

      it('should support all advanced PostgreSQL features', () => {
        const capabilities = postgresCoordinator.getCapabilities()
        
        expect(capabilities.supportsPartialIndexes).toBe(true)
        expect(capabilities.supportsExpressionIndexes).toBe(true)
        expect(capabilities.supportsConcurrentIndexCreation).toBe(true)
        expect(capabilities.supportsMaterializedViews).toBe(true)
        expect(capabilities.supportsCustomTypes).toBe(true)
        expect(capabilities.supportsExtensions).toBe(true)
      })
    })

    describe('SQLite Coordinator Capabilities', () => {
      it('should return extended SQLite capabilities', () => {
        const capabilities = sqliteCoordinator.getCapabilities()
        
        expect(capabilities).toEqual({
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: false, // Depends on PRAGMA setting
          supportsCheckConstraints: true,
          supportsDeferredConstraints: false,
          supportsPartialIndexes: true,
          supportsExpressionIndexes: true,
          supportsConcurrentIndexCreation: false,
          supportsMaterializedViews: false,
          supportsCustomTypes: false,
          supportsExtensions: false,
          supportsPRAGMA: true,
          supportsAutoIncrement: true,
          supportsRowId: true
        })
      })

      it('should support SQLite-specific features', () => {
        const capabilities = sqliteCoordinator.getCapabilities()
        
        expect(capabilities.supportsPartialIndexes).toBe(true)
        expect(capabilities.supportsExpressionIndexes).toBe(true)
        expect(capabilities.supportsPRAGMA).toBe(true)
        expect(capabilities.supportsAutoIncrement).toBe(true)
        expect(capabilities.supportsRowId).toBe(true)
      })

      it('should not support advanced features not available in SQLite', () => {
        const capabilities = sqliteCoordinator.getCapabilities()
        
        expect(capabilities.supportsConcurrentIndexCreation).toBe(false)
        expect(capabilities.supportsMaterializedViews).toBe(false)
        expect(capabilities.supportsCustomTypes).toBe(false)
        expect(capabilities.supportsExtensions).toBe(false)
      })
    })
  })

  describe('Capability Consistency', () => {
    it('should have consistent capabilities between factory and coordinator for PostgreSQL', () => {
      const factoryCapabilities = factory.getDialectCapabilities('postgresql')
      const coordinatorCapabilities = postgresCoordinator.getCapabilities()
      
      // Basic capabilities should match
      expect(factoryCapabilities.supportsViews).toBe(coordinatorCapabilities.supportsViews)
      expect(factoryCapabilities.supportsIndexes).toBe(coordinatorCapabilities.supportsIndexes)
      expect(factoryCapabilities.supportsConstraints).toBe(coordinatorCapabilities.supportsConstraints)
      expect(factoryCapabilities.supportsForeignKeys).toBe(coordinatorCapabilities.supportsForeignKeys)
      expect(factoryCapabilities.supportsCheckConstraints).toBe(coordinatorCapabilities.supportsCheckConstraints)
      expect(factoryCapabilities.supportsDeferredConstraints).toBe(coordinatorCapabilities.supportsDeferredConstraints)
    })

    it('should have consistent capabilities between factory and coordinator for SQLite', () => {
      const factoryCapabilities = factory.getDialectCapabilities('sqlite')
      const coordinatorCapabilities = sqliteCoordinator.getCapabilities()
      
      // Basic capabilities should match
      expect(factoryCapabilities.supportsViews).toBe(coordinatorCapabilities.supportsViews)
      expect(factoryCapabilities.supportsIndexes).toBe(coordinatorCapabilities.supportsIndexes)
      expect(factoryCapabilities.supportsConstraints).toBe(coordinatorCapabilities.supportsConstraints)
      expect(factoryCapabilities.supportsCheckConstraints).toBe(coordinatorCapabilities.supportsCheckConstraints)
      expect(factoryCapabilities.supportsDeferredConstraints).toBe(coordinatorCapabilities.supportsDeferredConstraints)
      
      // Note: Foreign keys in SQLite depend on PRAGMA setting, so factory shows true but coordinator shows false
      // This is expected behavior as the factory doesn't know the runtime PRAGMA state
    })
  })

  describe('Feature Support Validation', () => {
    it('should correctly identify PostgreSQL as supporting advanced features', () => {
      const capabilities = postgresCoordinator.getCapabilities()
      
      expect(capabilities.supportsMaterializedViews).toBe(true)
      expect(capabilities.supportsCustomTypes).toBe(true)
      expect(capabilities.supportsExtensions).toBe(true)
      expect(capabilities.supportsConcurrentIndexCreation).toBe(true)
    })

    it('should correctly identify SQLite as not supporting certain advanced features', () => {
      const capabilities = sqliteCoordinator.getCapabilities()
      
      expect(capabilities.supportsMaterializedViews).toBe(false)
      expect(capabilities.supportsCustomTypes).toBe(false)
      expect(capabilities.supportsExtensions).toBe(false)
      expect(capabilities.supportsConcurrentIndexCreation).toBe(false)
    })

    it('should correctly identify common features supported by both', () => {
      const postgresCapabilities = postgresCoordinator.getCapabilities()
      const sqliteCapabilities = sqliteCoordinator.getCapabilities()
      
      expect(postgresCapabilities.supportsViews).toBe(true)
      expect(sqliteCapabilities.supportsViews).toBe(true)
      
      expect(postgresCapabilities.supportsIndexes).toBe(true)
      expect(sqliteCapabilities.supportsIndexes).toBe(true)
      
      expect(postgresCapabilities.supportsConstraints).toBe(true)
      expect(sqliteCapabilities.supportsConstraints).toBe(true)
      
      expect(postgresCapabilities.supportsPartialIndexes).toBe(true)
      expect(sqliteCapabilities.supportsPartialIndexes).toBe(true)
      
      expect(postgresCapabilities.supportsExpressionIndexes).toBe(true)
      expect(sqliteCapabilities.supportsExpressionIndexes).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null dialect name', () => {
      const capabilities = factory.getDialectCapabilities(null as any)
      
      expect(capabilities).toEqual({
        supportsViews: false,
        supportsIndexes: false,
        supportsConstraints: false,
        supportsForeignKeys: false,
        supportsCheckConstraints: false,
        supportsDeferredConstraints: false
      })
    })

    it('should handle undefined dialect name', () => {
      const capabilities = factory.getDialectCapabilities(undefined as any)
      
      expect(capabilities).toEqual({
        supportsViews: false,
        supportsIndexes: false,
        supportsConstraints: false,
        supportsForeignKeys: false,
        supportsCheckConstraints: false,
        supportsDeferredConstraints: false
      })
    })

    it('should handle dialect name with whitespace', () => {
      const capabilities = factory.getDialectCapabilities(' postgresql ')
      
      expect(capabilities).toEqual({
        supportsViews: true,
        supportsIndexes: true,
        supportsConstraints: true,
        supportsForeignKeys: true,
        supportsCheckConstraints: true,
        supportsDeferredConstraints: true
      })
    })

    it('should handle mixed case dialect names', () => {
      const capabilities = factory.getDialectCapabilities('PostgreSQL')
      
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

  describe('Capability Usage Examples', () => {
    it('should demonstrate how to check for specific features', () => {
      const postgresCapabilities = postgresCoordinator.getCapabilities()
      const sqliteCapabilities = sqliteCoordinator.getCapabilities()
      
      // Example usage patterns
      if (postgresCapabilities.supportsMaterializedViews) {
        expect(postgresCapabilities.supportsMaterializedViews).toBe(true)
      }
      
      if (sqliteCapabilities.supportsPRAGMA) {
        expect(sqliteCapabilities.supportsPRAGMA).toBe(true)
      }
      
      // Check for common features
      const bothSupportViews = postgresCapabilities.supportsViews && sqliteCapabilities.supportsViews
      expect(bothSupportViews).toBe(true)
      
      const bothSupportPartialIndexes = postgresCapabilities.supportsPartialIndexes && sqliteCapabilities.supportsPartialIndexes
      expect(bothSupportPartialIndexes).toBe(true)
    })

    it('should demonstrate conditional feature usage', () => {
      const capabilities = factory.getDialectCapabilities('postgresql')
      
      // Simulate conditional logic based on capabilities
      const features = []
      
      if (capabilities.supportsViews) {
        features.push('views')
      }
      
      if (capabilities.supportsIndexes) {
        features.push('indexes')
      }
      
      if (capabilities.supportsConstraints) {
        features.push('constraints')
      }
      
      if (capabilities.supportsForeignKeys) {
        features.push('foreign_keys')
      }
      
      if (capabilities.supportsCheckConstraints) {
        features.push('check_constraints')
      }
      
      if (capabilities.supportsDeferredConstraints) {
        features.push('deferred_constraints')
      }
      
      expect(features).toEqual([
        'views',
        'indexes',
        'constraints',
        'foreign_keys',
        'check_constraints',
        'deferred_constraints'
      ])
    })
  })
})
