import type { Kysely } from '../../../../kysely.js'
import { DatabaseIntrospector } from '../../../../dialect/database-introspector.js'

/**
 * SQLite-specific schema introspector with enhanced metadata capabilities
 */
export class SQLiteSchemaIntrospector extends DatabaseIntrospector {
  constructor(db: Kysely<any>) {
    super(db)
  }

  /**
   * Get enhanced table metadata for SQLite
   */
  async getEnhancedTables(): Promise<any[]> {
    try {
      const tables = await this.db
        .selectFrom('sqlite_master')
        .select([
          'name',
          'type',
          'tbl_name',
          'rootpage',
          'sql'
        ])
        .where('type', '=', 'table')
        .execute()

      const enhancedTables = []

      for (const table of tables) {
        try {
          // Get row count for each table
          const rowCountResult = await this.db.executeQuery({
            sql: `SELECT COUNT(*) as count FROM ${table.name}`,
            parameters: []
          })

          const rowCount = rowCountResult.rows?.[0]?.count || 0

          enhancedTables.push({
            ...table,
            estimatedRows: rowCount,
            sizeBytes: 0, // SQLite doesn't provide direct size info
            comment: null, // SQLite doesn't support table comments
            hasIndexes: false, // Will be determined separately
            hasTriggers: false, // Will be determined separately
            tableType: 'table',
            lastAnalyzed: null,
            lastAutoAnalyzed: null
          })
        } catch (error) {
          console.warn(`Failed to get row count for SQLite table ${table.name}:`, error)
          enhancedTables.push(table)
        }
      }

      return enhancedTables
    } catch (error) {
      console.warn('Failed to get enhanced SQLite table metadata:', error)
      return []
    }
  }

  /**
   * Get database statistics for SQLite using PRAGMA
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const stats: any = {}

      // Get various PRAGMA values
      const pragmas = [
        'user_version',
        'application_id',
        'page_count',
        'page_size',
        'cache_size',
        'freelist_count',
        'synchronous',
        'journal_mode',
        'auto_vacuum',
        'integrity_check'
      ]

      for (const pragma of pragmas) {
        try {
          const result = await this.db.executeQuery({
            sql: `PRAGMA ${pragma}`,
            parameters: []
          })
          stats[pragma] = result.rows?.[0]?.[pragma] || null
        } catch (error) {
          stats[pragma] = null
        }
      }

      return {
        databaseName: 'main',
        activeConnections: 1, // SQLite is single-connection
        committedTransactions: stats.user_version || 0,
        rolledBackTransactions: 0,
        blocksRead: stats.page_count || 0,
        blocksHit: stats.cache_size || 0,
        tuplesReturned: 0,
        tuplesFetched: 0,
        tuplesInserted: 0,
        tuplesUpdated: 0,
        tuplesDeleted: 0,
        statsReset: null,
        pageSize: stats.page_size,
        journalMode: stats.journal_mode,
        autoVacuum: stats.auto_vacuum,
        synchronous: stats.synchronous
      }
    } catch (error) {
      console.warn('Failed to get SQLite database stats:', error)
      return null
    }
  }

  /**
   * Get SQLite-specific information
   */
  async getSQLiteInfo(): Promise<any> {
    try {
      const info: any = {}

      // Get SQLite version
      const versionResult = await this.db.executeQuery({
        sql: 'SELECT sqlite_version() as version',
        parameters: []
      })
      info.version = versionResult.rows?.[0]?.version

      // Get compile options
      const compileOptionsResult = await this.db.executeQuery({
        sql: 'PRAGMA compile_options',
        parameters: []
      })
      info.compileOptions = compileOptionsResult.rows?.map(row => (row as any).compile_options) || []

      // Get foreign key status
      const fkResult = await this.db.executeQuery({
        sql: 'PRAGMA foreign_keys',
        parameters: []
      })
      info.foreignKeysEnabled = fkResult.rows?.[0]?.foreign_keys === 1

      return info
    } catch (error) {
      console.warn('Failed to get SQLite info:', error)
      return {}
    }
  }

  /**
   * Get SQLite database integrity check results
   */
  async checkIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      const result = await this.db.executeQuery({
        sql: 'PRAGMA integrity_check',
        parameters: []
      })

      const issues: string[] = []
      let isValid = true

      for (const row of result.rows || []) {
        const check = (row as any).integrity_check
        if (check !== 'ok') {
          issues.push(check)
          isValid = false
        }
      }

      return { isValid, issues }
    } catch (error) {
      console.warn('Failed to check SQLite integrity:', error)
      return { isValid: false, issues: ['Integrity check failed'] }
    }
  }

  /**
   * Get SQLite database optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const recommendations: string[] = []

    try {
      // Check for unused pages
      const freelistResult = await this.db.executeQuery({
        sql: 'PRAGMA freelist_count',
        parameters: []
      })
      const freelistCount = freelistResult.rows?.[0]?.freelist_count || 0

      if (freelistCount > 0) {
        recommendations.push(`Consider running VACUUM to reclaim ${freelistCount} unused pages`)
      }

      // Check page size
      const pageSizeResult = await this.db.executeQuery({
        sql: 'PRAGMA page_size',
        parameters: []
      })
      const pageSize = pageSizeResult.rows?.[0]?.page_size || 0

      if (pageSize < 4096) {
        recommendations.push('Consider using a larger page size (4096 or 8192) for better performance')
      }

      // Check journal mode
      const journalModeResult = await this.db.executeQuery({
        sql: 'PRAGMA journal_mode',
        parameters: []
      })
      const journalMode = journalModeResult.rows?.[0]?.journal_mode

      if (journalMode !== 'WAL') {
        recommendations.push('Consider using WAL mode for better concurrency: PRAGMA journal_mode = WAL')
      }

      // Check cache size
      const cacheSizeResult = await this.db.executeQuery({
        sql: 'PRAGMA cache_size',
        parameters: []
      })
      const cacheSize = cacheSizeResult.rows?.[0]?.cache_size || 0

      if (cacheSize < -1000) {
        recommendations.push('Consider increasing cache size for better performance')
      }

    } catch (error) {
      console.warn('Failed to get SQLite optimization recommendations:', error)
    }

    return recommendations
  }
}
