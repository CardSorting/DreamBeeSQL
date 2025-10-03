import type { Kysely } from '../../../kysely.js'
import { DatabaseIntrospector } from '../../../dialect/database-introspector.js'
import { SchemaInfo, IntrospectionConfig } from '../../../types/index.js'
import { SchemaDiscoveryConfig } from '../../core/types/schema-discovery-types.js'
import { TableMetadataDiscovery } from '../../core/discovery/table-metadata-discovery.js'
import { RelationshipDiscovery } from '../../core/discovery/relationship-discovery.js'
import { ViewDiscovery } from '../../core/discovery/view-discovery.js'
import { PostgreSQLIndexDiscovery } from './discovery/postgresql-index-discovery.js'
import { PostgreSQLConstraintDiscovery } from './discovery/postgresql-constraint-discovery.js'

/**
 * PostgreSQL-specific schema discovery coordinator
 */
export class PostgreSQLDiscoveryCoordinator {
  private static instance: PostgreSQLDiscoveryCoordinator
  private tableDiscovery: TableMetadataDiscovery
  private relationshipDiscovery: RelationshipDiscovery
  private viewDiscovery: ViewDiscovery
  private indexDiscovery: PostgreSQLIndexDiscovery
  private constraintDiscovery: PostgreSQLConstraintDiscovery

  private constructor() {
    this.tableDiscovery = TableMetadataDiscovery.getInstance()
    this.relationshipDiscovery = RelationshipDiscovery.getInstance()
    this.viewDiscovery = ViewDiscovery.getInstance()
    this.indexDiscovery = PostgreSQLIndexDiscovery.getInstance()
    this.constraintDiscovery = PostgreSQLConstraintDiscovery.getInstance()
  }

  static getInstance(): PostgreSQLDiscoveryCoordinator {
    if (!PostgreSQLDiscoveryCoordinator.instance) {
      PostgreSQLDiscoveryCoordinator.instance = new PostgreSQLDiscoveryCoordinator()
    }
    return PostgreSQLDiscoveryCoordinator.instance
  }

  /**
   * Discover complete PostgreSQL schema
   */
  async discoverSchema(
    db: Kysely<any>,
    config: IntrospectionConfig = {}
  ): Promise<SchemaInfo> {
    const introspector = new DatabaseIntrospector(db)
    const discoveryConfig: SchemaDiscoveryConfig = {
      excludeTables: config.excludeTables,
      includeViews: config.includeViews,
      customTypeMappings: config.customTypeMappings
    }

    // Discover tables with PostgreSQL-specific metadata
    const tables = await this.tableDiscovery.discoverTables(introspector, discoveryConfig)
    
    // Enhance tables with PostgreSQL-specific index and constraint information
    const enhancedTables = await this.enhanceTablesWithPostgreSQLMetadata(db, tables)
    
    // Discover relationships
    const relationships = await this.relationshipDiscovery.discoverRelationships(enhancedTables)
    
    // Discover views if requested
    const viewMetadata = discoveryConfig.includeViews 
      ? await this.viewDiscovery.discoverViews(introspector) 
      : []
    
    const views = viewMetadata.map(view => ({
      name: view.name,
      schema: view.schema,
      definition: view.definition || '',
      columns: view.columns || []
    }))

    return {
      tables: enhancedTables,
      relationships,
      views
    }
  }

  /**
   * Enhance table metadata with PostgreSQL-specific information
   */
  private async enhanceTablesWithPostgreSQLMetadata(
    db: Kysely<any>,
    tables: any[]
  ): Promise<any[]> {
    const enhancedTables = []

    for (const table of tables) {
      try {
        // Get PostgreSQL-specific index information
        const indexes = await this.indexDiscovery.discoverTableIndexes(db, table.name)
        
        // Get PostgreSQL-specific constraint information
        const constraints = await this.constraintDiscovery.discoverTableConstraints(db, table.name)
        
        // Get foreign key constraints specifically
        const foreignKeys = await this.constraintDiscovery.discoverForeignKeyConstraints(db, table.name)

        enhancedTables.push({
          ...table,
          indexes: indexes.map(idx => ({
            name: idx.name,
            columns: idx.columns,
            unique: idx.unique,
            isPrimary: idx.isPrimary,
            valid: idx.valid,
            definition: idx.definition,
            comment: idx.comment
          })),
          constraints: constraints,
          foreignKeys: foreignKeys.map(fk => ({
            name: fk.name,
            column: fk.column,
            referencedTable: fk.referencedTable,
            referencedColumn: fk.referencedColumn,
            onDelete: fk.onDelete,
            onUpdate: fk.onUpdate,
            deferrable: fk.deferrable,
            deferred: fk.deferred
          }))
        })
      } catch (error) {
        console.warn(`Failed to enhance PostgreSQL metadata for table ${table.name}:`, error)
        enhancedTables.push(table)
      }
    }

    return enhancedTables
  }

  /**
   * Get PostgreSQL-specific capabilities
   */
  getCapabilities() {
    return {
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
    }
  }

  /**
   * Get PostgreSQL-specific recommendations
   */
  async getRecommendations(db: Kysely<any>, tables: any[]): Promise<string[]> {
    const recommendations: string[] = []

    for (const table of tables) {
      try {
        // Analyze indexes
        const indexes = await this.indexDiscovery.discoverTableIndexes(db, table.name)
        const usageStats = await this.indexDiscovery.getIndexUsageStats(db, table.name)
        const indexAnalysis = this.indexDiscovery.analyzeIndexEfficiency(indexes, usageStats)
        
        recommendations.push(...indexAnalysis.recommendations)

        // Analyze constraints
        const constraints = await this.constraintDiscovery.discoverTableConstraints(db, table.name)
        const constraintAnalysis = this.constraintDiscovery.analyzeConstraintPerformance(constraints)
        
        recommendations.push(...constraintAnalysis.recommendations)
      } catch (error) {
        console.warn(`Failed to get recommendations for PostgreSQL table ${table.name}:`, error)
      }
    }

    return recommendations
  }
}
