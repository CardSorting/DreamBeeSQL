# Relationship Engine Architecture

## Overview

The Relationship Engine provides centralized management of entity relationships using a singleton pattern. It handles both eager and lazy loading of relationships without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single engine instance
- **Lazy Loading** - Load relationships only when needed
- **Batch Loading** - Efficient batch operations
- **No Database Spam** - Minimal queries, no health checks
- **Type Safety** - Full TypeScript support
- **Memory Efficient** - Minimal relationship metadata storage

## Architecture

```typescript
// Relationship Engine (Singleton)
export class RelationshipEngine {
  private static instance: RelationshipEngine | null = null
  private relationshipCache = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()
  
  private constructor() {
    // Private constructor for singleton
  }
  
  static getInstance(): RelationshipEngine {
    if (!RelationshipEngine.instance) {
      RelationshipEngine.instance = new RelationshipEngine()
    }
    return RelationshipEngine.instance
  }
  
  // Core methods
  async loadRelationships<T extends Entity>(
    entities: T[],
    relationshipNames: string[]
  ): Promise<T[]>
  
  async loadRelationship<T extends Entity>(
    entity: T,
    relationshipName: string
  ): Promise<any>
  
  clearCache(): void
  clearCacheForEntity(entityId: string): void
}
```

## Relationship Metadata

```typescript
export interface RelationshipMetadata {
  property: string
  type: RelationshipType
  targetEntity: string
  foreignKey?: string
  localKey?: string
  cascade?: CascadeOption[]
}

export enum RelationshipType {
  HAS_ONE = 'hasOne',
  HAS_MANY = 'hasMany',
  BELONGS_TO = 'belongsTo'
}

export enum CascadeOption {
  SAVE = 'save',
  UPDATE = 'update',
  DELETE = 'delete'
}
```

## Relationship Decorators

```typescript
export function HasOne<T>(
  targetEntity: () => new () => Entity,
  options?: RelationshipOptions
) {
  return function (target: any, propertyKey: string) {
    const metadata: RelationshipMetadata = {
      property: propertyKey,
      type: RelationshipType.HAS_ONE,
      targetEntity: targetEntity().name,
      foreignKey: options?.foreignKey,
      localKey: options?.localKey
    }
    
    if (!target.constructor.relationshipMetadata) {
      target.constructor.relationshipMetadata = new Map()
    }
    target.constructor.relationshipMetadata.set(propertyKey, metadata)
  }
}

export function HasMany<T>(
  targetEntity: () => new () => Entity,
  options?: RelationshipOptions
) {
  return function (target: any, propertyKey: string) {
    const metadata: RelationshipMetadata = {
      property: propertyKey,
      type: RelationshipType.HAS_MANY,
      targetEntity: targetEntity().name,
      foreignKey: options?.foreignKey,
      localKey: options?.localKey
    }
    
    if (!target.constructor.relationshipMetadata) {
      target.constructor.relationshipMetadata = new Map()
    }
    target.constructor.relationshipMetadata.set(propertyKey, metadata)
  }
}

export function BelongsTo<T>(
  targetEntity: () => new () => Entity,
  options?: RelationshipOptions
) {
  return function (target: any, propertyKey: string) {
    const metadata: RelationshipMetadata = {
      property: propertyKey,
      type: RelationshipType.BELONGS_TO,
      targetEntity: targetEntity().name,
      foreignKey: options?.foreignKey,
      localKey: options?.localKey
    }
    
    if (!target.constructor.relationshipMetadata) {
      target.constructor.relationshipMetadata = new Map()
    }
    target.constructor.relationshipMetadata.set(propertyKey, metadata)
  }
}

export interface RelationshipOptions {
  foreignKey?: string
  localKey?: string
  cascade?: CascadeOption[]
}
```

## Relationship Loader

```typescript
export class RelationshipLoader {
  private db: Kysely<any>
  private entityManager: EntityManager
  
  constructor(db: Kysely<any>) {
    this.db = db
    this.entityManager = EntityManager.getInstance()
  }
  
  async loadHasOne<T extends Entity>(
    entities: T[],
    relationshipName: string,
    metadata: RelationshipMetadata
  ): Promise<void> {
    if (entities.length === 0) return
    
    const localKey = metadata.localKey || 'id'
    const foreignKey = metadata.foreignKey || `${this.getTableName(entities[0])}_id`
    
    const ids = entities.map(entity => entity[localKey])
    const targetTable = this.getTargetTable(metadata.targetEntity)
    
    const relatedEntities = await this.db
      .selectFrom(targetTable)
      .where(foreignKey, 'in', ids)
      .selectAll()
      .execute()
    
    // Map relationships to entities
    const relationshipMap = new Map()
    relatedEntities.forEach(related => {
      const key = related[foreignKey]
      if (!relationshipMap.has(key)) {
        relationshipMap.set(key, related)
      }
    })
    
    entities.forEach(entity => {
      const related = relationshipMap.get(entity[localKey])
      if (related) {
        entity[relationshipName] = this.createEntity(metadata.targetEntity, related)
      }
    })
  }
  
  async loadHasMany<T extends Entity>(
    entities: T[],
    relationshipName: string,
    metadata: RelationshipMetadata
  ): Promise<void> {
    if (entities.length === 0) return
    
    const localKey = metadata.localKey || 'id'
    const foreignKey = metadata.foreignKey || `${this.getTableName(entities[0])}_id`
    
    const ids = entities.map(entity => entity[localKey])
    const targetTable = this.getTargetTable(metadata.targetEntity)
    
    const relatedEntities = await this.db
      .selectFrom(targetTable)
      .where(foreignKey, 'in', ids)
      .selectAll()
      .execute()
    
    // Map relationships to entities
    const relationshipMap = new Map()
    relatedEntities.forEach(related => {
      const key = related[foreignKey]
      if (!relationshipMap.has(key)) {
        relationshipMap.set(key, [])
      }
      relationshipMap.get(key).push(this.createEntity(metadata.targetEntity, related))
    })
    
    entities.forEach(entity => {
      const related = relationshipMap.get(entity[localKey]) || []
      entity[relationshipName] = related
    })
  }
  
  async loadBelongsTo<T extends Entity>(
    entities: T[],
    relationshipName: string,
    metadata: RelationshipMetadata
  ): Promise<void> {
    if (entities.length === 0) return
    
    const foreignKey = metadata.foreignKey || `${this.getTargetTable(metadata.targetEntity)}_id`
    const localKey = metadata.localKey || 'id'
    
    const ids = entities
      .map(entity => entity[foreignKey])
      .filter(id => id != null)
    
    if (ids.length === 0) return
    
    const targetTable = this.getTargetTable(metadata.targetEntity)
    const relatedEntities = await this.db
      .selectFrom(targetTable)
      .where(localKey, 'in', ids)
      .selectAll()
      .execute()
    
    // Map relationships to entities
    const relationshipMap = new Map()
    relatedEntities.forEach(related => {
      relationshipMap.set(related[localKey], related)
    })
    
    entities.forEach(entity => {
      const relatedId = entity[foreignKey]
      if (relatedId && relationshipMap.has(relatedId)) {
        entity[relationshipName] = this.createEntity(metadata.targetEntity, relationshipMap.get(relatedId))
      }
    })
  }
  
  private getTableName(entity: Entity): string {
    return entity.constructor.getTableName()
  }
  
  private getTargetTable(targetEntity: string): string {
    const entityClass = this.entityManager.getEntityClass(targetEntity)
    return entityClass.getTableName()
  }
  
  private createEntity(targetEntity: string, row: any): Entity {
    const entityClass = this.entityManager.getEntityClass(targetEntity)
    return new entityClass().fromRow(row)
  }
}
```

## Usage Examples

### Entity Definition with Relationships

```typescript
@Entity('users')
export class User extends Entity<UserRow> {
  @PrimaryKey()
  id!: string
  
  @Column()
  email!: string
  
  @HasMany(() => Post, { foreignKey: 'user_id' })
  posts?: Post[]
  
  @HasOne(() => Profile, { foreignKey: 'user_id' })
  profile?: Profile
  
  toRow(): UserRow {
    return {
      id: this.id,
      email: this.email
    }
  }
  
  fromRow(row: UserRow): this {
    this.id = row.id
    this.email = row.email
    return this
  }
}

@Entity('posts')
export class Post extends Entity<PostRow> {
  @PrimaryKey()
  id!: string
  
  @Column()
  title!: string
  
  @Column()
  user_id!: string
  
  @BelongsTo(() => User, { foreignKey: 'user_id' })
  user?: User
  
  @HasMany(() => Comment, { foreignKey: 'post_id' })
  comments?: Comment[]
  
  toRow(): PostRow {
    return {
      id: this.id,
      title: this.title,
      user_id: this.user_id
    }
  }
  
  fromRow(row: PostRow): this {
    this.id = row.id
    this.title = row.title
    this.user_id = row.user_id
    return this
  }
}
```

### Loading Relationships

```typescript
// Eager loading
const users = await userRepo.findAll()
const relationshipEngine = RelationshipEngine.getInstance()
await relationshipEngine.loadRelationships(users, ['posts', 'profile'])

// Lazy loading
const user = await userRepo.findById('123')
await relationshipEngine.loadRelationship(user, 'posts')

// Batch loading
const posts = await postRepo.findAll()
await relationshipEngine.loadRelationships(posts, ['user', 'comments'])
```

### Repository with Relationships

```typescript
export class UserRepository extends BaseRepository<User, UserRow> {
  async findWithPosts(id: string): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationship(user, 'posts')
    
    return user
  }
  
  async findActiveUsersWithProfiles(): Promise<User[]> {
    const users = await this.findActiveUsers()
    
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships(users, ['profile'])
    
    return users
  }
}
```

## Performance Characteristics

- **Batch Loading**: O(1) queries per relationship type
- **Memory Usage**: Minimal - Only relationship data
- **Cache Efficiency**: O(1) lookup for cached relationships
- **Database Queries**: Only when needed - No health checks
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Centralized Management** - Single engine for all relationships
2. **Efficient Loading** - Batch operations reduce database queries
3. **Type Safety** - Full TypeScript support
4. **Memory Efficient** - Minimal relationship metadata storage
5. **No Database Spam** - Only necessary queries
6. **Lazy Loading** - Load relationships only when needed

## Limitations

1. **Static Configuration** - Relationships must be defined at compile time
2. **Memory Usage** - Relationship data cached in memory
3. **No Dynamic Relationships** - Cannot create relationships at runtime

## Integration Points

- **Entity Manager** - Provides entity metadata
- **Repository Registry** - Uses repositories for data access
- **Query Optimizer** - Optimizes relationship queries
- **Configuration Manager** - Provides relationship configuration
