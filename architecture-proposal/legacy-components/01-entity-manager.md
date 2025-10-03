# Entity Manager Architecture

## Overview

The Entity Manager is the central component responsible for managing all entities in the pseudo-ORM system. It uses a singleton pattern to ensure efficient resource usage and consistent state across the application.

## Design Principles

- **Singleton Pattern** - Single instance across the application
- **Lazy Initialization** - Initialize only when needed
- **Zero Database Queries** - No metadata queries during initialization
- **Type Safety** - Full TypeScript support
- **Minimal Memory Footprint** - Efficient metadata storage

## Architecture

```typescript
// Core Entity Manager (Singleton)
export class EntityManager {
  private static instance: EntityManager | null = null
  private entities = new Map<string, EntityMetadata>()
  private initialized = false
  
  private constructor() {
    // Private constructor for singleton
  }
  
  static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager()
    }
    return EntityManager.instance
  }
  
  // Core methods
  registerEntity<T extends Entity>(entityClass: new () => T): void
  getEntityMetadata(tableName: string): EntityMetadata | undefined
  createEntity<T extends Entity>(entityClass: new () => T): T
  isEntityRegistered(tableName: string): boolean
}
```

## Entity Metadata Structure

```typescript
export interface EntityMetadata {
  tableName: string
  primaryKey: string
  columns: ColumnMetadata[]
  relationships: RelationshipMetadata[]
  validations: ValidationMetadata[]
  hooks: HookMetadata[]
}

export interface ColumnMetadata {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  defaultValue?: any
}

export interface RelationshipMetadata {
  property: string
  type: 'hasOne' | 'hasMany' | 'belongsTo'
  targetEntity: string
  foreignKey?: string
  localKey?: string
}

export interface ValidationMetadata {
  property: string
  rules: ValidationRule[]
}

export interface ValidationRule {
  type: string
  options?: any
  message?: string
}

export interface HookMetadata {
  property: string
  type: 'beforeSave' | 'afterSave' | 'beforeDelete' | 'afterDelete'
  method: string
}
```

## Entity Base Class

```typescript
export abstract class Entity<T = any> {
  protected static tableName: string
  protected static primaryKey: string = 'id'
  
  // Static metadata (no database queries)
  static getTableName(): string { return this.tableName }
  static getPrimaryKey(): string { return this.primaryKey }
  
  // Instance methods
  abstract toRow(): T
  abstract fromRow(row: T): this
  
  // Lifecycle hooks (optional)
  beforeSave?(): Promise<void> | void
  afterSave?(): Promise<void> | void
  beforeDelete?(): Promise<void> | void
  afterDelete?(): Promise<void> | void
}
```

## Entity Registration

```typescript
// Decorator-based registration
export function Entity(tableName: string) {
  return function <T extends new (...args: any[]) => Entity>(constructor: T) {
    constructor.tableName = tableName
    EntityManager.getInstance().registerEntity(constructor)
    return constructor
  }
}

export function PrimaryKey() {
  return function (target: any, propertyKey: string) {
    target.constructor.primaryKey = propertyKey
  }
}

export function Column(options?: ColumnOptions) {
  return function (target: any, propertyKey: string) {
    // Store column metadata in static property
    if (!target.constructor.columnMetadata) {
      target.constructor.columnMetadata = new Map()
    }
    target.constructor.columnMetadata.set(propertyKey, options || {})
  }
}
```

## Implementation Details

### 1. Metadata Storage
- Store entity metadata in memory using Maps
- No database queries for metadata retrieval
- Metadata extracted from decorators at class definition time

### 2. Entity Creation
- Factory pattern for entity instantiation
- Lazy initialization of entity properties
- Type-safe entity creation

### 3. Registration Process
- Automatic registration via decorators
- Validation of entity structure
- Error handling for invalid configurations

## Usage Example

```typescript
@Entity('users')
export class User extends Entity<UserRow> {
  @PrimaryKey()
  id!: string
  
  @Column({ nullable: false })
  email!: string
  
  @Column({ nullable: true })
  firstName?: string
  
  @Column({ nullable: true })
  lastName?: string
  
  toRow(): UserRow {
    return {
      id: this.id,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName
    }
  }
  
  fromRow(row: UserRow): this {
    this.id = row.id
    this.email = row.email
    this.firstName = row.first_name
    this.lastName = row.last_name
    return this
  }
}

// Usage
const entityManager = EntityManager.getInstance()
const user = entityManager.createEntity(User)
```

## Performance Characteristics

- **Initialization**: O(1) - No database queries
- **Entity Creation**: O(1) - Direct instantiation
- **Metadata Lookup**: O(1) - Map-based storage
- **Memory Usage**: Minimal - Only metadata storage
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Centralized Management** - Single point of control for all entities
2. **Efficient Resource Usage** - Singleton pattern prevents duplication
3. **Zero Database Overhead** - No metadata queries
4. **Type Safety** - Full TypeScript support
5. **Lazy Loading** - Initialize only when needed
6. **Minimal Memory Footprint** - Efficient metadata storage

## Limitations

1. **Static Configuration** - Entity structure must be known at compile time
2. **No Runtime Schema Changes** - Cannot modify entity structure at runtime
3. **Memory Usage** - Metadata stored in memory (minimal impact)

## Integration Points

- **Repository Registry** - Provides entity metadata to repositories
- **Validation Core** - Uses entity metadata for validation rules
- **Relationship Engine** - Uses entity metadata for relationship mapping
- **Schema Registry** - Syncs with database schema when needed
