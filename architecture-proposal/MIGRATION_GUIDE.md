# NOORMME Migration Guide

> **Complete guide to migrating from other ORMs to NOORMME**

This guide helps you migrate from existing ORMs to NOORMME. NOORMME's zero-configuration approach means you can often migrate with minimal code changes while gaining automatic type safety and schema discovery.

## 🎯 Why Migrate to NOORMME?

| Feature | Traditional ORMs | NOORMME |
|---------|------------------|---------|
| Setup | Complex configuration | Zero configuration |
| Schema | Manual entity definitions | Auto-discovered |
| Types | Manual type definitions | Auto-generated |
| Migration | Schema migration files | Works with existing DB |
| Performance | Variable | Optimized with Kysely |
| Developer Experience | Complex setup | Instant productivity |

## 🚀 Migration Benefits

- **Zero Configuration** - No manual entity definitions
- **Automatic Type Generation** - Full TypeScript support
- **Schema Discovery** - Works with existing databases
- **Performance** - Built on Kysely for optimal SQL generation
- **Type Safety** - Compile-time checking for all operations

## 📋 Migration Checklist

### Pre-Migration
- [ ] Backup your database
- [ ] Document current ORM usage patterns
- [ ] Plan testing strategy
- [ ] Identify critical functionality
- [ ] Set up development environment

### During Migration
- [ ] Install NOORM
- [ ] Configure database connection
- [ ] Replace ORM imports
- [ ] Update query syntax
- [ ] Test functionality incrementally

### Post-Migration
- [ ] Run comprehensive tests
- [ ] Update documentation
- [ ] Remove old ORM dependencies
- [ ] Monitor performance
- [ ] Train team on new patterns

## 🔄 From TypeORM

### Step 1: Install NOORMME

```bash
# Install NOORMME
npm install noormme

# Install database driver
npm install pg  # for PostgreSQL
# or
npm install mysql2  # for MySQL
# or
npm install better-sqlite3  # for SQLite

# Remove TypeORM (after migration is complete)
npm uninstall typeorm
```

### Step 2: Update Configuration

#### Before (TypeORM)
```typescript
import { createConnection } from 'typeorm'
import { User } from './entities/User'
import { Post } from './entities/Post'

const connection = await createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'password',
  entities: [User, Post],
  synchronize: true
})

const userRepository = connection.getRepository(User)
```

#### After (NOORMME)
```typescript
import { NOORMME } from 'noormme'

const db = new NOORMMEME({
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

### Step 3: Remove Entity Definitions

#### Before (TypeORM)
```typescript
// entities/User.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  email: string

  @Column({ nullable: true })
  firstName?: string

  @Column({ nullable: true })
  lastName?: string

  @OneToMany(() => Post, post => post.user)
  posts: Post[]
}
```

#### After (NOORMME)
```typescript
// No entity definitions needed!
// NOORM auto-generates entities from your database schema

// Auto-generated types are available:
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
  posts?: Post[]
}
```

### Step 4: Update CRUD Operations

#### Before (TypeORM)
```typescript
// Create
const user = new User()
user.email = 'john@example.com'
user.firstName = 'John'
user.lastName = 'Doe'
const savedUser = await userRepository.save(user)

// Read
const user = await userRepository.findOne({ where: { id } })
const users = await userRepository.find()

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepository.save(user)

// Delete
await userRepository.remove(user)
```

#### After (NOORMME)
```typescript
// Create
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Read
const user = await userRepo.findById(id)
const users = await userRepo.findAll()

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete
await userRepo.delete(user.id)
```

### Step 5: Update Relationship Loading

#### Before (TypeORM)
```typescript
// Load user with posts
const user = await userRepository.findOne({
  where: { id },
  relations: ['posts']
})

// Load nested relationships
const user = await userRepository.findOne({
  where: { id },
  relations: ['posts', 'posts.comments']
})
```

#### After (NOORMME)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])

// Load nested relationships
const user = await userRepo.findWithRelations(id, ['posts.comments'])

// Batch loading for performance
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

### Step 6: Update Custom Queries

#### Before (TypeORM)
```typescript
// Query Builder
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .getMany()

// Raw SQL
const users = await userRepository.query(
  'SELECT * FROM users WHERE active = ?',
  [true]
)
```

#### After (NOORMME)
```typescript
// Using Kysely (included)
const users = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()

// Raw SQL
const users = await db.execute(
  'SELECT * FROM users WHERE active = ?',
  [true]
)
```

### Step 7: Update Transactions

#### Before (TypeORM)
```typescript
await connection.transaction(async (manager) => {
  const user = await manager.save(User, userData)
  const profile = await manager.save(Profile, { ...profileData, userId: user.id })
  return { user, profile }
})
```

#### After (NOORMME)
```typescript
await db.transaction().execute(async (trx) => {
  const user = await trx
    .insertInto('users')
    .values(userData)
    .returningAll()
    .executeTakeFirstOrThrow()
  
  const profile = await trx
    .insertInto('profiles')
    .values({ ...profileData, user_id: user.id })
    .returningAll()
    .executeTakeFirstOrThrow()
  
  return { user, profile }
})
```

## 🔄 From Prisma

### Step 1: Install NOORM

```bash
# Install NOORM
npm install noorm

# Install database driver
npm install pg  # for PostgreSQL
# or
npm install mysql2  # for MySQL
# or
npm install better-sqlite3  # for SQLite

# Remove Prisma (after migration is complete)
npm uninstall prisma @prisma/client
```

### Step 2: Update Configuration

#### Before (Prisma)
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://user:password@localhost:5432/myapp'
    }
  }
})
```

#### After (NOORMME)
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
```

### Step 3: Remove Schema Definitions

#### Before (Prisma)
```prisma
// schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String?
  lastName  String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### After (NOORMME)
```typescript
// No schema definitions needed!
// NOORM discovers schema from your existing database

// Auto-generated types are available:
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
  posts?: Post[]
}
```

### Step 4: Update CRUD Operations

#### Before (Prisma)
```typescript
// Create
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
})

// Read
const user = await prisma.user.findUnique({ where: { id } })
const users = await prisma.user.findMany()

// Update
const updatedUser = await prisma.user.update({
  where: { id },
  data: { firstName: 'Johnny' }
})

// Delete
await prisma.user.delete({ where: { id } })
```

#### After (NOORMME)
```typescript
// Create
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Read
const user = await userRepo.findById(id)
const users = await userRepo.findAll()

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete
await userRepo.delete(user.id)
```

### Step 5: Update Relationship Loading

#### Before (Prisma)
```typescript
// Load user with posts
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true }
})

// Load nested relationships
const user = await prisma.user.findUnique({
  where: { id },
  include: { 
    posts: {
      include: {
        comments: true
      }
    }
  }
})
```

#### After (NOORMME)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])

// Load nested relationships
const user = await userRepo.findWithRelations(id, ['posts.comments'])

// Batch loading for performance
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

## 🔄 From Sequelize

### Step 1: Install NOORM

```bash
# Install NOORM
npm install noorm

# Install database driver
npm install pg  # for PostgreSQL
# or
npm install mysql2  # for MySQL
# or
npm install better-sqlite3  # for SQLite

# Remove Sequelize (after migration is complete)
npm uninstall sequelize
```

### Step 2: Update Configuration

#### Before (Sequelize)
```typescript
import { Sequelize } from 'sequelize'
import { User } from './models/User'
import { Post } from './models/Post'

const sequelize = new Sequelize('myapp', 'user', 'password', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres'
})

await sequelize.authenticate()
```

#### After (NOORMME)
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
```

### Step 3: Remove Model Definitions

#### Before (Sequelize)
```typescript
// models/User.ts
import { Model, DataTypes } from 'sequelize'

export class User extends Model {
  public id!: string
  public email!: string
  public firstName?: string
  public lastName?: string
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'users'
})
```

#### After (NOORMME)
```typescript
// No model definitions needed!
// NOORM auto-generates models from your database schema

// Auto-generated types are available:
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
}
```

### Step 4: Update CRUD Operations

#### Before (Sequelize)
```typescript
// Create
const user = await User.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Read
const user = await User.findByPk(id)
const users = await User.findAll()

// Update
user.firstName = 'Johnny'
await user.save()

// Delete
await user.destroy()
```

#### After (NOORMME)
```typescript
// Create
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// Read
const user = await userRepo.findById(id)
const users = await userRepo.findAll()

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete
await userRepo.delete(user.id)
```

### Step 5: Update Relationship Loading

#### Before (Sequelize)
```typescript
// Load user with posts
const user = await User.findByPk(id, {
  include: [Post]
})

// Load nested relationships
const user = await User.findByPk(id, {
  include: [{
    model: Post,
    include: [Comment]
  }]
})
```

#### After (NOORMME)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])

// Load nested relationships
const user = await userRepo.findWithRelations(id, ['posts.comments'])

// Batch loading for performance
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

## 🛠️ General Migration Steps

### Step 1: Prepare for Migration

```bash
# Backup your database
pg_dump myapp > backup.sql

# Document current ORM usage patterns
# Identify critical functionality
# Plan testing strategy
```

### Step 2: Install NOORM

```bash
# Install NOORM
npm install noorm

# Install database driver
npm install pg  # for PostgreSQL
# or
npm install mysql2  # for MySQL
# or
npm install better-sqlite3  # for SQLite
```

### Step 3: Update Configuration

```typescript
// Replace your current ORM configuration
const db = new NOORMME({
  dialect: 'postgresql', // or 'mysql', 'sqlite', 'mssql'
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
})

await db.initialize()
```

### Step 4: Replace Repository Usage

```typescript
// Before (TypeORM)
const userRepo = connection.getRepository(User)
const user = await userRepo.findOne({ where: { id } })

// Before (Prisma)
const user = await prisma.user.findUnique({ where: { id } })

// Before (Sequelize)
const user = await User.findByPk(id)

// After (NOORMME)
const userRepo = db.getRepository('users')
const user = await userRepo.findById(id)
```

### Step 5: Update Relationship Loading

```typescript
// Before (TypeORM)
const user = await userRepo.findOne({
  where: { id },
  relations: ['posts']
})

// Before (Prisma)
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true }
})

// Before (Sequelize)
const user = await User.findByPk(id, {
  include: [Post]
})

// After (NOORMME)
const user = await userRepo.findWithRelations(id, ['posts'])
```

### Step 6: Test and Validate

```typescript
// Test basic functionality
const user = await userRepo.findById(id)
console.log('User found:', user)

// Test relationships
const userWithPosts = await userRepo.findWithRelations(id, ['posts'])
console.log('User with posts:', userWithPosts)

// Test complex queries
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()
console.log('Active users:', activeUsers)
```

### Step 7: Clean Up

```bash
# Remove old ORM dependencies
npm uninstall typeorm  # or prisma, sequelize, etc.

# Remove entity/model files
rm -rf entities/  # TypeORM
rm -rf models/    # Sequelize
rm schema.prisma  # Prisma

# Update imports throughout codebase
```

## 🚨 Common Migration Issues

### 1. Naming Conventions

#### Issue: Different column naming
```typescript
// TypeORM uses camelCase
user.firstName

// Database uses snake_case
user.first_name

// NOORM handles this automatically
```

#### Solution: Use consistent naming
```typescript
// NOORM auto-maps between camelCase and snake_case
const user = await userRepo.create({
  firstName: 'John', // Maps to first_name in database
  lastName: 'Doe'    // Maps to last_name in database
})
```

### 2. Type Differences

#### Issue: Different type systems
```typescript
// TypeORM
user.id: string // UUID
user.createdAt: Date

// NOORM
user.id: string // Auto-detected from database
user.createdAt?: Date // Optional based on database schema
```

#### Solution: Use auto-generated types
```typescript
// NOORM generates types from your actual database schema
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
}
```

### 3. Relationship Loading

#### Issue: Different relationship syntax
```typescript
// TypeORM
const user = await userRepo.findOne({
  where: { id },
  relations: ['posts', 'profile']
})

// NOORM
const user = await userRepo.findWithRelations(id, ['posts', 'profile'])
```

#### Solution: Update relationship calls
```typescript
// Batch loading for better performance
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts', 'profile'])
```

### 4. Database Connection Issues

#### Issue: Connection configuration differences
```typescript
// TypeORM
const connection = await createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'password'
})

// NOORM
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

#### Solution: Use environment variables
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

## 📊 Performance Considerations

### 1. Connection Pooling

```typescript
// Configure connection pooling
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
  }
})
```

### 2. Caching

```typescript
// Enable caching
const db = new NOORMME({
  // ... config
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  }
})
```

### 3. Query Optimization

```typescript
// Enable query optimization
db.updateConfig({
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 100
  }
})
```

## 🎯 Post-Migration Checklist

- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Type safety verified
- [ ] Documentation updated
- [ ] Team trained on new patterns
- [ ] Monitoring in place
- [ ] Rollback plan ready

## 🚀 Next Steps

1. **Start Small** - Migrate one module at a time
2. **Test Thoroughly** - Comprehensive testing at each step
3. **Monitor Performance** - Watch for performance regressions
4. **Update Documentation** - Keep docs current
5. **Train Team** - Ensure everyone understands new patterns

## 📚 Additional Resources

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - 5-minute setup guide
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Comprehensive usage guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common operations
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[examples/](./examples/)** - Real-world usage patterns

---

**Ready to migrate?** Start with the [GETTING_STARTED.md](./GETTING_STARTED.md) guide and follow this migration guide step by step!
