# NOORM Troubleshooting Guide

> **Quick solutions to common NOORM issues**

This guide provides solutions to the most common issues you might encounter when using NOORM.

## 📚 Navigation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - 5-minute setup guide
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Comprehensive documentation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common operations
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from other ORMs
- **[examples/](./examples/)** - Real-world usage patterns

## 🚨 Common Issues

### 1. Initialization Issues

#### "NOORM not initialized"
```typescript
// ❌ Wrong - Using repository before initialization
const db = new NOORM(config)
const userRepo = db.getRepository('users') // Error!

// ✅ Correct - Initialize first
const db = new NOORM(config)
await db.initialize()
const userRepo = db.getRepository('users')
```

#### "Database connection failed"
```typescript
// ❌ Wrong - Invalid connection config
const db = new NOORM({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

// ✅ Correct - Check connection details
const db = new NOORM({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password'
  }
})

// Test connection
try {
  await db.initialize()
  console.log('✅ Database connected successfully')
} catch (error) {
  console.error('❌ Database connection failed:', error.message)
}
```

### 2. Repository Issues

#### "Repository not found for table"
```typescript
// ❌ Wrong - Incorrect table name
const userRepo = db.getRepository('Users') // Should be 'users'

// ✅ Correct - Use exact table name
const userRepo = db.getRepository('users')

// Check available tables
const schemaInfo = await db.getSchemaInfo()
console.log('Available tables:', schemaInfo.tables)
```

#### "Table does not exist"
```typescript
// ❌ Wrong - Table doesn't exist in database
const userRepo = db.getRepository('nonexistent_table')

// ✅ Correct - Check if table exists
const schemaInfo = await db.getSchemaInfo()
if (!schemaInfo.tables.includes('users')) {
  throw new Error('Users table does not exist')
}
const userRepo = db.getRepository('users')
```

### 3. Type Issues

#### "Type errors with relationships"
```typescript
// ❌ Wrong - Incorrect relationship name
const user = await userRepo.findWithRelations(id, ['Posts']) // Should be 'posts'

// ✅ Correct - Use exact relationship name
const user = await userRepo.findWithRelations(id, ['posts'])

// Check available relationships
const schemaInfo = await db.getSchemaInfo()
console.log('Available relationships:', schemaInfo.relationships)
```

#### "Property does not exist on type"
```typescript
// ❌ Wrong - Property doesn't exist
const user = await userRepo.findById(id)
console.log(user.nonExistentProperty) // Error!

// ✅ Correct - Use auto-generated types
const user = await userRepo.findById(id)
if (user) {
  console.log(user.email) // ✅ This exists
  console.log(user.firstName) // ✅ This exists
}
```

### 4. Relationship Issues

#### "Relationship not found"
```typescript
// ❌ Wrong - Relationship doesn't exist
const user = await userRepo.findWithRelations(id, ['nonexistent_relation'])

// ✅ Correct - Check available relationships
const schemaInfo = await db.getSchemaInfo()
const userRelations = schemaInfo.relationships['users'] || []
if (!userRelations.includes('posts')) {
  throw new Error('Posts relationship not found for users table')
}
const user = await userRepo.findWithRelations(id, ['posts'])
```

#### "N+1 query problem"
```typescript
// ❌ Wrong - N+1 queries
const users = await userRepo.findAll()
for (const user of users) {
  await userRepo.loadRelationships(user, ['posts']) // N+1 queries!
}

// ✅ Correct - Batch loading
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts']) // Single query
```

### 5. Performance Issues

#### "Slow queries"
```typescript
// ❌ Wrong - No indexing
const users = await db
  .selectFrom('users')
  .where('email', '=', email) // No index on email
  .selectAll()
  .execute()

// ✅ Correct - Use indexed columns or add indexes
// Add index: CREATE INDEX idx_users_email ON users(email)
const users = await db
  .selectFrom('users')
  .where('email', '=', email) // Now uses index
  .selectAll()
  .execute()
```

#### "Memory usage issues"
```typescript
// ❌ Wrong - Loading too much data
const users = await userRepo.findAll() // Loads all users
const posts = await postRepo.findAll() // Loads all posts

// ✅ Correct - Use pagination
const users = await db
  .selectFrom('users')
  .selectAll()
  .limit(100)
  .offset(0)
  .execute()

const posts = await db
  .selectFrom('posts')
  .selectAll()
  .limit(100)
  .offset(0)
  .execute()
```

### 6. Configuration Issues

#### "Invalid configuration"
```typescript
// ❌ Wrong - Invalid config
const db = new NOORM({
  dialect: 'invalid_dialect',
  connection: {
    host: '',
    port: -1,
    database: '',
    username: '',
    password: ''
  }
})

// ✅ Correct - Validate config
function validateConfig(config: NOORMConfig): void {
  if (!['postgresql', 'mysql', 'sqlite', 'mssql'].includes(config.dialect)) {
    throw new Error('Invalid dialect')
  }
  
  if (!config.connection.host) {
    throw new Error('Host is required')
  }
  
  if (config.connection.port <= 0) {
    throw new Error('Port must be positive')
  }
  
  if (!config.connection.database) {
    throw new Error('Database name is required')
  }
}

const config = {
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
}

validateConfig(config)
const db = new NOORM(config)
```

## 🔧 Quick Debugging

### 1. Enable Debug Logging

```typescript
const db = new NOORM({
  // ... config
  logging: {
    level: 'debug',
    enabled: true,
    file: './noorm.log'
  }
})

// This will log:
// - Schema discovery process
// - Type generation
// - Query execution
// - Relationship loading
// - Cache operations
```

### 2. Check Schema Discovery

```typescript
// Check what was discovered
const schemaInfo = await db.getSchemaInfo()
console.log('Schema Info:', {
  tables: schemaInfo.tables,
  relationships: schemaInfo.relationships,
  lastUpdated: schemaInfo.lastUpdated
})

// Check specific table
const userTable = await db.getTableSchema('users')
console.log('Users table schema:', userTable)
```

### 3. Monitor Performance

```typescript
// Set up performance monitoring
db.onQuery((query, duration) => {
  if (duration > 1000) {
    console.warn(`Slow query detected: ${duration}ms`, query)
  }
})

db.onError((error) => {
  console.error('Database error:', error)
})

// Get performance metrics
const metrics = db.getPerformanceMetrics()
console.log('Performance metrics:', {
  queryCount: metrics.queryCount,
  averageQueryTime: metrics.averageQueryTime,
  slowQueries: metrics.slowQueries
})
```

### 4. Test Database Connection

```typescript
// Test connection before initializing
async function testConnection(config: NOORMConfig): Promise<boolean> {
  try {
    const db = new NOORM(config)
    await db.initialize()
    
    // Test basic query
    const result = await db.query('SELECT 1 as test')
    console.log('✅ Connection test passed:', result)
    
    await db.close()
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

const isConnected = await testConnection(config)
if (!isConnected) {
  throw new Error('Database connection failed')
}
```

## 🛠️ Quick Solutions

### 1. Schema Issues

#### Problem: Tables not discovered
```typescript
// Solution: Check database permissions
const db = new NOORM({
  // ... config
  introspection: {
    includeViews: true,
    includeSystemTables: false,
    excludeTables: ['migrations', 'sessions']
  }
})
```

#### Problem: Relationships not detected
```typescript
// Solution: Check foreign key constraints
// Ensure foreign keys are properly defined in database
// Example: ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id)
```

### 2. Type Issues

#### Problem: Type generation fails
```typescript
// Solution: Check custom type mappings
const db = new NOORM({
  // ... config
  introspection: {
    customTypeMappings: {
      'jsonb': 'Record<string, any>',
      'custom_type': 'CustomTypeInterface'
    }
  }
})
```

#### Problem: Type errors in IDE
```typescript
// Solution: Regenerate types
await db.refreshSchema()

// Or restart TypeScript server in IDE
// VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### 3. Performance Issues

#### Problem: Slow schema discovery
```typescript
// Solution: Cache schema
const db = new NOORM({
  // ... config
  cache: {
    ttl: 600000, // 10 minutes
    maxSize: 1000
  }
})

// Preload schema
await db.preloadSchema()
```

#### Problem: Slow queries
```typescript
// Solution: Use query optimization
db.updateConfig({
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})
```

### 4. Memory Issues

#### Problem: High memory usage
```typescript
// Solution: Configure connection pooling
const db = new NOORM({
  // ... config
  connection: {
    // ... connection config
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    }
  }
})
```

#### Problem: Memory leaks
```typescript
// Solution: Proper cleanup
process.on('SIGTERM', async () => {
  console.log('Shutting down NOORM...')
  await db.close()
  process.exit(0)
})
```

## 📊 Performance Monitoring

### 1. Set Up Monitoring

```typescript
// Comprehensive monitoring
const metrics = {
  queries: 0,
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  slowQueries: 0
}

db.onQuery((query, duration) => {
  metrics.queries++
  if (duration > 1000) {
    metrics.slowQueries++
    console.warn(`Slow query: ${duration}ms`, query)
  }
})

db.onError((error) => {
  metrics.errors++
  console.error('Database error:', error)
})

db.onCacheHit(() => {
  metrics.cacheHits++
})

db.onCacheMiss(() => {
  metrics.cacheMisses++
})

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    ...metrics,
    cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses),
    averageQueryTime: metrics.queries > 0 ? metrics.totalQueryTime / metrics.queries : 0
  })
})
```

### 2. Health Checks

```typescript
// Database health check
app.get('/health', async (req, res) => {
  try {
    const schemaInfo = await db.getSchemaInfo()
    const cacheStats = await db.getCacheStats()
    
    res.json({
      status: 'healthy',
      database: 'connected',
      tables: schemaInfo.tables.length,
      relationships: Object.keys(schemaInfo.relationships).length,
      cacheHitRate: cacheStats.hitRate,
      lastUpdated: schemaInfo.lastUpdated
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    })
  }
})
```

## 🚨 Emergency Procedures

### 1. Database Connection Lost

```typescript
// Automatic reconnection
let isConnected = false

async function ensureConnection() {
  if (!isConnected) {
    try {
      await db.initialize()
      isConnected = true
      console.log('✅ Database reconnected')
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message)
      // Retry after delay
      setTimeout(ensureConnection, 5000)
    }
  }
}

// Check connection periodically
setInterval(ensureConnection, 30000)
```

### 2. Schema Changes Detected

```typescript
// Handle schema changes
db.onSchemaChange((changes) => {
  console.log('Schema changes detected:', changes)
  
  // Refresh schema
  db.refreshSchema().then(() => {
    console.log('✅ Schema refreshed successfully')
  }).catch((error) => {
    console.error('❌ Schema refresh failed:', error)
  })
})
```

### 3. Performance Degradation

```typescript
// Monitor performance and alert
let queryCount = 0
let totalTime = 0

db.onQuery((query, duration) => {
  queryCount++
  totalTime += duration
  
  const averageTime = totalTime / queryCount
  
  if (averageTime > 2000) { // 2 seconds
    console.warn('⚠️ Performance degradation detected')
    console.warn(`Average query time: ${averageTime}ms`)
    
    // Clear cache
    db.clearCache()
    
    // Restart connection pool
    db.restartConnectionPool()
  }
})
```

## 📚 Additional Resources

### Documentation
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete developer guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference card
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from other ORMs
- **[TYPESCRIPT_CHEAT_SHEET.md](./TYPESCRIPT_CHEAT_SHEET.md)** - TypeScript patterns

### Community
- GitHub Issues - Report bugs and request features
- Discussions - Ask questions and share solutions
- Pull Requests - Contribute fixes and improvements

### Tools
- Database clients (pgAdmin, MySQL Workbench, etc.)
- Query analyzers (EXPLAIN ANALYZE)
- Performance monitoring tools
- TypeScript language server

---

**Still having issues?** Check the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for comprehensive examples and patterns!
