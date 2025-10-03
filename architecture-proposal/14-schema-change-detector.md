# Schema Change Detector Architecture

## Overview

The Schema Change Detector provides minimal, centralized detection of database schema changes without heavy monitoring or aggressive collection. It uses a singleton pattern with simple change detection based on schema snapshots.

## Design Principles

- **Singleton Pattern** - Single detector instance
- **Minimal Overhead** - Simple snapshot comparison
- **On-Demand Detection** - Only detect when requested
- **No Continuous Monitoring** - No background processes
- **Centralized State** - Single source of truth for schema state

## Architecture

```typescript
// Schema Change Detector (Singleton)
export class SchemaChangeDetector {
  private static instance: SchemaChangeDetector | null = null
  private lastKnownSchemas = new Map<string, DiscoveredTableSchema>()
  private introspectionEngine: SchemaIntrospectionEngine
  
  private constructor() {
    this.introspectionEngine = SchemaIntrospectionEngine.getInstance()
  }
  
  static getInstance(): SchemaChangeDetector {
    if (!SchemaChangeDetector.instance) {
      SchemaChangeDetector.instance = new SchemaChangeDetector()
    }
    return SchemaChangeDetector.instance
  }
  
  // Core methods
  async detectChanges(db: Kysely<any>): Promise<SchemaChangeResult>
  async getCurrentSchemas(db: Kysely<any>): Promise<Map<string, DiscoveredTableSchema>>
  resetKnownSchemas(): void
  setKnownSchemas(schemas: Map<string, DiscoveredTableSchema>): void
}
```

## Change Detection Structure

```typescript
export interface SchemaChangeResult {
  hasChanges: boolean
  changes: SchemaChange[]
  errors: DetectionError[]
}

export interface SchemaChange {
  type: SchemaChangeType
  tableName: string
  details: ChangeDetails
}

export type SchemaChangeType = 
  | 'TABLE_ADDED'
  | 'TABLE_REMOVED'
  | 'COLUMN_ADDED'
  | 'COLUMN_REMOVED'
  | 'COLUMN_MODIFIED'
  | 'INDEX_ADDED'
  | 'INDEX_REMOVED'
  | 'FOREIGN_KEY_ADDED'
  | 'FOREIGN_KEY_REMOVED'

export interface ChangeDetails {
  newSchema?: DiscoveredTableSchema
  oldSchema?: DiscoveredTableSchema
  newColumn?: DiscoveredColumn
  oldColumn?: DiscoveredColumn
  removedColumn?: DiscoveredColumn
  newIndex?: DiscoveredIndex
  removedIndex?: DiscoveredIndex
  newForeignKey?: DiscoveredForeignKey
  removedForeignKey?: DiscoveredForeignKey
}

export interface DetectionError {
  message: string
  tableName?: string
  error: Error
}
```

## Implementation

```typescript
export class SchemaChangeDetector {
  private static instance: SchemaChangeDetector | null = null
  private lastKnownSchemas = new Map<string, DiscoveredTableSchema>()
  private introspectionEngine: SchemaIntrospectionEngine
  
  private constructor() {
    this.introspectionEngine = SchemaIntrospectionEngine.getInstance()
  }
  
  static getInstance(): SchemaChangeDetector {
    if (!SchemaChangeDetector.instance) {
      SchemaChangeDetector.instance = new SchemaChangeDetector()
    }
    return SchemaChangeDetector.instance
  }
  
  async detectChanges(db: Kysely<any>): Promise<SchemaChangeResult> {
    try {
      const currentSchemas = await this.getCurrentSchemas(db)
      const changes = this.compareSchemas(this.lastKnownSchemas, currentSchemas)
      
      return {
        hasChanges: changes.length > 0,
        changes,
        errors: []
      }
    } catch (error) {
      return {
        hasChanges: false,
        changes: [],
        errors: [{
          message: 'Failed to detect schema changes',
          error: error as Error
        }]
      }
    }
  }
  
  async getCurrentSchemas(db: Kysely<any>): Promise<Map<string, DiscoveredTableSchema>> {
    const discoveryResult = await this.introspectionEngine.discoverDatabase(db)
    
    if (!discoveryResult.success) {
      throw new Error(`Schema discovery failed: ${discoveryResult.errors.map(e => e.message).join(', ')}`)
    }
    
    return discoveryResult.tables
  }
  
  private compareSchemas(
    oldSchemas: Map<string, DiscoveredTableSchema>,
    newSchemas: Map<string, DiscoveredTableSchema>
  ): SchemaChange[] {
    const changes: SchemaChange[] = []
    
    // Check for new tables
    for (const [tableName, newSchema] of newSchemas) {
      if (!oldSchemas.has(tableName)) {
        changes.push({
          type: 'TABLE_ADDED',
          tableName,
          details: { newSchema }
        })
      } else {
        const tableChanges = this.compareTableSchemas(
          oldSchemas.get(tableName)!,
          newSchema
        )
        changes.push(...tableChanges)
      }
    }
    
    // Check for removed tables
    for (const [tableName, oldSchema] of oldSchemas) {
      if (!newSchemas.has(tableName)) {
        changes.push({
          type: 'TABLE_REMOVED',
          tableName,
          details: { oldSchema }
        })
      }
    }
    
    return changes
  }
  
  private compareTableSchemas(
    oldSchema: DiscoveredTableSchema,
    newSchema: DiscoveredTableSchema
  ): SchemaChange[] {
    const changes: SchemaChange[] = []
    
    // Compare columns
    const columnChanges = this.compareColumns(oldSchema, newSchema)
    changes.push(...columnChanges)
    
    // Compare indexes
    const indexChanges = this.compareIndexes(oldSchema, newSchema)
    changes.push(...indexChanges)
    
    // Compare foreign keys
    const fkChanges = this.compareForeignKeys(oldSchema, newSchema)
    changes.push(...fkChanges)
    
    return changes
  }
  
  private compareColumns(
    oldSchema: DiscoveredTableSchema,
    newSchema: DiscoveredTableSchema
  ): SchemaChange[] {
    const changes: SchemaChange[] = []
    const oldColumns = new Map(oldSchema.columns.map(col => [col.name, col]))
    const newColumns = new Map(newSchema.columns.map(col => [col.name, col]))
    
    // Check for new columns
    for (const [columnName, newColumn] of newColumns) {
      if (!oldColumns.has(columnName)) {
        changes.push({
          type: 'COLUMN_ADDED',
          tableName: newSchema.name,
          details: { newColumn }
        })
      }
    }
    
    // Check for removed columns
    for (const [columnName, oldColumn] of oldColumns) {
      if (!newColumns.has(columnName)) {
        changes.push({
          type: 'COLUMN_REMOVED',
          tableName: oldSchema.name,
          details: { removedColumn: oldColumn }
        })
      }
    }
    
    // Check for modified columns
    for (const [columnName, oldColumn] of oldColumns) {
      const newColumn = newColumns.get(columnName)
      if (newColumn && !this.columnsEqual(oldColumn, newColumn)) {
        changes.push({
          type: 'COLUMN_MODIFIED',
          tableName: oldSchema.name,
          details: { oldColumn, newColumn }
        })
      }
    }
    
    return changes
  }
  
  private compareIndexes(
    oldSchema: DiscoveredTableSchema,
    newSchema: DiscoveredTableSchema
  ): SchemaChange[] {
    const changes: SchemaChange[] = []
    const oldIndexes = new Map(oldSchema.indexes.map(idx => [idx.name, idx]))
    const newIndexes = new Map(newSchema.indexes.map(idx => [idx.name, idx]))
    
    // Check for new indexes
    for (const [indexName, newIndex] of newIndexes) {
      if (!oldIndexes.has(indexName)) {
        changes.push({
          type: 'INDEX_ADDED',
          tableName: newSchema.name,
          details: { newIndex }
        })
      }
    }
    
    // Check for removed indexes
    for (const [indexName, oldIndex] of oldIndexes) {
      if (!newIndexes.has(indexName)) {
        changes.push({
          type: 'INDEX_REMOVED',
          tableName: oldSchema.name,
          details: { removedIndex: oldIndex }
        })
      }
    }
    
    return changes
  }
  
  private compareForeignKeys(
    oldSchema: DiscoveredTableSchema,
    newSchema: DiscoveredTableSchema
  ): SchemaChange[] {
    const changes: SchemaChange[] = []
    const oldFKs = new Map(oldSchema.foreignKeys.map(fk => [fk.name, fk]))
    const newFKs = new Map(newSchema.foreignKeys.map(fk => [fk.name, fk]))
    
    // Check for new foreign keys
    for (const [fkName, newFK] of newFKs) {
      if (!oldFKs.has(fkName)) {
        changes.push({
          type: 'FOREIGN_KEY_ADDED',
          tableName: newSchema.name,
          details: { newForeignKey: newFK }
        })
      }
    }
    
    // Check for removed foreign keys
    for (const [fkName, oldFK] of oldFKs) {
      if (!newFKs.has(fkName)) {
        changes.push({
          type: 'FOREIGN_KEY_REMOVED',
          tableName: oldSchema.name,
          details: { removedForeignKey: oldFK }
        })
      }
    }
    
    return changes
  }
  
  private columnsEqual(col1: DiscoveredColumn, col2: DiscoveredColumn): boolean {
    return col1.type === col2.type &&
           col1.nullable === col2.nullable &&
           col1.isPrimaryKey === col2.isPrimaryKey &&
           col1.isAutoIncrement === col2.isAutoIncrement &&
           col1.maxLength === col2.maxLength &&
           col1.precision === col2.precision &&
           col1.scale === col2.scale
  }
  
  resetKnownSchemas(): void {
    this.lastKnownSchemas.clear()
  }
  
  setKnownSchemas(schemas: Map<string, DiscoveredTableSchema>): void {
    this.lastKnownSchemas = new Map(schemas)
  }
  
  getKnownSchemas(): Map<string, DiscoveredTableSchema> {
    return new Map(this.lastKnownSchemas)
  }
}
```

## Usage Examples

### Basic Change Detection

```typescript
// Detect schema changes
const detector = SchemaChangeDetector.getInstance()
const changeResult = await detector.detectChanges(db)

if (changeResult.hasChanges) {
  console.log('Schema changes detected:', changeResult.changes.length)
  
  for (const change of changeResult.changes) {
    console.log(`${change.type} on table ${change.tableName}`)
  }
}
```

### Update Known Schemas After Changes

```typescript
// Update known schemas after handling changes
const detector = SchemaChangeDetector.getInstance()
const currentSchemas = await detector.getCurrentSchemas(db)
detector.setKnownSchemas(currentSchemas)
```

### Reset Detection State

```typescript
// Reset detection state (useful for fresh start)
const detector = SchemaChangeDetector.getInstance()
detector.resetKnownSchemas()
```

## Performance Characteristics

- **Change Detection**: O(n) - Linear with schema complexity
- **Memory Usage**: Minimal - Only stores schema snapshots
- **Database Queries**: Only during introspection
- **No Background Processes**: On-demand only

## Benefits

1. **Minimal Overhead** - Simple snapshot comparison
2. **Centralized** - Single detector instance
3. **No Monitoring** - On-demand detection only
4. **Simple State** - Basic schema snapshots
5. **Error Handling** - Graceful failure handling

## Limitations

1. **No Real-time Detection** - Manual detection required
2. **Snapshot Based** - Only detects changes between snapshots
3. **Memory Usage** - Stores schema snapshots in memory

## Integration Points

- **Schema Introspection Engine** - Uses for schema discovery
- **Type Regenerator** - Triggers type regeneration on changes
- **Entity Updater** - Updates entities based on changes
- **Repository Updater** - Updates repositories based on changes
