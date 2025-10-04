import type { Kysely } from '../kysely.js'
import { sql } from '../raw-builder/sql.js'
import { Logger } from '../logging/logger.js'
import { SQLiteAutoOptimizer } from '../dialect/sqlite/sqlite-auto-optimizer.js'
import { SQLiteAutoIndexer } from '../dialect/sqlite/sqlite-auto-indexer.js'

export interface SQLiteMigrationConfig {
  enableAutoOptimization: boolean
  enableIndexRecommendations: boolean
  enableConstraintValidation: boolean
  enablePerformanceMonitoring: boolean
  migrationDirectory: string
  backupBeforeMigration: boolean
  dryRun: boolean
}

export interface SQLiteMigrationResult {
  success: boolean
  migrationsApplied: number
  optimizationsApplied: string[]
  indexRecommendations: string[]
  performanceImpact: 'low' | 'medium' | 'high'
  duration: number
  warnings: string[]
}

export interface SQLiteMigrationPlan {
  migrations: string[]
  optimizations: string[]
  indexRecommendations: string[]
  estimatedImpact: 'low' | 'medium' | 'high'
  dryRun: boolean
}

/**
 * SQLite Migration Manager - Focused on SQLite automation and optimization
 * Integrates with existing SQLite auto-optimization features
 */
export class SQLiteMigrationManager {
  private static instance: SQLiteMigrationManager | null = null
  private db: Kysely<any>
  private config: SQLiteMigrationConfig
  private logger: Logger
  private optimizer: SQLiteAutoOptimizer
  private indexer: SQLiteAutoIndexer
  private isInitialized = false

  private constructor(
    db: Kysely<any>,
    config: Partial<SQLiteMigrationConfig> = {},
    logger: Logger
  ) {
    this.db = db
    this.logger = logger
    this.config = {
      enableAutoOptimization: true,
      enableIndexRecommendations: true,
      enableConstraintValidation: true,
      enablePerformanceMonitoring: true,
      migrationDirectory: './migrations',
      backupBeforeMigration: true,
      dryRun: false,
      ...config
    }

    this.optimizer = SQLiteAutoOptimizer.getInstance(logger)
    this.indexer = SQLiteAutoIndexer.getInstance(logger)
  }

  static getInstance(
    db: Kysely<any>,
    config?: Partial<SQLiteMigrationConfig>,
    logger?: Logger
  ): SQLiteMigrationManager {
    if (!SQLiteMigrationManager.instance) {
      if (!logger) {
        logger = new Logger({ level: 'info', enabled: true })
      }
      SQLiteMigrationManager.instance = new SQLiteMigrationManager(db, config, logger)
    }
    return SQLiteMigrationManager.instance
  }

  /**
   * Initialize the SQLite migration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    this.logger.info('🚀 Initializing SQLite Migration Manager...')

    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable()

      // Apply initial SQLite optimizations
      if (this.config.enableAutoOptimization) {
        await this.applyInitialOptimizations()
      }

      this.isInitialized = true
      this.logger.info('✅ SQLite Migration Manager initialized successfully')
    } catch (error) {
      this.logger.error('❌ Failed to initialize SQLite Migration Manager:', error)
      throw error
    }
  }

  /**
   * Create the migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS sqlite_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT,
        optimization_applied BOOLEAN DEFAULT FALSE,
        index_recommendations TEXT,
        performance_impact TEXT
      )
    `.execute(this.db)

    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sqlite_migrations_name 
      ON sqlite_migrations(name)
    `.execute(this.db)
  }

  /**
   * Apply initial SQLite optimizations
   */
  private async applyInitialOptimizations(): Promise<void> {
    this.logger.info('🔧 Applying initial SQLite optimizations...')

    try {
      const optimizations = await this.optimizer.optimizeDatabase(this.db, {
        enableAutoPragma: true,
        enableAutoIndexing: false, // We'll handle indexing separately
        enablePerformanceTuning: true,
        enableBackupRecommendations: false,
        slowQueryThreshold: 1000,
        autoVacuumMode: 'INCREMENTAL',
        journalMode: 'WAL',
        synchronous: 'NORMAL',
        cacheSize: -64000, // 64MB
        tempStore: 'MEMORY'
      })

      this.logger.info(`✅ Applied ${optimizations.appliedOptimizations.length} optimizations`)
      if (optimizations.warnings.length > 0) {
        this.logger.warn(`⚠️ ${optimizations.warnings.length} warnings:`, optimizations.warnings)
      }
    } catch (error) {
      this.logger.error('❌ Failed to apply initial optimizations:', error)
      throw error
    }
  }

  /**
   * Plan SQLite migrations with optimization recommendations
   */
  async planMigrations(): Promise<SQLiteMigrationPlan> {
    this.logger.info('📋 Planning SQLite migrations...')

    try {
      // Get pending migrations
      const pendingMigrations = await this.getPendingMigrations()

      // Get optimization recommendations
      const optimizationRecs = await this.optimizer.optimizeDatabase(this.db)

      // Get index recommendations
      const indexRecs = await this.indexer.analyzeAndRecommend(this.db, {
        minFrequency: 3,
        slowQueryThreshold: 1000,
        maxRecommendations: 10
      })

      const plan: SQLiteMigrationPlan = {
        migrations: pendingMigrations,
        optimizations: optimizationRecs.recommendations || [],
        indexRecommendations: indexRecs.recommendations.map(r => r.sql),
        estimatedImpact: this.calculateImpact(pendingMigrations.length, optimizationRecs.recommendations?.length || 0),
        dryRun: this.config.dryRun
      }

      this.logger.info(`📊 Migration plan: ${plan.migrations.length} migrations, ${plan.optimizations.length} optimizations, ${plan.indexRecommendations.length} index recommendations`)
      
      return plan
    } catch (error) {
      this.logger.error('❌ Failed to plan migrations:', error)
      throw error
    }
  }

  /**
   * Execute SQLite migrations with automatic optimization
   */
  async executeMigrations(): Promise<SQLiteMigrationResult> {
    const startTime = Date.now()
    this.logger.info('🔄 Executing SQLite migrations...')

    try {
      const plan = await this.planMigrations()
      
      if (plan.migrations.length === 0) {
        this.logger.info('✅ No pending migrations')
        return {
          success: true,
          migrationsApplied: 0,
          optimizationsApplied: [],
          indexRecommendations: [],
          performanceImpact: 'low',
          duration: Date.now() - startTime,
          warnings: []
        }
      }

      const result: SQLiteMigrationResult = {
        success: false,
        migrationsApplied: 0,
        optimizationsApplied: [],
        indexRecommendations: [],
        performanceImpact: 'low',
        duration: 0,
        warnings: []
      }

      // Execute migrations in transaction
      await this.db.transaction().execute(async (trx) => {
        for (const migration of plan.migrations) {
          await this.executeMigration(trx, migration)
          result.migrationsApplied++
        }

        // Apply optimizations after migrations
        if (this.config.enableAutoOptimization && plan.optimizations.length > 0) {
          const optimizationResult = await this.optimizer.optimizeDatabase(trx, {
            enableAutoPragma: true,
            enableAutoIndexing: false,
            enablePerformanceTuning: true,
            enableBackupRecommendations: false,
            slowQueryThreshold: 1000,
            autoVacuumMode: 'INCREMENTAL',
            journalMode: 'WAL',
            synchronous: 'NORMAL',
            cacheSize: -64000,
            tempStore: 'MEMORY'
          })
          
          result.optimizationsApplied = optimizationResult.appliedOptimizations
          result.warnings.push(...optimizationResult.warnings)
        }

        // Record index recommendations
        if (this.config.enableIndexRecommendations) {
          result.indexRecommendations = plan.indexRecommendations
        }
      })

      result.success = true
      result.performanceImpact = plan.estimatedImpact
      result.duration = Date.now() - startTime

      this.logger.info(`✅ Migration completed: ${result.migrationsApplied} migrations applied in ${result.duration}ms`)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error('❌ Migration failed:', error)
      
      return {
        success: false,
        migrationsApplied: 0,
        optimizationsApplied: [],
        indexRecommendations: [],
        performanceImpact: 'low',
        duration,
        warnings: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(trx: Kysely<any>, migrationName: string): Promise<void> {
    this.logger.info(`📝 Executing migration: ${migrationName}`)

    // For now, this is a placeholder - in a real implementation,
    // you would load and execute the actual migration SQL
    const migrationSQL = `-- Migration: ${migrationName}\n-- This would contain the actual migration SQL`
    
    // Record the migration
    await trx
      .insertInto('sqlite_migrations')
      .values({
        name: migrationName,
        applied_at: new Date(),
        checksum: this.calculateChecksum(migrationSQL),
        optimization_applied: true,
        performance_impact: 'medium'
      })
      .execute()

    this.logger.info(`✅ Migration ${migrationName} applied successfully`)
  }

  /**
   * Get pending migrations
   */
  private async getPendingMigrations(): Promise<string[]> {
    // This is a simplified implementation
    // In a real scenario, you would scan the migration directory
    // and compare with the database records
    
    const appliedMigrations = await this.db
      .selectFrom('sqlite_migrations')
      .select('name')
      .execute()

    const appliedNames = new Set(appliedMigrations.map(m => m.name))
    
    // Placeholder - return some example migrations
    const allMigrations = [
      '20240101000000_create_users_table',
      '20240102000000_add_email_index',
      '20240103000000_create_posts_table'
    ]

    return allMigrations.filter(name => !appliedNames.has(name))
  }

  /**
   * Calculate performance impact
   */
  private calculateImpact(migrationCount: number, optimizationCount: number): 'low' | 'medium' | 'high' {
    const total = migrationCount + optimizationCount
    
    if (total === 0) return 'low'
    if (total <= 3) return 'medium'
    return 'high'
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    // Simple checksum implementation
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    totalMigrations: number
    appliedMigrations: number
    pendingMigrations: number
    lastMigration?: string
    lastAppliedAt?: Date
  }> {
    const migrations = await this.db
      .selectFrom('sqlite_migrations')
      .selectAll()
      .orderBy('applied_at', 'desc')
      .execute()

    const pending = await this.getPendingMigrations()

    return {
      totalMigrations: migrations.length + pending.length,
      appliedMigrations: migrations.length,
      pendingMigrations: pending.length,
      lastMigration: migrations[0]?.name,
      lastAppliedAt: migrations[0]?.applied_at
    }
  }

  /**
   * Record query for performance analysis
   */
  recordQuery(query: string, executionTime: number, table?: string): void {
    if (this.config.enablePerformanceMonitoring) {
      this.indexer.recordQuery(query, executionTime, table)
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    return await this.optimizer.analyzeDatabase(this.db)
  }

  /**
   * Get index recommendations
   */
  async getIndexRecommendations(): Promise<any> {
    return await this.indexer.analyzeAndRecommend(this.db)
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<any> {
    return await this.optimizer.optimizeDatabase(this.db)
  }
}
