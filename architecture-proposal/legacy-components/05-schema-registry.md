# Schema Registry Architecture

## Overview

The Schema Registry provides centralized management of database schema information using a singleton pattern. It focuses on essential schema operations without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single registry instance
- **Lazy Schema Loading** - Load schema only when needed
- **Minimal Database Queries** - Only essential schema queries
- **Type Safety** - Full TypeScript support
- **Cache Management** - Efficient schema caching
- **No Health Checks** - Avoid unnecessary monitoring queries

## Architecture

```typescript
// Schema Registry (Singleton)
export class SchemaRegistry {
  private static instance: SchemaRegistry | null = null
  private schemaCache = new Map<string, TableSchema>()
  private cacheTimestamp = 0
  private readonly CACHE_TTL = 300000 // 5 minutes
  private db: Kysely<any> | null = null
  
  private constructor() {
    // Private constructor for singleton
  }
  
  static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry()
    }
    return SchemaRegistry.instance
  }
  
  // Core methods
  setDatabase(db: Kysely<any>): void
  async getTableSchema(tableName: string): Promise<TableSchema>
  async getAllTableSchemas(): Promise<Map<string, TableSchema>>
  async syncWithDatabase(): Promise<void>
  clearCache(): void
  isCacheValid(): boolean
}
```

## Schema Metadata

```typescript
export interface TableSchema {
  name: string
  columns: ColumnSchema[]
  indexes: IndexSchema[]
  foreignKeys: ForeignKeySchema[]
  primaryKey: string
  isView: boolean
  schema?: string
}

export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  defaultValue?: any
  comment?: string
}

export interface IndexSchema {
  name: string
  columns: string[]
  unique: boolean
  type: string
}

export interface ForeignKeySchema {
  name: string
  column: string
  referencedTable: string
  referencedColumn: string
  onDelete?: string
  onUpdate?: string
}
```

## Schema Introspector

```typescript
export class SchemaIntrospector {
  private db: Kysely<any>
  
  constructor(db: Kysely<any>) {
    this.db = db
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
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
        defaultValue: col.hasDefaultValue,
        comment: col.comment
      })),
      indexes: await this.getTableIndexes(tableName),
      foreignKeys: await this.getTableForeignKeys(tableName),
      primaryKey: this.getPrimaryKey(table.columns),
      isView: table.isView,
      schema: table.schema
    }
  }
  
  async getAllTableSchemas(): Promise<Map<string, TableSchema>> {
    const schemas = new Map<string, TableSchema>()
    const metadata = await this.db.introspection.getTables()
    
    for (const table of metadata) {
      const schema = await this.getTableSchema(table.name)
      schemas.set(table.name, schema)
    }
    
    return schemas
  }
  
  private getPrimaryKey(columns: any[]): string {
    const pkColumn = columns.find(col => col.name === 'id')
    return pkColumn ? pkColumn.name : 'id'
  }
  
  private async getTableIndexes(tableName: string): Promise<IndexSchema[]> {
    // Implementation depends on database dialect
    // This is a simplified version
    return []
  }
  
  private async getTableForeignKeys(tableName: string): Promise<ForeignKeySchema[]> {
    // Implementation depends on database dialect
    // This is a simplified version
    return []
  }
}
```

## Schema Generator

```typescript
export class SchemaGenerator {
  private db: Kysely<any>
  private entityManager: EntityManager
  
  constructor(db: Kysely<any>) {
    this.db = db
    this.entityManager = EntityManager.getInstance()
  }
  
  async generateEntityClass(tableName: string): Promise<string> {
    const schema = await this.getTableSchema(tableName)
    return this.generateClassCode(schema)
  }
  
  async generateDatabaseTypes(): Promise<string> {
    const schemas = await this.getAllTableSchemas()
    
    let code = 'export interface Database {\n'
    
    for (const [tableName, schema] of schemas) {
      code += `  ${tableName}: {\n`
      
      for (const column of schema.columns) {
        const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
        code += `    ${column.name}: ${tsType}\n`
      }
      
      code += '  }\n'
    }
    
    code += '}\n'
    return code
  }
  
  private async getTableSchema(tableName: string): Promise<TableSchema> {
    const registry = SchemaRegistry.getInstance()
    return await registry.getTableSchema(tableName)
  }
  
  private async getAllTableSchemas(): Promise<Map<string, TableSchema>> {
    const registry = SchemaRegistry.getInstance()
    return await registry.getAllTableSchemas()
  }
  
  private generateClassCode(schema: TableSchema): string {
    const className = this.toPascalCase(schema.name)
    
    let code = `@Entity('${schema.name}')\n`
    code += `export class ${className} extends Entity<${className}Row> {\n`
    
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
      
      if (column.primaryKey) {
        code += `  @PrimaryKey()\n`
      }
      
      code += `  @Column({ nullable: ${column.nullable} })\n`
      code += `  ${propertyName}!: ${tsType}\n\n`
    }
    
    code += `  toRow(): ${className}Row {\n`
    code += `    return {\n`
    
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      code += `      ${column.name}: this.${propertyName},\n`
    }
    
    code += `    }\n`
    code += `  }\n\n`
    
    code += `  fromRow(row: ${className}Row): this {\n`
    
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      code += `    this.${propertyName} = row.${column.name}\n`
    }
    
    code += `    return this\n`
    code += `  }\n`
    code += `}\n`
    
    return code
  }
  
  private mapDbTypeToTsType(dbType: string, nullable: boolean): string {
    const baseType = this.getBaseType(dbType)
    return nullable ? `${baseType} | null` : baseType
  }
  
  private getBaseType(dbType: string): string {
    const type = dbType.toLowerCase()
    
    if (type.includes('int') || type.includes('serial')) return 'number'
    if (type.includes('float') || type.includes('double') || type.includes('decimal')) return 'number'
    if (type.includes('bool')) return 'boolean'
    if (type.includes('date') || type.includes('time')) return 'Date'
    if (type.includes('json')) return 'any'
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'string'
    
    return 'any'
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}
```

## Schema Synchronizer

```typescript
export class SchemaSynchronizer {
  private db: Kysely<any>
  private entityManager: EntityManager
  private schemaRegistry: SchemaRegistry
  
  constructor(db: Kysely<any>) {
    this.db = db
    this.entityManager = EntityManager.getInstance()
    this.schemaRegistry = SchemaRegistry.getInstance()
  }
  
  async syncEntityWithSchema(entityClass: new () => Entity): Promise<SyncResult> {
    const tableName = entityClass.getTableName()
    const entitySchema = this.getEntitySchema(entityClass)
    const dbSchema = await this.schemaRegistry.getTableSchema(tableName)
    
    const differences = this.compareSchemas(entitySchema, dbSchema)
    
    if (differences.length === 0) {
      return { needsSync: false, differences: [] }
    }
    
    return { needsSync: true, differences }
  }
  
  async generateMigrationFromDifferences(
    entityClass: new () => Entity,
    differences: SchemaDifference[]
  ): Promise<string> {
    const tableName = entityClass.getTableName()
    let migration = `-- Migration for ${tableName}\n`
    
    for (const diff of differences) {
      switch (diff.type) {
        case 'ADD_COLUMN':
          migration += this.generateAddColumnSQL(tableName, diff.column)
          break
        case 'DROP_COLUMN':
          migration += this.generateDropColumnSQL(tableName, diff.column)
          break
        case 'ALTER_COLUMN':
          migration += this.generateAlterColumnSQL(tableName, diff.column)
          break
        case 'ADD_INDEX':
          migration += this.generateAddIndexSQL(tableName, diff.index)
          break
        case 'DROP_INDEX':
          migration += this.generateDropIndexSQL(tableName, diff.index)
          break
      }
    }
    
    return migration
  }
  
  private getEntitySchema(entityClass: new () => Entity): TableSchema {
    // Extract schema from entity metadata
    const metadata = this.entityManager.getEntityMetadata(entityClass.getTableName())
    if (!metadata) {
      throw new Error(`Entity metadata not found for ${entityClass.getTableName()}`)
    }
    
    return {
      name: metadata.tableName,
      columns: metadata.columns.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable,
        primaryKey: col.primaryKey,
        autoIncrement: col.autoIncrement,
        defaultValue: col.defaultValue
      })),
      indexes: [],
      foreignKeys: [],
      primaryKey: metadata.primaryKey,
      isView: false
    }
  }
  
  private compareSchemas(entitySchema: TableSchema, dbSchema: TableSchema): SchemaDifference[] {
    const differences: SchemaDifference[] = []
    
    // Compare columns
    for (const entityColumn of entitySchema.columns) {
      const dbColumn = dbSchema.columns.find(col => col.name === entityColumn.name)
      
      if (!dbColumn) {
        differences.push({
          type: 'ADD_COLUMN',
          column: entityColumn
        })
      } else if (!this.columnsEqual(entityColumn, dbColumn)) {
        differences.push({
          type: 'ALTER_COLUMN',
          column: entityColumn
        })
      }
    }
    
    // Check for columns to drop
    for (const dbColumn of dbSchema.columns) {
      const entityColumn = entitySchema.columns.find(col => col.name === dbColumn.name)
      
      if (!entityColumn) {
        differences.push({
          type: 'DROP_COLUMN',
          column: dbColumn
        })
      }
    }
    
    return differences
  }
  
  private columnsEqual(col1: ColumnSchema, col2: ColumnSchema): boolean {
    return col1.type === col2.type &&
           col1.nullable === col2.nullable &&
           col1.primaryKey === col2.primaryKey &&
           col1.autoIncrement === col2.autoIncrement
  }
  
  private generateAddColumnSQL(tableName: string, column: ColumnSchema): string {
    return `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}${column.nullable ? '' : ' NOT NULL'};\n`
  }
  
  private generateDropColumnSQL(tableName: string, column: ColumnSchema): string {
    return `ALTER TABLE ${tableName} DROP COLUMN ${column.name};\n`
  }
  
  private generateAlterColumnSQL(tableName: string, column: ColumnSchema): string {
    return `ALTER TABLE ${tableName} ALTER COLUMN ${column.name} TYPE ${column.type}${column.nullable ? '' : ' NOT NULL'};\n`
  }
  
  private generateAddIndexSQL(tableName: string, index: IndexSchema): string {
    const unique = index.unique ? 'UNIQUE ' : ''
    return `CREATE ${unique}INDEX ${index.name} ON ${tableName} (${index.columns.join(', ')});\n`
  }
  
  private generateDropIndexSQL(tableName: string, index: IndexSchema): string {
    return `DROP INDEX ${index.name};\n`
  }
}

export interface SyncResult {
  needsSync: boolean
  differences: SchemaDifference[]
}

export interface SchemaDifference {
  type: 'ADD_COLUMN' | 'DROP_COLUMN' | 'ALTER_COLUMN' | 'ADD_INDEX' | 'DROP_INDEX'
  column?: ColumnSchema
  index?: IndexSchema
}
```

## Usage Examples

### Schema Registry Usage

```typescript
// Setup
const db = new Kysely<Database>({ dialect: new PostgresDialect(...) })
const registry = SchemaRegistry.getInstance()
registry.setDatabase(db)

// Get table schema
const userSchema = await registry.getTableSchema('users')
console.log(userSchema.columns)

// Get all schemas
const allSchemas = await registry.getAllTableSchemas()
for (const [tableName, schema] of allSchemas) {
  console.log(`${tableName}: ${schema.columns.length} columns`)
}
```

### Schema Generator Usage

```typescript
const generator = new SchemaGenerator(db)

// Generate entity class
const userClassCode = await generator.generateEntityClass('users')
console.log(userClassCode)

// Generate database types
const dbTypes = await generator.generateDatabaseTypes()
console.log(dbTypes)
```

### Schema Synchronization

```typescript
const synchronizer = new SchemaSynchronizer(db)

// Check if entity needs sync
const syncResult = await synchronizer.syncEntityWithSchema(User)
if (syncResult.needsSync) {
  console.log('Schema differences found:', syncResult.differences)
  
  // Generate migration
  const migration = await synchronizer.generateMigrationFromDifferences(User, syncResult.differences)
  console.log(migration)
}
```

## Performance Characteristics

- **Schema Loading**: O(1) - Cached after first load
- **Cache Management**: O(1) - Map-based storage
- **Schema Comparison**: O(n) - Depends on schema complexity
- **Memory Usage**: Minimal - Only schema metadata
- **Database Queries**: Only when needed - No health checks

## Benefits

1. **Centralized Management** - Single registry for all schema operations
2. **Efficient Caching** - Schema information cached for performance
3. **Type Safety** - Full TypeScript support
4. **Minimal Overhead** - Only essential schema queries
5. **Schema Synchronization** - Compare entity and database schemas
6. **Code Generation** - Generate entity classes from schema

## Limitations

1. **Static Configuration** - Schema information must be known at compile time
2. **Memory Usage** - Schema metadata cached in memory
3. **Database Dependency** - Requires database connection for schema introspection

## Integration Points

- **Entity Manager** - Provides entity metadata
- **Repository Registry** - Uses schema information for queries
- **Migration System** - Generates migrations from schema differences
- **Configuration Manager** - Provides schema configuration
