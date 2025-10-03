/**
 * Lightweight migration logger - single responsibility: log migration events
 * Zero database spam, minimal overhead, production ready
 */
export class MigrationLogger {
  private static instance: MigrationLogger | null = null
  private logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  private enableConsole: boolean

  private constructor(config: {
    logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    enableConsole?: boolean
  } = {}) {
    this.logLevel = config.logLevel || 'INFO'
    this.enableConsole = config.enableConsole !== false
  }

  static getInstance(config?: {
    logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    enableConsole?: boolean
  }): MigrationLogger {
    if (!MigrationLogger.instance) {
      MigrationLogger.instance = new MigrationLogger(config)
    }
    return MigrationLogger.instance
  }

  /**
   * Log migration start
   */
  start(migrationName: string): void {
    this.log('INFO', `🔄 Starting migration: ${migrationName}`)
  }

  /**
   * Log migration success
   */
  success(migrationName: string, duration: number): void {
    this.log('INFO', `✅ Migration completed: ${migrationName} (${duration}ms)`)
  }

  /**
   * Log migration failure
   */
  failure(migrationName: string, error: string, duration: number): void {
    this.log('ERROR', `❌ Migration failed: ${migrationName} (${duration}ms) - ${error}`)
  }

  /**
   * Log system info
   */
  info(message: string): void {
    this.log('INFO', message)
  }

  /**
   * Log warning
   */
  warn(message: string): void {
    this.log('WARN', message)
  }

  /**
   * Log error
   */
  error(message: string): void {
    this.log('ERROR', message)
  }

  /**
   * Log debug info
   */
  debug(message: string): void {
    this.log('DEBUG', message)
  }

  /**
   * Core logging method
   */
  private log(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string): void {
    if (!this.shouldLog(level)) return

    if (this.enableConsole) {
      const timestamp = new Date().toISOString()
      const levelIcon = this.getLevelIcon(level)
      console.log(`[${timestamp}] ${levelIcon} ${message}`)
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  /**
   * Get icon for log level
   */
  private getLevelIcon(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): string {
    switch (level) {
      case 'DEBUG': return '🔍'
      case 'INFO': return 'ℹ️'
      case 'WARN': return '⚠️'
      case 'ERROR': return '❌'
      default: return '📝'
    }
  }

  /**
   * Update log level
   */
  setLogLevel(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): void {
    this.logLevel = level
  }

  /**
   * Enable/disable console output
   */
  setConsoleOutput(enabled: boolean): void {
    this.enableConsole = enabled
  }
}