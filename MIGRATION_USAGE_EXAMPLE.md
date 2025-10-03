# DreamBeeSQL Migration System - Clean Usage

## 🚀 Simple Usage

```typescript
import { Kysely, createNodeMigrationManager } from 'kysely'

// Create database connection
const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: ':memory:'
  })
})

// Create migration manager with automatic Node.js dependency injection
const migrationManager = await createNodeMigrationManager(db, {
  migrationsDirectory: './migrations',
  migrationTimeout: 30000,
  maxConcurrentMigrations: 3,
  logLevel: 'INFO'
})

// Initialize and run migrations
await migrationManager.initialize()
const result = await migrationManager.migrate()

console.log(`Migrations: ${result.executed} executed, ${result.failed} failed`)
```

## Alternative: Manual Node.js Module Initialization

```typescript
import { Kysely, initializeNodeModules, createNodeMigrationManagerSync } from 'kysely'

// Initialize Node.js modules first
await initializeNodeModules()

// Create database connection
const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: ':memory:'
  })
})

// Create migration manager synchronously (modules already initialized)
const migrationManager = createNodeMigrationManagerSync(db, {
  migrationsDirectory: './migrations',
  migrationTimeout: 30000,
  maxConcurrentMigrations: 3,
  logLevel: 'INFO'
})

// Initialize and run migrations
await migrationManager.initialize()
const result = await migrationManager.migrate()

console.log(`Migrations: ${result.executed} executed, ${result.failed} failed`)
```

## 📝 Creating Migrations

### SQL Migration Files
```sql
-- migrations/20241201120000_initial_schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### Create via Code
```typescript
const fileName = await migrationManager.createMigration(
  'add_user_preferences',
  `CREATE TABLE user_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    preferences JSON NOT NULL
  );`
)
```

## 🔍 Status and Monitoring

```typescript
// Quick status check
const status = await migrationManager.getStatus()
console.log({
  totalFiles: status.totalFiles,
  applied: status.appliedMigrations,
  pending: status.pendingMigrations,
  lastApplied: status.lastApplied,
  resourceUtilization: status.resourceUtilization
})

// Quick pending count
const pendingCount = await migrationManager.getPendingCount()
console.log(`Pending migrations: ${pendingCount}`)

// Check if up to date
const isUpToDate = await migrationManager.isUpToDate()
console.log(`System up to date: ${isUpToDate}`)
```

## ⚙️ Configuration

```typescript
// Update configuration
migrationManager.updateConfig({
  migrationTimeout: 60000,        // 60 seconds
  maxConcurrentMigrations: 5,     // Allow more concurrent
  logLevel: 'DEBUG'               // Verbose logging
})

// Get current configuration
const config = migrationManager.getConfig()
console.log(config)
```

## 🧹 Cleanup

```typescript
// Cleanup resources (for shutdown)
await migrationManager.cleanup()
```

## 🎯 Advanced Usage

```typescript
// Access individual components if needed
const { core, resourceManager, logger } = migrationManager.getComponents()

// Use core directly for advanced operations
const migrationFiles = await core.getMigrationFiles()
const appliedMigrations = await core.getAppliedMigrations()

// Use resource manager for custom operations
const cleanup = await resourceManager.acquireResources('custom-operation')
try {
  // Your custom operation
} finally {
  cleanup()
}

// Use logger for custom logging
logger.info('Custom operation started')
logger.success('Custom operation completed', 1250)
```

## 🏗️ Architecture

The system is built with clean, composable components:

- **MigrationManager** - Main orchestrator (singleton)
- **MigrationCore** - Core migration engine (singleton)
- **MigrationResourceManager** - Resource management (singleton)
- **MigrationLogger** - Lightweight logging (singleton)

Each component has a single responsibility and can be used independently or together.

## ✨ Key Features

- ✅ **Zero Database Spam** - Minimal queries, no unnecessary health checks
- ✅ **Industry Standard** - Clean, focused, single-responsibility design
- ✅ **High Performance** - Minimal overhead and fast operations
- ✅ **Production Ready** - Robust error handling and resource management
- ✅ **Maintainable** - Simple, clear code that's easy to understand
- ✅ **Composable** - Use components independently or together
- ✅ **Singleton Pattern** - Efficient resource usage
- ✅ **Type Safe** - Full TypeScript support
