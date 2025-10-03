# NOORM Examples

This directory contains practical examples showing how to use NOORM in real-world scenarios.

## 🚀 Quick Examples

### Basic CRUD Operations
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

// Get repository (auto-generated)
const userRepo = db.getRepository('users')

// Create a user
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Find user by ID
const foundUser = await userRepo.findById(user.id)

// Update user
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete user
await userRepo.delete(user.id)
```

### Working with Relationships
```typescript
// Load user with their posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Load post with comments and author
const postRepo = db.getRepository('posts')
const postWithAll = await postRepo.findWithRelations(post.id, ['comments', 'user'])

// Nested relationships
const userWithNested = await userRepo.findWithRelations(user.id, ['posts.comments'])
```

### Custom Queries
```typescript
// Find users by email
const user = await userRepo.findByEmail('john@example.com')

// Complex queries using Kysely directly
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()
```

## 📁 Example Applications

### 1. Blog Application
A complete blog system with users, posts, and comments.

**Features:**
- User management
- Post creation and editing
- Comment system
- Relationship loading

**Files:**
- `blog-app.ts` - Main application logic
- `blog-schema.sql` - Database schema
- `blog-examples.ts` - Usage examples

### 2. E-commerce Store
An online store with products, orders, and customers.

**Features:**
- Product catalog
- Shopping cart
- Order management
- Customer profiles

**Files:**
- `ecommerce-app.ts` - Main application logic
- `ecommerce-schema.sql` - Database schema
- `ecommerce-examples.ts` - Usage examples

### 3. Task Management System
A project management tool with tasks, projects, and teams.

**Features:**
- Project management
- Task tracking
- Team collaboration
- Progress monitoring

**Files:**
- `task-app.ts` - Main application logic
- `task-schema.sql` - Database schema
- `task-examples.ts` - Usage examples

## 🎯 Common Patterns

### 1. Repository Pattern
```typescript
// Auto-generated repository with custom methods
class UserRepository extends BaseRepository<User, UserRow> {
  async findByEmail(email: string): Promise<User | null> {
    return this.db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst()
  }

  async findActiveUsers(): Promise<User[]> {
    return this.db
      .selectFrom('users')
      .where('active', '=', true)
      .selectAll()
      .execute()
  }
}
```

### 2. Transaction Handling
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

### 3. Error Handling
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

### 4. Batch Operations
```typescript
// Load relationships for multiple entities
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts', 'profile'])

// Batch create
const newUsers = await userRepo.createMany([
  { email: 'user1@example.com', firstName: 'User', lastName: 'One' },
  { email: 'user2@example.com', firstName: 'User', lastName: 'Two' }
])
```

## 🔧 Configuration Examples

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
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
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

## 🚀 Getting Started

1. **Install NOORM**
   ```bash
   npm install noorm
   ```

2. **Install Database Driver**
   ```bash
   npm install pg  # PostgreSQL
   # or
   npm install mysql2  # MySQL
   # or
   npm install better-sqlite3  # SQLite
   ```

3. **Run Examples**
   ```bash
   # Run a specific example
   npx ts-node example/blog-app.ts
   
   # Run all examples
   npm run examples
   ```

## 📚 Learn More

- **[Developer Guide](../architecture-proposal/DEVELOPER_GUIDE.md)** - Complete guide with examples
- **[Quick Reference](../architecture-proposal/QUICK_REFERENCE.md)** - Quick reference card
- **[API Reference](../architecture-proposal/API_REFERENCE.md)** - Complete API documentation
- **[Migration Guide](../architecture-proposal/MIGRATION_GUIDE.md)** - Migrate from other ORMs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

### Adding New Examples

1. Create a new file in the `example/` directory
2. Follow the existing patterns and structure
3. Include comprehensive comments and documentation
4. Add the example to this README
5. Submit a pull request

---

**Ready to explore?** Start with the [Blog Application](./blog-app.ts) example! 🚀