# NOORMME - No ORM, just magic!

> **Zero-configuration pseudo-ORM that works with any existing database**

NOORMME automatically discovers your database schema and generates TypeScript types, entities, and repositories. No manual entity definitions required!

## 🎯 Why NOORMME?

| Feature | Traditional ORMs | NOORMME |
|---------|------------------|---------|
| Setup | Complex configuration | Zero configuration |
| Schema | Manual entity definitions | Auto-discovered |
| Types | Manual type definitions | Auto-generated |
| Migration | Schema migration files | Works with existing DB |
| Learning Curve | Steep | Minimal |
| Developer Experience | Complex setup | Instant productivity |

## 🚀 Get Started in 2 Minutes

### 1. Install
```bash
npm install noorm
```

### 2. Connect
```typescript
import { NOORMME } from 'noorm'

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

await db.initialize()
```

### 3. Use
```typescript
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()
// ✅ Full TypeScript support, IntelliSense, type safety
```

**That's it!** NOORMME automatically:
- ✅ Discovers all tables and relationships
- ✅ Generates TypeScript types
- ✅ Creates repository classes with CRUD operations
- ✅ Provides full IntelliSense support

## 📚 Features

### 🎯 Core Features
- **Zero Configuration** - Works with any existing database
- **Schema Discovery** - Automatically introspects tables and relationships
- **Type Generation** - Creates TypeScript types from database schema
- **Repository Pattern** - Auto-generated repositories with CRUD operations
- **Relationship Loading** - Intelligent foreign key relationship handling
- **Performance Optimized** - Built on Kysely for optimal SQL generation

### 🔧 Advanced Features
- **Batch Loading** - Avoid N+1 queries with intelligent batch loading
- **Caching** - Configurable caching for improved performance
- **Logging** - Comprehensive logging and monitoring
- **Custom Queries** - Full access to Kysely query builder
- **Transactions** - Complete transaction support
- **Multi-Database** - PostgreSQL, MySQL, SQLite, MSSQL support

## 📖 Usage Examples

### Basic CRUD Operations
```typescript
const userRepo = db.getRepository('users')

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
```typescript
// Use Kysely for complex queries
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()

// Raw SQL when needed
const result = await db.execute('SELECT * FROM users WHERE active = ?', [true])
```

### Transactions
```typescript
await db.transaction().execute(async (trx) => {
  const user = await trx
    .insertInto('users')
    .values(userData)
    .returningAll()
    .executeTakeFirstOrThrow()
  
  await trx
    .insertInto('profiles')
    .values({ ...profileData, user_id: user.id })
    .execute()
})
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
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    }
  },
  introspection: {
    includeViews: true,
    excludeTables: ['migrations', 'sessions'],
    customTypeMappings: {
      'jsonb': 'Record<string, any>',
      'custom_type': 'CustomTypeInterface'
    }
  },
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  },
  logging: {
    level: 'info',
    enabled: true
  },
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})
```

## 🎯 Supported Databases

| Database | Status | Features |
|----------|--------|----------|
| PostgreSQL | ✅ Full Support | All features |
| MySQL | ✅ Full Support | All features |
| SQLite | ✅ Full Support | All features |
| MSSQL | 🚧 In Progress | Basic support |

## 🔄 Migration from Other ORMs

### From TypeORM
```typescript
// Before (TypeORM)
const user = await userRepository.findOne({
  where: { id },
  relations: ['posts']
})

// After (NOORMME)
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

// After (NOORMME)
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

### From Sequelize
```typescript
// Before (Sequelize)
const user = await User.findByPk(id, {
  include: [Post]
})

// After (NOORMME)
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

## 🚀 Performance Features

### Batch Loading
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
```typescript
const db = new NOORMME({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  }
})
```

### Query Optimization
```typescript
db.updateConfig({
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})
```

## 📊 Monitoring and Debugging

### Performance Metrics
```typescript
const metrics = db.getPerformanceMetrics()
console.log('Query count:', metrics.queryCount)
console.log('Average time:', metrics.averageQueryTime)
console.log('Cache hit rate:', metrics.cacheHitRate)
```

### Schema Information
```typescript
const schemaInfo = await db.getSchemaInfo()
console.log('Tables:', schemaInfo.tables)
console.log('Relationships:', schemaInfo.relationships)
```

### Query Logging
```typescript
const db = new NOORMME({
  logging: {
    level: 'debug',
    enabled: true
  }
})
```

## 🎯 Perfect For

- **🚀 New Projects** - Start with full type safety from day one
- **🔄 Existing Projects** - Add to existing databases without migration
- **📱 Full-Stack Apps** - Works with any TypeScript/Node.js application
- **🏢 Enterprise** - Production-ready with connection pooling and monitoring
- **👥 Teams** - Consistent API reduces onboarding time

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Read the docs** - Start with this README
2. **Check issues** - Look for "good first issue" labels
3. **Follow guidelines** - TypeScript best practices, test coverage
4. **Submit PR** - Include tests and documentation updates

## 📞 Need Help?

- **📖 Documentation** - This README and inline code comments
- **🐛 Issues** - [GitHub Issues](https://github.com/your-org/noorm/issues) for bugs
- **💬 Discussions** - [GitHub Discussions](https://github.com/your-org/noorm/discussions) for questions
- **💡 Ideas** - [Feature Requests](https://github.com/your-org/noorm/discussions/categories/ideas)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to get started?** Check out the [examples](./examples/) directory for real-world usage patterns!
