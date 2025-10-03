// Core migration system - clean, composable, singleton-based
export { MigrationCore } from './migration-core.js'
export { MigrationResourceManager } from './resource-manager.js'
export { MigrationLogger } from './migration-logger.js'
export { MigrationManager } from './migration-manager.js'

// Re-export original Kysely migration components for backwards compatibility
export * from './migrator.js'
export * from './file-migration-provider.js'

// Import for internal use
import { MigrationManager } from './migration-manager.js'

// Convenience factory function
export function createMigrationManager(db: any, config?: any) {
  return MigrationManager.getInstance(db, config)
}

// Node.js specific exports
export { 
  createNodeMigrationManager, 
  createNodeMigrationManagerSync,
  initializeNodeModules,
  isNodeModulesInitialized
} from './node-migration-manager.js'

export { NodeMigrationFactory } from './node-factory.js'
