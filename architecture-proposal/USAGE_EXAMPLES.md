# DreamBeeSQL Usage Examples

## 🎯 Overview

This document provides comprehensive usage examples for DreamBeeSQL, from basic setup to advanced features. Each example includes code, explanations, and expected outcomes.

## 🚀 Quick Start

### Basic Setup

```typescript
import { DreamBeeSQL } from 'dreambeesql'

// 1. Initialize DreamBeeSQL with zero configuration
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

// 2. Discover schema and generate types automatically
await db.initialize()

// 3. Use auto-generated repositories
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()

console.log('Users:', users)
```

**What happens:**
1. DreamBeeSQL connects to your PostgreSQL database
2. Automatically discovers all tables, columns, and relationships
3. Generates TypeScript types and entity classes
4. Creates repository classes with CRUD operations
5. Provides type-safe access to your data

## 📊 Database Schema Examples

### Example Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Basic CRUD Operations

### Creating Records

```typescript
// Create a new user
const userRepo = db.getRepository('users')
const newUser = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

console.log('Created user:', newUser.id)

// Create a post for the user
const postRepo = db.getRepository('posts')
const newPost = await postRepo.create({
  title: 'My First Post',
  content: 'This is my first post content',
  userId: newUser.id
})

console.log('Created post:', newPost.id)
```

### Reading Records

```typescript
// Find user by ID
const user = await userRepo.findById(newUser.id)
console.log('User:', user)

// Find all users
const allUsers = await userRepo.findAll()
console.log('All users:', allUsers.length)

// Find users by email
const userByEmail = await userRepo.findByEmail('john@example.com')
console.log('User by email:', userByEmail)

// Find posts by user ID
const userPosts = await postRepo.findByUserId(newUser.id)
console.log('User posts:', userPosts.length)
```

### Updating Records

```typescript
// Update user information
user.firstName = 'Johnny'
user.lastName = 'Smith'
const updatedUser = await userRepo.update(user)
console.log('Updated user:', updatedUser)

// Update post content
const post = await postRepo.findById(newPost.id)
post.content = 'Updated post content'
const updatedPost = await postRepo.update(post)
console.log('Updated post:', updatedPost)
```

### Deleting Records

```typescript
// Delete a comment
const commentRepo = db.getRepository('comments')
const comment = await commentRepo.findById(commentId)
const deleted = await commentRepo.delete(comment.id)
console.log('Comment deleted:', deleted)

// Delete a post and its comments
const post = await postRepo.findById(postId)
await commentRepo.deleteByPostId(post.id)
await postRepo.delete(post.id)
console.log('Post and comments deleted')
```

## 🔗 Relationship Loading

### Basic Relationships

```typescript
// Load user with posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])
console.log('User with posts:', userWithPosts.posts?.length)

// Load post with comments
const postWithComments = await postRepo.findWithRelations(post.id, ['comments'])
console.log('Post with comments:', postWithComments.comments?.length)

// Load comment with post and user
const commentWithRelations = await commentRepo.findWithRelations(comment.id, ['post', 'user'])
console.log('Comment with relations:', commentWithRelations)
```

### Advanced Relationships

```typescript
// Load user with all related data
const userWithAll = await userRepo.findWithRelations(user.id, [
  'posts',
  'profile',
  'comments'
])

console.log('User with all relations:', {
  posts: userWithAll.posts?.length,
  profile: userWithAll.profile ? 'Yes' : 'No',
  comments: userWithAll.comments?.length
})

// Load post with user and comments
const postWithAll = await postRepo.findWithRelations(post.id, [
  'user',
  'comments'
])

console.log('Post with all relations:', {
  user: postWithAll.user?.email,
  comments: postWithAll.comments?.length
})
```

### Nested Relationships

```typescript
// Load user with posts, and each post with comments
const userWithNested = await userRepo.findWithRelations(user.id, [
  'posts.comments',
  'profile'
])

console.log('User with nested relations:', {
  posts: userWithNested.posts?.map(post => ({
    title: post.title,
    comments: post.comments?.length || 0
  }))
})
```

## 🔍 Advanced Queries

### Custom Query Methods

```typescript
// Find recent posts
const recentPosts = await postRepo.findRecentPosts(10)
console.log('Recent posts:', recentPosts.length)

// Find posts by title search
const searchResults = await postRepo.findByTitle('First')
console.log('Search results:', searchResults.length)

// Find active users
const activeUsers = await userRepo.findActiveUsers()
console.log('Active users:', activeUsers.length)

// Find users by creation date range
const usersInRange = await userRepo.findByDateRange(
  new Date('2024-01-01'),
  new Date('2024-12-31')
)
console.log('Users in range:', usersInRange.length)
```

### Complex Queries

```typescript
// Find users with post count
const usersWithPostCount = await userRepo.findUsersWithPostCount()
console.log('Users with post count:', usersWithPostCount.map(u => ({
  email: u.email,
  postCount: u.postCount
})))

// Find popular posts (by comment count)
const popularPosts = await postRepo.findPopularPosts(5)
console.log('Popular posts:', popularPosts.map(p => ({
  title: p.title,
  commentCount: p.commentCount
})))

// Find users with most comments
const topCommenters = await userRepo.findTopCommenters(10)
console.log('Top commenters:', topCommenters.map(u => ({
  email: u.email,
  commentCount: u.commentCount
})))
```

## 🎨 Schema Evolution

### Monitoring Schema Changes

```typescript
// Set up schema change monitoring
db.onSchemaChange((changes) => {
  console.log('Schema changes detected:', changes)
  
  changes.forEach(change => {
    switch (change.type) {
      case 'TABLE_ADDED':
        console.log(`New table added: ${change.tableName}`)
        break
      case 'COLUMN_ADDED':
        console.log(`New column added: ${change.tableName}.${change.columnName}`)
        break
      case 'COLUMN_MODIFIED':
        console.log(`Column modified: ${change.tableName}.${change.columnName}`)
        break
      case 'TABLE_REMOVED':
        console.log(`Table removed: ${change.tableName}`)
        break
    }
  })
})

// Start monitoring
await db.startSchemaMonitoring()
```

### Handling Schema Changes

```typescript
// Manual schema refresh
const refreshResult = await db.refreshSchema()
if (refreshResult.success) {
  console.log('Schema refreshed successfully')
  console.log('New tables:', refreshResult.newTables)
  console.log('Modified tables:', refreshResult.modifiedTables)
} else {
  console.error('Schema refresh failed:', refreshResult.errors)
}

// Get schema information
const schemaInfo = await db.getSchemaInfo()
console.log('Schema info:', {
  totalTables: schemaInfo.totalTables,
  totalColumns: schemaInfo.totalColumns,
  totalRelationships: schemaInfo.totalRelationships,
  lastUpdated: schemaInfo.lastUpdated
})
```

## ⚡ Performance Optimization

### Caching

```typescript
// Configure caching
db.updateConfig({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  }
})

// Preload frequently used data
await db.preloadSchema()
await db.preloadRelationships(['users.posts', 'posts.comments'])

// Get cache statistics
const cacheStats = await db.getCacheStats()
console.log('Cache stats:', {
  hitRate: cacheStats.hitRate,
  totalEntries: cacheStats.totalEntries,
  memoryUsage: cacheStats.memoryUsage
})
```

### Query Optimization

```typescript
// Enable query optimization
db.updateConfig({
  queryOptimization: {
    enabled: true,
    maxDepth: 3,
    batchSize: 100
  }
})

// Use optimized queries
const optimizedUsers = await userRepo.findWithOptimizedRelations(user.id, [
  'posts.comments.user'
])

// Get query performance metrics
const queryStats = await db.getQueryStats()
console.log('Query stats:', {
  averageQueryTime: queryStats.averageQueryTime,
  totalQueries: queryStats.totalQueries,
  slowQueries: queryStats.slowQueries
})
```

## 🛡️ Error Handling

### Basic Error Handling

```typescript
try {
  const user = await userRepo.findById('invalid-id')
  if (!user) {
    throw new Error('User not found')
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message)
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message)
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

### Advanced Error Handling

```typescript
// Set up error handling
db.onError((error, context) => {
  console.error('DreamBeeSQL Error:', {
    message: error.message,
    type: error.constructor.name,
    context: context,
    timestamp: new Date().toISOString()
  })
  
  // Log to external service
  if (error instanceof DatabaseError) {
    logToExternalService(error, context)
  }
})

// Use fallback mechanisms
const user = await userRepo.findByIdWithFallback(userId, {
  fallbackToCache: true,
  fallbackToDefault: true,
  defaultUser: { id: userId, email: 'unknown@example.com' }
})
```

## 🔧 Configuration Examples

### Basic Configuration

```typescript
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  },
  introspection: {
    includeViews: true,
    includeSystemTables: false,
    customTypeMappings: {
      'custom_type': 'CustomTypeInterface'
    }
  },
  cache: {
    ttl: 300000,
    maxSize: 1000
  },
  logging: {
    level: 'info',
    enabled: true
  }
})
```

### Advanced Configuration

```typescript
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password',
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    }
  },
  introspection: {
    includeViews: true,
    includeSystemTables: false,
    customTypeMappings: {
      'custom_type': 'CustomTypeInterface',
      'jsonb': 'Record<string, any>'
    },
    relationshipDepth: 3,
    excludeTables: ['migrations', 'sessions']
  },
  cache: {
    ttl: 300000,
    maxSize: 1000,
    strategy: 'lru',
    preload: ['users', 'posts']
  },
  logging: {
    level: 'debug',
    enabled: true,
    file: './dreambeesql.log'
  },
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})
```

## 🧪 Testing Examples

### Unit Testing

```typescript
import { DreamBeeSQL } from 'dreambeesql'
import { createTestDatabase } from './test-utils'

describe('DreamBeeSQL', () => {
  let db: DreamBeeSQL
  
  beforeEach(async () => {
    const testDb = await createTestDatabase()
    db = new DreamBeeSQL({
      dialect: 'postgresql',
      connection: testDb.connection
    })
    await db.initialize()
  })
  
  afterEach(async () => {
    await db.close()
  })
  
  it('should create and find users', async () => {
    const userRepo = db.getRepository('users')
    
    const user = await userRepo.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    })
    
    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@example.com')
    
    const foundUser = await userRepo.findById(user.id)
    expect(foundUser).toEqual(user)
  })
  
  it('should load relationships', async () => {
    const userRepo = db.getRepository('users')
    const postRepo = db.getRepository('posts')
    
    const user = await userRepo.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    })
    
    const post = await postRepo.create({
      title: 'Test Post',
      content: 'Test content',
      userId: user.id
    })
    
    const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])
    expect(userWithPosts.posts).toHaveLength(1)
    expect(userWithPosts.posts[0].id).toBe(post.id)
  })
})
```

### Integration Testing

```typescript
describe('DreamBeeSQL Integration', () => {
  it('should handle complex relationships', async () => {
    const userRepo = db.getRepository('users')
    const postRepo = db.getRepository('posts')
    const commentRepo = db.getRepository('comments')
    
    // Create test data
    const user = await userRepo.create({
      email: 'integration@example.com',
      firstName: 'Integration',
      lastName: 'Test'
    })
    
    const post = await postRepo.create({
      title: 'Integration Test Post',
      content: 'Integration test content',
      userId: user.id
    })
    
    const comment = await commentRepo.create({
      content: 'Integration test comment',
      postId: post.id,
      userId: user.id
    })
    
    // Test complex relationship loading
    const userWithAll = await userRepo.findWithRelations(user.id, [
      'posts.comments.user',
      'comments.post'
    ])
    
    expect(userWithAll.posts).toHaveLength(1)
    expect(userWithAll.posts[0].comments).toHaveLength(1)
    expect(userWithAll.comments).toHaveLength(1)
    expect(userWithAll.comments[0].post.id).toBe(post.id)
  })
})
```

## 🚀 Production Examples

### Production Setup

```typescript
import { DreamBeeSQL } from 'dreambeesql'

// Production configuration
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  },
  introspection: {
    includeViews: true,
    excludeTables: ['migrations', 'sessions', 'logs']
  },
  cache: {
    ttl: 600000, // 10 minutes
    maxSize: 5000,
    strategy: 'lru'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: true,
    file: './logs/dreambeesql.log'
  },
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 200
  }
})

// Initialize with error handling
try {
  await db.initialize()
  console.log('DreamBeeSQL initialized successfully')
} catch (error) {
  console.error('Failed to initialize DreamBeeSQL:', error)
  process.exit(1)
}

// Set up health check
app.get('/health', async (req, res) => {
  try {
    const schemaInfo = await db.getSchemaInfo()
    res.json({
      status: 'healthy',
      database: 'connected',
      tables: schemaInfo.totalTables,
      lastUpdated: schemaInfo.lastUpdated
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    })
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down DreamBeeSQL...')
  await db.close()
  process.exit(0)
})
```

### Monitoring and Metrics

```typescript
// Set up monitoring
const metrics = {
  queries: 0,
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0
}

db.onQuery((query, duration) => {
  metrics.queries++
  console.log(`Query executed in ${duration}ms:`, query)
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
    queries: metrics.queries,
    errors: metrics.errors,
    cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses),
    ...db.getPerformanceMetrics()
  })
})
```

## 🎯 Best Practices

### 1. **Always Use Type Safety**

```typescript
// ✅ Good: Use auto-generated types
const user: User = await userRepo.findById(userId)

// ❌ Bad: Use any type
const user: any = await userRepo.findById(userId)
```

### 2. **Handle Errors Properly**

```typescript
// ✅ Good: Proper error handling
try {
  const user = await userRepo.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  return user
} catch (error) {
  console.error('Error fetching user:', error)
  throw error
}

// ❌ Bad: Ignore errors
const user = await userRepo.findById(userId) // What if this fails?
```

### 3. **Use Relationships Efficiently**

```typescript
// ✅ Good: Load only needed relationships
const user = await userRepo.findWithRelations(userId, ['posts'])

// ❌ Bad: Load all relationships
const user = await userRepo.findWithRelations(userId, ['posts', 'comments', 'profile', 'settings'])
```

### 4. **Configure for Production**

```typescript
// ✅ Good: Production configuration
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    }
  },
  cache: {
    ttl: 600000,
    maxSize: 5000
  },
  logging: {
    level: 'info',
    enabled: true
  }
})

// ❌ Bad: Development configuration in production
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})
```

### 5. **Monitor Performance**

```typescript
// ✅ Good: Monitor performance
const startTime = Date.now()
const users = await userRepo.findAll()
const duration = Date.now() - startTime

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`)
}

// ❌ Bad: Ignore performance
const users = await userRepo.findAll() // How long did this take?
```

## 🎉 Conclusion

These examples demonstrate the power and flexibility of DreamBeeSQL. The system provides:

- **Zero Configuration** - Works with any existing database
- **Type Safety** - Full TypeScript support with auto-generated types
- **Relationship Loading** - Automatic relationship detection and loading
- **Schema Evolution** - Automatic adaptation to database changes
- **Performance Optimization** - Smart caching and query optimization
- **Error Handling** - Comprehensive error handling and fallbacks
- **Production Ready** - Built for production use with monitoring and metrics

Start with the basic examples and gradually work your way up to the advanced features as your needs grow.
