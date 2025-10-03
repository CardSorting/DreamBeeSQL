# NOORM Quick Reference

## 🚀 Setup (30 seconds)

```typescript
import { NOORM } from 'noorm'

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

await db.initialize()
```

## 📊 CRUD Operations

### Create
```typescript
const userRepo = db.getRepository('users')
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

## 🔗 Relationships

### Load Relationships
```typescript
// Single relationship
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Nested relationships
const userWithNested = await userRepo.findWithRelations(user.id, ['posts.comments'])
```

### Batch Loading
```typescript
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

## ⚙️ Configuration

### Basic Config
```typescript
const db = new NOORM({
  dialect: 'postgresql',
  connection: { /* connection */ }
})
```

### Advanced Config
```typescript
const db = new NOORM({
  dialect: 'postgresql',
  connection: { /* connection */ },
  introspection: {
    includeViews: true,
    excludeTables: ['migrations']
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

## 🔍 Custom Queries

### Using Kysely
```typescript
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()
```

## 🎯 Common Patterns

### Transaction
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

## 📝 TypeScript Types

### Auto-generated Types
```typescript
// Entity types
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

## 🚨 Common Issues

### "NOORM not initialized"
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

## ⚡ Performance Tips

### Batch Loading
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

### Caching
```typescript
const db = new NOORM({
  // ... config
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  }
})
```

## 🔧 Database Support

### PostgreSQL
```typescript
npm install pg
const db = new NOORM({
  dialect: 'postgresql',
  connection: { /* config */ }
})
```

### MySQL
```typescript
npm install mysql2
const db = new NOORM({
  dialect: 'mysql',
  connection: { /* config */ }
})
```

### SQLite
```typescript
npm install better-sqlite3
const db = new NOORM({
  dialect: 'sqlite',
  connection: {
    database: './myapp.db'
  }
})
```

## 📚 API Reference

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
  async findById(id: any): Promise<T | null>
  async findAll(): Promise<T[]>
  async create(data: Partial<TRow>): Promise<T>
  async update(entity: T): Promise<T>
  async delete(id: any): Promise<boolean>
  async findWithRelations(id: any, relations: string[]): Promise<T | null>
  async loadRelationships(entities: T[], relations: string[]): Promise<void>
}
```

## 🎯 Best Practices

### 1. Always Initialize
```typescript
await db.initialize()
```

### 2. Use Type Safety
```typescript
const user: User = await userRepo.findById(id)
```

### 3. Handle Errors
```typescript
try {
  const user = await userRepo.findById(id)
  if (!user) throw new Error('User not found')
  return user
} catch (error) {
  console.error('Error:', error)
  throw error
}
```

### 4. Configure for Production
```typescript
const db = new NOORM({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  cache: { ttl: 600000, maxSize: 5000 },
  logging: { level: 'info', enabled: true }
})
```

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

---

**Need more help?** Check out the [Developer Guide](./DEVELOPER_GUIDE.md) for comprehensive documentation and examples.
