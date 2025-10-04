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
}

export interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
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
  defaultValue?: any
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
  findById(id: any): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(entity: T): Promise<T>
  delete(id: any): Promise<boolean>

  // Relationships
  findWithRelations(id: any, relations: string[]): Promise<T | null>
  loadRelationships(entities: T[], relations: string[]): Promise<void>

  // Utility methods
  count(): Promise<number>
  exists(id: any): Promise<boolean>

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
  withCount(id: any, relationships: string[]): Promise<T & Record<string, number>>

  // Custom finders (auto-generated from schema)
  [key: string]: any
}

export interface SchemaChange {
  type: 'table_added' | 'table_removed' | 'column_added' | 'column_removed' | 'column_modified'
  table: string
  column?: string
  details?: any
}

export interface RefreshResult {
  schemaInfo: SchemaInfo
  changes: SchemaChange[]
  typesRegenerated: boolean
}
