# NOORMME Quick Reference

> **Cheat sheet for common NOORMME operations**

## 🚀 Quick Setup

```typescript
import { NOORMME } from 'noormme'

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
const userRepo = db.getRepository('users')
```

> **💡 Pro Tip:** Always call `await db.initialize()` before using repositories!

## 📊 CRUD Operations

### Create
```typescript
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})
```

### Read
```typescript
// By ID
const user = await userRepo.findById(id)

// All records
const users = await userRepo.findAll()

// Custom finder (auto-generated from schema)
const user = await userRepo.findByEmail('john@example.com')
```

### Update
```typescript
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)
```

### Delete
```typescript
await userRepo.delete(user.id)
```

> **💡 Type Safety:** All operations are fully type-safe with IntelliSense support!

## 🔗 Relationships

### Load Relationships
```typescript
// Single relationship
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Nested relationships
const userWithNested = await userRepo.findWithRelations(user.id, ['posts.comments'])
```

### Batch Loading (Performance)
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

> **💡 Performance:** Always use batch loading to avoid N+1 queries!

## 🔍 Custom Queries

### Using Kysely
```typescript
// Simple query
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()

// Complex query with joins
const usersWithPostCounts = await db
  .selectFrom('users')
  .leftJoin('posts', 'posts.userId', 'users.id')
  .select([
    'users.id',
    'users.email',
    db.fn.count('posts.id').as('postCount')
  ])
  .groupBy(['users.id', 'users.email'])
  .execute()

// Pagination
const users = await db
  .selectFrom('users')
  .selectAll()
  .limit(10)
  .offset(0)
  .execute()
```

> **💡 Query Builder:** Full access to Kysely's powerful query builder with type safety!

## ⚙️ Configuration

### Basic Config
```typescript
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

### Production Config
```typescript
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
    ttl: 600000, // 10 minutes
    maxSize: 5000
  },
  logging: {
    level: 'info',
    enabled: true
  }
})
```

> **💡 Environment:** Always use environment variables for production configuration!

## 🎯 Common Patterns

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

### Error Handling
```typescript
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
```

### Environment Variables
```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password'
  }
})
```

> **💡 Best Practices:** Always handle errors gracefully and use transactions for data consistency!

## 📝 TypeScript Types

### Auto-generated Types
```typescript
// Entity types (auto-generated)
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
  posts?: Post[]
  profile?: Profile
}
```

### Custom Type Mappings
```typescript
const db = new NOORMME({
  // ... config
  introspection: {
    customTypeMappings: {
      'jsonb': 'Record<string, any>',
      'custom_type': 'CustomTypeInterface'
    }
  }
})
```

> **💡 Type Safety:** All types are automatically generated from your database schema!

## 🚨 Common Issues

### "NOORMME not initialized"
```typescript
// ❌ Wrong
const userRepo = db.getRepository('users')

// ✅ Correct
await db.initialize()
const userRepo = db.getRepository('users')
```

### "Repository not found"
```typescript
// ❌ Wrong table name
const userRepo = db.getRepository('Users')

// ✅ Correct
const userRepo = db.getRepository('users')
```

### Type errors
```typescript
// ❌ Wrong relationship name
const user = await userRepo.findWithRelations(id, ['Posts'])

// ✅ Correct
const user = await userRepo.findWithRelations(id, ['posts'])
```

> **💡 Troubleshooting:** Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide for more solutions!

## 🔧 Database Support

### PostgreSQL
```typescript
npm install pg
const db = new NOORMME({
  dialect: 'postgresql',
  connection: { /* config */ }
})
```

### MySQL
```typescript
npm install mysql2
const db = new NOORMME({
  dialect: 'mysql',
  connection: { /* config */ }
})
```

### SQLite
```typescript
npm install better-sqlite3
const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './myapp.db'
  }
})
```

> **💡 Database Choice:** PostgreSQL is recommended for production, SQLite for development!

## 🚀 Migration from Other ORMs

### From TypeORM
```typescript
// Before
const user = await userRepository.findOne({
  where: { id },
  relations: ['posts']
})

// After
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

### From Prisma
```typescript
// Before
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true }
})

// After
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

### From Sequelize
```typescript
// Before
const user = await User.findByPk(id, {
  include: [Post]
})

// After
const userRepo = db.getRepository('users')
const user = await userRepo.findWithRelations(id, ['posts'])
```

> **💡 Migration:** Check out [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration steps!

## 📚 More Resources

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - 5-minute setup guide
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Comprehensive documentation
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Detailed migration steps
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

**Need more help?** Check out the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for comprehensive documentation and examples.
