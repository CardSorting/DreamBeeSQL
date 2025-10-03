import { Kysely } from '../kysely.js'
import { MigrationManager, MigrationManagerConfig } from './migration-manager.js'
import { NodeMigrationFactory } from './node-factory.js'

/**
 * Convenience function to create a migration manager with Node.js dependencies
 * This automatically initializes the Node.js modules and creates the migration manager
 */
export async function createNodeMigrationManager(
  db: Kysely<any>, 
  config: Partial<MigrationManagerConfig> = {}
): Promise<MigrationManager> {
  // Initialize Node.js modules
  await NodeMigrationFactory.initialize()
  
  // Create migration manager (it will use the initialized Node.js modules)
  return MigrationManager.getInstance(db, config)
}

/**
 * Synchronous version that assumes Node.js modules are already initialized
 */
export function createNodeMigrationManagerSync(
  db: Kysely<any>, 
  config: Partial<MigrationManagerConfig> = {}
): MigrationManager {
  if (!NodeMigrationFactory.isInitialized()) {
    throw new Error('Node.js modules not initialized. Call NodeMigrationFactory.initialize() first or use createNodeMigrationManager() instead.')
  }
  
  return MigrationManager.getInstance(db, config)
}

/**
 * Initialize Node.js modules for use with migration system
 */
export async function initializeNodeModules(): Promise<void> {
  await NodeMigrationFactory.initialize()
}

/**
 * Check if Node.js modules are initialized
 */
export function isNodeModulesInitialized(): boolean {
  return NodeMigrationFactory.isInitialized()
}
