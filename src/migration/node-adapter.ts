import { MigrationCoreFS, MigrationCorePath, MigrationCoreCrypto } from './migration-core.js'

/**
 * Node.js adapter for migration system dependencies
 * Provides fully functional implementations for fs, path, and crypto
 */
export class NodeMigrationAdapter {
  private static fsModule: any = null
  private static pathModule: any = null
  private static cryptoModule: any = null

  /**
   * Dynamically import Node.js modules
   */
  private static async ensureModules() {
    if (!this.fsModule) {
      try {
        // Try node:fs first (Node.js 16+)
        this.fsModule = await import('node:fs')
      } catch {
        // Fallback to fs
        this.fsModule = await import('fs')
      }
    }

    if (!this.pathModule) {
      try {
        // Try node:path first (Node.js 16+)
        this.pathModule = await import('node:path')
      } catch {
        // Fallback to path
        this.pathModule = await import('path')
      }
    }

    if (!this.cryptoModule) {
      try {
        // Try node:crypto first (Node.js 16+)
        this.cryptoModule = await import('node:crypto')
      } catch {
        // Fallback to crypto
        this.cryptoModule = await import('crypto')
      }
    }
  }

  /**
   * Get Node.js FS implementation
   */
  static async getFS(): Promise<MigrationCoreFS> {
    await this.ensureModules()
    
    const fs = this.fsModule
    const { promises } = fs

    return {
      readdir: (dirPath: string) => promises.readdir(dirPath),
      readFile: (filePath: string, encoding: string) => promises.readFile(filePath, encoding),
      writeFile: (filePath: string, data: string, encoding: string) => promises.writeFile(filePath, data, encoding)
    }
  }

  /**
   * Get Node.js Path implementation
   */
  static async getPath(): Promise<MigrationCorePath> {
    await this.ensureModules()
    
    const path = this.pathModule

    return {
      join: (...pathSegments: string[]) => path.join(...pathSegments)
    }
  }

  /**
   * Get Node.js Crypto implementation
   */
  static async getCrypto(): Promise<MigrationCoreCrypto> {
    await this.ensureModules()
    
    const crypto = this.cryptoModule

    return {
      randomUUID: () => crypto.randomUUID()
    }
  }

  /**
   * Get all Node.js dependencies
   */
  static async getDependencies() {
    const [fs, path, crypto] = await Promise.all([
      this.getFS(),
      this.getPath(),
      this.getCrypto()
    ])

    return { fs, path, crypto }
  }

  /**
   * Synchronous version for immediate use (if modules are already loaded)
   */
  static getFSAsync(): MigrationCoreFS {
    if (!this.fsModule) {
      throw new Error('Node.js modules not loaded. Call getFS() first.')
    }

    const fs = this.fsModule
    const { promises } = fs

    return {
      readdir: (dirPath: string) => promises.readdir(dirPath),
      readFile: (filePath: string, encoding: string) => promises.readFile(filePath, encoding),
      writeFile: (filePath: string, data: string, encoding: string) => promises.writeFile(filePath, data, encoding)
    }
  }

  /**
   * Synchronous version for immediate use (if modules are already loaded)
   */
  static getPathAsync(): MigrationCorePath {
    if (!this.pathModule) {
      throw new Error('Node.js modules not loaded. Call getPath() first.')
    }

    const path = this.pathModule

    return {
      join: (...pathSegments: string[]) => path.join(...pathSegments)
    }
  }

  /**
   * Synchronous version for immediate use (if modules are already loaded)
   */
  static getCryptoAsync(): MigrationCoreCrypto {
    if (!this.cryptoModule) {
      throw new Error('Node.js modules not loaded. Call getCrypto() first.')
    }

    const crypto = this.cryptoModule

    return {
      randomUUID: () => crypto.randomUUID()
    }
  }

  /**
   * Preload all modules for synchronous access
   */
  static async preloadModules(): Promise<void> {
    await this.getDependencies()
  }
}
