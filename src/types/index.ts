/**
 * Core type definitions for NOORMME
 */

export interface NOORMConfig {
  dialect: 'sqlite'
  connection: ConnectionConfig
  introspection?: IntrospectionConfig
  cache?: CacheConfig
  logging?: LoggingConfig
  performance?: PerformanceConfig
  automation?: AutomationConfig
  optimization?: OptimizationConfig
}

export interface ConnectionConfig {
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  ssl?: boolean | object
  pool?: PoolConfig
}

export interface PoolConfig {
  min?: number
  max?: number
  idleTimeoutMillis?: number
}

export interface IntrospectionConfig {
  includeViews?: boolean
  excludeTables?: string[]
  customTypeMappings?: Record<string, string>
}

export interface CacheConfig {
  ttl?: number
  maxSize?: number
  strategy?: 'lru' | 'fifo'
}

export interface LoggingConfig {
  level?: 'debug' | 'info' | 'warn' | 'error'
  enabled?: boolean
  file?: string
}

export interface PerformanceConfig {
  enableQueryOptimization?: boolean
  enableBatchLoading?: boolean
  maxBatchSize?: number
  enableCaching?: boolean
  maxCacheSize?: number
  enableBatchOperations?: boolean
  slowQueryThreshold?: number
}

export interface AutomationConfig {
  enableAutoOptimization?: boolean
  enableIndexRecommendations?: boolean
  enableQueryAnalysis?: boolean
  enableMigrationGeneration?: boolean
  enablePerformanceMonitoring?: boolean
  enableSchemaWatcher?: boolean
}

export interface OptimizationConfig {
  enableWALMode?: boolean
  enableForeignKeys?: boolean
  cacheSize?: number
  synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA'
  tempStore?: 'DEFAULT' | 'FILE' | 'MEMORY'
  autoVacuumMode?: 'NONE' | 'FULL' | 'INCREMENTAL'
  journalMode?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF'
}

export interface SchemaInfo {
  tables: TableInfo[]
  relationships: RelationshipInfo[]
  views?: ViewInfo[]
}

export interface TableInfo {
  name: string
  schema?: string
  columns: ColumnInfo[]
  primaryKey?: string[]
  indexes: IndexInfo[]
  foreignKeys: ForeignKeyInfo[]
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: unknown
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  maxLength?: number
  precision?: number
  scale?: number
}

export interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
}

export interface ForeignKeyInfo {
  name: string
  column: string
  referencedTable: string
  referencedColumn: string
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

export interface RelationshipInfo {
  name: string
  type: 'one-to-many' | 'many-to-one' | 'many-to-many'
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  throughTable?: string
  throughFromColumn?: string
  throughToColumn?: string
}

export interface ViewInfo {
  name: string
  schema?: string
  definition: string
  columns: ColumnInfo[]
}

export interface GeneratedTypes {
  entities: EntityType[]
  interfaces: string
  types: string
}

export interface EntityType {
  name: string
  tableName: string
  interface: string
  insertType: string
  updateType: string
  selectType: string
}

export interface Repository<T> {
  // CRUD operations
  findById(id: string | number): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(entity: T): Promise<T>
  delete(id: string | number): Promise<boolean>

  // Relationships
  findWithRelations(id: string | number, relations: string[]): Promise<T | null>
  loadRelationships(entities: T[], relations: string[]): Promise<void>

  // Utility methods
  count(): Promise<number>
  exists(id: string | number): Promise<boolean>

  // Pagination
  paginate(options: {
    page: number
    limit: number
    where?: Partial<T>
    orderBy?: {
      column: keyof T
      direction: 'asc' | 'desc'
    }
  }): Promise<{
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }>

  // Relationship counting
  withCount(id: string | number, relationships: string[]): Promise<T & Record<string, number>>

  // Custom finders (auto-generated from schema)
  [key: string]: unknown
}

export interface SchemaChange {
  type: 'table_added' | 'table_removed' | 'column_added' | 'column_removed' | 'column_modified'
  table: string
  column?: string
  details?: unknown
}

export interface RefreshResult {
  schemaInfo: SchemaInfo
  changes: SchemaChange[]
  typesRegenerated: boolean
}

