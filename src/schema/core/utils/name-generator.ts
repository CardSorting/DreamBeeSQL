/**
 * Utility class for generating relationship names and handling naming conventions
 */
export class NameGenerator {
  /**
   * Generate relationship name from foreign key column
   */
  static generateRelationshipName(columnName: string, referencedTable: string): string {
    // Remove common foreign key suffixes
    let name = columnName
    if (name.endsWith('_id')) {
      name = name.slice(0, -3)
    }
    if (name.endsWith('Id')) {
      name = name.slice(0, -2)
    }

    // Convert to camelCase
    return this.toCamelCase(name)
  }

  /**
   * Generate reverse relationship name
   */
  static generateReverseRelationshipName(tableName: string, columnName: string): string {
    // Convert table name to plural for one-to-many relationships
    const pluralTableName = this.pluralize(this.toCamelCase(tableName))
    return pluralTableName
  }

  /**
   * Convert string to camelCase
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '')
  }

  /**
   * Simple pluralization (basic implementation)
   */
  static pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies'
    }
    if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('x') || str.endsWith('z')) {
      return str + 'es'
    }
    return str + 's'
  }
}
