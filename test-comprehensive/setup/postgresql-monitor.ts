import { NOORMME } from '../../src/noormme.js'

export interface PostgreSQLStats {
  connectionCount: number
  activeConnections: number
  totalQueries: number
  averageQueryTime: number
  slowQueries: number
  databaseSize: string
  uptime: string
  version: string
}

export interface PostgreSQLHealth {
  isHealthy: boolean
  issues: string[]
  recommendations: string[]
  stats: PostgreSQLStats
}

export class PostgreSQLMonitor {
  private db: NOORMME
  private queryTimes: number[] = []
  private slowQueryThreshold = 100 // milliseconds

  constructor(db: NOORMME) {
    this.db = db
  }

  /**
   * Get comprehensive PostgreSQL statistics
   */
  async getStats(): Promise<PostgreSQLStats> {
    const kysely = this.db.getKysely()

    try {
      // Get connection statistics
      const connectionStats = await kysely.executeQuery({
        sql: `
          SELECT 
            count(*) as connection_count,
            count(*) FILTER (WHERE state = 'active') as active_connections
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `,
        parameters: []
      })

      // Get database size
      const sizeResult = await kysely.executeQuery({
        sql: `
          SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
        `,
        parameters: []
      })

      // Get database uptime
      const uptimeResult = await kysely.executeQuery({
        sql: `
          SELECT 
            pg_postmaster_start_time() as start_time,
            now() - pg_postmaster_start_time() as uptime
        `,
        parameters: []
      })

      // Get PostgreSQL version
      const versionResult = await kysely.executeQuery({
        sql: 'SELECT version() as version',
        parameters: []
      })

      const totalQueries = this.queryTimes.length
      const averageQueryTime = totalQueries > 0 
        ? this.queryTimes.reduce((sum, time) => sum + time, 0) / totalQueries 
        : 0
      const slowQueries = this.queryTimes.filter(time => time > this.slowQueryThreshold).length

      return {
        connectionCount: parseInt(connectionStats.rows[0].connection_count),
        activeConnections: parseInt(connectionStats.rows[0].active_connections),
        totalQueries: totalQueries,
        averageQueryTime: Math.round(averageQueryTime * 100) / 100,
        slowQueries: slowQueries,
        databaseSize: sizeResult.rows[0].database_size,
        uptime: this.formatDuration(uptimeResult.rows[0].uptime),
        version: versionResult.rows[0].version
      }
    } catch (error) {
      console.error('Failed to get PostgreSQL stats:', error)
      throw error
    }
  }

  /**
   * Check PostgreSQL health
   */
  async getHealth(): Promise<PostgreSQLHealth> {
    const stats = await this.getStats()
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for issues
    if (stats.activeConnections > stats.connectionCount * 0.8) {
      issues.push('High connection usage detected')
      recommendations.push('Consider increasing connection pool size')
    }

    if (stats.averageQueryTime > 1000) {
      issues.push('Average query time is high')
      recommendations.push('Review and optimize slow queries')
    }

    if (stats.slowQueries > stats.totalQueries * 0.1) {
      issues.push('High percentage of slow queries')
      recommendations.push('Add database indexes for frequently queried columns')
    }

    // Check database size
    const sizeInMB = this.parseSize(stats.databaseSize)
    if (sizeInMB > 1024) { // 1GB
      issues.push('Large database size detected')
      recommendations.push('Consider archiving old data or implementing partitioning')
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
      stats
    }
  }

  /**
   * Record query execution time for monitoring
   */
  recordQueryTime(queryTime: number): void {
    this.queryTimes.push(queryTime)
    
    // Keep only last 1000 query times to prevent memory issues
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000)
    }

    // Log slow queries
    if (queryTime > this.slowQueryThreshold) {
      console.warn(`🐌 Slow PostgreSQL query detected: ${queryTime}ms`)
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<any[]> {
    const kysely = this.db.getKysely()

    const result = await kysely.executeQuery({
      sql: `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `,
      parameters: []
    })

    return result.rows
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any[]> {
    const kysely = this.db.getKysely()

    const result = await kysely.executeQuery({
      sql: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan,
          CASE 
            WHEN idx_scan = 0 THEN 'Unused'
            WHEN idx_scan < 10 THEN 'Low Usage'
            ELSE 'Active'
          END as usage_status
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `,
      parameters: []
    })

    return result.rows
  }

  /**
   * Get query performance statistics
   */
  async getQueryStats(): Promise<any[]> {
    const kysely = this.db.getKysely()

    const result = await kysely.executeQuery({
      sql: `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          stddev_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_time DESC
        LIMIT 10
      `,
      parameters: []
    })

    return result.rows
  }

  /**
   * Reset monitoring data
   */
  resetStats(): void {
    this.queryTimes = []
    console.log('📊 PostgreSQL monitoring stats reset')
  }

  /**
   * Generate monitoring report
   */
  async generateReport(): Promise<string> {
    const health = await this.getHealth()
    const tableStats = await this.getTableStats()
    const indexStats = await this.getIndexStats()

    let report = `
# PostgreSQL Monitoring Report
Generated at: ${new Date().toISOString()}

## Health Status
Status: ${health.isHealthy ? '✅ Healthy' : '❌ Issues Detected'}

${health.issues.length > 0 ? `
### Issues:
${health.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

${health.recommendations.length > 0 ? `
### Recommendations:
${health.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

## Statistics
- Connection Count: ${health.stats.connectionCount}
- Active Connections: ${health.stats.activeConnections}
- Total Queries: ${health.stats.totalQueries}
- Average Query Time: ${health.stats.averageQueryTime}ms
- Slow Queries: ${health.stats.slowQueries}
- Database Size: ${health.stats.databaseSize}
- Uptime: ${health.stats.uptime}

## Top Tables by Row Count
${tableStats.slice(0, 5).map(table => 
  `- ${table.tablename}: ${table.live_tuples} rows`
).join('\n')}

## Index Usage
${indexStats.slice(0, 5).map(index => 
  `- ${index.indexname} (${index.tablename}): ${index.idx_scan} scans, ${index.usage_status}`
).join('\n')}
`

    return report
  }

  private formatDuration(interval: string): string {
    // PostgreSQL returns interval as a string, parse it
    const parts = interval.split(':')
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts
      const days = Math.floor(parseInt(hours) / 24)
      const remainingHours = parseInt(hours) % 24
      
      if (days > 0) {
        return `${days}d ${remainingHours}h ${minutes}m`
      } else {
        return `${remainingHours}h ${minutes}m ${seconds}s`
      }
    }
    return interval
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i)
    if (match) {
      const value = parseFloat(match[1])
      const unit = match[2].toUpperCase()
      
      switch (unit) {
        case 'KB': return value / 1024
        case 'MB': return value
        case 'GB': return value * 1024
        default: return 0
      }
    }
    return 0
  }
}
