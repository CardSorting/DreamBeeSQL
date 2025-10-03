import { Kysely } from '../kysely.js'
import { MigrationCore, MigrationCoreFS, MigrationCorePath, MigrationCoreCrypto } from './migration-core.js'
import { MigrationResourceManager } from './resource-manager.js'
import { MigrationLogger } from './migration-logger.js'
import { NodeMigrationFactory } from './node-factory.js'

export interface MigrationManagerConfig {
  migrationsDirectory: string
  migrationTimeout: number
  maxRetries: number
  retryDelay: number
  maxConcurrentMigrations: number
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  enableConsole: boolean
  fs?: MigrationCoreFS
  path?: MigrationCorePath
  crypto?: MigrationCoreCrypto
}

/**
 * Migration Manager - orchestrates all migration components
 * Single responsibility: coordinate migration execution
 * Zero database spam, minimal overhead, production ready
 */
export class MigrationManager {
  private static instance: MigrationManager | null = null
  private db: Kysely<any>
  private core: MigrationCore
  private resourceManager: MigrationResourceManager
  private logger: MigrationLogger
  private config: MigrationManagerConfig

  private constructor(db: Kysely<any>, config: Partial<MigrationManagerConfig> = {}) {
    this.db = db
    this.config = {
      migrationsDirectory: './migrations',
      migrationTimeout: 30000,
      maxRetries: 3,
      retryDelay: 2000,
      maxConcurrentMigrations: 3,
      logLevel: 'INFO',
      enableConsole: true,
      ...config
    }

    // Initialize components with dependencies
    const fs = this.config.fs || this.getDefaultFS()
    const path = this.config.path || this.getDefaultPath()
    const crypto = this.config.crypto || this.getDefaultCrypto()
    
    this.core = MigrationCore.getInstance(db, fs, path, crypto, {
      migrationsDirectory: this.config.migrationsDirectory,
      migrationTimeout: this.config.migrationTimeout,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay
    })

    this.resourceManager = MigrationResourceManager.getInstance({
      maxConcurrentMigrations: this.config.maxConcurrentMigrations,
      migrationTimeout: this.config.migrationTimeout
    })

    this.logger = MigrationLogger.getInstance({
      logLevel: this.config.logLevel,
      enableConsole: this.config.enableConsole
    })
  }

  static getInstance(db: Kysely<any>, config?: Partial<MigrationManagerConfig>): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager(db, config)
    }
    return MigrationManager.instance
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing migration system...')
    await this.core.initialize()
    this.logger.info('✅ Migration system initialized')
  }

  /**
   * Execute all pending migrations with resource management (optimized)
   */
  async migrate(): Promise<{
    success: boolean
    executed: number
    failed: number
    duration: number
  }> {
    const startTime = Date.now()
    this.logger.info('🔄 Starting migration execution...')

    try {
      // Quick check for pending migrations (uses cache)
      const pendingCount = await this.core.getStatus().then(s => s.pendingMigrations)
      
      if (pendingCount === 0) {
        this.logger.info('✅ No pending migrations')
        return {
          success: true,
          executed: 0,
          failed: 0,
          duration: Date.now() - startTime
        }
      }

      this.logger.info(`📋 Found ${pendingCount} pending migrations`)

      // Execute migrations with resource management
      const result = await this.resourceManager.executeWithResources(
        'migration-batch',
        () => this.core.executeAllMigrations()
      )

      const duration = Date.now() - startTime
      
      if (result.failed > 0) {
        this.logger.error(`❌ Migration failed: ${result.failed} failed, ${result.executed} executed`)
        return {
          success: false,
          executed: result.executed,
          failed: result.failed,
          duration
        }
      }

      this.logger.info(`✅ Migration completed: ${result.executed} executed in ${duration}ms`)
      return {
        success: true,
        executed: result.executed,
        failed: result.failed,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`❌ Migration system error: ${errorMessage}`)
      
      return {
        success: false,
        executed: 0,
        failed: 1,
        duration
      }
    }
  }

  /**
   * Create new migration file
   */
  async createMigration(name: string, content: string): Promise<string> {
    this.logger.info(`📝 Creating migration: ${name}`)
    const fileName = await this.core.createMigration(name, content)
    this.logger.info(`✅ Created migration file: ${fileName}`)
    return fileName
  }

  /**
   * Get migration status (optimized)
   */
  async getStatus(): Promise<{
    totalFiles: number
    appliedMigrations: number
    pendingMigrations: number
    lastApplied: string | null
    resourceUtilization: number
    performanceMetrics: any
  }> {
    // Execute in parallel for better performance
    const [status, resourceUtilization, performanceMetrics] = await Promise.all([
      this.core.getStatus(),
      Promise.resolve(this.resourceManager.getResourceUtilization()),
      Promise.resolve(this.resourceManager.getPerformanceMetrics())
    ])

    return {
      ...status,
      resourceUtilization,
      performanceMetrics
    }
  }

  /**
   * Check if migrations are up to date
   */
  async isUpToDate(): Promise<boolean> {
    const status = await this.core.getStatus()
    return status.pendingMigrations === 0
  }

  /**
   * Get pending migrations count (for quick checks)
   */
  async getPendingCount(): Promise<number> {
    const status = await this.core.getStatus()
    return status.pendingMigrations
  }

  /**
   * Get configuration
   */
  getConfig(): MigrationManagerConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MigrationManagerConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Update component configurations
    this.core.updateConfig({
      migrationsDirectory: this.config.migrationsDirectory,
      migrationTimeout: this.config.migrationTimeout,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay
    })

    this.resourceManager.updateConfig({
      maxConcurrentMigrations: this.config.maxConcurrentMigrations,
      migrationTimeout: this.config.migrationTimeout
    })

    this.logger.setLogLevel(this.config.logLevel)
    this.logger.setConsoleOutput(this.config.enableConsole)
  }

  /**
   * Get component instances (for advanced usage)
   */
  getComponents(): {
    core: MigrationCore
    resourceManager: MigrationResourceManager
    logger: MigrationLogger
  } {
    return {
      core: this.core,
      resourceManager: this.resourceManager,
      logger: this.logger
    }
  }

  /**
   * Cleanup resources (for shutdown)
   */
  async cleanup(): Promise<void> {
    this.logger.info('🧹 Cleaning up migration resources...')
    await this.resourceManager.cleanup()
    this.logger.info('✅ Migration cleanup completed')
  }

  /**
   * Get default FS implementation
   */
  private getDefaultFS(): MigrationCoreFS {
    if (NodeMigrationFactory.isInitialized()) {
      return NodeMigrationFactory.getFS()
    }
    
    // Fallback implementation that throws helpful error
    return {
      readdir: () => Promise.reject(new Error('Node.js modules not initialized. Call NodeMigrationFactory.initialize() first or provide fs implementation in config.')),
      readFile: () => Promise.reject(new Error('Node.js modules not initialized. Call NodeMigrationFactory.initialize() first or provide fs implementation in config.')),
      writeFile: () => Promise.reject(new Error('Node.js modules not initialized. Call NodeMigrationFactory.initialize() first or provide fs implementation in config.'))
    }
  }

  /**
   * Get default Path implementation
   */
  private getDefaultPath(): MigrationCorePath {
    if (NodeMigrationFactory.isInitialized()) {
      return NodeMigrationFactory.getPath()
    }
    
    // Fallback implementation that throws helpful error
    return {
      join: () => {
        throw new Error('Node.js modules not initialized. Call NodeMigrationFactory.initialize() first or provide path implementation in config.')
      }
    }
  }

  /**
   * Get default Crypto implementation
   */
  private getDefaultCrypto(): MigrationCoreCrypto {
    if (NodeMigrationFactory.isInitialized()) {
      return NodeMigrationFactory.getCrypto()
    }
    
    // Fallback implementation that throws helpful error
    return {
      randomUUID: () => {
        throw new Error('Node.js modules not initialized. Call NodeMigrationFactory.initialize() first or provide crypto implementation in config.')
      }
    }
  }
}
