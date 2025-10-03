# NOORMME Developer Guide

> **Complete guide to building applications with NOORMME**

This comprehensive guide covers everything you need to know about NOORMME, from basic setup to advanced patterns.

## 🎯 What You'll Learn

- **Basic Operations** - CRUD operations and simple queries
- **Relationships** - Loading related data efficiently
- **Configuration** - Customizing NOORMME for your needs
- **Advanced Patterns** - Real-world usage examples
- **Performance** - Optimization techniques
- **Best Practices** - Production-ready patterns

## 📚 Guide Structure

| Section | Description | Time |
|---------|-------------|------|
| [Quick Start](#quick-start) | Get running in 2 minutes | 2 min |
| [Basic Operations](#basic-operations) | CRUD operations and queries | 10 min |
| [Relationships](#relationships) | Loading related data | 15 min |
| [Configuration](#configuration) | Customizing NOORMME | 10 min |
| [Real-world Examples](#real-world-examples) | Complete application patterns | 20 min |
| [Performance & Optimization](#performance--optimization) | Making it fast | 15 min |
| [API Reference](#api-reference) | Complete API documentation | Reference |

## 🚀 Quick Start

If you're new to NOORMME, start here:

```typescript
import { NOORMME } from 'noormme'

// 1. Connect to your existing database
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

// 2. Initialize (discovers schema automatically)
await db.initialize()

// 3. Use auto-generated repositories
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()
```

**That's it!** NOORMME automatically:
- ✅ Discovers all tables and relationships
- ✅ Generates TypeScript types
- ✅ Creates repository classes with CRUD operations
- ✅ Provides full IntelliSense support

> **New to NOORMME?** Check out [GETTING_STARTED.md](./GETTING_STARTED.md) for a step-by-step setup guide.

## 🔧 Basic Operations

### CRUD Operations

The foundation of any application is Create, Read, Update, and Delete operations:

```typescript
// Create a new user
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})
console.log('Created user:', user.id)

// Read operations
const foundUser = await userRepo.findById(user.id)
const allUsers = await userRepo.findAll()
const recentUsers = await userRepo.findRecent(10) // Custom method

// Update the user
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete the user
await userRepo.delete(user.id)
```

### Finding Data

```typescript
// Find by ID
const user = await userRepo.findById('123')

// Find by email (custom method)
const user = await userRepo.findByEmail('john@example.com')

// Find with conditions
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()

// Pagination
const users = await db
  .selectFrom('users')
  .selectAll()
  .limit(10)
  .offset(0)
  .execute()
```

### Working with Relationships

```typescript
// Load user with their posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Load nested relationships (posts with comments)
const userWithNested = await userRepo.findWithRelations(user.id, ['posts.comments'])

// Batch loading for performance
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts', 'profile'])
```

### Custom Queries

For complex queries, use the built-in Kysely query builder:

```typescript
// Complex query with joins
const usersWithPostCounts = await db
  .selectFrom('users')
  .leftJoin('posts', 'posts.userId', 'users.id')
  .select([
    'users.id',
    'users.email',
    'users.firstName',
    'users.lastName',
    db.fn.count('posts.id').as('postCount')
  ])
  .groupBy(['users.id', 'users.email', 'users.firstName', 'users.lastName'])
  .execute()

// Raw SQL when needed
const result = await db.execute('SELECT * FROM users WHERE active = ?', [true])
```

## ⚙️ Configuration

### Basic Configuration

```typescript
const db = new NOORMME({
  dialect: 'postgresql', // or 'mysql', 'sqlite', 'mssql'
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})
```

### Environment Configuration

For production applications, use environment variables:

```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
})
```

### Advanced Configuration

```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password',
    // Connection pooling
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    }
  },
  // Schema discovery options
  introspection: {
    includeViews: true,
    excludeTables: ['migrations', 'sessions'],
    customTypeMappings: {
      'jsonb': 'Record<string, any>',
      'custom_type': 'CustomTypeInterface'
    }
  },
  // Caching configuration
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  },
  // Logging configuration
  logging: {
    level: 'info',
    enabled: true,
    file: './noorm.log'
  },
  // Performance options
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})
```

### Configuration Examples

#### Development Configuration

```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp_dev',
    username: 'dev_user',
    password: 'dev_password'
  },
  logging: {
    level: 'debug',
    enabled: true
  }
})
```

#### Production Configuration

```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: true,
    pool: {
      min: 10,
      max: 50,
      idleTimeoutMillis: 30000
    }
  },
  cache: {
    ttl: 600000, // 10 minutes
    maxSize: 5000
  },
  logging: {
    level: 'warn',
    enabled: true
  },
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 200
  }
})
```

## 📖 Real-world Examples

### Blog Application

Let's build a complete blog application with NOORMME:

```typescript
import { NOORMME } from 'noormme'

// Initialize NOORMME
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'blog_app',
    username: 'user',
    password: 'password'
  }
})

await db.initialize()

// Get repositories
const userRepo = db.getRepository('users')
const postRepo = db.getRepository('posts')
const commentRepo = db.getRepository('comments')

// Create a new user
const user = await userRepo.create({
  email: 'author@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Create a blog post
const post = await postRepo.create({
  title: 'Getting Started with NOORM',
  content: 'NOORM makes database operations simple...',
  userId: user.id,
  published: true
})

// Add a comment
const comment = await commentRepo.create({
  content: 'Great post! Very helpful.',
  postId: post.id,
  userId: user.id
})

// Load post with all relationships
const postWithRelations = await postRepo.findWithRelations(post.id, [
  'user',
  'comments.user'
])

console.log(`Post "${postWithRelations.title}" by ${postWithRelations.user.firstName}`)
console.log(`Comments: ${postWithRelations.comments?.length}`)
```

### E-commerce Application

```typescript
// E-commerce example
const productRepo = db.getRepository('products')
const orderRepo = db.getRepository('orders')
const orderItemRepo = db.getRepository('order_items')

// Create a product
const product = await productRepo.create({
  name: 'Laptop',
  price: 999.99,
  description: 'High-performance laptop',
  stock: 10
})

// Create an order
const order = await orderRepo.create({
  userId: user.id,
  total: 999.99,
  status: 'pending'
})

// Add items to order
await orderItemRepo.create({
  orderId: order.id,
  productId: product.id,
  quantity: 1,
  price: product.price
})

// Load order with all details
const orderWithDetails = await orderRepo.findWithRelations(order.id, [
  'user',
  'orderItems.product'
])

console.log(`Order ${orderWithDetails.id} for ${orderWithDetails.user.email}`)
console.log(`Items: ${orderWithDetails.orderItems?.length}`)
```

### Social Media Application

```typescript
// Social media example
const postRepo = db.getRepository('posts')
const likeRepo = db.getRepository('likes')
const followRepo = db.getRepository('follows')

// Create a post
const post = await postRepo.create({
  content: 'Just learned about NOORM!',
  userId: user.id,
  createdAt: new Date()
})

// Like the post
await likeRepo.create({
  postId: post.id,
  userId: user.id
})

// Follow a user
await followRepo.create({
  followerId: user.id,
  followingId: 'other-user-id'
})

// Get user's feed (posts from followed users)
const feed = await db
  .selectFrom('posts')
  .innerJoin('follows', 'follows.followingId', 'posts.userId')
  .where('follows.followerId', '=', user.id)
  .selectAll()
  .orderBy('posts.createdAt', 'desc')
  .limit(20)
  .execute()

console.log(`Feed has ${feed.length} posts`)
```

## 🚀 Performance & Optimization

### Batch Loading

Avoid N+1 queries by using batch loading:

```typescript
// ❌ N+1 queries (slow)
const users = await userRepo.findAll()
for (const user of users) {
  await userRepo.loadRelationships(user, ['posts'])
}

// ✅ Batch loading (fast)
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

### Caching

Configure caching for better performance:

```typescript
const db = new NOORMME({
  // ... config
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  }
})

// Preload frequently accessed data
await db.preloadSchema()
```

### Query Optimization

```typescript
// Enable query optimization
db.updateConfig({
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})

// Monitor slow queries
db.onQuery((query, duration) => {
  if (duration > 1000) {
    console.warn(`Slow query: ${duration}ms`, query)
  }
})
```

### Connection Pooling

```typescript
const db = new NOORMME({
  // ... config
  connection: {
    // ... connection config
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    }
  }
})
```

## 🔄 Migration from Other ORMs

### From TypeORM

```typescript
// Before (TypeORM)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  email: string

  @OneToMany(() => Post, post => post.user)
  posts: Post[]
}

const user = await userRepository.findOne({
  where: { id },
  relations: ['posts']
})

// After (NOORM)
// No entity definition needed!
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

### From Prisma

```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true }
})

// After (NOORM)
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

### From Sequelize

```typescript
// Before (Sequelize)
const user = await User.findByPk(id, {
  include: [Post]
})

// After (NOORM)
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

> **Need more migration help?** Check out the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration steps.

## 🐛 Troubleshooting

### Common Issues

#### 1. "NOORM not initialized"
```typescript
// ❌ Wrong
const userRepo = db.getRepository('users')

// ✅ Correct
await db.initialize()
const userRepo = db.getRepository('users')
```

#### 2. "Repository not found for table"
```typescript
// ❌ Wrong table name
const userRepo = db.getRepository('Users') // Should be 'users'

// ✅ Correct
const userRepo = db.getRepository('users')
```

#### 3. Type errors with relationships
```typescript
// ❌ Wrong
const user = await userRepo.findWithRelations(id, ['Posts'])

// ✅ Correct
const user = await userRepo.findWithRelations(id, ['posts'])
```

### Debug Mode

```typescript
const db = new NOORMME({
  // ... config
  logging: {
    level: 'debug',
    enabled: true
  }
})

// Will log schema discovery, type generation, and queries
```

### Schema Issues

```typescript
// Check discovered schema
const schemaInfo = await db.getSchemaInfo()
console.log('Tables:', schemaInfo.tables)
console.log('Relationships:', schemaInfo.relationships)

// Refresh schema
await db.refreshSchema()
```

> **Need more troubleshooting help?** Check out the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide for comprehensive solutions.

## 🎯 Best Practices

### 1. Always Initialize

```typescript
// ✅ Good
const db = new NOORMME(config)
await db.initialize()

// ❌ Bad
const db = new NOORMME(config)
// Forgot to initialize!
```

### 2. Use Type Safety

```typescript
// ✅ Good
const user: User = await userRepo.findById(id)

// ❌ Bad
const user: any = await userRepo.findById(id)
```

### 3. Handle Errors

```typescript
// ✅ Good
try {
  const user = await userRepo.findById(id)
  if (!user) {
    throw new Error('User not found')
  }
  return user
} catch (error) {
  console.error('Error:', error)
  throw error
}

// ❌ Bad
const user = await userRepo.findById(id) // What if this fails?
```

### 4. Configure for Production

```typescript
// ✅ Good
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
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

// ❌ Bad
const db = new NOORMME({
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

## 🔧 API Reference

### NOORM Class

```typescript
class NOORM {
  constructor(config: NOORMConfig)
  async initialize(): Promise<void>
  getRepository<T>(tableName: string): T
  onSchemaChange(callback: (changes: SchemaChange[]) => void): void
  async refreshSchema(): Promise<RefreshResult>
  async getSchemaInfo(): Promise<SchemaInfo>
  updateConfig(updates: Partial<NOORMConfig>): void
  async close(): Promise<void>
}
```

### Repository Methods

```typescript
interface BaseRepository<T, TRow> {
  // CRUD
  async findById(id: any): Promise<T | null>
  async findAll(): Promise<T[]>
  async create(data: Partial<TRow>): Promise<T>
  async update(entity: T): Promise<T>
  async delete(id: any): Promise<boolean>
  
  // Relationships
  async findWithRelations(id: any, relations: string[]): Promise<T | null>
  async loadRelationships(entities: T[], relations: string[]): Promise<void>
}
```

### Configuration Types

```typescript
interface NOORMConfig {
  dialect: 'postgresql' | 'mysql' | 'sqlite' | 'mssql'
  connection: ConnectionConfig
  introspection?: IntrospectionConfig
  cache?: CacheConfig
  logging?: LoggingConfig
  performance?: PerformanceConfig
}
```

## 🚀 Advanced Features

### Schema Evolution

```typescript
// Monitor schema changes
db.onSchemaChange((changes) => {
  console.log('Schema changes detected:', changes)
  // Types and entities are automatically updated
})

// Start monitoring
await db.startSchemaMonitoring()
```

### Performance Monitoring

```typescript
// Set up monitoring
db.onQuery((query, duration) => {
  console.log(`Query: ${query} (${duration}ms)`)
})

db.onError((error) => {
  console.error('Database error:', error)
})

// Get metrics
const metrics = db.getPerformanceMetrics()
console.log('Query count:', metrics.queryCount)
console.log('Average time:', metrics.averageQueryTime)
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Read the docs** - Start with [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Check issues** - Look for "good first issue" labels
3. **Follow guidelines** - TypeScript best practices, test coverage
4. **Submit PR** - Include tests and documentation updates

## 📞 Need Help?

- **📖 Documentation** - Comprehensive guides in this directory
- **🐛 Issues** - [GitHub Issues](https://github.com/your-org/noorm/issues) for bugs
- **💬 Discussions** - [GitHub Discussions](https://github.com/your-org/noorm/discussions) for questions
- **💡 Ideas** - [Feature Requests](https://github.com/your-org/noorm/discussions/categories/ideas)

---

**Ready to get started?** Jump to [GETTING_STARTED.md](./GETTING_STARTED.md) for a 5-minute setup guide!
