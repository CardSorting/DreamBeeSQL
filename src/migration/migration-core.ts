import { Kysely } from '../kysely.js'
import { sql } from '../raw-builder/sql.js'

export interface MigrationFile {
  name: string
  content: string
  timestamp: string
}

export interface MigrationRecord {
  id: string
  name: string
  applied_at: Date
  checksum: string
}

export interface MigrationConfig {
  migrationsDirectory: string
  migrationTimeout: number
  maxRetries: number
  retryDelay: number
}

export interface MigrationCoreFS {
  readdir(path: string): Promise<string[]>
  readFile(path: string, encoding: string): Promise<string>
  writeFile(path: string, data: string, encoding: string): Promise<void>
}

export interface MigrationCorePath {
  join(...path: string[]): string
}

export interface MigrationCoreCrypto {
  randomUUID(): string
}

/**
 * High-performance migration engine with caching and lazy loading
 * Zero database spam, minimal overhead, production ready
 */
export class MigrationCore {
  private static instance: MigrationCore | null = null
  private db: Kysely<any>
  private config: MigrationConfig
  private fs: MigrationCoreFS
  private path: MigrationCorePath
  private crypto: MigrationCoreCrypto
  private isInitialized = false
  
  // Performance optimizations
  private migrationFilesCache: MigrationFile[] | null = null
  private appliedMigrationsCache: MigrationRecord[] | null = null
  private cacheTimestamp = 0
  private readonly CACHE_TTL = 5000 // 5 seconds cache TTL
  private checksumCache = new Map<string, string>()

  private constructor(
    db: Kysely<any>, 
    fs: MigrationCoreFS,
    path: MigrationCorePath,
    crypto: MigrationCoreCrypto,
    config: Partial<MigrationConfig> = {}
  ) {
    this.db = db
    this.fs = fs
    this.path = path
    this.crypto = crypto
    this.config = {
      migrationsDirectory: './migrations',
      migrationTimeout: 30000,
      maxRetries: 3,
      retryDelay: 2000,
      ...config
    }
  }

  static getInstance(
    db: Kysely<any>, 
    fs: MigrationCoreFS,
    path: MigrationCorePath,
    crypto: MigrationCoreCrypto,
    config?: Partial<MigrationConfig>
  ): MigrationCore {
    if (!MigrationCore.instance) {
      MigrationCore.instance = new MigrationCore(db, fs, path, crypto, config)
    }
    return MigrationCore.instance
  }

  /**
   * Initialize migration system (creates tracking table only)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL
      )
    `.execute(this.db)

    this.isInitialized = true
  }

  /**
   * Get all migration files from directory (with caching)
   */
  async getMigrationFiles(): Promise<MigrationFile[]> {
    const now = Date.now()
    
    // Return cached result if still valid
    if (this.migrationFilesCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.migrationFilesCache
    }

    try {
      const files = await this.fs.readdir(this.config.migrationsDirectory)
      const sqlFiles = files
        .filter((file: string) => file.endsWith('.sql'))
        .sort()

      // Read all files in parallel for better performance
      const migrations = await Promise.all(
        sqlFiles.map(async (file: string) => {
          const filePath = this.path.join(this.config.migrationsDirectory, file)
          const content = await this.fs.readFile(filePath, 'utf-8')
          const timestamp = file.split('_')[0]
          
          return {
            name: file.replace('.sql', ''),
            content,
            timestamp
          }
        })
      )

      // Cache the result
      this.migrationFilesCache = migrations
      this.cacheTimestamp = now
      
      return migrations
    } catch (error) {
      return []
    }
  }

  /**
   * Get applied migrations (single query with caching)
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const now = Date.now()
    
    // Return cached result if still valid
    if (this.appliedMigrationsCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.appliedMigrationsCache
    }

    try {
      const records = await this.db
        .selectFrom('migrations')
        .selectAll()
        .orderBy('applied_at', 'asc')
        .execute()

      const migrations = records.map(row => ({
        id: row.id,
        name: row.name,
        applied_at: row.applied_at,
        checksum: row.checksum
      }))

      // Cache the result
      this.appliedMigrationsCache = migrations
      this.cacheTimestamp = now
      
      return migrations
    } catch {
      return []
    }
  }

  /**
   * Check if migration is applied (optimized with cache)
   */
  async isMigrationApplied(name: string): Promise<boolean> {
    // Use cache if available
    if (this.appliedMigrationsCache) {
      return this.appliedMigrationsCache.some(m => m.name === name)
    }

    try {
      const result = await this.db
        .selectFrom('migrations')
        .select('id')
        .where('name', '=', name)
        .executeTakeFirst()
      
      return !!result
    } catch {
      return false
    }
  }

  /**
   * Execute single migration with timeout and retry (optimized)
   */
  async executeMigration(migration: MigrationFile): Promise<void> {
    const migrationId = this.crypto.randomUUID()
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.executeWithTimeout(async () => {
          await this.db.transaction().execute(async (trx) => {
            // Execute migration SQL
            await sql.raw(migration.content).execute(trx)
            
            // Record migration
            await trx
              .insertInto('migrations')
              .values({
                id: migrationId,
                name: migration.name,
                checksum: this.calculateChecksum(migration.content),
                applied_at: new Date()
              })
              .execute()
          })
        })
        
        // Invalidate cache after successful migration
        this.invalidateCache()
        return // Success
      } catch (error) {
        lastError = error as Error
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    throw lastError || new Error('Migration failed')
  }

  /**
   * Execute all pending migrations (optimized)
   */
  async executeAllMigrations(): Promise<{ executed: number; failed: number }> {
    await this.initialize()

    // Get both in parallel for better performance
    const [migrationFiles, appliedMigrations] = await Promise.all([
      this.getMigrationFiles(),
      this.getAppliedMigrations()
    ])

    // Use Set for O(1) lookups instead of array includes
    const appliedNames = new Set(appliedMigrations.map(m => m.name))

    const pendingMigrations = migrationFiles.filter(
      file => !appliedNames.has(file.name)
    )

    let executed = 0
    let failed = 0

    for (const migration of pendingMigrations) {
      try {
        await this.executeMigration(migration)
        executed++
      } catch (error) {
        failed++
        break // Stop on first failure
      }
    }

    return { executed, failed }
  }

  /**
   * Create new migration file
   */
  async createMigration(name: string, content: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    const fileName = `${timestamp}_${name}.sql`
    const filePath = this.path.join(this.config.migrationsDirectory, fileName)
    
    await this.fs.writeFile(filePath, content, 'utf-8')
    return fileName
  }

  /**
   * Get migration status (optimized with parallel execution)
   */
  async getStatus(): Promise<{
    totalFiles: number
    appliedMigrations: number
    pendingMigrations: number
    lastApplied: string | null
  }> {
    await this.initialize()

    // Execute in parallel for better performance
    const [migrationFiles, appliedMigrations] = await Promise.all([
      this.getMigrationFiles(),
      this.getAppliedMigrations()
    ])
    
    return {
      totalFiles: migrationFiles.length,
      appliedMigrations: appliedMigrations.length,
      pendingMigrations: migrationFiles.length - appliedMigrations.length,
      lastApplied: appliedMigrations.length > 0 ? appliedMigrations[appliedMigrations.length - 1].name : null
    }
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${this.config.migrationTimeout}ms`)), this.config.migrationTimeout)
      })
    ])
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Calculate checksum for content verification (cached)
   */
  private calculateChecksum(content: string): string {
    // Check cache first
    if (this.checksumCache.has(content)) {
      return this.checksumCache.get(content)!
    }

    // Calculate checksum
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    const checksum = Math.abs(hash).toString(16)
    
    // Cache the result (limit cache size to prevent memory issues)
    if (this.checksumCache.size < 1000) {
      this.checksumCache.set(content, checksum)
    }
    
    return checksum
  }

  /**
   * Invalidate cache after migrations
   */
  private invalidateCache(): void {
    this.migrationFilesCache = null
    this.appliedMigrationsCache = null
    this.cacheTimestamp = 0
  }

  /**
   * Get configuration
   */
  getConfig(): MigrationConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
