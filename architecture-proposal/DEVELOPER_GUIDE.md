# NOORM Developer Guide

## 🎯 What is NOORM?

NOORM is a **zero-configuration pseudo-ORM** that automatically discovers your database schema and generates TypeScript types, entities, and repositories. No manual entity definitions required!

## 🚀 Quick Start (2 minutes)

```typescript
import { NOORM } from 'noorm'

// 1. Connect to your existing database
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

// 2. Initialize (discovers schema automatically)
await db.initialize()

// 3. Use auto-generated repositories
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()
```

**That's it!** NOORM automatically:
- ✅ Discovers all tables and relationships
- ✅ Generates TypeScript types
- ✅ Creates repository classes with CRUD operations
- ✅ Provides full IntelliSense support

## 📚 Guide Structure

1. **[Basic Usage](#basic-usage)** - CRUD operations and relationships
2. **[Configuration](#configuration)** - Setup options
3. **[Examples](#examples)** - Real-world patterns
4. **[API Reference](#api-reference)** - Complete API docs
5. **[Migration Guide](#migration-guide)** - From other ORMs
6. **[Troubleshooting](#troubleshooting)** - Common issues

## 🔧 Basic Usage

### CRUD Operations

```typescript
// Create
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Read
const foundUser = await userRepo.findById(user.id)
const allUsers = await userRepo.findAll()

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete
await userRepo.delete(user.id)
```

### Relationships

```typescript
// Load user with posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Load nested relationships
const userWithNested = await userRepo.findWithRelations(user.id, ['posts.comments'])
```

### Custom Queries

```typescript
// Using Kysely for complex queries
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()
```

## ⚙️ Configuration

### Basic Configuration

```typescript
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
```

### Advanced Configuration

```typescript
const db = new NOORM({
  dialect: 'postgresql',
  connection: { /* connection config */ },
  introspection: {
    includeViews: true,
    excludeTables: ['migrations', 'sessions'],
    customTypeMappings: {
      'jsonb': 'Record<string, any>'
    }
  },
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  },
  logging: {
    level: 'info',
    enabled: true
  }
})
```

### Environment Configuration

```typescript
const db = new NOORM({
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

## 📖 Examples

### Blog Application

```typescript
// Initialize
const db = new NOORM({ /* config */ })
await db.initialize()

// Get repositories
const userRepo = db.getRepository('users')
const postRepo = db.getRepository('posts')
const commentRepo = db.getRepository('comments')

// Create blog post
const user = await userRepo.create({
  email: 'author@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

const post = await postRepo.create({
  title: 'My First Post',
  content: 'Hello world!',
  userId: user.id
})

// Add comment
const comment = await commentRepo.create({
  content: 'Great post!',
  postId: post.id,
  userId: user.id
})

// Load with relationships
const postWithComments = await postRepo.findWithRelations(post.id, ['comments.user'])
console.log(`Post "${postWithComments.title}" has ${postWithComments.comments?.length} comments`)
```

## 🔄 Migration Guide

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

// After (NOORM)
// No entity definition needed!
const userRepo = db.getRepository('users')
const user = await userRepo.findById(id)
const userWithPosts = await userRepo.findWithRelations(id, ['posts'])
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
const db = new NOORM({
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

## ⚡ Performance Tips

### 1. Use Batch Loading

```typescript
// ❌ N+1 queries
const users = await userRepo.findAll()
for (const user of users) {
  await userRepo.loadRelationships(user, ['posts'])
}

// ✅ Batch loading
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

### 2. Configure Caching

```typescript
const db = new NOORM({
  // ... config
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  }
})
```

### 3. Use Query Optimization

```typescript
// Enable query optimization
db.updateConfig({
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true
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

interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  pool?: PoolConfig
}

interface IntrospectionConfig {
  includeViews?: boolean
  includeSystemTables?: boolean
  excludeTables?: string[]
  customTypeMappings?: Record<string, string>
  relationshipDepth?: number
}

interface CacheConfig {
  ttl: number
  maxSize: number
  strategy?: 'lru' | 'fifo' | 'ttl'
  preload?: string[]
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enabled: boolean
  file?: string
}

interface PerformanceConfig {
  enableQueryOptimization?: boolean
  enableBatchLoading?: boolean
  maxBatchSize?: number
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

### Custom Type Mappings

```typescript
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

## 🎯 Best Practices

### 1. Always Initialize

```typescript
// ✅ Good
const db = new NOORM(config)
await db.initialize()

// ❌ Bad
const db = new NOORM(config)
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
const db = new NOORM({
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
```

## 🤝 Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/noorm.git
cd noorm

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

### Contribution Guidelines

1. Follow TypeScript best practices
2. Maintain test coverage > 95%
3. Update documentation
4. Follow semantic versioning
5. Add examples for new features

## 📞 Support

### Getting Help

- **Documentation** - This guide and related docs
- **GitHub Issues** - Report bugs and request features
- **Discussions** - Ask questions and share ideas
- **Examples** - Working code examples and patterns

### Community

- Join our Discord server
- Follow us on Twitter
- Star us on GitHub
- Contribute to the project

---

**Ready to get started?** Jump to the [Quick Start](#quick-start-2-minutes) section and have NOORM running in 2 minutes!
