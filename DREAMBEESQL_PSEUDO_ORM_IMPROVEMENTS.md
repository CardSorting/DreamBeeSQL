# DreamBeeSQL Pseudo-ORM Improvements

## Executive Summary

DreamBeeSQL (Kysely) is an excellent type-safe SQL query builder with a robust migration system. To transform it into a pseudo-ORM while maintaining its strengths and avoiding full ORM complexity, we need to add entity management, relationship handling, and data access patterns without the overhead of change tracking, lazy loading, or complex caching.

## Current State Analysis

### Strengths
- **Type-safe query builder** with excellent TypeScript integration
- **Comprehensive migration system** with clean architecture
- **Schema introspection** capabilities
- **Multi-dialect support** (PostgreSQL, MySQL, SQLite, MSSQL)
- **Transaction support** with controlled transactions
- **Minimal overhead** and direct SQL control
- **Plugin system** for extensibility

### Current Gaps for Pseudo-ORM
- **No entity abstraction** - direct table/row manipulation
- **Manual relationship handling** - no automatic joins or associations
- **No repository pattern** - custom repository implementations needed
- **Limited validation** - manual validation required
- **No entity lifecycle hooks** - before/after save, etc.
- **No automatic type generation** - manual table interface definitions
- **No query optimization** - no automatic eager/lazy loading strategies

## Proposed Improvements

### 1. Entity Management System

#### 1.1 Entity Base Class
```typescript
// New: src/entity/entity.ts
export abstract class Entity<T = any> {
  protected static tableName: string
  protected static primaryKey: string = 'id'
  
  // Entity metadata
  static getTableName(): string { return this.tableName }
  static getPrimaryKey(): string { return this.primaryKey }
  
  // Instance methods
  abstract toRow(): T
  abstract fromRow(row: T): this
  
  // Lifecycle hooks
  beforeSave?(): Promise<void> | void
  afterSave?(): Promise<void> | void
  beforeDelete?(): Promise<void> | void
  afterDelete?(): Promise<void> | void
}
```

#### 1.2 Entity Decorators
```typescript
// New: src/entity/decorators.ts
export function Table(name: string) {
  return function <T extends new (...args: any[]) => {}>(constructor: T) {
    constructor.tableName = name
    return constructor
  }
}

export function PrimaryKey() {
  return function (target: any, propertyKey: string) {
    target.constructor.primaryKey = propertyKey
  }
}

export function Column(options?: { nullable?: boolean; default?: any }) {
  return function (target: any, propertyKey: string) {
    // Store column metadata
  }
}

export function BeforeSave() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    target.beforeSave = descriptor.value
  }
}
```

#### 1.3 Entity Registry
```typescript
// New: src/entity/registry.ts
export class EntityRegistry {
  private static entities = new Map<string, typeof Entity>()
  
  static register(entityClass: typeof Entity) {
    this.entities.set(entityClass.getTableName(), entityClass)
  }
  
  static getEntity(tableName: string): typeof Entity | undefined {
    return this.entities.get(tableName)
  }
  
  static getAllEntities(): Map<string, typeof Entity> {
    return new Map(this.entities)
  }
}
```

### 2. Repository Pattern Enhancement

#### 2.1 Base Repository
```typescript
// New: src/repository/base-repository.ts
export abstract class BaseRepository<TEntity extends Entity, TRow> {
  constructor(
    protected db: Kysely<any>,
    protected entityClass: new () => TEntity
  ) {}
  
  abstract getTableName(): string
  
  // CRUD operations
  async findById(id: any): Promise<TEntity | null> {
    const row = await this.db
      .selectFrom(this.getTableName())
      .where(this.getPrimaryKey(), '=', id)
      .selectAll()
      .executeTakeFirst()
    
    return row ? this.rowToEntity(row) : null
  }
  
  async save(entity: TEntity): Promise<TEntity> {
    const row = entity.toRow()
    const savedRow = await this.db
      .insertInto(this.getTableName())
      .values(row)
      .returningAll()
      .executeTakeFirstOrThrow()
    
    return this.rowToEntity(savedRow)
  }
  
  async update(entity: TEntity): Promise<TEntity> {
    const row = entity.toRow()
    const updatedRow = await this.db
      .updateTable(this.getTableName())
      .set(row)
      .where(this.getPrimaryKey(), '=', row[this.getPrimaryKey()])
      .returningAll()
      .executeTakeFirstOrThrow()
    
    return this.rowToEntity(updatedRow)
  }
  
  async delete(id: any): Promise<boolean> {
    const result = await this.db
      .deleteFrom(this.getTableName())
      .where(this.getPrimaryKey(), '=', id)
      .execute()
    
    return result.numDeletedRows > 0
  }
  
  protected abstract rowToEntity(row: TRow): TEntity
  protected abstract getPrimaryKey(): string
}
```

#### 2.2 Repository Factory
```typescript
// New: src/repository/repository-factory.ts
export class RepositoryFactory {
  private static repositories = new Map<string, BaseRepository<any, any>>()
  
  static create<T extends BaseRepository<any, any>>(
    repositoryClass: new (db: Kysely<any>) => T,
    db: Kysely<any>
  ): T {
    const key = repositoryClass.name
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new repositoryClass(db))
    }
    return this.repositories.get(key) as T
  }
}
```

### 3. Relationship Management

#### 3.1 Relationship Decorators
```typescript
// New: src/relationships/decorators.ts
export function HasOne<T>(
  targetEntity: () => new () => Entity,
  foreignKey?: string
) {
  return function (target: any, propertyKey: string) {
    // Store relationship metadata
  }
}

export function HasMany<T>(
  targetEntity: () => new () => Entity,
  foreignKey?: string
) {
  return function (target: any, propertyKey: string) {
    // Store relationship metadata
  }
}

export function BelongsTo<T>(
  targetEntity: () => new () => Entity,
  foreignKey?: string
) {
  return function (target: any, propertyKey: string) {
    // Store relationship metadata
  }
}
```

#### 3.2 Relationship Loader
```typescript
// New: src/relationships/loader.ts
export class RelationshipLoader {
  constructor(private db: Kysely<any>) {}
  
  async loadRelationships<T extends Entity>(
    entities: T[],
    relationships: string[]
  ): Promise<T[]> {
    // Implement eager loading logic
    return entities
  }
  
  async loadRelationship<T extends Entity>(
    entity: T,
    relationshipName: string
  ): Promise<any> {
    // Implement lazy loading logic
    return null
  }
}
```

### 4. Validation System

#### 4.1 Validation Decorators
```typescript
// New: src/validation/decorators.ts
export function Required(message?: string) {
  return function (target: any, propertyKey: string) {
    // Store validation metadata
  }
}

export function Email(message?: string) {
  return function (target: any, propertyKey: string) {
    // Store validation metadata
  }
}

export function MinLength(min: number, message?: string) {
  return function (target: any, propertyKey: string) {
    // Store validation metadata
  }
}

export function MaxLength(max: number, message?: string) {
  return function (target: any, propertyKey: string) {
    // Store validation metadata
  }
}
```

#### 4.2 Validator
```typescript
// New: src/validation/validator.ts
export class EntityValidator {
  static async validate<T extends Entity>(entity: T): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    
    // Get validation metadata from decorators
    // Run validations
    // Return results
    
    return { isValid: errors.length === 0, errors }
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  property: string
  message: string
  value: any
}
```

### 5. Schema Diary Enhancement

#### 5.1 Schema Introspection Enhancement
```typescript
// New: src/schema/schema-diary.ts
export class SchemaDiary {
  constructor(private db: Kysely<any>) {}
  
  async getEntitySchema(tableName: string): Promise<EntitySchema> {
    const metadata = await this.db.introspection.getTables()
    const table = metadata.find(t => t.name === tableName)
    
    if (!table) {
      throw new Error(`Table ${tableName} not found`)
    }
    
    return {
      name: table.name,
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.dataType,
        nullable: col.isNullable,
        primaryKey: col.name === 'id', // Simple assumption
        autoIncrement: col.isAutoIncrementing,
        defaultValue: col.hasDefaultValue
      })),
      indexes: await this.getTableIndexes(tableName),
      foreignKeys: await this.getTableForeignKeys(tableName)
    }
  }
  
  async generateEntityClass(tableName: string): Promise<string> {
    const schema = await this.getEntitySchema(tableName)
    // Generate TypeScript class code
    return this.generateClassCode(schema)
  }
  
  private async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    // Implementation to get table indexes
    return []
  }
  
  private async getTableForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    // Implementation to get foreign keys
    return []
  }
  
  private generateClassCode(schema: EntitySchema): string {
    // Generate TypeScript class with decorators
    return ''
  }
}

export interface EntitySchema {
  name: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  foreignKeys: ForeignKeyInfo[]
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  defaultValue: boolean
}

export interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
}

export interface ForeignKeyInfo {
  column: string
  referencedTable: string
  referencedColumn: string
}
```

### 6. Query Optimization

#### 6.1 Query Builder Enhancement
```typescript
// New: src/query/entity-query-builder.ts
export class EntityQueryBuilder<T extends Entity> {
  constructor(
    private db: Kysely<any>,
    private entityClass: new () => T
  ) {}
  
  with(relationships: string[]): EntityQueryBuilder<T> {
    // Add eager loading relationships
    return this
  }
  
  where(conditions: Partial<T>): EntityQueryBuilder<T> {
    // Add where conditions
    return this
  }
  
  orderBy(column: keyof T, direction: 'asc' | 'desc' = 'asc'): EntityQueryBuilder<T> {
    // Add ordering
    return this
  }
  
  limit(count: number): EntityQueryBuilder<T> {
    // Add limit
    return this
  }
  
  async execute(): Promise<T[]> {
    // Execute query and return entities
    return []
  }
  
  async executeFirst(): Promise<T | null> {
    // Execute query and return first entity
    return null
  }
}
```

#### 6.2 Query Cache
```typescript
// New: src/query/query-cache.ts
export class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}
```

### 7. Migration System Enhancement

#### 7.1 Entity-Aware Migrations
```typescript
// New: src/migration/entity-migration.ts
export abstract class EntityMigration {
  abstract up(): Promise<void>
  abstract down(): Promise<void>
  
  protected createEntityTable<T extends Entity>(
    entityClass: new () => T
  ): CreateTableBuilder {
    // Generate table creation from entity metadata
    return this.db.schema.createTable(entityClass.getTableName())
  }
  
  protected dropEntityTable<T extends Entity>(
    entityClass: new () => T
  ): DropTableBuilder {
    return this.db.schema.dropTable(entityClass.getTableName())
  }
}
```

#### 7.2 Migration Generator
```typescript
// New: src/migration/migration-generator.ts
export class MigrationGenerator {
  constructor(private db: Kysely<any>) {}
  
  async generateFromEntities(entities: typeof Entity[]): Promise<string> {
    // Generate migration SQL from entity definitions
    return ''
  }
  
  async generateFromSchemaDiff(): Promise<string> {
    // Compare current schema with entity definitions
    // Generate migration to sync them
    return ''
  }
}
```

### 8. Type Generation Enhancement

#### 8.1 Automatic Type Generation
```typescript
// New: src/types/type-generator.ts
export class TypeGenerator {
  constructor(private db: Kysely<any>) {}
  
  async generateDatabaseTypes(): Promise<string> {
    const tables = await this.db.introspection.getTables()
    
    let code = 'export interface Database {\n'
    
    for (const table of tables) {
      code += `  ${table.name}: {\n`
      
      for (const column of table.columns) {
        const tsType = this.mapDbTypeToTsType(column.dataType, column.isNullable)
        code += `    ${column.name}: ${tsType}\n`
      }
      
      code += '  }\n'
    }
    
    code += '}\n'
    return code
  }
  
  private mapDbTypeToTsType(dbType: string, nullable: boolean): string {
    // Map database types to TypeScript types
    const baseType = this.getBaseType(dbType)
    return nullable ? `${baseType} | null` : baseType
  }
  
  private getBaseType(dbType: string): string {
    // Implementation to map DB types to TS types
    return 'any'
  }
}
```

### 9. Configuration and Setup

#### 9.1 Pseudo-ORM Configuration
```typescript
// New: src/config/pseudo-orm-config.ts
export interface PseudoORMConfig {
  entities: typeof Entity[]
  repositories?: typeof BaseRepository[]
  migrations?: {
    directory: string
    tableName: string
  }
  validation?: {
    enabled: boolean
    strictMode: boolean
  }
  relationships?: {
    enabled: boolean
    lazyLoading: boolean
    eagerLoading: boolean
  }
  caching?: {
    enabled: boolean
    ttl: number
  }
  logging?: {
    enabled: boolean
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  }
}

export class PseudoORM {
  constructor(
    private db: Kysely<any>,
    private config: PseudoORMConfig
  ) {}
  
  async initialize(): Promise<void> {
    // Register entities
    for (const entity of this.config.entities) {
      EntityRegistry.register(entity)
    }
    
    // Initialize repositories
    // Setup validation
    // Configure relationships
    // Setup caching
  }
  
  getRepository<T extends BaseRepository<any, any>>(
    repositoryClass: new (db: Kysely<any>) => T
  ): T {
    return RepositoryFactory.create(repositoryClass, this.db)
  }
  
  getEntity<T extends Entity>(entityClass: new () => T): T {
    return new entityClass()
  }
}
```

### 10. Usage Examples

#### 10.1 Entity Definition
```typescript
// Example: User entity
@Table('users')
export class User extends Entity<UserRow> {
  @PrimaryKey()
  id!: string
  
  @Column({ nullable: false })
  @Required()
  @Email()
  email!: string
  
  @Column({ nullable: true })
  @MaxLength(100)
  firstName?: string
  
  @Column({ nullable: true })
  @MaxLength(100)
  lastName?: string
  
  @HasMany(() => Post, 'userId')
  posts?: Post[]
  
  @BeforeSave()
  async validateEmail() {
    // Custom validation logic
  }
  
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
```

#### 10.2 Repository Usage
```typescript
// Example: User repository
export class UserRepository extends BaseRepository<User, UserRow> {
  getTableName(): string { return 'users' }
  getPrimaryKey(): string { return 'id' }
  
  protected rowToEntity(row: UserRow): User {
    return new User().fromRow(row)
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst()
    
    return row ? this.rowToEntity(row) : null
  }
  
  async findWithPosts(id: string): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    // Load relationships
    const relationshipLoader = new RelationshipLoader(this.db)
    await relationshipLoader.loadRelationships([user], ['posts'])
    
    return user
  }
}
```

#### 10.3 Service Usage
```typescript
// Example: User service
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private validator: EntityValidator
  ) {}
  
  async createUser(userData: Partial<User>): Promise<User> {
    const user = new User()
    Object.assign(user, userData)
    
    // Validate
    const validation = await this.validator.validate(user)
    if (!validation.isValid) {
      throw new ValidationError(validation.errors)
    }
    
    // Save
    return await this.userRepo.save(user)
  }
  
  async getUserWithPosts(id: string): Promise<User | null> {
    return await this.userRepo.findWithPosts(id)
  }
}
```

#### 10.4 Application Setup
```typescript
// Example: Application setup
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    database: new Pool({
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      user: 'user',
      password: 'password'
    })
  })
})

const pseudoORM = new PseudoORM(db, {
  entities: [User, Post, Comment],
  repositories: [UserRepository, PostRepository, CommentRepository],
  migrations: {
    directory: './migrations',
    tableName: 'migrations'
  },
  validation: {
    enabled: true,
    strictMode: true
  },
  relationships: {
    enabled: true,
    lazyLoading: true,
    eagerLoading: true
  },
  caching: {
    enabled: true,
    ttl: 300000 // 5 minutes
  }
})

await pseudoORM.initialize()

// Use in application
const userRepo = pseudoORM.getRepository(UserRepository)
const user = await userRepo.findByEmail('user@example.com')
```

## Implementation Priority

### Phase 1: Core Entity System (High Priority)
1. Entity base class and decorators
2. Basic repository pattern
3. Entity registry
4. Basic validation system

### Phase 2: Relationship Management (Medium Priority)
1. Relationship decorators
2. Relationship loader
3. Eager/lazy loading strategies

### Phase 3: Schema Integration (Medium Priority)
1. Schema diary enhancement
2. Automatic type generation
3. Entity-aware migrations

### Phase 4: Advanced Features (Low Priority)
1. Query optimization
2. Caching system
3. Advanced validation rules
4. Performance monitoring

## Benefits of This Approach

### Advantages
- **Maintains Kysely's strengths** - type safety, performance, SQL control
- **Adds ORM-like convenience** - entities, relationships, validation
- **Avoids ORM complexity** - no change tracking, lazy loading overhead
- **Incremental adoption** - can be adopted gradually
- **Flexible** - can mix raw SQL with entity operations
- **Type-safe** - full TypeScript support throughout

### Disadvantages
- **Additional complexity** - more concepts to learn
- **Performance overhead** - some abstraction cost
- **Learning curve** - new patterns and decorators
- **Maintenance burden** - more code to maintain

## Conclusion

This pseudo-ORM approach would transform DreamBeeSQL into a more developer-friendly tool while maintaining its core strengths. The key is to provide convenience without the complexity and performance overhead of full ORMs. The proposed improvements focus on:

1. **Entity abstraction** for cleaner data modeling
2. **Repository pattern** for consistent data access
3. **Relationship management** for handling associations
4. **Validation system** for data integrity
5. **Schema integration** for better developer experience
6. **Query optimization** for performance

The implementation should be done incrementally, starting with core entity management and gradually adding more advanced features based on user feedback and requirements.
