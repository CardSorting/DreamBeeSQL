import type { Kysely } from '../kysely.js'
import { DatabaseIntrospector } from '../dialect/database-introspector.js'
import { SchemaInfo, IntrospectionConfig } from '../types/index.js'
import type { Dialect } from '../dialect/dialect.js'
import { SchemaDiscoveryConfig } from './types/schema-discovery-types.js'
import { DiscoveryFactory } from './factories/discovery-factory.js'

/**
 * Central coordinator for schema discovery operations
 * Uses factory pattern to create database-specific discovery services
 */
export class SchemaDiscoveryCoordinator {
  private static instance: SchemaDiscoveryCoordinator
  private factory: DiscoveryFactory
  private currentDialect: string = ''

  private constructor() {
    this.factory = DiscoveryFactory.getInstance()
  }

  static getInstance(): SchemaDiscoveryCoordinator {
    if (!SchemaDiscoveryCoordinator.instance) {
      SchemaDiscoveryCoordinator.instance = new SchemaDiscoveryCoordinator()
    }
    return SchemaDiscoveryCoordinator.instance
  }

  /**
   * Discover the complete database schema
   */
  async discoverSchema(
    db: Kysely<any>,
    config: IntrospectionConfig = {},
    dialect?: Dialect
  ): Promise<SchemaInfo> {
    // Determine the dialect
    const dialectName = (dialect as any)?.name || 'sqlite'
    this.currentDialect = dialectName

    // Check if dialect is supported
    if (!this.factory.isDialectSupported(dialectName)) {
      throw new Error(`Unsupported database dialect: ${dialectName}`)
    }

    // Use the dialect-specific introspector if available, otherwise fall back to generic
    const introspector = dialect?.createIntrospector?.(db) || new DatabaseIntrospector(db)
    
    // Convert config to schema discovery config
    const discoveryConfig: SchemaDiscoveryConfig = {
      excludeTables: config.excludeTables,
      includeViews: config.includeViews,
      customTypeMappings: config.customTypeMappings
    }

    // Create discovery services for this dialect
    const services = this.factory.createDiscoveryServices(dialectName)
    
    // Get all tables using the table discovery service
    const tables = await services.tableDiscovery.discoverTables(introspector, discoveryConfig)
    
    // Get all relationships using the relationship discovery service
    const relationships = await services.relationshipDiscovery.discoverRelationships(tables)
    
    // Get views if requested using the view discovery service
    const viewMetadata = discoveryConfig.includeViews 
      ? await services.viewDiscovery.discoverViews(introspector) 
      : []
    
    // Convert ViewMetadata to ViewInfo
    const views = viewMetadata.map(view => ({
      name: view.name,
      schema: view.schema,
      definition: view.definition || '',
      columns: view.columns || []
    }))

    return {
      tables,
      relationships,
      views
    }
  }

  /**
   * Get the discovery factory instance
   */
  getFactory(): DiscoveryFactory {
    return this.factory
  }

  /**
   * Get current dialect
   */
  getCurrentDialect(): string {
    return this.currentDialect
  }

  /**
   * Get dialect capabilities
   */
  getDialectCapabilities(): ReturnType<DiscoveryFactory['getDialectCapabilities']> {
    return this.factory.getDialectCapabilities(this.currentDialect)
  }
}
