// TODO: Remove this import if ColumnInfo is not used, or fix the import path if necessary.
// import { ColumnInfo } from '../../types/index.js'

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
   /**
    * Map database column info to our ColumnInfo interface
    */
   static mapColumnInfo(
     dbColumn: any,
     customTypeMappings?: Record<string, string>
   ): {
     name: string;
     type: string;
     nullable: boolean;
     defaultValue?: any;
     isPrimaryKey: boolean;
     isAutoIncrement: boolean;
     maxLength?: number;
     precision?: number;
     scale?: number;
   } {
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
