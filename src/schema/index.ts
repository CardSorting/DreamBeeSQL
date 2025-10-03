// Main schema discovery class
export { SchemaDiscovery } from './schema-discovery.js'

// Coordinator for advanced operations
export { SchemaDiscoveryCoordinator } from './schema-discovery.coordinator.js'

// Factory
export { DiscoveryFactory } from './factories/discovery-factory.js'

// Discovery Services
export { TableMetadataDiscovery } from './discovery/table/table-metadata-discovery.js'
export { RelationshipDiscovery } from './discovery/relationship/relationship-discovery.js'
export { ViewDiscovery } from './discovery/view/view-discovery.js'

// Database-specific Index Discovery
export { PostgreSQLIndexDiscovery } from './discovery/index/postgresql-index-discovery.js'
export { SQLiteIndexDiscovery } from './discovery/index/sqlite-index-discovery.js'

// Database-specific Constraint Discovery
export { PostgreSQLConstraintDiscovery } from './discovery/constraint/postgresql-constraint-discovery.js'
export { SQLiteConstraintDiscovery } from './discovery/constraint/sqlite-constraint-discovery.js'

// Utilities
export { TypeMapper } from './utils/type-mapper.js'
export { NameGenerator } from './utils/name-generator.js'

// Types
export * from './types/schema-discovery-types.js'
