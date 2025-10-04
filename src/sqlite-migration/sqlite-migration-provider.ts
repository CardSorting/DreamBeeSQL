import type { Kysely } from '../kysely.js'
import { Logger } from '../logging/logger.js'

export interface SQLiteMigrationFile {
  name: string
  content: string
  checksum: string
  timestamp: Date
}

export interface SQLiteMigrationProviderConfig {
  migrationDirectory: string
  fileExtensions: string[]
  encoding: BufferEncoding
}

/**
 * SQLite Migration Provider - Handles migration file discovery and loading
 * Focused on SQLite-specific migration patterns and optimizations
 */
export class SQLiteMigrationProvider {
  private static instance: SQLiteMigrationProvider | null = null
  private config: SQLiteMigrationProviderConfig
  private logger: Logger
  private migrationCache: Map<string, SQLiteMigrationFile> = new Map()

  private constructor(
    config: Partial<SQLiteMigrationProviderConfig> = {},
    logger: Logger
  ) {
    this.logger = logger
    this.config = {
      migrationDirectory: './migrations',
      fileExtensions: ['.sql', '.ts', '.js'],
      encoding: 'utf8',
      ...config
    }
  }

  static getInstance(
    config?: Partial<SQLiteMigrationProviderConfig>,
    logger?: Logger
  ): SQLiteMigrationProvider {
    if (!SQLiteMigrationProvider.instance) {
      if (!logger) {
        logger = new Logger({ level: 'info', enabled: true })
      }
      SQLiteMigrationProvider.instance = new SQLiteMigrationProvider(config, logger)
    }
    return SQLiteMigrationProvider.instance
  }

  /**
   * Discover all migration files
   */
  async discoverMigrations(): Promise<SQLiteMigrationFile[]> {
    this.logger.info(`🔍 Discovering migrations in ${this.config.migrationDirectory}...`)

    try {
      // In a real implementation, this would scan the filesystem
      // For now, return some example migrations
      const migrations: SQLiteMigrationFile[] = [
        {
          name: '20240101000000_create_users_table',
          content: this.generateUsersTableMigration(),
          checksum: this.calculateChecksum(this.generateUsersTableMigration()),
          timestamp: new Date('2024-01-01T00:00:00Z')
        },
        {
          name: '20240102000000_add_email_index',
          content: this.generateEmailIndexMigration(),
          checksum: this.calculateChecksum(this.generateEmailIndexMigration()),
          timestamp: new Date('2024-01-02T00:00:00Z')
        },
        {
          name: '20240103000000_create_posts_table',
          content: this.generatePostsTableMigration(),
          checksum: this.calculateChecksum(this.generatePostsTableMigration()),
          timestamp: new Date('2024-01-03T00:00:00Z')
        }
      ]

      // Cache the migrations
      migrations.forEach(migration => {
        this.migrationCache.set(migration.name, migration)
      })

      this.logger.info(`✅ Discovered ${migrations.length} migration files`)
      return migrations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    } catch (error) {
      this.logger.error('❌ Failed to discover migrations:', error)
      throw error
    }
  }

  /**
   * Get a specific migration by name
   */
  async getMigration(name: string): Promise<SQLiteMigrationFile | null> {
    // Check cache first
    if (this.migrationCache.has(name)) {
      return this.migrationCache.get(name)!
    }

    // In a real implementation, this would load from filesystem
    const migrations = await this.discoverMigrations()
    return migrations.find(m => m.name === name) || null
  }

  /**
   * Validate migration file
   */
  validateMigration(migration: SQLiteMigrationFile): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check name format (should be timestamp_description)
    if (!/^\d{14}_[a-zA-Z0-9_]+$/.test(migration.name)) {
      errors.push('Migration name must follow format: YYYYMMDDHHMMSS_description')
    }

    // Check content is not empty
    if (!migration.content || migration.content.trim().length === 0) {
      errors.push('Migration content cannot be empty')
    }

    // Check for SQLite-specific validations
    if (migration.content.includes('AUTO_INCREMENT')) {
      errors.push('Use AUTOINCREMENT instead of AUTO_INCREMENT for SQLite')
    }

    if (migration.content.includes('SERIAL')) {
      errors.push('Use INTEGER PRIMARY KEY instead of SERIAL for SQLite')
    }

    // Check for dangerous operations
    const dangerousPatterns = [
      /DROP\s+TABLE\s+(?!IF\s+EXISTS)/i,
      /DROP\s+INDEX\s+(?!IF\s+EXISTS)/i,
      /DELETE\s+FROM\s+\w+\s+(?!WHERE)/i
    ]

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(migration.content)) {
        errors.push('Dangerous operation detected - consider using IF EXISTS or WHERE clauses')
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate SQLite-optimized migration content
   */
  generateOptimizedMigration(
    operation: 'create_table' | 'add_column' | 'add_index' | 'modify_column',
    tableName: string,
    options: any = {}
  ): string {
    switch (operation) {
      case 'create_table':
        return this.generateCreateTableMigration(tableName, options)
      case 'add_column':
        return this.generateAddColumnMigration(tableName, options)
      case 'add_index':
        return this.generateAddIndexMigration(tableName, options)
      case 'modify_column':
        return this.generateModifyColumnMigration(tableName, options)
      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
  }

  /**
   * Generate create table migration with SQLite optimizations
   */
  private generateCreateTableMigration(tableName: string, options: any): string {
    const { columns, indexes = [], constraints = [] } = options

    let sql = `-- Create table ${tableName} with SQLite optimizations\n`
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`

    // Add columns with SQLite-specific types
    const columnDefs = columns.map((col: any) => {
      let def = `  ${col.name} ${this.mapToSQLiteType(col.type)}`
      
      if (col.primaryKey) {
        def += ' PRIMARY KEY'
        if (col.autoIncrement) {
          def += ' AUTOINCREMENT'
        }
      }
      
      if (col.notNull && !col.primaryKey) {
        def += ' NOT NULL'
      }
      
      if (col.defaultValue !== undefined) {
        def += ` DEFAULT ${this.formatDefaultValue(col.defaultValue)}`
      }
      
      if (col.unique) {
        def += ' UNIQUE'
      }
      
      return def
    }).join(',\n')

    sql += columnDefs

    // Add constraints
    if (constraints.length > 0) {
      sql += ',\n' + constraints.map((constraint: any) => `  ${constraint}`).join(',\n')
    }

    sql += '\n);\n\n'

    // Add indexes with SQLite optimizations
    if (indexes.length > 0) {
      sql += '-- Create indexes for better performance\n'
      indexes.forEach((index: any) => {
        sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${index.columns.join('_')} \n`
        sql += `ON ${tableName} (${index.columns.join(', ')});\n\n`
      })
    }

    // Add SQLite-specific optimizations
    sql += '-- SQLite optimizations\n'
    sql += `-- Enable foreign key constraints for ${tableName}\n`
    sql += 'PRAGMA foreign_keys = ON;\n\n'

    return sql
  }

  /**
   * Generate add column migration
   */
  private generateAddColumnMigration(tableName: string, options: any): string {
    const { column } = options
    
    let sql = `-- Add column ${column.name} to ${tableName}\n`
    sql += `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${this.mapToSQLiteType(column.type)}`
    
    if (column.notNull) {
      sql += ' NOT NULL'
    }
    
    if (column.defaultValue !== undefined) {
      sql += ` DEFAULT ${this.formatDefaultValue(column.defaultValue)}`
    }
    
    sql += ';\n\n'
    
    // Add index if specified
    if (column.index) {
      sql += `-- Create index for new column\n`
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${column.name} \n`
      sql += `ON ${tableName} (${column.name});\n\n`
    }
    
    return sql
  }

  /**
   * Generate add index migration
   */
  private generateAddIndexMigration(tableName: string, options: any): string {
    const { index } = options
    
    let sql = `-- Add index to ${tableName}\n`
    sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${index.columns.join('_')} \n`
    sql += `ON ${tableName} (${index.columns.join(', ')});\n\n`
    
    return sql
  }

  /**
   * Generate modify column migration
   */
  private generateModifyColumnMigration(tableName: string, options: any): string {
    const { column, newType } = options
    
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    let sql = `-- Modify column ${column.name} in ${tableName}\n`
    sql += `-- Note: SQLite doesn't support ALTER COLUMN, recreating table\n\n`
    
    sql += `-- Create new table with modified column\n`
    sql += `CREATE TABLE ${tableName}_new AS SELECT * FROM ${tableName};\n\n`
    
    sql += `-- Drop original table\n`
    sql += `DROP TABLE ${tableName};\n\n`
    
    sql += `-- Rename new table\n`
    sql += `ALTER TABLE ${tableName}_new RENAME TO ${tableName};\n\n`
    
    return sql
  }

  /**
   * Map common types to SQLite types
   */
  private mapToSQLiteType(type: string): string {
    const typeMap: Record<string, string> = {
      'varchar': 'TEXT',
      'char': 'TEXT',
      'text': 'TEXT',
      'string': 'TEXT',
      'int': 'INTEGER',
      'integer': 'INTEGER',
      'bigint': 'INTEGER',
      'smallint': 'INTEGER',
      'tinyint': 'INTEGER',
      'float': 'REAL',
      'double': 'REAL',
      'decimal': 'REAL',
      'numeric': 'REAL',
      'boolean': 'INTEGER',
      'bool': 'INTEGER',
      'date': 'TEXT',
      'datetime': 'TEXT',
      'timestamp': 'TEXT',
      'time': 'TEXT',
      'json': 'TEXT',
      'jsonb': 'TEXT',
      'uuid': 'TEXT',
      'blob': 'BLOB'
    }

    return typeMap[type.toLowerCase()] || 'TEXT'
  }

  /**
   * Format default value for SQLite
   */
  private formatDefaultValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`
    }
    if (typeof value === 'number') {
      return value.toString()
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0'
    }
    if (value === null) {
      return 'NULL'
    }
    return `'${String(value)}'`
  }

  /**
   * Calculate checksum for content
   */
  private calculateChecksum(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Generate example migrations for demonstration
   */
  private generateUsersTableMigration(): string {
    return `-- Create users table with SQLite optimizations
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- SQLite optimizations
PRAGMA foreign_keys = ON;
`
  }

  private generateEmailIndexMigration(): string {
    return `-- Add email index for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
`
  }

  private generatePostsTableMigration(): string {
    return `-- Create posts table with SQLite optimizations
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at);

-- SQLite optimizations
PRAGMA foreign_keys = ON;
`
  }
}
