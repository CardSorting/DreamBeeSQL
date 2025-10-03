# Repository Registry Architecture

## Overview

The Repository Registry provides centralized management of all repositories using a singleton pattern. It ensures efficient resource usage and provides a consistent interface for data access across the application.

## Design Principles

- **Singleton Pattern** - Single registry instance
- **Lazy Repository Creation** - Create repositories only when needed
- **Type Safety** - Full TypeScript support
- **Minimal Overhead** - No unnecessary instantiation
- **Centralized Configuration** - Single point of repository management

## Architecture

```typescript
// Repository Registry (Singleton)
export class RepositoryRegistry {
  private static instance: RepositoryRegistry | null = null
  private repositories = new Map<string, BaseRepository<any, any>>()
  private db: Kysely<any> | null = null
  
  private constructor() {
    // Private constructor for singleton
  }
  
  static getInstance(): RepositoryRegistry {
    if (!RepositoryRegistry.instance) {
      RepositoryRegistry.instance = new RepositoryRegistry()
    }
    return RepositoryRegistry.instance
  }
  
  // Core methods
  setDatabase(db: Kysely<any>): void
  getRepository<T extends BaseRepository<any, any>>(
    repositoryClass: new (db: Kysely<any>) => T
  ): T
  registerRepository<T extends BaseRepository<any, any>>(
    repositoryClass: new (db: Kysely<any>) => T
  ): void
  clear(): void
}
```

## Base Repository Interface

```typescript
export abstract class BaseRepository<TEntity extends Entity, TRow> {
  protected db: Kysely<any>
  protected entityManager: EntityManager
  protected entityClass: new () => TEntity
  
  constructor(db: Kysely<any>, entityClass: new () => TEntity) {
    this.db = db
    this.entityManager = EntityManager.getInstance()
    this.entityClass = entityClass
  }
  
  // Abstract methods
  abstract getTableName(): string
  abstract getPrimaryKey(): string
  protected abstract rowToEntity(row: TRow): TEntity
  
  // CRUD operations
  async findById(id: any): Promise<TEntity | null>
  async findAll(): Promise<TEntity[]>
  async save(entity: TEntity): Promise<TEntity>
  async update(entity: TEntity): Promise<TEntity>
  async delete(id: any): Promise<boolean>
  async exists(id: any): Promise<boolean>
  
  // Query builder methods
  createQueryBuilder(): EntityQueryBuilder<TEntity>
  where(conditions: Partial<TRow>): EntityQueryBuilder<TEntity>
  orderBy(column: keyof TRow, direction: 'asc' | 'desc'): EntityQueryBuilder<TEntity>
  limit(count: number): EntityQueryBuilder<TEntity>
}
```

## Entity Query Builder

```typescript
export class EntityQueryBuilder<TEntity extends Entity> {
  private query: SelectQueryBuilder<any, any, any>
  private entityClass: new () => TEntity
  private entityManager: EntityManager
  
  constructor(
    query: SelectQueryBuilder<any, any, any>,
    entityClass: new () => TEntity
  ) {
    this.query = query
    this.entityClass = entityClass
    this.entityManager = EntityManager.getInstance()
  }
  
  // Query methods
  where(conditions: Partial<any>): EntityQueryBuilder<TEntity>
  orderBy(column: string, direction: 'asc' | 'desc'): EntityQueryBuilder<TEntity>
  limit(count: number): EntityQueryBuilder<TEntity>
  offset(count: number): EntityQueryBuilder<TEntity>
  
  // Relationship loading
  with(relationships: string[]): EntityQueryBuilder<TEntity>
  
  // Execution
  async execute(): Promise<TEntity[]>
  async executeFirst(): Promise<TEntity | null>
  async executeFirstOrThrow(): Promise<TEntity>
  async count(): Promise<number>
}
```

## Repository Implementation Example

```typescript
export class UserRepository extends BaseRepository<User, UserRow> {
  getTableName(): string { return 'users' }
  getPrimaryKey(): string { return 'id' }
  
  protected rowToEntity(row: UserRow): User {
    return new User().fromRow(row)
  }
  
  // Custom methods
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst()
    
    return row ? this.rowToEntity(row) : null
  }
  
  async findActiveUsers(): Promise<User[]> {
    const rows = await this.db
      .selectFrom('users')
      .where('active', '=', true)
      .selectAll()
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findWithPosts(id: string): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    // Load relationships using relationship engine
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([user], ['posts'])
    
    return user
  }
}
```

## Repository Factory

```typescript
export class RepositoryFactory {
  private static registry = RepositoryRegistry.getInstance()
  
  static create<T extends BaseRepository<any, any>>(
    repositoryClass: new (db: Kysely<any>) => T,
    db: Kysely<any>
  ): T {
    return this.registry.getRepository(repositoryClass)
  }
  
  static register<T extends BaseRepository<any, any>>(
    repositoryClass: new (db: Kysely<any>) => T
  ): void {
    this.registry.registerRepository(repositoryClass)
  }
}
```

## Usage Examples

### Basic Repository Usage

```typescript
// Setup
const db = new Kysely<Database>({ dialect: new PostgresDialect(...) })
const registry = RepositoryRegistry.getInstance()
registry.setDatabase(db)

// Get repository
const userRepo = registry.getRepository(UserRepository)

// Use repository
const user = await userRepo.findById('123')
const users = await userRepo.findAll()
const newUser = await userRepo.save(user)
```

### Query Builder Usage

```typescript
// Using query builder
const users = await userRepo
  .createQueryBuilder()
  .where({ active: true })
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute()

// With relationships
const userWithPosts = await userRepo
  .createQueryBuilder()
  .where({ id: '123' })
  .with(['posts', 'comments'])
  .executeFirst()
```

### Custom Repository Methods

```typescript
// Custom repository with business logic
export class UserRepository extends BaseRepository<User, UserRow> {
  async findActiveUsersWithPosts(): Promise<User[]> {
    const users = await this.findActiveUsers()
    
    // Load relationships
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships(users, ['posts'])
    
    return users
  }
  
  async createUserWithProfile(userData: Partial<User>, profileData: Partial<Profile>): Promise<User> {
    return this.db.transaction().execute(async (trx) => {
      // Create user
      const user = await trx
        .insertInto('users')
        .values(userData)
        .returningAll()
        .executeTakeFirstOrThrow()
      
      // Create profile
      await trx
        .insertInto('profiles')
        .values({ ...profileData, user_id: user.id })
        .execute()
      
      return this.rowToEntity(user)
    })
  }
}
```

## Performance Characteristics

- **Repository Creation**: O(1) - Cached instances
- **Query Execution**: O(n) - Depends on query complexity
- **Memory Usage**: Minimal - Only repository instances
- **Database Queries**: Only when needed - No health checks
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Centralized Management** - Single registry for all repositories
2. **Efficient Resource Usage** - Singleton pattern prevents duplication
3. **Type Safety** - Full TypeScript support
4. **Lazy Loading** - Create repositories only when needed
5. **Consistent Interface** - Standardized repository pattern
6. **Minimal Overhead** - No unnecessary instantiation

## Limitations

1. **Static Configuration** - Repository classes must be known at compile time
2. **Memory Usage** - Repository instances cached in memory
3. **No Dynamic Queries** - Cannot create repositories at runtime

## Integration Points

- **Entity Manager** - Provides entity metadata
- **Relationship Engine** - Handles relationship loading
- **Validation Core** - Validates entities before save
- **Query Optimizer** - Optimizes query execution
- **Configuration Manager** - Provides repository configuration
