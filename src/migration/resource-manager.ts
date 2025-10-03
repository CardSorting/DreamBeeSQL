import { Kysely } from '../kysely.js'

export interface ResourceConfig {
  maxConcurrentMigrations: number
  migrationTimeout: number
}

export interface ResourceMetrics {
  activeMigrations: number
  totalMigrations: number
  failedMigrations: number
}

/**
 * High-performance resource manager for migration operations
 * Follows industry standards with minimal overhead and no database spam
 */
export class MigrationResourceManager {
  private static instance: MigrationResourceManager | null = null
  private config: ResourceConfig
  private metrics: ResourceMetrics
  private activeMigrations = new Set<string>()
  private migrationTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
  
  // Performance optimizations
  private readonly maxCacheSize = 100
  private cleanupCallbacks = new Map<string, () => void>()

  private constructor(config: Partial<ResourceConfig> = {}) {
    this.config = {
      maxConcurrentMigrations: 3,
      migrationTimeout: 30000, // 30 seconds
      ...config
    }

    this.metrics = {
      activeMigrations: 0,
      totalMigrations: 0,
      failedMigrations: 0
    }
  }

  static getInstance(config?: Partial<ResourceConfig>): MigrationResourceManager {
    if (!MigrationResourceManager.instance) {
      MigrationResourceManager.instance = new MigrationResourceManager(config)
    }
    return MigrationResourceManager.instance
  }

  /**
   * Acquire resources for migration execution
   * Returns a cleanup function to release resources
   */
  async acquireResources(migrationId: string): Promise<() => void> {
    // Check concurrent migration limit
    if (this.activeMigrations.size >= this.config.maxConcurrentMigrations) {
      throw new Error(`Maximum concurrent migrations (${this.config.maxConcurrentMigrations}) exceeded`)
    }

    // Add to active migrations
    this.activeMigrations.add(migrationId)
    this.metrics.activeMigrations = this.activeMigrations.size
    this.metrics.totalMigrations++

    // Set timeout for automatic cleanup
    const timeout = setTimeout(() => {
      this.releaseResources(migrationId)
    }, this.config.migrationTimeout)
    
    this.migrationTimeouts.set(migrationId, timeout)

    // Return cleanup function
    return () => this.releaseResources(migrationId)
  }

  /**
   * Release resources after migration completion
   */
  private releaseResources(migrationId: string): void {
    // Remove from active migrations
    this.activeMigrations.delete(migrationId)
    this.metrics.activeMigrations = this.activeMigrations.size

    // Clear timeout
    const timeout = this.migrationTimeouts.get(migrationId)
    if (timeout) {
      clearTimeout(timeout)
      this.migrationTimeouts.delete(migrationId)
    }
  }

  /**
   * Execute migration with resource management (optimized)
   */
  async executeWithResources<T>(
    migrationId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const cleanup = await this.acquireResources(migrationId)
    
    try {
      const result = await operation()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      this.metrics.failedMigrations++
      throw error
    }
  }

  /**
   * Batch execute multiple operations with resource management
   */
  async executeBatch<T>(
    operations: Array<{ id: string; operation: () => Promise<T> }>
  ): Promise<Array<{ id: string; result?: T; error?: Error }>> {
    const results: Array<{ id: string; result?: T; error?: Error }> = []
    
    // Execute operations in parallel up to the concurrency limit
    const semaphore = new Array(this.config.maxConcurrentMigrations).fill(null)
    const promises = operations.map(async (op) => {
      await this.executeWithResources(op.id, op.operation)
        .then(result => results.push({ id: op.id, result }))
        .catch(error => results.push({ id: op.id, error }))
    })
    
    await Promise.all(promises)
    return results
  }

  /**
   * Execute with timeout protection
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = this.config.migrationTimeout
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  }

  /**
   * Get current metrics (lightweight, no database calls)
   */
  getMetrics(): ResourceMetrics {
    return { ...this.metrics }
  }

  /**
   * Check if resources are available
   */
  hasAvailableResources(): boolean {
    return this.activeMigrations.size < this.config.maxConcurrentMigrations
  }

  /**
   * Get resource utilization percentage
   */
  getResourceUtilization(): number {
    return (this.activeMigrations.size / this.config.maxConcurrentMigrations) * 100
  }

  /**
   * Get active migrations (for debugging)
   */
  getActiveMigrations(): string[] {
    return Array.from(this.activeMigrations)
  }

  /**
   * Check if migration is active
   */
  isMigrationActive(migrationId: string): boolean {
    return this.activeMigrations.has(migrationId)
  }

  /**
   * Get configuration
   */
  getConfig(): ResourceConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ResourceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      activeMigrations: this.activeMigrations.size,
      totalMigrations: 0,
      failedMigrations: 0
    }
  }

  /**
   * Cleanup all resources (for shutdown) - optimized
   */
  async cleanup(): Promise<void> {
    // Clear all timeouts efficiently
    const timeouts = Array.from(this.migrationTimeouts.values())
    timeouts.forEach(timeout => clearTimeout(timeout))
    this.migrationTimeouts.clear()
    
    // Clear active migrations
    this.activeMigrations.clear()
    this.metrics.activeMigrations = 0
    
    // Clear cleanup callbacks
    this.cleanupCallbacks.clear()
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    activeMigrations: number
    totalMigrations: number
    failedMigrations: number
    successRate: number
    averageUtilization: number
  } {
    const successRate = this.metrics.totalMigrations > 0 
      ? ((this.metrics.totalMigrations - this.metrics.failedMigrations) / this.metrics.totalMigrations) * 100
      : 100
    
    const averageUtilization = (this.activeMigrations.size / this.config.maxConcurrentMigrations) * 100
    
    return {
      activeMigrations: this.activeMigrations.size,
      totalMigrations: this.metrics.totalMigrations,
      failedMigrations: this.metrics.failedMigrations,
      successRate,
      averageUtilization
    }
  }
}

// Global resource manager instance
export const resourceManager = MigrationResourceManager.getInstance()
