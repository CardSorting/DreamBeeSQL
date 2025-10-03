# DreamBeeSQL Migration Guide

## 🎯 Overview

This guide helps you migrate from existing ORMs to DreamBeeSQL. DreamBeeSQL's zero-configuration approach means you can often migrate with minimal code changes while gaining automatic type safety and schema discovery.

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
- [ ] Identify custom queries and relationships
- [ ] Plan testing strategy
- [ ] Set up development environment

### During Migration
- [ ] Install DreamBeeSQL
- [ ] Configure database connection
- [ ] Replace ORM imports
- [ ] Update query syntax
- [ ] Test functionality
- [ ] Update error handling

### Post-Migration
- [ ] Run comprehensive tests
- [ ] Update documentation
- [ ] Monitor performance
- [ ] Train team on new patterns
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

#### After (DreamBeeSQL)
```typescript
import { DreamBeeSQL } from 'dreambeesql'

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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Post, post => post.user)
  posts: Post[]
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ nullable: true })
  content?: string

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column()
  user_id: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

#### After (DreamBeeSQL)
```typescript
// No entity definitions needed!
// DreamBeeSQL auto-generates entities from your database schema

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

interface Post {
  id: string
  title: string
  content?: string
  user_id: string
  createdAt?: Date
  updatedAt?: Date
  user?: User
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
const userByEmail = await userRepository.findOne({ where: { email } })

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepository.save(user)

// Delete
await userRepository.remove(user)
```

#### After (DreamBeeSQL)
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
const userByEmail = await userRepo.findByEmail('john@example.com')

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

// Load post with user
const post = await postRepository.findOne({
  where: { id },
  relations: ['user']
})

// Load nested relationships
const user = await userRepository.findOne({
  where: { id },
  relations: ['posts', 'posts.comments']
})
```

#### After (DreamBeeSQL)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])

// Load post with user
const post = await postRepo.findWithRelations(id, ['user'])

// Load nested relationships
const user = await userRepo.findWithRelations(id, ['posts.comments'])
```

### Custom Queries

#### Before (TypeORM)
```typescript
// Query Builder
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .andWhere('user.createdAt > :date', { date: new Date('2024-01-01') })
  .orderBy('user.createdAt', 'DESC')
  .getMany()

// Raw SQL
const users = await userRepository.query(
  'SELECT * FROM users WHERE active = $1 AND created_at > $2',
  [true, new Date('2024-01-01')]
)
```

#### After (DreamBeeSQL)
```typescript
// Using Kysely (included)
const users = await db
  .selectFrom('users')
  .where('active', '=', true)
  .where('created_at', '>', new Date('2024-01-01'))
  .orderBy('created_at', 'desc')
  .selectAll()
  .execute()

// Custom repository methods
async findActiveUsers(): Promise<User[]> {
  return this.db
    .selectFrom('users')
    .where('active', '=', true)
    .where('created_at', '>', new Date('2024-01-01'))
    .orderBy('created_at', 'desc')
    .selectAll()
    .execute()
}
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

#### After (DreamBeeSQL)
```typescript
import { DreamBeeSQL } from 'dreambeesql'

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
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  profile   Profile?

  @@map("users")
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

#### After (DreamBeeSQL)
```typescript
// No schema definitions needed!
// DreamBeeSQL discovers schema from your existing database
// Types are auto-generated from the actual database structure
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
const userByEmail = await prisma.user.findUnique({ where: { email } })

// Update
const updatedUser = await prisma.user.update({
  where: { id },
  data: { firstName: 'Johnny' }
})

// Delete
await prisma.user.delete({ where: { id } })
```

#### After (DreamBeeSQL)
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
const userByEmail = await userRepo.findByEmail('john@example.com')

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

// Load post with user
const post = await prisma.post.findUnique({
  where: { id },
  include: { user: true }
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

#### After (DreamBeeSQL)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])

// Load post with user
const post = await postRepo.findWithRelations(id, ['user'])

// Load nested relationships
const user = await userRepo.findWithRelations(id, ['posts.comments'])
```

### Transactions

#### Before (Prisma)
```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
  })

  const profile = await tx.profile.create({
    data: {
      userId: user.id,
      bio: 'Software developer'
    }
  })

  return { user, profile }
})
```

#### After (DreamBeeSQL)
```typescript
const result = await db.transaction().execute(async (trx) => {
  const user = await trx
    .insertInto('users')
    .values({
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe'
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const profile = await trx
    .insertInto('profiles')
    .values({
      user_id: user.id,
      bio: 'Software developer'
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { user, profile }
})
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

#### After (DreamBeeSQL)
```typescript
import { DreamBeeSQL } from 'dreambeesql'

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
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
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

#### After (DreamBeeSQL)
```typescript
// No model definitions needed!
// DreamBeeSQL auto-generates models from your database schema
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
const userByEmail = await User.findOne({ where: { email } })

// Update
user.firstName = 'Johnny'
await user.save()

// Delete
await user.destroy()
```

#### After (DreamBeeSQL)
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
const userByEmail = await userRepo.findByEmail('john@example.com')

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

// Load post with user
const post = await Post.findByPk(id, {
  include: [User]
})

// Load nested relationships
const user = await User.findByPk(id, {
  include: [{
    model: Post,
    include: [Comment]
  }]
})
```

#### After (DreamBeeSQL)
```typescript
// Load user with posts
const user = await userRepo.findWithRelations(id, ['posts'])

// Load post with user
const post = await postRepo.findWithRelations(id, ['user'])

// Load nested relationships
const user = await userRepo.findWithRelations(id, ['posts.comments'])
```

## 🔄 From Drizzle

### Basic Setup

#### Before (Drizzle)
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, posts } from './schema'

const client = postgres('postgresql://user:password@localhost:5432/myapp')
const db = drizzle(client)
```

#### After (DreamBeeSQL)
```typescript
import { DreamBeeSQL } from 'dreambeesql'

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

await db.initialize()
```

### Schema Definitions

#### Before (Drizzle)
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: varchar('content'),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

#### After (DreamBeeSQL)
```typescript
// No schema definitions needed!
// DreamBeeSQL discovers schema from your existing database
```

### CRUD Operations

#### Before (Drizzle)
```typescript
// Create
const user = await db.insert(users).values({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
}).returning()

// Read
const user = await db.select().from(users).where(eq(users.id, id))
const users = await db.select().from(users)
const userByEmail = await db.select().from(users).where(eq(users.email, email))

// Update
const updatedUser = await db.update(users)
  .set({ firstName: 'Johnny' })
  .where(eq(users.id, id))
  .returning()

// Delete
await db.delete(users).where(eq(users.id, id))
```

#### After (DreamBeeSQL)
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
const userByEmail = await userRepo.findByEmail('john@example.com')

// Update
user.firstName = 'Johnny'
const updatedUser = await userRepo.update(user)

// Delete
await userRepo.delete(user.id)
```

## 🛠️ Migration Steps

### Step 1: Install DreamBeeSQL

```bash
npm install dreambeesql
npm uninstall typeorm # or your current ORM
```

### Step 2: Update Configuration

```typescript
// Replace your current ORM configuration
const db = new DreamBeeSQL({
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

### Step 5: Update Custom Queries

```typescript
// Before (TypeORM Query Builder)
const users = await userRepo
  .createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .getMany()

// After (Kysely)
const users = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()
```

## 🧪 Testing Migration

### Unit Tests

```typescript
describe('User Repository', () => {
  let db: DreamBeeSQL
  let userRepo: any

  beforeEach(async () => {
    db = new DreamBeeSQL({
      dialect: 'sqlite',
      connection: {
        database: ':memory:'
      }
    })
    await db.initialize()
    userRepo = db.getRepository('users')
  })

  afterEach(async () => {
    await db.close()
  })

  it('should create and find users', async () => {
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
})
```

### Integration Tests

```typescript
describe('User-Post Relationships', () => {
  it('should load user with posts', async () => {
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

## 🚨 Common Migration Issues

### 1. Naming Conventions

#### Issue: Different column naming
```typescript
// TypeORM uses camelCase
user.firstName

// Database uses snake_case
user.first_name

// DreamBeeSQL handles this automatically
```

#### Solution: Use consistent naming
```typescript
// DreamBeeSQL auto-maps between camelCase and snake_case
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

// DreamBeeSQL
user.id: string // Auto-detected from database
user.createdAt?: Date // Optional based on database schema
```

#### Solution: Use auto-generated types
```typescript
// DreamBeeSQL generates types from your actual database schema
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

// DreamBeeSQL
const user = await userRepo.findWithRelations(id, ['posts', 'profile'])
```

#### Solution: Update relationship calls
```typescript
// Batch loading for better performance
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts', 'profile'])
```

### 4. Custom Queries

#### Issue: Different query syntax
```typescript
// TypeORM Query Builder
const users = await userRepo
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('user.active = :active', { active: true })
  .getMany()

// DreamBeeSQL with Kysely
const users = await db
  .selectFrom('users')
  .leftJoin('posts', 'posts.user_id', 'users.id')
  .where('users.active', '=', true)
  .selectAll()
  .execute()
```

#### Solution: Use Kysely for complex queries
```typescript
// Custom repository method
async findActiveUsersWithPosts(): Promise<User[]> {
  return this.db
    .selectFrom('users')
    .leftJoin('posts', 'posts.user_id', 'users.id')
    .where('users.active', '=', true)
    .selectAll()
    .execute()
}
```

## 📊 Performance Considerations

### 1. Connection Pooling

```typescript
// Configure connection pooling
const db = new DreamBeeSQL({
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
const db = new DreamBeeSQL({
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

## 🔍 Migration Validation

### 1. Data Integrity

```typescript
// Compare data before and after migration
const beforeData = await oldOrm.query('SELECT COUNT(*) FROM users')
const afterData = await db.query('SELECT COUNT(*) FROM users')

expect(afterData).toEqual(beforeData)
```

### 2. Performance Testing

```typescript
// Benchmark query performance
const startTime = Date.now()
const users = await userRepo.findAll()
const endTime = Date.now()

console.log(`Query took ${endTime - startTime}ms`)
```

### 3. Type Safety

```typescript
// Verify TypeScript compilation
const user: User = await userRepo.findById(id)
// Should have full IntelliSense support
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
- [API Reference](#api-reference) - Complete API documentation
- [Examples](./implementation-examples/) - Working code examples

---

**Ready to migrate?** Start with the [Quick Start Guide](./QUICK_START.md) and follow this migration guide step by step!
