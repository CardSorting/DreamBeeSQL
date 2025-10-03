# NOORM Migration Guide

## 🎯 Overview

This guide helps you migrate from existing ORMs to NOORM. NOORM's zero-configuration approach means you can often migrate with minimal code changes while gaining automatic type safety and schema discovery.

## 🚀 Migration Benefits

- **Zero Configuration** - No manual entity definitions
- **Automatic Type Generation** - Full TypeScript support
- **Schema Discovery** - Works with existing databases
- **Performance** - Built on Kysely for optimal SQL generation
- **Type Safety** - Compile-time checking for all operations

## 📋 Quick Migration Checklist

### Pre-Migration
- [ ] Backup your database
- [ ] Document current ORM usage patterns
- [ ] Plan testing strategy

### During Migration
- [ ] Install NOORM
- [ ] Configure database connection
- [ ] Replace ORM imports
- [ ] Update query syntax
- [ ] Test functionality

### Post-Migration
- [ ] Run comprehensive tests
- [ ] Update documentation
- [ ] Remove old ORM dependencies

## 🔄 From TypeORM

### Basic Setup

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

#### After (NOORM)
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
const userRepo = db.getRepository('users')
```

### Entity Definitions

#### Before (TypeORM)
```typescript
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

#### After (NOORM)
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

### CRUD Operations

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

#### After (NOORM)
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

### Relationships

#### Before (TypeORM)
```typescript
// Load user with posts
const user = await userRepository.findOne({
  where: { id },
  relations: ['posts']
})
```

#### After (NOORM)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])
```

### Custom Queries

#### Before (TypeORM)
```typescript
// Query Builder
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .getMany()
```

#### After (NOORM)
```typescript
// Using Kysely (included)
const users = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()
```

## 🔄 From Prisma

### Basic Setup

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

#### After (NOORM)
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

### Schema Definitions

#### Before (Prisma)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String?
  lastName  String?
  posts     Post[]
}
```

#### After (NOORM)
```typescript
// No schema definitions needed!
// NOORM discovers schema from your existing database
```

### CRUD Operations

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

#### After (NOORM)
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

### Relationships

#### Before (Prisma)
```typescript
// Load user with posts
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true }
})
```

#### After (NOORM)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])
```

## 🔄 From Sequelize

### Basic Setup

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

#### After (NOORM)
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

### Model Definitions

#### Before (Sequelize)
```typescript
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
  }
}, {
  sequelize,
  tableName: 'users'
})
```

#### After (NOORM)
```typescript
// No model definitions needed!
// NOORM auto-generates models from your database schema
```

### CRUD Operations

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

#### After (NOORM)
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

### Relationships

#### Before (Sequelize)
```typescript
// Load user with posts
const user = await User.findByPk(id, {
  include: [Post]
})
```

#### After (NOORM)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])
```

## 🛠️ Migration Steps

### Step 1: Install NOORM

```bash
npm install noorm
npm uninstall typeorm # or your current ORM
```

### Step 2: Update Configuration

```typescript
// Replace your current ORM configuration
const db = new NOORM({
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

### Step 3: Replace Repository Usage

```typescript
// Before
const userRepo = connection.getRepository(User)
const user = await userRepo.findOne({ where: { id } })

// After
const userRepo = db.getRepository('users')
const user = await userRepo.findById(id)
```

### Step 4: Update Relationship Loading

```typescript
// Before
const user = await userRepo.findOne({
  where: { id },
  relations: ['posts']
})

// After
const user = await userRepo.findWithRelations(id, ['posts'])
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

## 📊 Performance Considerations

### 1. Connection Pooling

```typescript
// Configure connection pooling
const db = new NOORM({
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
const db = new NOORM({
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

- [Developer Guide](./DEVELOPER_GUIDE.md) - Comprehensive usage guide
- [Quick Reference](./QUICK_REFERENCE.md) - Common operations
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

**Ready to migrate?** Start with the [Quick Start Guide](./README.md) and follow this migration guide step by step!
