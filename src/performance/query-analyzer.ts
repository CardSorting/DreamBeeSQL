import type { Kysely } from '../kysely.js'
import { Logger } from '../logging/logger.js'
import { SchemaInfo, TableInfo } from '../types/index.js'

export interface QueryMetrics {
  query: string
  executionTime: number
  timestamp: Date
  table?: string
  operation?: string
}

export interface PerformanceWarning {
  type: 'n_plus_one' | 'missing_index' | 'slow_query' | 'full_table_scan' | 'large_result_set'
  message: string
  suggestion: string
  query?: string
  table?: string
  severity: 'low' | 'medium' | 'high'
}

export interface QueryAnalyzerOptions {
  enabled?: boolean
  slowQueryThreshold?: number // milliseconds
  nPlusOneDetection?: boolean
  missingIndexDetection?: boolean
  largeResultSetThreshold?: number
}

/**
 * Analyzes query performance and provides warnings for optimization
 */
export class QueryAnalyzer {
  private queryHistory: QueryMetrics[] = []
  private recentQueries: Map<string, QueryMetrics[]> = new Map()
  private maxHistorySize = 1000

  constructor(
    private db: Kysely<any>,
    private logger: Logger,
    private schemaInfo: SchemaInfo,
    private options: QueryAnalyzerOptions = {}
  ) {
    this.options = {
      enabled: process.env.NODE_ENV === 'development',
      slowQueryThreshold: 1000, // 1 second
      nPlusOneDetection: true,
      missingIndexDetection: true,
      largeResultSetThreshold: 1000,
      ...options
    }
  }

  /**
   * Record a query execution for analysis
   */
  recordQuery(query: string, executionTime: number, resultCount?: number, table?: string): void {
    if (!this.options.enabled) return

    const metrics: QueryMetrics = {
      query: this.normalizeQuery(query),
      executionTime,
      timestamp: new Date(),
      table,
      operation: this.extractOperation(query)
    }

    this.queryHistory.push(metrics)

    // Keep history size under control
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize)
    }

    // Track recent queries for N+1 detection
    const normalizedQuery = metrics.query
    if (!this.recentQueries.has(normalizedQuery)) {
      this.recentQueries.set(normalizedQuery, [])
    }
    this.recentQueries.get(normalizedQuery)!.push(metrics)

    // Clean up old recent queries (keep last 10 seconds)
    const cutoff = new Date(Date.now() - 10000)
    for (const [query, queries] of this.recentQueries.entries()) {
      const recent = queries.filter(q => q.timestamp >= cutoff)
      if (recent.length === 0) {
        this.recentQueries.delete(query)
      } else {
        this.recentQueries.set(query, recent)
      }
    }

    // Analyze the query
    this.analyzeQuery(metrics, resultCount)
  }

  /**
   * Analyze a query for performance issues
   */
  private analyzeQuery(metrics: QueryMetrics, resultCount?: number): void {
    const warnings: PerformanceWarning[] = []

    // Check for slow queries
    if (this.options.slowQueryThreshold && metrics.executionTime > this.options.slowQueryThreshold) {
      warnings.push({
        type: 'slow_query',
        message: `Slow query detected: ${metrics.executionTime}ms`,
        suggestion: 'Consider adding indexes or optimizing the query',
        query: metrics.query,
        table: metrics.table,
        severity: metrics.executionTime > this.options.slowQueryThreshold * 3 ? 'high' : 'medium'
      })
    }

    // Check for N+1 queries
    if (this.options.nPlusOneDetection) {
      const nPlusOneWarning = this.detectNPlusOne(metrics)
      if (nPlusOneWarning) {
        warnings.push(nPlusOneWarning)
      }
    }

    // Check for missing indexes
    if (this.options.missingIndexDetection && metrics.table) {
      const missingIndexWarning = this.checkForMissingIndexes(metrics)
      if (missingIndexWarning) {
        warnings.push(missingIndexWarning)
      }
    }

    // Check for large result sets
    if (resultCount && this.options.largeResultSetThreshold && resultCount > this.options.largeResultSetThreshold) {
      warnings.push({
        type: 'large_result_set',
        message: `Large result set: ${resultCount} rows returned`,
        suggestion: 'Consider using pagination or filtering to reduce result size',
        query: metrics.query,
        table: metrics.table,
        severity: resultCount > this.options.largeResultSetThreshold * 5 ? 'high' : 'medium'
      })
    }

    // Log warnings
    for (const warning of warnings) {
      this.logWarning(warning)
    }
  }

  /**
   * Detect N+1 query patterns
   */
  private detectNPlusOne(metrics: QueryMetrics): PerformanceWarning | null {
    const recentQueries = this.recentQueries.get(metrics.query) || []

    // Look for the same query executed multiple times in quick succession
    if (recentQueries.length >= 5) {
      const timeWindow = 5000 // 5 seconds
      const recentInWindow = recentQueries.filter(
        q => Date.now() - q.timestamp.getTime() < timeWindow
      )

      if (recentInWindow.length >= 5) {
        return {
          type: 'n_plus_one',
          message: `Potential N+1 query detected: same query executed ${recentInWindow.length} times`,
          suggestion: 'Consider using joins or batch loading to reduce query count',
          query: metrics.query,
          table: metrics.table,
          severity: 'high'
        }
      }
    }

    return null
  }

  /**
   * Check for missing indexes based on WHERE clauses
   */
  private checkForMissingIndexes(metrics: QueryMetrics): PerformanceWarning | null {
    if (!metrics.table || !metrics.query.includes('WHERE')) {
      return null
    }

    const table = this.schemaInfo.tables.find(t => t.name === metrics.table)
    if (!table) return null

    // Extract WHERE conditions (simplified parsing)
    const whereMatch = metrics.query.match(/WHERE\s+([^ORDER\s]+)/i)
    if (!whereMatch) return null

    const whereClause = whereMatch[1]
    const columnMatches = whereClause.match(/(\w+)\s*[=<>]/g)
    if (!columnMatches) return null

    // Check if columns used in WHERE have indexes
    for (const match of columnMatches) {
      const column = match.replace(/\s*[=<>].*/, '').trim()

      // Skip if it's the primary key (automatically indexed)
      if (table.primaryKey?.includes(column)) continue

      // Check if there's an index on this column
      const hasIndex = table.indexes.some(index =>
        index.columns.includes(column) || index.columns[0] === column
      )

      if (!hasIndex) {
        return {
          type: 'missing_index',
          message: `Column '${column}' used in WHERE clause may benefit from an index`,
          suggestion: `Consider adding an index on ${metrics.table}.${column}`,
          query: metrics.query,
          table: metrics.table,
          severity: 'medium'
        }
      }
    }

    return null
  }

  /**
   * Normalize query for comparison (remove dynamic values)
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace PostgreSQL parameters
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Extract operation type from query
   */
  private extractOperation(query: string): string {
    const normalized = query.trim().toUpperCase()
    if (normalized.startsWith('SELECT')) return 'SELECT'
    if (normalized.startsWith('INSERT')) return 'INSERT'
    if (normalized.startsWith('UPDATE')) return 'UPDATE'
    if (normalized.startsWith('DELETE')) return 'DELETE'
    return 'OTHER'
  }

  /**
   * Log performance warning
   */
  private logWarning(warning: PerformanceWarning): void {
    const emoji = this.getWarningEmoji(warning.type)
    const message = `${emoji} Performance Warning [${warning.severity.toUpperCase()}]: ${warning.message}`

    switch (warning.severity) {
      case 'high':
        this.logger.warn(message)
        break
      case 'medium':
        this.logger.info(message)
        break
      case 'low':
        this.logger.debug(message)
        break
    }

    this.logger.debug(`  Suggestion: ${warning.suggestion}`)
    if (warning.query) {
      this.logger.debug(`  Query: ${warning.query}`)
    }
  }

  /**
   * Get emoji for warning type
   */
  private getWarningEmoji(type: PerformanceWarning['type']): string {
    const emojis = {
      'n_plus_one': '🔄',
      'missing_index': '📇',
      'slow_query': '🐌',
      'full_table_scan': '🔍',
      'large_result_set': '📊'
    }
    return emojis[type] || '⚠️'
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number
    averageExecutionTime: number
    slowQueries: number
    warningCount: { [key: string]: number }
  } {
    const slowQueries = this.queryHistory.filter(
      q => q.executionTime > (this.options.slowQueryThreshold || 1000)
    ).length

    const totalTime = this.queryHistory.reduce((sum, q) => sum + q.executionTime, 0)
    const averageExecutionTime = this.queryHistory.length > 0 ? totalTime / this.queryHistory.length : 0

    return {
      totalQueries: this.queryHistory.length,
      averageExecutionTime,
      slowQueries,
      warningCount: {} // Would be populated by tracking warnings
    }
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.queryHistory = []
    this.recentQueries.clear()
  }

  /**
   * Update schema info for index checking
   */
  updateSchema(schemaInfo: SchemaInfo): void {
    this.schemaInfo = schemaInfo
  }
}