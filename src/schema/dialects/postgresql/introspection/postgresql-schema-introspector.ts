import type { Kysely } from '../../../../kysely.js'
import { DatabaseIntrospector } from '../../../../dialect/database-introspector.js'

/**
 * PostgreSQL-specific schema introspector with enhanced metadata capabilities
 */
export class PostgreSQLSchemaIntrospector extends DatabaseIntrospector {
  constructor(db: Kysely<any>) {
    super(db)
  }

  /**
   * Get enhanced table metadata for PostgreSQL
   */
  async getEnhancedTables(): Promise<any[]> {
    try {
      const tables = await this.db
        .selectFrom('pg_tables as pt')
        .innerJoin('pg_class as pc', 'pt.tablename', 'pc.relname')
        .innerJoin('pg_namespace as pn', 'pc.relnamespace', 'pn.oid')
        .select([
          'pt.tablename as name',
          'pt.schemaname as schema',
          sql<number>`pc.reltuples`.as('estimatedRows'),
          sql<number>`pg_total_relation_size(pc.oid)`.as('sizeBytes'),
          sql<string>`obj_description(pc.oid, 'pg_class')`.as('comment'),
          sql<boolean>`pc.relhasindex`.as('hasIndexes'),
          sql<boolean>`pc.relhastriggers`.as('hasTriggers'),
          sql<string>`pc.relkind`.as('tableType'),
          sql<Date>`pg_stat_get_last_analyze(pc.oid)`.as('lastAnalyzed'),
          sql<Date>`pg_stat_get_last_autoanalyze(pc.oid)`.as('lastAutoAnalyzed')
        ])
        .where('pt.schemaname', 'not in', ['information_schema', 'pg_catalog'])
        .execute()

      return tables
    } catch (error) {
      console.warn('Failed to get enhanced PostgreSQL table metadata:', error)
      return []
    }
  }

  /**
   * Get database statistics for PostgreSQL
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await this.db
        .selectFrom('pg_stat_database as psd')
        .select([
          'psd.datname as databaseName',
          sql<number>`psd.numbackends`.as('activeConnections'),
          sql<number>`psd.xact_commit`.as('committedTransactions'),
          sql<number>`psd.xact_rollback`.as('rolledBackTransactions'),
          sql<number>`psd.blks_read`.as('blocksRead'),
          sql<number>`psd.blks_hit`.as('blocksHit'),
          sql<number>`psd.tup_returned`.as('tuplesReturned'),
          sql<number>`psd.tup_fetched`.as('tuplesFetched'),
          sql<number>`psd.tup_inserted`.as('tuplesInserted'),
          sql<number>`psd.tup_updated`.as('tuplesUpdated'),
          sql<number>`psd.tup_deleted`.as('tuplesDeleted'),
          sql<Date>`psd.stats_reset`.as('statsReset')
        ])
        .where('psd.datname', '=', this.db.selectFrom('current_database()').executeTakeFirst())
        .executeTakeFirst()

      return stats
    } catch (error) {
      console.warn('Failed to get PostgreSQL database stats:', error)
      return null
    }
  }

  /**
   * Get connection pool information for PostgreSQL
   */
  async getConnectionPoolStats(): Promise<any> {
    try {
      const poolStats = await this.db
        .selectFrom('pg_stat_activity as psa')
        .select([
          sql<string>`psa.state`.as('state'),
          sql<number>`count(*)`.as('count')
        ])
        .groupBy('psa.state')
        .execute()

      return poolStats
    } catch (error) {
      console.warn('Failed to get PostgreSQL connection pool stats:', error)
      return []
    }
  }

  /**
   * Get PostgreSQL extensions information
   */
  async getExtensions(): Promise<any[]> {
    try {
      const extensions = await this.db
        .selectFrom('pg_extension as pe')
        .innerJoin('pg_namespace as pn', 'pe.extnamespace', 'pn.oid')
        .select([
          'pe.extname as name',
          'pn.nspname as schema',
          sql<string>`pe.extversion`.as('version'),
          sql<string>`pe.extrelocatable`.as('relocatable')
        ])
        .execute()

      return extensions
    } catch (error) {
      console.warn('Failed to get PostgreSQL extensions:', error)
      return []
    }
  }

  /**
   * Get PostgreSQL configuration settings
   */
  async getConfigurationSettings(): Promise<any[]> {
    try {
      const settings = await this.db
        .selectFrom('pg_settings as ps')
        .select([
          'ps.name',
          'ps.setting',
          'ps.unit',
          'ps.context',
          'ps.vartype',
          'ps.source',
          'ps.min_val',
          'ps.max_val',
          'ps.enumvals'
        ])
        .where('ps.source', '!=', 'default')
        .execute()

      return settings
    } catch (error) {
      console.warn('Failed to get PostgreSQL configuration settings:', error)
      return []
    }
  }
}
