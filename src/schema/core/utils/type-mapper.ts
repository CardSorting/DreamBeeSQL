import { ColumnInfo } from '../../types/index.js'

/**
 * Maps database column types to TypeScript types
 */
export class TypeMapper {
  private static typeMapping = {
    // PostgreSQL types
    'varchar': 'string',
    'text': 'string',
    'char': 'string',
    'integer': 'number',
    'bigint': 'number',
    'smallint': 'number',
    'decimal': 'number',
    'numeric': 'number',
    'real': 'number',
    'double precision': 'number',
    'boolean': 'boolean',
    'date': 'Date',
    'timestamp': 'Date',
    'timestamptz': 'Date',
    'time': 'Date',
    'json': 'any',
    'jsonb': 'any',
    'uuid': 'string',

    // MySQL specific types
    'longtext': 'string',
    'mediumtext': 'string',
    'tinytext': 'string',
    'int': 'number',
    'tinyint': 'number',
    'float': 'number',
    'double': 'number',
    'bool': 'boolean',
    'datetime': 'Date',

    // SQLite specific types
    'blob': 'Buffer',

    // MSSQL specific types
    'nvarchar': 'string',
    'nchar': 'string',
    'ntext': 'string',
    'bit': 'boolean',
    'datetime2': 'Date',
    'smalldatetime': 'Date'
  }

  /**
   * Map database column info to our ColumnInfo interface
   */
  static mapColumnInfo(dbColumn: any, customTypeMappings?: Record<string, string>): ColumnInfo {
    return {
      name: dbColumn.name,
      type: this.mapColumnType(dbColumn.type, customTypeMappings),
      nullable: dbColumn.nullable,
      defaultValue: dbColumn.defaultValue,
      isPrimaryKey: dbColumn.isPrimaryKey,
      isAutoIncrement: dbColumn.isAutoIncrement,
      maxLength: dbColumn.maxLength,
      precision: dbColumn.precision,
      scale: dbColumn.scale
    }
  }

  /**
   * Map database column types to TypeScript types
   */
  static mapColumnType(dbType: string, customTypeMappings?: Record<string, string>): string {
    // Handle custom type mappings first
    if (customTypeMappings?.[dbType]) {
      return customTypeMappings[dbType]
    }

    // Try exact match first
    if ((this.typeMapping as any)[dbType.toLowerCase()]) {
      return (this.typeMapping as any)[dbType.toLowerCase()]
    }

    // Handle parameterized types (e.g., varchar(255), decimal(10,2))
    const baseType = dbType.toLowerCase().split('(')[0]
    if ((this.typeMapping as any)[baseType]) {
      return (this.typeMapping as any)[baseType]
    }

    // Default to any for unknown types
    return 'any'
  }
}
