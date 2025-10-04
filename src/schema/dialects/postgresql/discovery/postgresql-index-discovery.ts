import type { Kysely } from '../../../../kysely.js'
import { DatabaseIntrospector } from '../../../../dialect/database-introspector.js'
import { sql } from '../../../../raw-builder/sql.js'

/**
 * PostgreSQL-specific index discovery
 */
export class PostgreSQLIndexDiscovery {
  private static instance: PostgreSQLIndexDiscovery

  static getInstance(): PostgreSQLIndexDiscovery {
    if (!PostgreSQLIndexDiscovery.instance) {
      PostgreSQLIndexDiscovery.instance = new PostgreSQLIndexDiscovery()
    }
    return PostgreSQLIndexDiscovery.instance
  }

  /**
   * Discover indexes for a specific table in PostgreSQL
   */
  async discoverTableIndexes(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      const indexes = await db
        .selectFrom('pg_index as i')
        .innerJoin('pg_class as c', 'i.indrelid', 'c.oid')
        .innerJoin('pg_class as ic', 'i.indexrelid', 'ic.oid')
        .innerJoin('pg_namespace as ns', 'c.relnamespace', 'ns.oid')
        .select([
          'ic.relname as name',
          'ns.nspname as schema',
          sql<boolean>`i.indisunique`.as('unique'),
          sql<boolean>`i.indisprimary`.as('isPrimary'),
          sql<boolean>`i.indisvalid`.as('valid'),
          sql<string[]>`array_agg(a.attname ORDER BY array_position(i.indkey, a.attnum))`.as('columns'),
          sql<string>`pg_get_indexdef(i.indexrelid)`.as('definition'),
          sql<string>`obj_description(i.indexrelid, 'pg_class')`.as('comment')
        ])
        .innerJoin('pg_attribute as a', (join: any) => 
          join.onRef('a.attrelid', '=', 'c.oid')
              .on('a.attnum', '=', sql`ANY(i.indkey)`)
        )
        .where('c.relname', '=', tableName)
        .where('ns.nspname', '=', 'public')
        .groupBy(['ic.relname', 'ns.nspname', 'i.indisunique', 'i.indisprimary', 'i.indisvalid', 'i.indexrelid'])
        .execute()

      return indexes
    } catch (error) {
      console.warn(`Failed to discover indexes for PostgreSQL table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Get index usage statistics for PostgreSQL
   */
  async getIndexUsageStats(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      const stats = await db
        .selectFrom('pg_stat_user_indexes as si')
        .innerJoin('pg_class as c', 'si.relid', 'c.oid')
        .innerJoin('pg_class as ic', 'si.indexrelid', 'ic.oid')
        .select([
          'ic.relname as indexName',
          'si.idx_scan as scans',
          'si.idx_tup_read as tuplesRead',
          'si.idx_tup_fetch as tuplesFetched',
          sql<boolean>`si.idx_scan = 0`.as('unused')
        ])
        .where('c.relname', '=', tableName)
        .execute()

      return stats
    } catch (error) {
      console.warn(`Failed to get index usage stats for PostgreSQL table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Analyze index efficiency for PostgreSQL
   */
  analyzeIndexEfficiency(indexes: any[], usageStats: any[]): {
    recommendations: string[]
    unusedIndexes: string[]
    duplicateIndexes: string[]
  } {
    const recommendations: string[] = []
    const unusedIndexes: string[] = []
    const duplicateIndexes: string[] = []

    // Find unused indexes
    for (const stat of usageStats) {
      if (stat.unused) {
        unusedIndexes.push(stat.indexName)
        recommendations.push(`Consider dropping unused index: ${stat.indexName}`)
      }
    }

    // Find duplicate indexes (same columns, different names)
    const indexGroups = new Map<string, string[]>()
    for (const index of indexes) {
      const key = index.columns.sort().join(',')
      if (!indexGroups.has(key)) {
        indexGroups.set(key, [])
      }
      indexGroups.get(key)!.push(index.name)
    }

    for (const [columns, names] of indexGroups) {
      if (names.length > 1) {
        duplicateIndexes.push(...names)
        recommendations.push(`Duplicate indexes found on columns (${columns}): ${names.join(', ')}`)
      }
    }

    return {
      recommendations,
      unusedIndexes,
      duplicateIndexes
    }
  }
}
