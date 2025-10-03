// Removed import of missing types to fix error

export interface SchemaDiscoveryConfig {
  excludeTables?: string[]
  includeViews?: boolean
  customTypeMappings?: Record<string, string>
}

export interface TableMetadata {
  name: string
  schema?: string
  columns: any[] // Changed from ColumnInfo[] to any[] to fix missing type error
  primaryKey?: string[]
  indexes: IndexMetadata[]
  foreignKeys: ForeignKeyMetadata[];
}

export interface IndexMetadata {
  name: string;
  columns: string[];
  unique: boolean;
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
