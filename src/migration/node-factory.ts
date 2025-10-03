import { MigrationCoreFS, MigrationCorePath, MigrationCoreCrypto } from './migration-core.js'

/**
 * Factory for creating Node.js implementations of migration dependencies
 * This handles the dynamic imports and provides synchronous access
 */
export class NodeMigrationFactory {
  private static fsImpl: MigrationCoreFS | null = null
  private static pathImpl: MigrationCorePath | null = null
  private static cryptoImpl: MigrationCoreCrypto | null = null
  private static initialized = false

  /**
   * Initialize all Node.js modules
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamic imports with fallbacks
      let fsModule: any
      let pathModule: any
      let cryptoModule: any

      try {
        fsModule = await import('node:fs')
      } catch {
        fsModule = await import('fs')
      }

      try {
        pathModule = await import('node:path')
      } catch {
        pathModule = await import('path')
      }

      try {
        cryptoModule = await import('node:crypto')
      } catch {
        cryptoModule = await import('crypto')
      }

      // Create implementations
      this.fsImpl = {
        readdir: (dirPath: string) => fsModule.promises.readdir(dirPath),
        readFile: (filePath: string, encoding: string) => fsModule.promises.readFile(filePath, encoding),
        writeFile: (filePath: string, data: string, encoding: string) => fsModule.promises.writeFile(filePath, data, encoding)
      }

      this.pathImpl = {
        join: (...pathSegments: string[]) => pathModule.join(...pathSegments)
      }

      this.cryptoImpl = {
        randomUUID: () => cryptoModule.randomUUID()
      }

      this.initialized = true
    } catch (error) {
      throw new Error(`Failed to initialize Node.js modules: ${error}`)
    }
  }

  /**
   * Get FS implementation (must call initialize() first)
   */
  static getFS(): MigrationCoreFS {
    if (!this.initialized || !this.fsImpl) {
      throw new Error('NodeMigrationFactory not initialized. Call initialize() first.')
    }
    return this.fsImpl
  }

  /**
   * Get Path implementation (must call initialize() first)
   */
  static getPath(): MigrationCorePath {
    if (!this.initialized || !this.pathImpl) {
      throw new Error('NodeMigrationFactory not initialized. Call initialize() first.')
    }
    return this.pathImpl
  }

  /**
   * Get Crypto implementation (must call initialize() first)
   */
  static getCrypto(): MigrationCoreCrypto {
    if (!this.initialized || !this.cryptoImpl) {
      throw new Error('NodeMigrationFactory not initialized. Call initialize() first.')
    }
    return this.cryptoImpl
  }

  /**
   * Get all implementations
   */
  static getAll(): {
    fs: MigrationCoreFS
    path: MigrationCorePath
    crypto: MigrationCoreCrypto
  } {
    return {
      fs: this.getFS(),
      path: this.getPath(),
      crypto: this.getCrypto()
    }
  }

  /**
   * Check if factory is initialized
   */
  static isInitialized(): boolean {
    return this.initialized
  }
}
