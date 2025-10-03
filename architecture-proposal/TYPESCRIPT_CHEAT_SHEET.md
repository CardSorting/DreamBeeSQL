# NOORM TypeScript Cheat Sheet

> **Essential TypeScript patterns for NOORM**

This cheat sheet covers the most important TypeScript patterns and types you'll use with NOORM.

## 📚 Navigation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - 5-minute setup guide
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Comprehensive documentation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common operations
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from other ORMs
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[examples/](./examples/)** - Real-world usage patterns

## 🎯 Auto-Generated Types

NOORM automatically generates TypeScript types from your database schema. No manual type definitions required!

### Basic Types

```typescript
// Auto-generated from database schema
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
}

interface Post {
  id: string
  title: string
  content?: string
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  createdAt?: Date
}
```

### Row Types (Database Format)

```typescript
// Snake_case format for database operations
interface UserRow {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: Date | null
  updated_at: Date | null
}

interface PostRow {
  id: string
  title: string
  content: string | null
  user_id: string
  created_at: Date | null
  updated_at: Date | null
}
```

### Insertable Types

```typescript
// For creating new records
interface InsertableUser {
  email: string
  firstName?: string
  lastName?: string
  // id, createdAt, updatedAt are auto-generated
}

interface InsertablePost {
  title: string
  content?: string
  userId: string
  // id, createdAt, updatedAt are auto-generated
}
```

### Updateable Types

```typescript
// For updating existing records
interface UpdateableUser {
  email?: string
  firstName?: string
  lastName?: string
  // id cannot be updated
}

interface UpdateablePost {
  title?: string
  content?: string
  // userId, id cannot be updated
}
```

## 🔗 Relationship Types

### With Relationships

```typescript
// User with posts
interface UserWithPosts extends User {
  posts: Post[]
}

// User with profile
interface UserWithProfile extends User {
  profile: Profile
}

// Post with user and comments
interface PostWithRelations extends Post {
  user: User
  comments: Comment[]
}

// Comment with post and user
interface CommentWithRelations extends Comment {
  post: Post
  user: User
}
```

### Nested Relationships

```typescript
// User with posts and comments
interface UserWithNested extends User {
  posts: (Post & {
    comments: Comment[]
  })[]
  profile: Profile
}

// Post with comments and users
interface PostWithNested extends Post {
  comments: (Comment & {
    user: User
  })[]
  user: User
}
```

## 📊 Repository Types

### Base Repository

```typescript
interface BaseRepository<T, TRow> {
  // CRUD operations
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Insertable<TRow>): Promise<T>
  update(entity: T): Promise<T>
  delete(id: string): Promise<boolean>
  
  // Relationship loading
  findWithRelations(id: string, relations: string[]): Promise<T | null>
  loadRelationships(entities: T[], relations: string[]): Promise<void>
  
  // Custom queries
  findByEmail(email: string): Promise<T | null>
  findRecent(limit: number): Promise<T[]>
}
```

### Specific Repositories

```typescript
// User Repository
interface UserRepository extends BaseRepository<User, UserRow> {
  findByEmail(email: string): Promise<User | null>
  findActiveUsers(): Promise<User[]>
  findWithPosts(id: string): Promise<UserWithPosts | null>
  findWithProfile(id: string): Promise<UserWithProfile | null>
}

// Post Repository
interface PostRepository extends BaseRepository<Post, PostRow> {
  findByUserId(userId: string): Promise<Post[]>
  findRecentPosts(limit: number): Promise<Post[]>
  findWithComments(id: string): Promise<PostWithRelations | null>
}

// Comment Repository
interface CommentRepository extends BaseRepository<Comment, CommentRow> {
  findByPostId(postId: string): Promise<Comment[]>
  findByUserId(userId: string): Promise<Comment[]>
}
```

## 🎨 Configuration Types

### NOORM Config

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

### Connection Config

```typescript
interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  pool?: PoolConfig
}

interface PoolConfig {
  min: number
  max: number
  idleTimeoutMillis: number
  acquireTimeoutMillis?: number
}
```

### Introspection Config

```typescript
interface IntrospectionConfig {
  includeViews?: boolean
  includeSystemTables?: boolean
  excludeTables?: string[]
  customTypeMappings?: Record<string, string>
  relationshipDepth?: number
}
```

### Cache Config

```typescript
interface CacheConfig {
  ttl: number
  maxSize: number
  strategy?: 'lru' | 'fifo' | 'ttl'
  preload?: string[]
}
```

### Logging Config

```typescript
interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enabled: boolean
  file?: string
}
```

### Performance Config

```typescript
interface PerformanceConfig {
  enableQueryOptimization?: boolean
  enableBatchLoading?: boolean
  maxBatchSize?: number
}
```

## 🔧 Utility Types

### Generic Types

```typescript
// Extract entity type from repository
type ExtractEntity<T> = T extends BaseRepository<infer U, any> ? U : never

// Extract row type from repository
type ExtractRow<T> = T extends BaseRepository<any, infer U> ? U : never

// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P]
}

// Make all properties required
type Required<T> = {
  [P in keyof T]-?: T[P]
}

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// Omit specific properties
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
```

### NOORM Specific Types

```typescript
// Insertable type (excludes auto-generated fields)
type Insertable<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

// Updateable type (excludes immutable fields)
type Updateable<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>

// With relationships
type WithRelations<T, R extends string> = T & {
  [K in R]: any // This would be properly typed based on the relationship
}

// Repository type
type Repository<T> = BaseRepository<T, any>
```

## 🎯 Common Patterns

### Type Guards

```typescript
// Check if entity has relationships loaded
function hasPosts(user: User): user is UserWithPosts {
  return 'posts' in user && Array.isArray(user.posts)
}

function hasProfile(user: User): user is UserWithProfile {
  return 'profile' in user && user.profile !== undefined
}

// Check if entity is complete
function isCompleteUser(user: User): user is Required<User> {
  return user.id !== undefined && 
         user.email !== undefined && 
         user.firstName !== undefined && 
         user.lastName !== undefined
}
```

### Generic Functions

```typescript
// Generic repository function
async function findWithRelations<T>(
  repo: BaseRepository<T, any>,
  id: string,
  relations: string[]
): Promise<T | null> {
  return repo.findWithRelations(id, relations)
}

// Generic entity validation
function validateEntity<T>(entity: T, requiredFields: (keyof T)[]): boolean {
  return requiredFields.every(field => entity[field] !== undefined)
}

// Generic relationship loader
async function loadRelationships<T>(
  entities: T[],
  relations: string[]
): Promise<void> {
  // Implementation would depend on the specific repository
}
```

### Type Assertions

```typescript
// Safe type assertion
function assertUser(user: any): asserts user is User {
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') {
    throw new Error('Invalid user object')
  }
}

// Type predicate
function isUser(obj: any): obj is User {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.email === 'string'
}

// Conditional types
type UserOrNull<T> = T extends User ? User : null
type UserWithPostsOrNull<T> = T extends UserWithPosts ? UserWithPosts : null
```

## 🚀 Advanced Patterns

### Conditional Types

```typescript
// Conditional repository type
type RepositoryType<T extends string> = 
  T extends 'users' ? UserRepository :
  T extends 'posts' ? PostRepository :
  T extends 'comments' ? CommentRepository :
  BaseRepository<any, any>

// Conditional entity type
type EntityType<T extends string> = 
  T extends 'users' ? User :
  T extends 'posts' ? Post :
  T extends 'comments' ? Comment :
  any

// Conditional relationship type
type RelationshipType<T, R extends string> = 
  R extends 'posts' ? T & { posts: Post[] } :
  R extends 'profile' ? T & { profile: Profile } :
  R extends 'comments' ? T & { comments: Comment[] } :
  T
```

### Mapped Types

```typescript
// Make all properties optional except ID
type PartialExceptId<T> = {
  [K in keyof T]: K extends 'id' ? T[K] : T[K] | undefined
}

// Make all properties required except ID
type RequiredExceptId<T> = {
  [K in keyof T]: K extends 'id' ? T[K] : Required<T[K]>
}

// Extract relationship names
type RelationshipNames<T> = {
  [K in keyof T]: T[K] extends any[] ? K : never
}[keyof T]
```

## 🔍 Type Utilities

### Validation Types

```typescript
// Email validation
type Email = string & { readonly __brand: 'Email' }

function createEmail(email: string): Email {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email format')
  }
  return email as Email
}

// UUID validation
type UUID = string & { readonly __brand: 'UUID' }

function createUUID(uuid: string): UUID {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
    throw new Error('Invalid UUID format')
  }
  return uuid as UUID
}
```

### Error Types

```typescript
// Custom error types
class NOORMError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'NOORMError'
  }
}

class ValidationError extends NOORMError {
  constructor(message: string, public field: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

class NotFoundError extends NOORMError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}
```

## 📝 Best Practices

### 1. Use Auto-Generated Types

```typescript
// ✅ Good: Use auto-generated types
const user: User = await userRepo.findById(id)

// ❌ Bad: Use any type
const user: any = await userRepo.findById(id)
```

### 2. Type Your Repositories

```typescript
// ✅ Good: Type your repositories
const userRepo: UserRepository = db.getRepository('users')

// ❌ Bad: Use any type
const userRepo: any = db.getRepository('users')
```

### 3. Use Type Guards

```typescript
// ✅ Good: Use type guards
function processUser(user: User) {
  if (hasPosts(user)) {
    console.log(`User has ${user.posts.length} posts`)
  }
}

// ❌ Bad: Assume properties exist
function processUser(user: User) {
  console.log(`User has ${user.posts.length} posts`) // posts might not be loaded
}
```

### 4. Leverage Type Inference

```typescript
// ✅ Good: Let TypeScript infer types
const users = await userRepo.findAll() // TypeScript knows this is User[]

// ❌ Bad: Unnecessary type annotations
const users: User[] = await userRepo.findAll()
```

### 5. Use Generic Types

```typescript
// ✅ Good: Use generic types for reusability
async function findEntity<T>(
  repo: BaseRepository<T, any>,
  id: string
): Promise<T | null> {
  return repo.findById(id)
}

// ❌ Bad: Duplicate code for each entity type
async function findUser(repo: UserRepository, id: string): Promise<User | null> {
  return repo.findById(id)
}
```

## 🎯 Common Type Patterns

### Repository Pattern

```typescript
// Generic repository interface
interface Repository<T, TRow> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Insertable<TRow>): Promise<T>
  update(entity: T): Promise<T>
  delete(id: string): Promise<boolean>
}

// Specific repository implementation
class UserRepository implements Repository<User, UserRow> {
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
  
  async findAll(): Promise<User[]> {
    // Implementation
  }
  
  // ... other methods
}
```

### Entity Pattern

```typescript
// Base entity interface
interface Entity<T> {
  toRow(): T
  fromRow(row: T): this
}

// Specific entity implementation
class User implements Entity<UserRow> {
  id!: string
  email!: string
  firstName?: string
  lastName?: string
  
  toRow(): UserRow {
    return {
      id: this.id,
      email: this.email,
      first_name: this.firstName || null,
      last_name: this.lastName || null,
      created_at: null,
      updated_at: null
    }
  }
  
  fromRow(row: UserRow): this {
    this.id = row.id
    this.email = row.email
    this.firstName = row.first_name || undefined
    this.lastName = row.last_name || undefined
    return this
  }
}
```

### Relationship Pattern

```typescript
// Relationship loading interface
interface RelationshipLoader<T> {
  loadRelationships(entities: T[], relations: string[]): Promise<void>
}

// Specific relationship loader
class UserRelationshipLoader implements RelationshipLoader<User> {
  async loadRelationships(users: User[], relations: string[]): Promise<void> {
    for (const relation of relations) {
      switch (relation) {
        case 'posts':
          await this.loadPosts(users)
          break
        case 'profile':
          await this.loadProfiles(users)
          break
      }
    }
  }
  
  private async loadPosts(users: User[]): Promise<void> {
    // Implementation
  }
  
  private async loadProfiles(users: User[]): Promise<void> {
    // Implementation
  }
}
```

---

**Need more help?** Check out the [Developer Guide](./DEVELOPER_GUIDE.md) for comprehensive examples and patterns!
