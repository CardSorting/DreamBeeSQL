# DreamBeeSQL Implementation Guide

## 🎯 Overview

This guide provides a step-by-step approach to implementing the DreamBeeSQL pseudo-ORM system. We'll build the system incrementally, starting with core functionality and gradually adding advanced features.

## 🏗️ Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
- Basic database connection and configuration
- Schema discovery engine
- Simple type generation
- Basic entity and repository generation

### Phase 2: Runtime Operations (Week 3-4)
- Entity and repository management
- Basic CRUD operations
- Relationship loading
- Caching system

### Phase 3: Advanced Features (Week 5-6)
- Schema evolution
- Advanced relationship types
- Performance optimization
- Error handling and fallbacks

### Phase 4: Production Ready (Week 7-8)
- Comprehensive testing
- Documentation
- Performance tuning
- Migration tools

## 🚀 Phase 1: Core Foundation

### Step 1: Project Setup

```bash
# Create new project
mkdir dreambeesql
cd dreambeesql

# Initialize package.json
npm init -y

# Install dependencies
npm install kysely
npm install -D typescript @types/node ts-node

# Create project structure
mkdir -p src/{core,discovery,generation,runtime,config}
mkdir -p tests examples docs
```

### Step 2: Basic Configuration

```typescript
// src/config/types.ts
export interface DreamBeeSQLConfig {
  dialect: 'postgresql' | 'mysql' | 'sqlite' | 'mssql'
  connection: ConnectionConfig
  introspection?: IntrospectionConfig
  cache?: CacheConfig
  logging?: LoggingConfig
}

export interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface IntrospectionConfig {
  includeViews: boolean
  includeSystemTables: boolean
  customTypeMappings: Record<string, string>
}

export interface CacheConfig {
  ttl: number
  maxSize: number
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enabled: boolean
}
```

### Step 3: Core DreamBeeSQL Class

```typescript
// src/core/dreambeesql.ts
import { Kysely } from 'kysely'
import { DreamBeeSQLConfig } from '../config/types'
import { SchemaDiscoveryEngine } from '../discovery/schema-discovery-engine'
import { TypeEntityGenerator } from '../generation/type-entity-generator'
import { RuntimeManager } from '../runtime/runtime-manager'

export class DreamBeeSQL {
  private db: Kysely<any>
  private config: DreamBeeSQLConfig
  private discoveryEngine: SchemaDiscoveryEngine
  private typeGenerator: TypeEntityGenerator
  private runtimeManager: RuntimeManager
  private initialized = false

  constructor(config: DreamBeeSQLConfig) {
    this.config = config
    this.db = this.createDatabaseConnection()
    this.discoveryEngine = new SchemaDiscoveryEngine()
    this.typeGenerator = new TypeEntityGenerator()
    this.runtimeManager = new RuntimeManager()
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // 1. Discover database schema
      const discoveryResult = await this.discoveryEngine.discoverDatabase(this.db)
      
      if (!discoveryResult.success) {
        throw new Error(`Schema discovery failed: ${discoveryResult.errors.join(', ')}`)
      }

      // 2. Generate types and entities
      const types = await this.typeGenerator.generateTypes(discoveryResult.schemas)
      const entities = await this.typeGenerator.generateEntities(discoveryResult.schemas)
      const repositories = await this.typeGenerator.generateRepositories(discoveryResult.schemas)

      // 3. Register with runtime manager
      await this.runtimeManager.registerTypes(types)
      await this.runtimeManager.registerEntities(entities)
      await this.runtimeManager.registerRepositories(repositories)

      this.initialized = true
      console.log('DreamBeeSQL initialized successfully')
    } catch (error) {
      console.error('Initialization failed:', error)
      throw error
    }
  }

  getRepository<T>(tableName: string): T {
    if (!this.initialized) {
      throw new Error('DreamBeeSQL not initialized. Call initialize() first.')
    }
    return this.runtimeManager.getRepository(tableName)
  }

  getEntity<T>(tableName: string): T {
    if (!this.initialized) {
      throw new Error('DreamBeeSQL not initialized. Call initialize() first.')
    }
    return this.runtimeManager.getEntity(tableName)
  }

  private createDatabaseConnection(): Kysely<any> {
    // Implementation depends on dialect
    switch (this.config.dialect) {
      case 'postgresql':
        return this.createPostgreSQLConnection()
      case 'mysql':
        return this.createMySQLConnection()
      case 'sqlite':
        return this.createSQLiteConnection()
      case 'mssql':
        return this.createMSSQLConnection()
      default:
        throw new Error(`Unsupported dialect: ${this.config.dialect}`)
    }
  }

  private createPostgreSQLConnection(): Kysely<any> {
    // PostgreSQL connection implementation
    // This would use the appropriate PostgreSQL driver
    throw new Error('PostgreSQL connection not implemented yet')
  }

  // ... other connection methods
}
```

### Step 4: Schema Discovery Engine

```typescript
// src/discovery/schema-discovery-engine.ts
import { Kysely } from 'kysely'
import { IntrospectionStrategy } from './introspection-strategy'
import { PostgreSQLStrategy } from './strategies/postgresql-strategy'
import { MySQLStrategy } from './strategies/mysql-strategy'
import { SQLiteStrategy } from './strategies/sqlite-strategy'
import { MSSQLStrategy } from './strategies/mssql-strategy'

export interface DiscoveryResult {
  success: boolean
  schemas: Map<string, TableSchema>
  relationships: Map<string, RelationshipInfo[]>
  errors: string[]
  warnings: string[]
}

export interface TableSchema {
  name: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  foreignKeys: ForeignKeyInfo[]
  primaryKeys: string[]
  uniqueConstraints: UniqueConstraintInfo[]
  isView: boolean
  comment?: string
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  maxLength?: number
  precision?: number
  scale?: number
  comment?: string
}

export interface RelationshipInfo {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  foreignKeyName?: string
  isOptional: boolean
}

export class SchemaDiscoveryEngine {
  private strategies = new Map<string, IntrospectionStrategy>()

  constructor() {
    this.registerDefaultStrategies()
  }

  private registerDefaultStrategies(): void {
    this.strategies.set('postgresql', new PostgreSQLStrategy())
    this.strategies.set('mysql', new MySQLStrategy())
    this.strategies.set('sqlite', new SQLiteStrategy())
    this.strategies.set('mssql', new MSSQLStrategy())
  }

  async discoverDatabase(db: Kysely<any>): Promise<DiscoveryResult> {
    try {
      const dialect = this.detectDialect(db)
      const strategy = this.strategies.get(dialect)
      
      if (!strategy) {
        throw new Error(`No strategy found for dialect: ${dialect}`)
      }

      const schemas = await strategy.discoverTables(db)
      const relationships = await strategy.discoverRelationships(db, schemas)

      return {
        success: true,
        schemas: new Map(schemas.map(s => [s.name, s])),
        relationships,
        errors: [],
        warnings: []
      }
    } catch (error) {
      return {
        success: false,
        schemas: new Map(),
        relationships: new Map(),
        errors: [error.message],
        warnings: []
      }
    }
  }

  private detectDialect(db: Kysely<any>): string {
    // Simple dialect detection based on connection
    // In a real implementation, this would be more sophisticated
    return 'postgresql' // Placeholder
  }

  registerStrategy(dialect: string, strategy: IntrospectionStrategy): void {
    this.strategies.set(dialect, strategy)
  }
}
```

### Step 5: PostgreSQL Strategy

```typescript
// src/discovery/strategies/postgresql-strategy.ts
import { Kysely } from 'kysely'
import { IntrospectionStrategy, TableSchema, ColumnInfo, RelationshipInfo } from '../schema-discovery-engine'

export class PostgreSQLStrategy implements IntrospectionStrategy {
  async discoverTables(db: Kysely<any>): Promise<TableSchema[]> {
    const tables = await db
      .selectFrom('information_schema.tables')
      .select([
        'table_name as name',
        'table_type',
        'table_comment'
      ])
      .where('table_schema', 'not in', ['information_schema', 'pg_catalog'])
      .where('table_type', 'in', ['BASE TABLE', 'VIEW'])
      .execute()

    const discoveredTables: TableSchema[] = []

    for (const table of tables) {
      const columns = await this.getColumnMetadata(db, table.name)
      const indexes = await this.getIndexMetadata(db, table.name)
      const foreignKeys = await this.getForeignKeyMetadata(db, table.name)
      const primaryKeys = await this.getPrimaryKeys(db, table.name)
      const uniqueConstraints = await this.getUniqueConstraints(db, table.name)

      discoveredTables.push({
        name: table.name,
        columns,
        indexes,
        foreignKeys,
        primaryKeys,
        uniqueConstraints,
        isView: table.table_type === 'VIEW',
        comment: table.table_comment
      })
    }

    return discoveredTables
  }

  async discoverRelationships(db: Kysely<any>, tables: TableSchema[]): Promise<Map<string, RelationshipInfo[]>> {
    const relationships = new Map<string, RelationshipInfo[]>()

    for (const table of tables) {
      const tableRelationships: RelationshipInfo[] = []

      for (const fk of table.foreignKeys) {
        const targetTable = tables.find(t => t.name === fk.referencedTable)
        if (targetTable) {
          const isUnique = targetTable.uniqueConstraints.some(uc => 
            uc.columns.includes(fk.referencedColumn)
          )

          const relationshipType: RelationshipInfo['type'] = isUnique ? 'one-to-one' : 'many-to-one'

          tableRelationships.push({
            type: relationshipType,
            sourceTable: table.name,
            sourceColumn: fk.columnName,
            targetTable: fk.referencedTable,
            targetColumn: fk.referencedColumn,
            foreignKeyName: fk.name,
            isOptional: !table.columns.find(c => c.name === fk.columnName)?.nullable
          })
        }
      }

      relationships.set(table.name, tableRelationships)
    }

    return relationships
  }

  private async getColumnMetadata(db: Kysely<any>, tableName: string): Promise<ColumnInfo[]> {
    const columns = await db
      .selectFrom('information_schema.columns as c')
      .select([
        'c.column_name as name',
        'c.data_type as type',
        'c.is_nullable as nullable',
        'c.column_default as defaultValue',
        'c.character_maximum_length as maxLength',
        'c.numeric_precision as precision',
        'c.numeric_scale as scale',
        'c.column_comment as comment',
        'c.is_identity as isAutoIncrement'
      ])
      .where('c.table_name', '=', tableName)
      .where('c.table_schema', '=', 'public')
      .execute()

    const primaryKeyColumns = await this.getPrimaryKeys(db, tableName)
    const pkSet = new Set(primaryKeyColumns)

    return columns.map(col => ({
      name: col.name,
      type: col.type,
      nullable: col.nullable === 'YES',
      defaultValue: col.defaultValue,
      isPrimaryKey: pkSet.has(col.name),
      isAutoIncrement: col.isAutoIncrement === 'YES',
      maxLength: col.maxLength,
      precision: col.precision,
      scale: col.scale,
      comment: col.comment
    }))
  }

  private async getPrimaryKeys(db: Kysely<any>, tableName: string): Promise<string[]> {
    const result = await db
      .selectFrom('information_schema.table_constraints as tc')
      .join('information_schema.key_column_usage as kcu',
        (join) => join
          .onRef('tc.constraint_name', '=', 'kcu.constraint_name')
          .onRef('tc.table_schema', '=', 'kcu.table_schema')
      )
      .select(['kcu.column_name as columnName'])
      .where('tc.constraint_type', '=', 'PRIMARY KEY')
      .where('tc.table_name', '=', tableName)
      .orderBy('kcu.ordinal_position')
      .execute()

    return result.map(row => row.columnName)
  }

  // ... other metadata methods
}
```

### Step 6: Type and Entity Generator

```typescript
// src/generation/type-entity-generator.ts
import { TableSchema, RelationshipInfo } from '../discovery/schema-discovery-engine'

export interface GeneratedTypes {
  database: string
  entities: string
  repositories: string
  relationships: string
}

export interface GeneratedEntities {
  [tableName: string]: GeneratedEntityClass
}

export interface GeneratedRepositories {
  [tableName: string]: GeneratedRepositoryClass
}

export interface GeneratedEntityClass {
  className: string
  fileName: string
  content: string
  dependencies: string[]
}

export interface GeneratedRepositoryClass {
  className: string
  fileName: string
  content: string
  dependencies: string[]
}

export class TypeEntityGenerator {
  private typeMapper: DatabaseTypeMapper

  constructor() {
    this.typeMapper = new DatabaseTypeMapper()
  }

  async generateTypes(schemas: Map<string, TableSchema>): Promise<GeneratedTypes> {
    const database = await this.generateDatabaseTypes(schemas)
    const entities = await this.generateEntityTypes(schemas)
    const repositories = await this.generateRepositoryTypes(schemas)
    const relationships = await this.generateRelationshipTypes(schemas)

    return {
      database,
      entities,
      repositories,
      relationships
    }
  }

  async generateEntities(schemas: Map<string, TableSchema>): Promise<GeneratedEntities> {
    const entities: GeneratedEntities = {}

    for (const [tableName, schema] of schemas) {
      const entityClass = await this.generateEntityClass(tableName, schema)
      entities[tableName] = entityClass
    }

    return entities
  }

  async generateRepositories(schemas: Map<string, TableSchema>): Promise<GeneratedRepositories> {
    const repositories: GeneratedRepositories = {}

    for (const [tableName, schema] of schemas) {
      const repositoryClass = await this.generateRepositoryClass(tableName, schema)
      repositories[tableName] = repositoryClass
    }

    return repositories
  }

  private async generateDatabaseTypes(schemas: Map<string, TableSchema>): Promise<string> {
    let code = '// Auto-generated database types\n'
    code += 'export interface Database {\n'

    for (const [tableName, schema] of schemas) {
      code += `  ${tableName}: {\n`
      
      for (const column of schema.columns) {
        const tsType = this.typeMapper.mapToTypeScript(column)
        code += `    ${column.name}: ${tsType}\n`
      }
      
      code += '  }\n'
    }

    code += '}\n'
    return code
  }

  private async generateEntityTypes(schemas: Map<string, TableSchema>): Promise<string> {
    let code = '// Auto-generated entity types\n'

    for (const [tableName, schema] of schemas) {
      const entityName = this.toPascalCase(tableName)
      
      // Generate row type
      code += `export interface ${entityName}Row {\n`
      for (const column of schema.columns) {
        const tsType = this.typeMapper.mapToTypeScript(column)
        code += `  ${column.name}: ${tsType}\n`
      }
      code += '}\n\n'

      // Generate insertable type
      code += `export interface Insertable${entityName}Row {\n`
      for (const column of schema.columns) {
        if (column.isPrimaryKey && column.isAutoIncrement) continue
        
        const tsType = this.typeMapper.mapToTypeScript(column)
        code += `  ${column.name}: ${tsType}\n`
      }
      code += '}\n\n'

      // Generate updateable type
      code += `export interface Updateable${entityName}Row {\n`
      for (const column of schema.columns) {
        if (column.isPrimaryKey) continue
        
        const tsType = this.typeMapper.mapToTypeScript(column, true)
        code += `  ${column.name}?: ${tsType}\n`
      }
      code += '}\n\n'
    }

    return code
  }

  private async generateEntityClass(tableName: string, schema: TableSchema): Promise<GeneratedEntityClass> {
    const className = this.toPascalCase(tableName)
    const rowTypeName = `${className}Row`
    
    let code = `// Auto-generated entity class\n`
    code += `import { Entity } from '../core/entity'\n`
    code += `import { ${rowTypeName} } from '../types/entities'\n\n`
    
    code += `export class ${className} extends Entity<${rowTypeName}> {\n`
    
    // Generate properties
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      const tsType = this.typeMapper.mapToTypeScript(column)
      
      if (column.isPrimaryKey) {
        code += `  @PrimaryKey()\n`
      }
      
      code += `  @Column({ nullable: ${column.nullable}${column.isAutoIncrement ? ', autoIncrement: true' : ''} })\n`
      code += `  ${propertyName}!: ${tsType}\n\n`
    }
    
    // Generate toRow method
    code += `  toRow(): ${rowTypeName} {\n`
    code += `    return {\n`
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      code += `      ${column.name}: this.${propertyName},\n`
    }
    code += `    }\n`
    code += `  }\n\n`
    
    // Generate fromRow method
    code += `  fromRow(row: ${rowTypeName}): this {\n`
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      code += `    this.${propertyName} = row.${column.name}\n`
    }
    code += `    return this\n`
    code += `  }\n`
    code += `}\n`

    return {
      className,
      fileName: `${this.toKebabCase(className)}.entity.ts`,
      content: code,
      dependencies: []
    }
  }

  private async generateRepositoryClass(tableName: string, schema: TableSchema): Promise<GeneratedRepositoryClass> {
    const entityName = this.toPascalCase(tableName)
    const repositoryName = `${entityName}Repository`
    const rowTypeName = `${entityName}Row`
    
    let code = `// Auto-generated repository class\n`
    code += `import { BaseRepository } from '../core/base-repository'\n`
    code += `import { Kysely } from 'kysely'\n`
    code += `import { ${entityName}, ${rowTypeName} } from '../entities/${this.toKebabCase(entityName)}.entity'\n\n`
    
    code += `export class ${repositoryName} extends BaseRepository<${entityName}, ${rowTypeName}> {\n`
    code += `  constructor(db: Kysely<any>) {\n`
    code += `    super(db)\n`
    code += `  }\n\n`
    
    code += `  getTableName(): string {\n`
    code += `    return '${tableName}'\n`
    code += `  }\n\n`
    
    const primaryKeys = schema.columns.filter(col => col.isPrimaryKey)
    if (primaryKeys.length === 1) {
      code += `  getPrimaryKey(): string {\n`
      code += `    return '${primaryKeys[0].name}'\n`
      code += `  }\n\n`
    }
    
    code += `  protected rowToEntity(row: ${rowTypeName}): ${entityName} {\n`
    code += `    return new ${entityName}().fromRow(row)\n`
    code += `  }\n`
    code += `}\n`

    return {
      className: repositoryName,
      fileName: `${this.toKebabCase(repositoryName)}.ts`,
      content: code,
      dependencies: []
    }
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }
}
```

### Step 7: Database Type Mapper

```typescript
// src/generation/database-type-mapper.ts
import { ColumnInfo } from '../discovery/schema-discovery-engine'

export class DatabaseTypeMapper {
  mapToTypeScript(column: ColumnInfo, optional: boolean = false): string {
    const baseType = this.getBaseType(column)
    const nullableType = column.nullable ? `${baseType} | null` : baseType
    return optional ? `${nullableType}` : nullableType
  }

  private getBaseType(column: ColumnInfo): string {
    const type = column.type.toLowerCase()
    
    if (type.includes('int') || type.includes('serial') || type.includes('bigint')) {
      return 'number'
    }
    
    if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) {
      return 'number'
    }
    
    if (type.includes('bool')) {
      return 'boolean'
    }
    
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return 'Date'
    }
    
    if (type.includes('json') || type.includes('jsonb')) {
      return 'any'
    }
    
    if (type.includes('text') || type.includes('varchar') || type.includes('char') || type.includes('string')) {
      return 'string'
    }
    
    if (type.includes('uuid')) {
      return 'string'
    }
    
    if (type.includes('bytea')) {
      return 'Buffer'
    }
    
    return 'any'
  }
}
```

### Step 8: Runtime Manager

```typescript
// src/runtime/runtime-manager.ts
import { Kysely } from 'kysely'
import { GeneratedTypes, GeneratedEntities, GeneratedRepositories } from '../generation/type-entity-generator'
import { BaseRepository } from '../core/base-repository'

export class RuntimeManager {
  private types: GeneratedTypes | null = null
  private entities = new Map<string, any>()
  private repositories = new Map<string, BaseRepository>()
  private db: Kysely<any> | null = null

  setDatabase(db: Kysely<any>): void {
    this.db = db
  }

  async registerTypes(types: GeneratedTypes): Promise<void> {
    this.types = types
    // In a real implementation, this would write the types to files
    console.log('Types registered:', Object.keys(types))
  }

  async registerEntities(entities: GeneratedEntities): Promise<void> {
    for (const [tableName, entityClass] of Object.entries(entities)) {
      this.entities.set(tableName, entityClass)
    }
    console.log('Entities registered:', Array.from(this.entities.keys()))
  }

  async registerRepositories(repositories: GeneratedRepositories): Promise<void> {
    if (!this.db) {
      throw new Error('Database not set. Call setDatabase() first.')
    }

    for (const [tableName, repositoryClass] of Object.entries(repositories)) {
      // In a real implementation, this would dynamically create repository instances
      // For now, we'll store the class definition
      this.repositories.set(tableName, repositoryClass as any)
    }
    console.log('Repositories registered:', Array.from(this.repositories.keys()))
  }

  getRepository<T>(tableName: string): T {
    const repository = this.repositories.get(tableName)
    if (!repository) {
      throw new Error(`Repository not found for table: ${tableName}`)
    }
    return repository as T
  }

  getEntity<T>(tableName: string): T {
    const entity = this.entities.get(tableName)
    if (!entity) {
      throw new Error(`Entity not found for table: ${tableName}`)
    }
    return entity as T
  }
}
```

### Step 9: Basic Entity and Repository Base Classes

```typescript
// src/core/entity.ts
export abstract class Entity<T = any> {
  abstract toRow(): T
  abstract fromRow(row: T): this
}

// Decorators (simplified)
export function PrimaryKey() {
  return function (target: any, propertyKey: string) {
    // Store metadata
  }
}

export function Column(options?: { nullable?: boolean; autoIncrement?: boolean }) {
  return function (target: any, propertyKey: string) {
    // Store metadata
  }
}
```

```typescript
// src/core/base-repository.ts
import { Kysely } from 'kysely'
import { Entity } from './entity'

export abstract class BaseRepository<TEntity extends Entity, TRow> {
  protected db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.db = db
  }

  abstract getTableName(): string
  abstract getPrimaryKey(): string
  protected abstract rowToEntity(row: TRow): TEntity

  async findById(id: any): Promise<TEntity | null> {
    const row = await this.db
      .selectFrom(this.getTableName())
      .selectAll()
      .where(this.getPrimaryKey(), '=', id)
      .executeTakeFirst()

    return row ? this.rowToEntity(row) : null
  }

  async findAll(): Promise<TEntity[]> {
    const rows = await this.db
      .selectFrom(this.getTableName())
      .selectAll()
      .execute()

    return rows.map(row => this.rowToEntity(row))
  }

  async save(entity: TEntity): Promise<TEntity> {
    const row = entity.toRow()
    const result = await this.db
      .insertInto(this.getTableName())
      .values(row)
      .returningAll()
      .executeTakeFirstOrThrow()

    return this.rowToEntity(result)
  }

  async update(entity: TEntity): Promise<TEntity> {
    const row = entity.toRow()
    const result = await this.db
      .updateTable(this.getTableName())
      .set(row)
      .where(this.getPrimaryKey(), '=', (row as any)[this.getPrimaryKey()])
      .returningAll()
      .executeTakeFirstOrThrow()

    return this.rowToEntity(result)
  }

  async delete(id: any): Promise<boolean> {
    const result = await this.db
      .deleteFrom(this.getTableName())
      .where(this.getPrimaryKey(), '=', id)
      .execute()

    return result.numDeletedRows > 0
  }
}
```

### Step 10: Basic Example

```typescript
// examples/basic-usage.ts
import { DreamBeeSQL } from '../src/core/dreambeesql'

async function basicExample() {
  try {
    // Initialize DreamBeeSQL
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

    // Initialize and discover schema
    await db.initialize()

    // Get auto-generated repository
    const userRepo = db.getRepository('users')

    // Use repository methods
    const users = await userRepo.findAll()
    console.log('Users:', users)

    // Create new user
    const newUser = await userRepo.create({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    })
    console.log('Created user:', newUser)

  } catch (error) {
    console.error('Error:', error)
  }
}

basicExample()
```

## 🎯 Phase 1 Completion Checklist

- [ ] Basic project structure
- [ ] Core DreamBeeSQL class
- [ ] Schema discovery engine
- [ ] PostgreSQL strategy
- [ ] Type and entity generator
- [ ] Database type mapper
- [ ] Runtime manager
- [ ] Basic entity and repository classes
- [ ] Basic example
- [ ] Unit tests for core functionality

## 🚀 Next Steps

Once Phase 1 is complete, you'll have a working foundation that can:
- Connect to a PostgreSQL database
- Discover the database schema
- Generate TypeScript types and entity classes
- Create basic repositories with CRUD operations

The next phases will add:
- Schema evolution support
- Advanced relationship loading
- Performance optimization
- Comprehensive error handling
- Production-ready features

This implementation guide provides a solid foundation for building the DreamBeeSQL pseudo-ORM system incrementally and systematically.
