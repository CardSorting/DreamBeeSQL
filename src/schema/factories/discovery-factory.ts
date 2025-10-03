import type { Kysely } from '../../kysely.js'
import type { Dialect } from '../../dialect/dialect.js'
import { TableMetadataDiscovery } from '../discovery/table/table-metadata-discovery.js'
import { RelationshipDiscovery } from '../discovery/relationship/relationship-discovery.js'
import { ViewDiscovery } from '../discovery/view/view-discovery.js'
import { PostgreSQLIndexDiscovery } from '../discovery/index/postgresql-index-discovery.js'
import { SQLiteIndexDiscovery } from '../discovery/index/sqlite-index-discovery.js'
import { PostgreSQLConstraintDiscovery } from '../discovery/constraint/postgresql-constraint-discovery.js'
import { SQLiteConstraintDiscovery } from '../discovery/constraint/sqlite-constraint-discovery.js'

/**
 * Factory for creating database-specific discovery services
 */
export class DiscoveryFactory {
  private static instance: DiscoveryFactory

  static getInstance(): DiscoveryFactory {
    if (!DiscoveryFactory.instance) {
      DiscoveryFactory.instance = new DiscoveryFactory()
    }
    return DiscoveryFactory.instance
  }

  /**
   * Create table discovery service
   */
  createTableDiscovery(): TableMetadataDiscovery {
    return TableMetadataDiscovery.getInstance()
  }

  /**
   * Create relationship discovery service
   */
  createRelationshipDiscovery(): RelationshipDiscovery {
    return RelationshipDiscovery.getInstance()
  }

  /**
   * Create view discovery service
   */
  createViewDiscovery(): ViewDiscovery {
    return ViewDiscovery.getInstance()
  }

  /**
   * Create index discovery service based on dialect
   */
  createIndexDiscovery(dialect: string): PostgreSQLIndexDiscovery | SQLiteIndexDiscovery {
    switch (dialect.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        return PostgreSQLIndexDiscovery.getInstance()
      case 'sqlite':
        return SQLiteIndexDiscovery.getInstance()
      case 'mysql':
        // TODO: Implement MySQL index discovery
        throw new Error('MySQL index discovery not yet implemented')
      case 'mssql':
        // TODO: Implement MSSQL index discovery
        throw new Error('MSSQL index discovery not yet implemented')
      default:
        throw new Error(`Unsupported dialect for index discovery: ${dialect}`)
    }
  }

  /**
   * Create constraint discovery service based on dialect
   */
  createConstraintDiscovery(dialect: string): PostgreSQLConstraintDiscovery | SQLiteConstraintDiscovery {
    switch (dialect.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        return PostgreSQLConstraintDiscovery.getInstance()
      case 'sqlite':
        return SQLiteConstraintDiscovery.getInstance()
      case 'mysql':
        // TODO: Implement MySQL constraint discovery
        throw new Error('MySQL constraint discovery not yet implemented')
      case 'mssql':
        // TODO: Implement MSSQL constraint discovery
        throw new Error('MSSQL constraint discovery not yet implemented')
      default:
        throw new Error(`Unsupported dialect for constraint discovery: ${dialect}`)
    }
  }

  /**
   * Create all discovery services for a specific dialect
   */
  createDiscoveryServices(dialect: string): {
    tableDiscovery: TableMetadataDiscovery
    relationshipDiscovery: RelationshipDiscovery
    viewDiscovery: ViewDiscovery
    indexDiscovery: PostgreSQLIndexDiscovery | SQLiteIndexDiscovery
    constraintDiscovery: PostgreSQLConstraintDiscovery | SQLiteConstraintDiscovery
  } {
    return {
      tableDiscovery: this.createTableDiscovery(),
      relationshipDiscovery: this.createRelationshipDiscovery(),
      viewDiscovery: this.createViewDiscovery(),
      indexDiscovery: this.createIndexDiscovery(dialect),
      constraintDiscovery: this.createConstraintDiscovery(dialect)
    }
  }

  /**
   * Get supported dialects
   */
  getSupportedDialects(): string[] {
    return ['postgresql', 'postgres', 'sqlite']
  }

  /**
   * Check if a dialect is supported
   */
  isDialectSupported(dialect: string): boolean {
    return this.getSupportedDialects().includes(dialect.toLowerCase())
  }

  /**
   * Get dialect-specific capabilities
   */
  getDialectCapabilities(dialect: string): {
    supportsViews: boolean
    supportsIndexes: boolean
    supportsConstraints: boolean
    supportsForeignKeys: boolean
    supportsCheckConstraints: boolean
    supportsDeferredConstraints: boolean
  } {
    switch (dialect.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        return {
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: true
        }
      case 'sqlite':
        return {
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: false
        }
      case 'mysql':
        return {
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: false
        }
      case 'mssql':
        return {
          supportsViews: true,
          supportsIndexes: true,
          supportsConstraints: true,
          supportsForeignKeys: true,
          supportsCheckConstraints: true,
          supportsDeferredConstraints: true
        }
      default:
        return {
          supportsViews: false,
          supportsIndexes: false,
          supportsConstraints: false,
          supportsForeignKeys: false,
          supportsCheckConstraints: false,
          supportsDeferredConstraints: false
        }
    }
  }
}
