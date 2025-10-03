# Migration Integration Architecture

## Overview

The Migration Integration provides seamless integration between the pseudo-ORM system and the existing DreamBeeSQL migration system. It focuses on entity-aware migrations without aggressive monitoring or database spam.

## Design Principles

- **Integration with Existing System** - Leverage existing migration infrastructure
- **Entity-Aware Migrations** - Generate migrations from entity changes
- **Minimal Overhead** - No additional database queries
- **Type Safety** - Full TypeScript support
- **Lazy Generation** - Generate migrations only when needed
- **No Database Spam** - Use existing migration tracking

## Architecture

```typescript
// Migration Integration (Singleton)
export class MigrationIntegration {
  private static instance: MigrationIntegration | null = null
  private entityManager: EntityManager
  private schemaRegistry: SchemaRegistry
  private migrationManager: any // Existing DreamBeeSQL migration manager
  
  private constructor() {
    this.entityManager = EntityManager.getInstance()
    this.schemaRegistry = SchemaRegistry.getInstance()
  }
  
  static getInstance(): MigrationIntegration {
    if (!MigrationIntegration.instance) {
      MigrationIntegration.instance = new MigrationIntegration()
    }
    return MigrationIntegration.instance
  }
  
  // Core methods
  setMigrationManager(migrationManager: any): void
  async generateMigrationFromEntities(entities: typeof Entity[]): Promise<string>
  async generateMigrationFromSchemaDiff(): Promise<string>
  async syncEntityWithDatabase(entityClass: typeof Entity): Promise<SyncResult>
  async createEntityMigration(name: string, entityClass: typeof Entity): Promise<string>
}
```

## Entity-Aware Migration Generator

```typescript
export class EntityMigrationGenerator {
  private entityManager: EntityManager
  private schemaRegistry: SchemaRegistry
  
  constructor(entityManager: EntityManager, schemaRegistry: SchemaRegistry) {
    this.entityManager = entityManager
    this.schemaRegistry = schemaRegistry
  }
  
  async generateFromEntities(entities: typeof Entity[]): Promise<string> {
    let migration = '-- Entity-aware migration\n'
    migration += '-- Generated from entity definitions\n\n'
    
    for (const entityClass of entities) {
      const tableName = entityClass.getTableName()
      const entitySchema = this.getEntitySchema(entityClass)
      const dbSchema = await this.schemaRegistry.getTableSchema(tableName)
      
      if (!dbSchema) {
        // Table doesn't exist, create it
        migration += this.generateCreateTableSQL(entitySchema)
      } else {
        // Table exists, check for differences
        const differences = this.compareSchemas(entitySchema, dbSchema)
        if (differences.length > 0) {
          migration += this.generateAlterTableSQL(tableName, differences)
        }
      }
    }
    
    return migration
  }
  
  async generateFromSchemaDiff(): Promise<string> {
    const entities = this.entityManager.getAllEntities()
    const dbSchemas = await this.schemaRegistry.getAllTableSchemas()
    
    let migration = '-- Schema diff migration\n'
    migration += '-- Generated from schema differences\n\n'
    
    // Check for missing tables
    for (const [tableName, entityClass] of entities) {
      if (!dbSchemas.has(tableName)) {
        const entitySchema = this.getEntitySchema(entityClass)
        migration += this.generateCreateTableSQL(entitySchema)
      }
    }
    
    // Check for extra tables
    for (const [tableName, dbSchema] of dbSchemas) {
      if (!entities.has(tableName)) {
        migration += this.generateDropTableSQL(tableName)
      }
    }
    
    // Check for schema differences
    for (const [tableName, entityClass] of entities) {
      if (dbSchemas.has(tableName)) {
        const entitySchema = this.getEntitySchema(entityClass)
        const dbSchema = dbSchemas.get(tableName)!
        const differences = this.compareSchemas(entitySchema, dbSchema)
        
        if (differences.length > 0) {
          migration += this.generateAlterTableSQL(tableName, differences)
        }
      }
    }
    
    return migration
  }
  
  private getEntitySchema(entityClass: typeof Entity): TableSchema {
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
  
  private generateCreateTableSQL(schema: TableSchema): string {
    let sql = `CREATE TABLE IF NOT EXISTS ${schema.name} (\n`
    
    const columnDefinitions = schema.columns.map(col => {
      let definition = `  ${col.name} ${col.type}`
      
      if (col.primaryKey) {
        definition += ' PRIMARY KEY'
      }
      
      if (col.autoIncrement) {
        definition += ' AUTOINCREMENT'
      }
      
      if (!col.nullable) {
        definition += ' NOT NULL'
      }
      
      if (col.defaultValue !== undefined) {
        definition += ` DEFAULT ${col.defaultValue}`
      }
      
      return definition
    })
    
    sql += columnDefinitions.join(',\n')
    sql += '\n);\n\n'
    
    return sql
  }
  
  private generateDropTableSQL(tableName: string): string {
    return `DROP TABLE IF EXISTS ${tableName};\n\n`
  }
  
  private generateAlterTableSQL(tableName: string, differences: SchemaDifference[]): string {
    let sql = `-- Alter table ${tableName}\n`
    
    for (const diff of differences) {
      switch (diff.type) {
        case 'ADD_COLUMN':
          sql += this.generateAddColumnSQL(tableName, diff.column!)
          break
        case 'DROP_COLUMN':
          sql += this.generateDropColumnSQL(tableName, diff.column!)
          break
        case 'ALTER_COLUMN':
          sql += this.generateAlterColumnSQL(tableName, diff.column!)
          break
      }
    }
    
    sql += '\n'
    return sql
  }
  
  private generateAddColumnSQL(tableName: string, column: ColumnSchema): string {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}`
    
    if (!column.nullable) {
      sql += ' NOT NULL'
    }
    
    if (column.defaultValue !== undefined) {
      sql += ` DEFAULT ${column.defaultValue}`
    }
    
    sql += ';\n'
    return sql
  }
  
  private generateDropColumnSQL(tableName: string, column: ColumnSchema): string {
    return `ALTER TABLE ${tableName} DROP COLUMN ${column.name};\n`
  }
  
  private generateAlterColumnSQL(tableName: string, column: ColumnSchema): string {
    let sql = `ALTER TABLE ${tableName} ALTER COLUMN ${column.name} TYPE ${column.type}`
    
    if (!column.nullable) {
      sql += ' NOT NULL'
    }
    
    sql += ';\n'
    return sql
  }
}

export interface SchemaDifference {
  type: 'ADD_COLUMN' | 'DROP_COLUMN' | 'ALTER_COLUMN'
  column?: ColumnSchema
}
```

## Migration Sync Manager

```typescript
export class MigrationSyncManager {
  private entityManager: EntityManager
  private schemaRegistry: SchemaRegistry
  private migrationManager: any
  
  constructor(entityManager: EntityManager, schemaRegistry: SchemaRegistry, migrationManager: any) {
    this.entityManager = entityManager
    this.schemaRegistry = schemaRegistry
    this.migrationManager = migrationManager
  }
  
  async syncEntityWithDatabase(entityClass: typeof Entity): Promise<SyncResult> {
    const tableName = entityClass.getTableName()
    const entitySchema = this.getEntitySchema(entityClass)
    const dbSchema = await this.schemaRegistry.getTableSchema(tableName)
    
    if (!dbSchema) {
      return {
        needsSync: true,
        action: 'CREATE_TABLE',
        differences: [],
        migration: this.generateCreateTableMigration(entitySchema)
      }
    }
    
    const differences = this.compareSchemas(entitySchema, dbSchema)
    
    if (differences.length === 0) {
      return {
        needsSync: false,
        action: 'NO_ACTION',
        differences: [],
        migration: null
      }
    }
    
    return {
      needsSync: true,
      action: 'ALTER_TABLE',
      differences,
      migration: this.generateAlterTableMigration(tableName, differences)
    }
  }
  
  async syncAllEntities(): Promise<SyncResult[]> {
    const entities = this.entityManager.getAllEntities()
    const results: SyncResult[] = []
    
    for (const [tableName, entityClass] of entities) {
      const result = await this.syncEntityWithDatabase(entityClass)
      results.push(result)
    }
    
    return results
  }
  
  async createMigrationFromSyncResults(results: SyncResult[], name: string): Promise<string> {
    const migrationContent = results
      .filter(result => result.needsSync)
      .map(result => result.migration)
      .join('\n')
    
    if (migrationContent.trim()) {
      return await this.migrationManager.createMigration(name, migrationContent)
    }
    
    throw new Error('No changes to migrate')
  }
  
  private getEntitySchema(entityClass: typeof Entity): TableSchema {
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
  
  private generateCreateTableMigration(schema: TableSchema): string {
    return this.generateCreateTableSQL(schema)
  }
  
  private generateAlterTableMigration(tableName: string, differences: SchemaDifference[]): string {
    return this.generateAlterTableSQL(tableName, differences)
  }
  
  private generateCreateTableSQL(schema: TableSchema): string {
    let sql = `CREATE TABLE IF NOT EXISTS ${schema.name} (\n`
    
    const columnDefinitions = schema.columns.map(col => {
      let definition = `  ${col.name} ${col.type}`
      
      if (col.primaryKey) {
        definition += ' PRIMARY KEY'
      }
      
      if (col.autoIncrement) {
        definition += ' AUTOINCREMENT'
      }
      
      if (!col.nullable) {
        definition += ' NOT NULL'
      }
      
      if (col.defaultValue !== undefined) {
        definition += ` DEFAULT ${col.defaultValue}`
      }
      
      return definition
    })
    
    sql += columnDefinitions.join(',\n')
    sql += '\n);\n'
    
    return sql
  }
  
  private generateAlterTableSQL(tableName: string, differences: SchemaDifference[]): string {
    let sql = `-- Alter table ${tableName}\n`
    
    for (const diff of differences) {
      switch (diff.type) {
        case 'ADD_COLUMN':
          sql += this.generateAddColumnSQL(tableName, diff.column!)
          break
        case 'DROP_COLUMN':
          sql += this.generateDropColumnSQL(tableName, diff.column!)
          break
        case 'ALTER_COLUMN':
          sql += this.generateAlterColumnSQL(tableName, diff.column!)
          break
      }
    }
    
    return sql
  }
  
  private generateAddColumnSQL(tableName: string, column: ColumnSchema): string {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}`
    
    if (!column.nullable) {
      sql += ' NOT NULL'
    }
    
    if (column.defaultValue !== undefined) {
      sql += ` DEFAULT ${column.defaultValue}`
    }
    
    sql += ';\n'
    return sql
  }
  
  private generateDropColumnSQL(tableName: string, column: ColumnSchema): string {
    return `ALTER TABLE ${tableName} DROP COLUMN ${column.name};\n`
  }
  
  private generateAlterColumnSQL(tableName: string, column: ColumnSchema): string {
    let sql = `ALTER TABLE ${tableName} ALTER COLUMN ${column.name} TYPE ${column.type}`
    
    if (!column.nullable) {
      sql += ' NOT NULL'
    }
    
    sql += ';\n'
    return sql
  }
}

export interface SyncResult {
  needsSync: boolean
  action: 'CREATE_TABLE' | 'ALTER_TABLE' | 'NO_ACTION'
  differences: SchemaDifference[]
  migration: string | null
}
```

## Usage Examples

### Basic Migration Integration

```typescript
// Setup migration integration
const migrationIntegration = MigrationIntegration.getInstance()
const migrationManager = await createNodeMigrationManager(db, {
  migrationsDirectory: './migrations',
  migrationTimeout: 30000
})

migrationIntegration.setMigrationManager(migrationManager)

// Generate migration from entities
const entities = [User, Post, Comment]
const migration = await migrationIntegration.generateMigrationFromEntities(entities)
console.log(migration)

// Create migration file
const fileName = await migrationManager.createMigration('sync_entities', migration)
console.log(`Created migration: ${fileName}`)
```

### Schema Diff Migration

```typescript
// Generate migration from schema differences
const migration = await migrationIntegration.generateMigrationFromSchemaDiff()
console.log(migration)

// Create migration file
const fileName = await migrationManager.createMigration('schema_diff', migration)
console.log(`Created migration: ${fileName}`)
```

### Entity Sync

```typescript
// Sync single entity with database
const syncResult = await migrationIntegration.syncEntityWithDatabase(User)
if (syncResult.needsSync) {
  console.log(`Entity ${User.getTableName()} needs sync`)
  console.log(`Action: ${syncResult.action}`)
  console.log(`Differences: ${syncResult.differences.length}`)
  
  if (syncResult.migration) {
    const fileName = await migrationManager.createMigration(
      `sync_${User.getTableName()}`,
      syncResult.migration
    )
    console.log(`Created migration: ${fileName}`)
  }
} else {
  console.log(`Entity ${User.getTableName()} is in sync`)
}
```

### Batch Entity Sync

```typescript
// Sync all entities
const syncManager = new MigrationSyncManager(
  EntityManager.getInstance(),
  SchemaRegistry.getInstance(),
  migrationManager
)

const results = await syncManager.syncAllEntities()
const needsSync = results.filter(result => result.needsSync)

if (needsSync.length > 0) {
  console.log(`${needsSync.length} entities need sync`)
  
  const fileName = await syncManager.createMigrationFromSyncResults(
    needsSync,
    'sync_all_entities'
  )
  console.log(`Created migration: ${fileName}`)
} else {
  console.log('All entities are in sync')
}
```

### Development Workflow

```typescript
// Development workflow for entity changes
async function handleEntityChange(entityClass: typeof Entity) {
  const migrationIntegration = MigrationIntegration.getInstance()
  
  try {
    // Check if entity needs sync
    const syncResult = await migrationIntegration.syncEntityWithDatabase(entityClass)
    
    if (syncResult.needsSync) {
      console.log(`Entity ${entityClass.getTableName()} has changes`)
      
      // Generate migration
      const migration = syncResult.migration!
      
      // Create migration file
      const fileName = await migrationManager.createMigration(
        `update_${entityClass.getTableName()}`,
        migration
      )
      
      console.log(`Created migration: ${fileName}`)
      
      // Run migration
      await migrationManager.migrate()
      
      console.log('Migration applied successfully')
    } else {
      console.log(`Entity ${entityClass.getTableName()} is up to date`)
    }
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Handle entity changes
handleEntityChange(User)
```

### Production Deployment

```typescript
// Production deployment workflow
async function deployToProduction() {
  const migrationIntegration = MigrationIntegration.getInstance()
  
  try {
    console.log('Starting production deployment...')
    
    // Generate migration from all entities
    const entities = [User, Post, Comment, Profile]
    const migration = await migrationIntegration.generateMigrationFromEntities(entities)
    
    if (migration.trim()) {
      // Create migration file
      const fileName = await migrationManager.createMigration(
        `production_deploy_${Date.now()}`,
        migration
      )
      
      console.log(`Created migration: ${fileName}`)
      
      // Run migration
      const result = await migrationManager.migrate()
      
      if (result.success) {
        console.log(`Migration successful: ${result.executed} executed`)
      } else {
        console.error(`Migration failed: ${result.failed} failed`)
        throw new Error('Migration failed')
      }
    } else {
      console.log('No migrations needed')
    }
    
    console.log('Production deployment completed')
  } catch (error) {
    console.error('Production deployment failed:', error)
    throw error
  }
}

// Deploy to production
deployToProduction()
```

## Performance Characteristics

- **Migration Generation**: O(n) - Depends on schema complexity
- **Schema Comparison**: O(n) - Depends on number of columns
- **Memory Usage**: Minimal - Only migration content
- **Database Queries**: None - Uses existing schema information
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Seamless Integration** - Works with existing DreamBeeSQL migration system
2. **Entity-Aware** - Generates migrations from entity changes
3. **Type Safety** - Full TypeScript support
4. **Minimal Overhead** - No additional database queries
5. **Automated Workflow** - Automatic migration generation
6. **Production Ready** - Suitable for production deployments

## Limitations

1. **Schema Dependency** - Requires schema information
2. **Entity Changes** - Must track entity changes
3. **Migration Complexity** - Complex schema changes may need manual intervention

## Integration Points

- **Entity Manager** - Uses entity metadata for migration generation
- **Schema Registry** - Uses schema information for comparison
- **Existing Migration System** - Integrates with DreamBeeSQL migrations
- **Configuration Manager** - Uses migration configuration
