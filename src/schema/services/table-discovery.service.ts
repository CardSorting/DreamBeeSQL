import type { Kysely } from '../../kysely.js'
import { DatabaseIntrospector } from '../../dialect/database-introspector.js'
import { TableInfo } from '../../types/index.js'
import { TableMetadata, SchemaDiscoveryConfig } from '../types/schema-discovery-types.js'
import { TypeMapper } from '../utils/type-mapper.js'

/**
 * Service for discovering table metadata from the database
 */
export class TableDiscoveryService {
  private static instance: TableDiscoveryService

  static getInstance(): TableDiscoveryService {
    if (!TableDiscoveryService.instance) {
      TableDiscoveryService.instance = new TableDiscoveryService()
    }
    return TableDiscoveryService.instance
  }

  /**
   * Discover all tables in the database
   */
  async discoverTables(
    introspector: DatabaseIntrospector,
    config: SchemaDiscoveryConfig = {}
  ): Promise<TableInfo[]> {
    const tables = await introspector.getTables()
    
    // Process tables in parallel to reduce total time
    const tablePromises = tables.map(async (table) => {
      return await this.processTable(table, introspector, config)
    })

    // Wait for all table processing to complete
    const results = await Promise.all(tablePromises)
    
    // Filter out null results and return valid table infos
    return results.filter((table): table is TableInfo => table !== null)
  }

  /**
   * Process a single table to get its metadata
   */
  private async processTable(
    table: any,
    introspector: DatabaseIntrospector,
    config: SchemaDiscoveryConfig
  ): Promise<TableInfo | null> {
    // Skip excluded tables
    if (config.excludeTables?.includes(table.name)) {
      return null
    }

    try {
      // Get columns, indexes, and foreign keys for this table
      const [columns, indexes, foreignKeys] = await Promise.all([
        introspector.getColumns(table.name).catch(() => []),
        introspector.getIndexes(table.name).catch(() => []),
        introspector.getForeignKeys(table.name).catch(() => [])
      ])

      // Find primary key columns
      const primaryKeyColumns = columns
        .filter((col: any) => col.isPrimaryKey)
        .map((col: any) => col.name)

      return {
        name: table.name,
        schema: table.schema,
        columns: columns.map((col: any) => TypeMapper.mapColumnInfo(col, config.customTypeMappings)),
        primaryKey: primaryKeyColumns.length > 0 ? primaryKeyColumns : undefined,
        indexes: indexes.map((idx: any) => ({
          name: idx.name,
          columns: idx.columns,
          unique: idx.unique
        })),
        foreignKeys: foreignKeys.map((fk: any) => ({
          name: fk.name,
          column: fk.column,
          referencedTable: fk.referencedTable,
          referencedColumn: fk.referencedColumn,
          onDelete: fk.onDelete,
          onUpdate: fk.onUpdate
        }))
      }
    } catch (error) {
      console.warn(`Failed to get metadata for table ${table.name}:`, error)
      return null
    }
  }
}
