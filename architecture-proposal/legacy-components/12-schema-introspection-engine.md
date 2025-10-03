# Schema Introspection Engine Architecture

## Overview

The Schema Introspection Engine provides comprehensive database schema discovery and automatic entity generation capabilities. It eliminates the need for users to manually define entities by automatically discovering database structure and generating appropriate TypeScript types and entity classes.

## Design Principles

- **Zero Configuration** - Works with any existing database without manual setup
- **Automatic Discovery** - Discovers all tables, columns, relationships, and constraints
- **Dynamic Type Generation** - Generates TypeScript types from discovered schema
- **Auto Entity Generation** - Creates entity classes automatically from database structure
- **Schema Evolution** - Handles database changes at runtime
- **Fallback Support** - Graceful degradation when introspection fails

## Architecture

```typescript
// Schema Introspection Engine (Singleton)
export class SchemaIntrospectionEngine {
  private static instance: SchemaIntrospectionEngine | null = null
  private discoveredSchemas = new Map<string, DiscoveredTableSchema>()
  private typeCache = new Map<string, GeneratedTypes>()
  private entityCache = new Map<string, GeneratedEntityClass>()
  private introspectionStrategies = new Map<string, IntrospectionStrategy>()
  
  private constructor() {
    this.registerDefaultStrategies()
  }
  
  static getInstance(): SchemaIntrospectionEngine {
    if (!SchemaIntrospectionEngine.instance) {
      SchemaIntrospectionEngine.instance = new SchemaIntrospectionEngine()
    }
    return SchemaIntrospectionEngine.instance
  }
  
  // Core methods
  async discoverDatabase(db: Kysely<any>): Promise<DiscoveryResult>
  async generateEntityClasses(schemas: Map<string, DiscoveredTableSchema>): Promise<Map<string, GeneratedEntityClass>>
  async generateTypes(schemas: Map<string, DiscoveredTableSchema>): Promise<GeneratedTypes>
  async detectRelationships(schemas: Map<string, DiscoveredTableSchema>): Promise<Map<string, RelationshipInfo[]>>
  registerIntrospectionStrategy(dialect: string, strategy: IntrospectionStrategy): void
  getDiscoveredSchema(tableName: string): DiscoveredTableSchema | undefined
  getAllDiscoveredSchemas(): Map<string, DiscoveredTableSchema>
}
```

## Discovery Result Structure

```typescript
export interface DiscoveryResult {
  success: boolean
  tables: Map<string, DiscoveredTableSchema>
  relationships: Map<string, RelationshipInfo[]>
  errors: DiscoveryError[]
  warnings: DiscoveryWarning[]
  metadata: DiscoveryMetadata
}

export interface DiscoveredTableSchema {
  name: string
  schema?: string
  columns: DiscoveredColumn[]
  indexes: DiscoveredIndex[]
  foreignKeys: DiscoveredForeignKey[]
  primaryKeys: string[]
  uniqueConstraints: DiscoveredUniqueConstraint[]
  checkConstraints: DiscoveredCheckConstraint[]
  isView: boolean
  viewDefinition?: string
  estimatedRowCount?: number
  tableComment?: string
}

export interface DiscoveredColumn {
  name: string
  type: string
  nativeType: string
  nullable: boolean
  defaultValue?: any
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  isGenerated: boolean
  maxLength?: number
  precision?: number
  scale?: number
  comment?: string
  enumValues?: string[]
  collation?: string
}

export interface DiscoveredForeignKey {
  name: string
  columnName: string
  referencedTable: string
  referencedColumn: string
  onDelete: ForeignKeyAction
  onUpdate: ForeignKeyAction
  isDeferrable: boolean
}

export interface DiscoveredIndex {
  name: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  type: IndexType
  algorithm?: string
  condition?: string
}

export interface DiscoveredUniqueConstraint {
  name: string
  columns: string[]
  isPrimaryKey: boolean
}

export interface DiscoveredCheckConstraint {
  name: string
  expression: string
  isEnabled: boolean
}

export interface RelationshipInfo {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  foreignKeyName?: string
  isOptional: boolean
  joinTable?: string
  joinColumns?: { source: string; target: string }
}

export interface DiscoveryMetadata {
  databaseVersion: string
  dialect: string
  discoveryTime: Date
  totalTables: number
  totalColumns: number
  totalRelationships: number
  schemaComplexity: 'simple' | 'moderate' | 'complex'
}
```

## Introspection Strategies

```typescript
export interface IntrospectionStrategy {
  dialect: string
  discoverTables(db: Kysely<any>): Promise<DiscoveredTableSchema[]>
  discoverRelationships(db: Kysely<any>, tables: DiscoveredTableSchema[]): Promise<Map<string, RelationshipInfo[]>>
  getColumnMetadata(db: Kysely<any>, tableName: string): Promise<DiscoveredColumn[]>
  getIndexMetadata(db: Kysely<any>, tableName: string): Promise<DiscoveredIndex[]>
  getForeignKeyMetadata(db: Kysely<any>, tableName: string): Promise<DiscoveredForeignKey[]>
  getTableStatistics(db: Kysely<any>, tableName: string): Promise<TableStatistics>
}

export class PostgreSQLIntrospectionStrategy implements IntrospectionStrategy {
  dialect = 'postgresql'
  
  async discoverTables(db: Kysely<any>): Promise<DiscoveredTableSchema[]> {
    const tables = await db
      .selectFrom('information_schema.tables')
      .select([
        'table_name as name',
        'table_schema as schema',
        'table_type',
        'table_comment'
      ])
      .where('table_schema', 'not in', ['information_schema', 'pg_catalog'])
      .where('table_type', 'in', ['BASE TABLE', 'VIEW'])
      .execute()
    
    const discoveredTables: DiscoveredTableSchema[] = []
    
    for (const table of tables) {
      const columns = await this.getColumnMetadata(db, table.name)
      const indexes = await this.getIndexMetadata(db, table.name)
      const foreignKeys = await this.getForeignKeyMetadata(db, table.name)
      const primaryKeys = await this.getPrimaryKeys(db, table.name)
      const uniqueConstraints = await this.getUniqueConstraints(db, table.name)
      const checkConstraints = await this.getCheckConstraints(db, table.name)
      
      discoveredTables.push({
        name: table.name,
        schema: table.schema,
        columns,
        indexes,
        foreignKeys,
        primaryKeys,
        uniqueConstraints,
        checkConstraints,
        isView: table.table_type === 'VIEW',
        tableComment: table.table_comment
      })
    }
    
    return discoveredTables
  }
  
  async getColumnMetadata(db: Kysely<any>, tableName: string): Promise<DiscoveredColumn[]> {
    const columns = await db
      .selectFrom('information_schema.columns as c')
      .leftJoin('information_schema.element_types as et', 
        (join) => join
          .onRef('c.table_catalog', '=', 'et.object_catalog')
          .onRef('c.table_schema', '=', 'et.object_schema')
          .onRef('c.table_name', '=', 'et.object_name')
          .onRef('c.dtd_identifier', '=', 'et.collection_type_identifier')
      )
      .select([
        'c.column_name as name',
        'c.data_type as type',
        'c.udt_name as nativeType',
        'c.is_nullable as nullable',
        'c.column_default as defaultValue',
        'c.character_maximum_length as maxLength',
        'c.numeric_precision as precision',
        'c.numeric_scale as scale',
        'c.column_comment as comment',
        'c.is_identity as isAutoIncrement',
        'c.is_generated as isGenerated',
        'et.data_type as elementType'
      ])
      .where('c.table_name', '=', tableName)
      .where('c.table_schema', '=', 'public')
      .execute()
    
    // Get enum values for enum types
    const enumColumns = columns.filter(col => col.nativeType?.startsWith('enum'))
    for (const column of enumColumns) {
      const enumValues = await this.getEnumValues(db, column.nativeType)
      column.enumValues = enumValues
    }
    
    // Check for primary key columns
    const primaryKeyColumns = await this.getPrimaryKeyColumns(db, tableName)
    const pkSet = new Set(primaryKeyColumns)
    
    return columns.map(col => ({
      name: col.name,
      type: col.type,
      nativeType: col.nativeType,
      nullable: col.nullable === 'YES',
      defaultValue: col.defaultValue,
      isPrimaryKey: pkSet.has(col.name),
      isAutoIncrement: col.isAutoIncrement === 'YES',
      isGenerated: col.isGenerated === 'ALWAYS',
      maxLength: col.maxLength,
      precision: col.precision,
      scale: col.scale,
      comment: col.comment,
      enumValues: col.enumValues,
      collation: undefined
    }))
  }
  
  async getIndexMetadata(db: Kysely<any>, tableName: string): Promise<DiscoveredIndex[]> {
    const indexes = await db
      .selectFrom('pg_indexes')
      .select([
        'indexname as name',
        'indexdef as definition'
      ])
      .where('tablename', '=', tableName)
      .execute()
    
    return indexes.map(idx => {
      const isUnique = idx.definition.includes('UNIQUE')
      const isPrimary = idx.definition.includes('PRIMARY KEY')
      
      // Parse column names from index definition
      const columnMatch = idx.definition.match(/\(([^)]+)\)/)
      const columns = columnMatch ? columnMatch[1].split(',').map(col => col.trim()) : []
      
      return {
        name: idx.name,
        columns,
        isUnique,
        isPrimary,
        type: 'btree' as IndexType,
        algorithm: undefined,
        condition: undefined
      }
    })
  }
  
  async getForeignKeyMetadata(db: Kysely<any>, tableName: string): Promise<DiscoveredForeignKey[]> {
    const foreignKeys = await db
      .selectFrom('information_schema.table_constraints as tc')
      .join('information_schema.key_column_usage as kcu', 
        (join) => join
          .onRef('tc.constraint_name', '=', 'kcu.constraint_name')
          .onRef('tc.table_schema', '=', 'kcu.table_schema')
      )
      .join('information_schema.constraint_column_usage as ccu',
        (join) => join
          .onRef('ccu.constraint_name', '=', 'tc.constraint_name')
          .onRef('ccu.table_schema', '=', 'tc.table_schema')
      )
      .select([
        'tc.constraint_name as name',
        'kcu.column_name as columnName',
        'ccu.table_name as referencedTable',
        'ccu.column_name as referencedColumn'
      ])
      .where('tc.constraint_type', '=', 'FOREIGN KEY')
      .where('tc.table_name', '=', tableName)
      .execute()
    
    // Get additional FK metadata
    const fkDetails = await db
      .selectFrom('information_schema.referential_constraints as rc')
      .select([
        'rc.constraint_name as name',
        'rc.delete_rule as onDelete',
        'rc.update_rule as onUpdate',
        'rc.is_deferrable as isDeferrable'
      ])
      .where('rc.constraint_name', 'in', foreignKeys.map(fk => fk.name))
      .execute()
    
    const fkDetailsMap = new Map(fkDetails.map(fk => [fk.name, fk]))
    
    return foreignKeys.map(fk => {
      const details = fkDetailsMap.get(fk.name)
      return {
        name: fk.name,
        columnName: fk.columnName,
        referencedTable: fk.referencedTable,
        referencedColumn: fk.referencedColumn,
        onDelete: this.mapForeignKeyAction(details?.onDelete || 'RESTRICT'),
        onUpdate: this.mapForeignKeyAction(details?.onUpdate || 'RESTRICT'),
        isDeferrable: details?.isDeferrable === 'YES'
      }
    })
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
  
  private async getUniqueConstraints(db: Kysely<any>, tableName: string): Promise<DiscoveredUniqueConstraint[]> {
    const constraints = await db
      .selectFrom('information_schema.table_constraints as tc')
      .join('information_schema.key_column_usage as kcu',
        (join) => join
          .onRef('tc.constraint_name', '=', 'kcu.constraint_name')
          .onRef('tc.table_schema', '=', 'kcu.table_schema')
      )
      .select([
        'tc.constraint_name as name',
        'kcu.column_name as columnName'
      ])
      .where('tc.constraint_type', '=', 'UNIQUE')
      .where('tc.table_name', '=', tableName)
      .execute()
    
    const constraintMap = new Map<string, string[]>()
    for (const constraint of constraints) {
      if (!constraintMap.has(constraint.name)) {
        constraintMap.set(constraint.name, [])
      }
      constraintMap.get(constraint.name)!.push(constraint.columnName)
    }
    
    return Array.from(constraintMap.entries()).map(([name, columns]) => ({
      name,
      columns,
      isPrimaryKey: false
    }))
  }
  
  private async getCheckConstraints(db: Kysely<any>, tableName: string): Promise<DiscoveredCheckConstraint[]> {
    const constraints = await db
      .selectFrom('information_schema.table_constraints as tc')
      .join('information_schema.check_constraints as cc',
        (join) => join
          .onRef('tc.constraint_name', '=', 'cc.constraint_name')
          .onRef('tc.table_schema', '=', 'cc.constraint_schema')
      )
      .select([
        'tc.constraint_name as name',
        'cc.check_clause as expression'
      ])
      .where('tc.constraint_type', '=', 'CHECK')
      .where('tc.table_name', '=', tableName)
      .execute()
    
    return constraints.map(constraint => ({
      name: constraint.name,
      expression: constraint.expression,
      isEnabled: true
    }))
  }
  
  private async getEnumValues(db: Kysely<any>, enumType: string): Promise<string[]> {
    const values = await db
      .selectFrom('pg_enum')
      .select(['enumlabel as value'])
      .join('pg_type', 'pg_enum.enumtypid', 'pg_type.oid')
      .where('pg_type.typname', '=', enumType.replace('enum_', ''))
      .orderBy('enumsortorder')
      .execute()
    
    return values.map(row => row.value)
  }
  
  private mapForeignKeyAction(action: string): ForeignKeyAction {
    switch (action) {
      case 'CASCADE': return 'CASCADE'
      case 'SET NULL': return 'SET NULL'
      case 'SET DEFAULT': return 'SET DEFAULT'
      case 'RESTRICT': return 'RESTRICT'
      default: return 'RESTRICT'
    }
  }
  
  async discoverRelationships(db: Kysely<any>, tables: DiscoveredTableSchema[]): Promise<Map<string, RelationshipInfo[]>> {
    const relationships = new Map<string, RelationshipInfo[]>()
    
    for (const table of tables) {
      const tableRelationships: RelationshipInfo[] = []
      
      for (const fk of table.foreignKeys) {
        const targetTable = tables.find(t => t.name === fk.referencedTable)
        if (targetTable) {
          // Determine relationship type
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
  
  async getTableStatistics(db: Kysely<any>, tableName: string): Promise<TableStatistics> {
    const stats = await db
      .selectFrom('pg_stat_user_tables')
      .select([
        'n_tup_ins as inserts',
        'n_tup_upd as updates',
        'n_tup_del as deletes',
        'n_live_tup as liveTuples',
        'n_dead_tup as deadTuples',
        'last_vacuum',
        'last_autovacuum',
        'last_analyze',
        'last_autoanalyze'
      ])
      .where('relname', '=', tableName)
      .executeTakeFirst()
    
    return {
      estimatedRowCount: stats?.liveTuples || 0,
      insertCount: stats?.inserts || 0,
      updateCount: stats?.updates || 0,
      deleteCount: stats?.deletes || 0,
      lastVacuum: stats?.last_vacuum,
      lastAnalyze: stats?.last_analyze
    }
  }
}
```

## Auto Entity Generation

```typescript
export class EntityClassGenerator {
  async generateEntityClass(schema: DiscoveredTableSchema, relationships: RelationshipInfo[]): Promise<GeneratedEntityClass> {
    const className = this.toPascalCase(schema.name)
    const rowTypeName = `${className}Row`
    const insertableTypeName = `Insertable${className}Row`
    const updateableTypeName = `Updateable${className}Row`
    
    // Generate imports
    let imports = `import { Entity, Table, PrimaryKey, Column, HasMany, HasOne, BelongsTo } from '../entity/entity'\n`
    
    // Add relationship imports
    const relationshipImports = new Set<string>()
    for (const rel of relationships) {
      relationshipImports.add(this.toPascalCase(rel.targetTable))
    }
    
    for (const importName of relationshipImports) {
      imports += `import { ${importName} } from './${this.toKebabCase(importName)}.entity'\n`
    }
    
    // Generate row types
    const rowType = this.generateRowType(rowTypeName, schema)
    const insertableType = this.generateInsertableType(insertableTypeName, schema)
    const updateableType = this.generateUpdateableType(updateableTypeName, schema)
    
    // Generate entity class
    const entityClass = this.generateEntityClassCode(className, schema, relationships, rowTypeName)
    
    return {
      className,
      fileName: `${this.toKebabCase(className)}.entity.ts`,
      content: `${imports}\n\n${rowType}\n\n${insertableType}\n\n${updateableType}\n\n${entityClass}`,
      dependencies: Array.from(relationshipImports),
      schema: schema,
      relationships: relationships
    }
  }
  
  private generateRowType(typeName: string, schema: DiscoveredTableSchema): string {
    let code = `export interface ${typeName} {\n`
    
    for (const column of schema.columns) {
      const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
      const comment = column.comment ? ` // ${column.comment}` : ''
      code += `  ${column.name}: ${tsType}${comment}\n`
    }
    
    code += '}\n'
    return code
  }
  
  private generateInsertableType(typeName: string, schema: DiscoveredTableSchema): string {
    let code = `export interface ${typeName} {\n`
    
    for (const column of schema.columns) {
      if (column.isPrimaryKey && column.isAutoIncrement) {
        continue // Skip auto-increment primary keys
      }
      
      const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
      const comment = column.comment ? ` // ${column.comment}` : ''
      code += `  ${column.name}: ${tsType}${comment}\n`
    }
    
    code += '}\n'
    return code
  }
  
  private generateUpdateableType(typeName: string, schema: DiscoveredTableSchema): string {
    let code = `export interface ${typeName} {\n`
    
    for (const column of schema.columns) {
      if (column.isPrimaryKey) {
        continue // Skip primary keys in updates
      }
      
      const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
      const comment = column.comment ? ` // ${column.comment}` : ''
      code += `  ${column.name}?: ${tsType}${comment}\n`
    }
    
    code += '}\n'
    return code
  }
  
  private generateEntityClassCode(
    className: string, 
    schema: DiscoveredTableSchema, 
    relationships: RelationshipInfo[],
    rowTypeName: string
  ): string {
    let code = `@Table('${schema.name}')\n`
    code += `export class ${className} extends Entity<${rowTypeName}> {\n`
    
    // Generate properties
    for (const column of schema.columns) {
      const propertyName = this.toCamelCase(column.name)
      const tsType = this.mapDbTypeToTsType(column.type, column.nullable)
      
      // Add decorators
      if (column.isPrimaryKey) {
        code += `  @PrimaryKey()\n`
      }
      
      code += `  @Column({ nullable: ${column.nullable}${column.isAutoIncrement ? ', autoIncrement: true' : ''} })\n`
      code += `  ${propertyName}!: ${tsType}\n\n`
    }
    
    // Generate relationships
    for (const rel of relationships) {
      const propertyName = this.toCamelCase(rel.targetTable)
      const targetClassName = this.toPascalCase(rel.targetTable)
      
      switch (rel.type) {
        case 'one-to-one':
          code += `  @HasOne(() => ${targetClassName}, { foreignKey: '${rel.sourceColumn}' })\n`
          code += `  ${propertyName}?: ${targetClassName}\n\n`
          break
        case 'one-to-many':
          code += `  @HasMany(() => ${targetClassName}, { foreignKey: '${rel.sourceColumn}' })\n`
          code += `  ${propertyName}?: ${targetClassName}[]\n\n`
          break
        case 'many-to-one':
          code += `  @BelongsTo(() => ${targetClassName}, { foreignKey: '${rel.sourceColumn}' })\n`
          code += `  ${propertyName}?: ${targetClassName}\n\n`
          break
      }
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
    
    return code
  }
  
  private mapDbTypeToTsType(dbType: string, nullable: boolean): string {
    const baseType = this.getBaseType(dbType)
    return nullable ? `${baseType} | null` : baseType
  }
  
  private getBaseType(dbType: string): string {
    const type = dbType.toLowerCase()
    
    if (type.includes('int') || type.includes('serial') || type.includes('bigint')) return 'number'
    if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) return 'number'
    if (type.includes('bool')) return 'boolean'
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) return 'Date'
    if (type.includes('json') || type.includes('jsonb')) return 'any'
    if (type.includes('text') || type.includes('varchar') || type.includes('char') || type.includes('string')) return 'string'
    if (type.includes('uuid')) return 'string'
    if (type.includes('bytea')) return 'Buffer'
    
    return 'any'
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

## Schema Evolution Support

```typescript
export class SchemaEvolutionManager {
  private introspectionEngine: SchemaIntrospectionEngine
  private entityManager: EntityManager
  private lastKnownSchemas = new Map<string, DiscoveredTableSchema>()
  
  constructor() {
    this.introspectionEngine = SchemaIntrospectionEngine.getInstance()
    this.entityManager = EntityManager.getInstance()
  }
  
  async detectSchemaChanges(db: Kysely<any>): Promise<SchemaChangeResult> {
    const currentSchemas = await this.introspectionEngine.discoverDatabase(db)
    
    if (!currentSchemas.success) {
      return {
        hasChanges: false,
        changes: [],
        errors: currentSchemas.errors
      }
    }
    
    const changes: SchemaChange[] = []
    
    // Check for new tables
    for (const [tableName, currentSchema] of currentSchemas.tables) {
      const lastKnownSchema = this.lastKnownSchemas.get(tableName)
      
      if (!lastKnownSchema) {
        changes.push({
          type: 'TABLE_ADDED',
          tableName,
          details: { newSchema: currentSchema }
        })
      } else {
        const tableChanges = this.compareTableSchemas(lastKnownSchema, currentSchema)
        changes.push(...tableChanges)
      }
    }
    
    // Check for removed tables
    for (const [tableName, lastKnownSchema] of this.lastKnownSchemas) {
      if (!currentSchemas.tables.has(tableName)) {
        changes.push({
          type: 'TABLE_REMOVED',
          tableName,
          details: { removedSchema: lastKnownSchema }
        })
      }
    }
    
    // Update last known schemas
    this.lastKnownSchemas = new Map(currentSchemas.tables)
    
    return {
      hasChanges: changes.length > 0,
      changes,
      errors: []
    }
  }
  
  async handleSchemaChanges(changes: SchemaChange[]): Promise<EvolutionResult> {
    const results: EvolutionAction[] = []
    
    for (const change of changes) {
      switch (change.type) {
        case 'TABLE_ADDED':
          const addResult = await this.handleTableAdded(change)
          results.push(addResult)
          break
        case 'TABLE_REMOVED':
          const removeResult = await this.handleTableRemoved(change)
          results.push(removeResult)
          break
        case 'COLUMN_ADDED':
          const columnAddResult = await this.handleColumnAdded(change)
          results.push(columnAddResult)
          break
        case 'COLUMN_REMOVED':
          const columnRemoveResult = await this.handleColumnRemoved(change)
          results.push(columnRemoveResult)
          break
        case 'COLUMN_MODIFIED':
          const columnModifyResult = await this.handleColumnModified(change)
          results.push(columnModifyResult)
          break
        case 'INDEX_ADDED':
          const indexAddResult = await this.handleIndexAdded(change)
          results.push(indexAddResult)
          break
        case 'INDEX_REMOVED':
          const indexRemoveResult = await this.handleIndexRemoved(change)
          results.push(indexRemoveResult)
          break
      }
    }
    
    return {
      success: results.every(r => r.success),
      actions: results,
      errors: results.filter(r => !r.success).map(r => r.error!).flat()
    }
  }
  
  private async handleTableAdded(change: SchemaChange): Promise<EvolutionAction> {
    try {
      const generator = new EntityClassGenerator()
      const relationships = await this.introspectionEngine.detectRelationships(
        new Map([[change.tableName, change.details.newSchema]])
      )
      
      const entityClass = await generator.generateEntityClass(
        change.details.newSchema,
        relationships.get(change.tableName) || []
      )
      
      // Register the new entity
      this.entityManager.registerGeneratedEntity(change.tableName, entityClass)
      
      return {
        type: 'ENTITY_GENERATED',
        success: true,
        tableName: change.tableName,
        details: { generatedEntity: entityClass }
      }
    } catch (error) {
      return {
        type: 'ENTITY_GENERATION_FAILED',
        success: false,
        tableName: change.tableName,
        error: [error as Error]
      }
    }
  }
  
  private async handleColumnAdded(change: SchemaChange): Promise<EvolutionAction> {
    try {
      // Update existing entity class
      const entityClass = this.entityManager.getGeneratedEntity(change.tableName)
      if (entityClass) {
        const updatedEntity = await this.updateEntityForColumnAddition(entityClass, change.details.newColumn)
        this.entityManager.updateGeneratedEntity(change.tableName, updatedEntity)
      }
      
      return {
        type: 'ENTITY_UPDATED',
        success: true,
        tableName: change.tableName,
        details: { updatedEntity: entityClass }
      }
    } catch (error) {
      return {
        type: 'ENTITY_UPDATE_FAILED',
        success: false,
        tableName: change.tableName,
        error: [error as Error]
      }
    }
  }
  
  private compareTableSchemas(
    oldSchema: DiscoveredTableSchema, 
    newSchema: DiscoveredTableSchema
  ): SchemaChange[] {
    const changes: SchemaChange[] = []
    
    // Compare columns
    const oldColumns = new Map(oldSchema.columns.map(col => [col.name, col]))
    const newColumns = new Map(newSchema.columns.map(col => [col.name, col]))
    
    // Check for new columns
    for (const [columnName, newColumn] of newColumns) {
      if (!oldColumns.has(columnName)) {
        changes.push({
          type: 'COLUMN_ADDED',
          tableName: oldSchema.name,
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
    
    // Compare indexes
    const oldIndexes = new Map(oldSchema.indexes.map(idx => [idx.name, idx]))
    const newIndexes = new Map(newSchema.indexes.map(idx => [idx.name, idx]))
    
    for (const [indexName, newIndex] of newIndexes) {
      if (!oldIndexes.has(indexName)) {
        changes.push({
          type: 'INDEX_ADDED',
          tableName: oldSchema.name,
          details: { newIndex }
        })
      }
    }
    
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
  
  private columnsEqual(col1: DiscoveredColumn, col2: DiscoveredColumn): boolean {
    return col1.type === col2.type &&
           col1.nullable === col2.nullable &&
           col1.isPrimaryKey === col2.isPrimaryKey &&
           col1.isAutoIncrement === col2.isAutoIncrement &&
           col1.maxLength === col2.maxLength &&
           col1.precision === col2.precision &&
           col1.scale === col2.scale
  }
}
```

## Usage Examples

### Basic Database Discovery

```typescript
// Discover entire database structure
const introspectionEngine = SchemaIntrospectionEngine.getInstance()
const discoveryResult = await introspectionEngine.discoverDatabase(db)

if (discoveryResult.success) {
  console.log(`Discovered ${discoveryResult.tables.size} tables`)
  
  // Generate entity classes for all tables
  const entityClasses = await introspectionEngine.generateEntityClasses(discoveryResult.tables)
  
  // Generate TypeScript types
  const types = await introspectionEngine.generateTypes(discoveryResult.tables)
  
  // Save generated files
  for (const [tableName, entityClass] of entityClasses) {
    await writeFile(`generated/entities/${entityClass.fileName}`, entityClass.content)
  }
  
  await writeFile('generated/types/database.types.ts', types.database)
  await writeFile('generated/types/entities.types.ts', types.entities)
}
```

### Schema Evolution Monitoring

```typescript
// Monitor schema changes
const evolutionManager = new SchemaEvolutionManager()

setInterval(async () => {
  const changeResult = await evolutionManager.detectSchemaChanges(db)
  
  if (changeResult.hasChanges) {
    console.log('Schema changes detected:', changeResult.changes)
    
    const evolutionResult = await evolutionManager.handleSchemaChanges(changeResult.changes)
    
    if (evolutionResult.success) {
      console.log('Schema evolution completed successfully')
    } else {
      console.error('Schema evolution failed:', evolutionResult.errors)
    }
  }
}, 60000) // Check every minute
```

### Custom Introspection Strategy

```typescript
// Register custom introspection strategy for MySQL
class MySQLIntrospectionStrategy implements IntrospectionStrategy {
  dialect = 'mysql'
  
  async discoverTables(db: Kysely<any>): Promise<DiscoveredTableSchema[]> {
    // MySQL-specific introspection logic
    const tables = await db
      .selectFrom('information_schema.tables')
      .select(['table_name as name', 'table_comment as comment'])
      .where('table_schema', '=', db.getSchema())
      .execute()
    
    // ... MySQL-specific implementation
  }
  
  // ... other methods
}

// Register the strategy
const introspectionEngine = SchemaIntrospectionEngine.getInstance()
introspectionEngine.registerIntrospectionStrategy('mysql', new MySQLIntrospectionStrategy())
```

## Performance Characteristics

- **Initial Discovery**: O(n) - Depends on number of tables and columns
- **Schema Comparison**: O(n) - Linear with schema complexity
- **Entity Generation**: O(n) - Depends on entity complexity
- **Type Generation**: O(n) - Linear with schema size
- **Memory Usage**: Moderate - Caches discovered schemas and generated entities
- **Database Queries**: Minimal - Only essential metadata queries

## Benefits

1. **Zero Configuration** - Works with any existing database
2. **Automatic Discovery** - No manual entity definition required
3. **Dynamic Adaptation** - Handles schema changes at runtime
4. **Type Safety** - Generates full TypeScript types
5. **Relationship Detection** - Automatically discovers foreign key relationships
6. **Multi-Database Support** - Pluggable introspection strategies
7. **Schema Evolution** - Monitors and adapts to database changes

## Limitations

1. **Database Dependency** - Requires database connection for discovery
2. **Performance Impact** - Initial discovery can be slow for large schemas
3. **Complex Relationships** - May not detect all relationship types
4. **Custom Types** - Limited support for database-specific custom types

## Integration Points

- **Entity Manager** - Registers discovered entities
- **Repository Registry** - Uses discovered entities for repository generation
- **Type System** - Generates types from discovered schemas
- **Migration System** - Tracks schema changes for migration generation
- **Configuration Manager** - Configures introspection behavior
