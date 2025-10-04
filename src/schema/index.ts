// Main schema discovery class
export { SchemaDiscovery } from './schema-discovery.js'

// Core Components
export { SchemaDiscoveryCoordinator } from './core/coordinators/schema-discovery.coordinator.js'
export { DiscoveryFactory } from './core/factories/discovery-factory.js'

// Core Discovery Services
export { TableMetadataDiscovery } from './core/discovery/table-metadata-discovery.js'
export { RelationshipDiscovery } from './core/discovery/relationship-discovery.js'
export { ViewDiscovery } from './core/discovery/view-discovery.js'

// Core Utilities and Types
export { TypeMapper } from './core/utils/type-mapper.js'
export { NameGenerator } from './core/utils/name-generator.js'
export * from './core/types/schema-discovery-types.js'

// PostgreSQL Dialect
export { PostgreSQLDiscoveryCoordinator } from './dialects/postgresql/postgresql-discovery.coordinator.js'
export { PostgreSQLIndexDiscovery } from './dialects/postgresql/discovery/postgresql-index-discovery.js'
export { PostgreSQLConstraintDiscovery } from './dialects/postgresql/discovery/postgresql-constraint-discovery.js'
export { PostgreSQLSchemaIntrospector } from './dialects/postgresql/introspection/postgresql-schema-introspector.js'

// SQLite Dialect
export { SQLiteDiscoveryCoordinator } from './dialects/sqlite/sqlite-discovery.coordinator.js'
export { SQLiteIndexDiscovery } from './dialects/sqlite/discovery/sqlite-index-discovery.js'
export { SQLiteConstraintDiscovery } from './dialects/sqlite/discovery/sqlite-constraint-discovery.js'
export { SQLiteSchemaIntrospector } from './dialects/sqlite/introspection/sqlite-schema-introspector.js'

// Schema Builders
export * from './builders/index.js'
