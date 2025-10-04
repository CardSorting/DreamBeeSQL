import { ColumnInfo } from '../../../types/index.js'

/**
 * Raw database column information from introspection
 */
interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  defaultValue?: unknown
  isPrimaryKey?: boolean
  isAutoIncrement?: boolean
  maxLength?: number
  precision?: number
  scale?: number
}

/**
 * Maps database column types to TypeScript types
 */
export class TypeMapper {
  private static typeMapping = {
    // SQLite types
    'text': 'string',
    'varchar': 'string',
    'char': 'string',
    'integer': 'number',
    'real': 'number',
    'numeric': 'number',
    'boolean': 'boolean',
    'date': 'Date',
    'datetime': 'Date',
    'blob': 'Buffer',
  }

  /**
   * Map database column info to our ColumnInfo interface
   */
  static mapColumnInfo(
    dbColumn: DatabaseColumn,
    customTypeMappings?: Record<string, string>
  ): ColumnInfo {
     return {
       name: dbColumn.name,
       type: this.mapColumnType(dbColumn.type, customTypeMappings),
       nullable: dbColumn.nullable,
      defaultValue: dbColumn.defaultValue,
      isPrimaryKey: dbColumn.isPrimaryKey ?? false,
      isAutoIncrement: dbColumn.isAutoIncrement ?? false,
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
    if (this.typeMapping[dbType.toLowerCase() as keyof typeof this.typeMapping]) {
      return this.typeMapping[dbType.toLowerCase() as keyof typeof this.typeMapping]
    }

    // Handle parameterized types (e.g., varchar(255), decimal(10,2))
    const baseType = dbType.toLowerCase().split('(')[0]
    if (this.typeMapping[baseType as keyof typeof this.typeMapping]) {
      return this.typeMapping[baseType as keyof typeof this.typeMapping]
    }

    // Default to unknown for unknown types
    return 'unknown'
  }
}
