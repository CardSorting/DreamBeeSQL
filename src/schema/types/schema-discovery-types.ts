import { TableInfo, ColumnInfo, RelationshipInfo } from '../../types/index.js'

export interface SchemaDiscoveryConfig {
  excludeTables?: string[]
  includeViews?: boolean
  customTypeMappings?: Record<string, string>
}

export interface TableMetadata {
  name: string
  schema?: string
  columns: ColumnInfo[]
  primaryKey?: string[]
  indexes: IndexMetadata[]
  foreignKeys: ForeignKeyMetadata[]
}

export interface IndexMetadata {
  name: string
  columns: string[]
  unique: boolean
}

export interface ForeignKeyMetadata {
  name: string
  column: string
  referencedTable: string
  referencedColumn: string
  onDelete?: string
  onUpdate?: string
}

export interface ViewMetadata {
  name: string
  schema?: string
  definition?: string
  columns?: any[]
}
