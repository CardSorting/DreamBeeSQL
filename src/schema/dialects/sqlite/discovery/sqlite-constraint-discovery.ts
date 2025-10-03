import type { Kysely } from '../../../kysely.js'

/**
 * SQLite-specific constraint discovery
 */
export class SQLiteConstraintDiscovery {
  private static instance: SQLiteConstraintDiscovery

  static getInstance(): SQLiteConstraintDiscovery {
    if (!SQLiteConstraintDiscovery.instance) {
      SQLiteConstraintDiscovery.instance = new SQLiteConstraintDiscovery()
    }
    return SQLiteConstraintDiscovery.instance
  }

  /**
   * Discover constraints from SQLite table definition
   */
  async discoverTableConstraints(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      // Get table definition from sqlite_master
      const tableDef = await db
        .selectFrom('sqlite_master')
        .select('sql')
        .where('type', '=', 'table')
        .where('name', '=', tableName)
        .executeTakeFirst()

      if (!tableDef?.sql) {
        return []
      }

      return this.parseConstraintsFromSQL(tableDef.sql, tableName)
    } catch (error) {
      console.warn(`Failed to discover constraints for SQLite table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Parse constraints from SQLite CREATE TABLE statement
   */
  private parseConstraintsFromSQL(sql: string, tableName: string): any[] {
    const constraints: any[] = []
    
    // Extract column definitions and table constraints
    const columnMatches = sql.match(/CREATE TABLE[^(]*\(([^)]+)\)/i)
    if (!columnMatches) return constraints

    const definitions = columnMatches[1].split(',').map(def => def.trim())

    for (const definition of definitions) {
      // Primary key constraints
      if (definition.toUpperCase().includes('PRIMARY KEY')) {
        const pkMatch = definition.match(/(\w+)\s+PRIMARY KEY/i)
        if (pkMatch) {
          constraints.push({
            name: `${tableName}_pk`,
            type: 'p',
            columns: [pkMatch[1]],
            definition: definition
          })
        }
      }

      // Foreign key constraints
      if (definition.toUpperCase().includes('FOREIGN KEY')) {
        const fkMatch = definition.match(/FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/i)
        if (fkMatch) {
          constraints.push({
            name: `${tableName}_fk_${fkMatch[1]}`,
            type: 'f',
            column: fkMatch[1],
            referencedTable: fkMatch[2],
            referencedColumn: fkMatch[3],
            definition: definition
          })
        }
      }

      // Check constraints
      if (definition.toUpperCase().includes('CHECK')) {
        const checkMatch = definition.match(/CHECK\s*\(([^)]+)\)/i)
        if (checkMatch) {
          constraints.push({
            name: `${tableName}_check_${constraints.length + 1}`,
            type: 'c',
            definition: checkMatch[1],
            fullDefinition: definition
          })
        }
      }

      // Unique constraints
      if (definition.toUpperCase().includes('UNIQUE')) {
        const uniqueMatch = definition.match(/UNIQUE\s*\(([^)]+)\)/i)
        if (uniqueMatch) {
          constraints.push({
            name: `${tableName}_unique_${constraints.length + 1}`,
            type: 'u',
            columns: uniqueMatch[1].split(',').map(col => col.trim()),
            definition: definition
          })
        }
      }

      // Not null constraints
      if (definition.toUpperCase().includes('NOT NULL')) {
        const notNullMatch = definition.match(/(\w+)\s+[^,]+\s+NOT NULL/i)
        if (notNullMatch) {
          constraints.push({
            name: `${tableName}_nn_${notNullMatch[1]}`,
            type: 'n',
            column: notNullMatch[1],
            definition: definition
          })
        }
      }
    }

    return constraints
  }

  /**
   * Get foreign key information using PRAGMA
   */
  async getForeignKeyInfo(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      const result = await db.executeQuery({
        sql: `PRAGMA foreign_key_list(${tableName})`,
        parameters: []
      })

      return (result.rows || []).map(row => ({
        name: `${tableName}_fk_${row.column}`,
        type: 'f',
        column: row.column,
        referencedTable: row.table,
        referencedColumn: row.to,
        onDelete: row.on_delete || 'NO ACTION',
        onUpdate: row.on_update || 'NO ACTION'
      }))
    } catch (error) {
      console.warn(`Failed to get foreign key info for SQLite table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Check if foreign keys are enabled
   */
  async isForeignKeySupportEnabled(db: Kysely<any>): Promise<boolean> {
    try {
      const result = await db.executeQuery({
        sql: 'PRAGMA foreign_keys',
        parameters: []
      })

      return result.rows?.[0]?.foreign_keys === 1
    } catch (error) {
      console.warn('Failed to check foreign key support:', error)
      return false
    }
  }

  /**
   * Validate SQLite constraints
   */
  validateConstraints(constraints: any[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    for (const constraint of constraints) {
      if (!constraint.name) {
        issues.push('Constraint name is required')
      }

      if (!constraint.type) {
        issues.push(`Constraint type is required for ${constraint.name}`)
      }

      // Validate foreign key constraints
      if (constraint.type === 'f') {
        if (!constraint.column) {
          issues.push(`Foreign key constraint ${constraint.name} missing column`)
        }
        if (!constraint.referencedTable) {
          issues.push(`Foreign key constraint ${constraint.name} missing referenced table`)
        }
        if (!constraint.referencedColumn) {
          issues.push(`Foreign key constraint ${constraint.name} missing referenced column`)
        }
      }

      // Validate check constraints
      if (constraint.type === 'c' && !constraint.definition) {
        issues.push(`Check constraint ${constraint.name} missing definition`)
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Analyze constraint compatibility
   */
  analyzeConstraintCompatibility(constraints: any[]): {
    recommendations: string[]
    compatibilityIssues: string[]
  } {
    const recommendations: string[] = []
    const compatibilityIssues: string[] = []

    // Check for complex constraints that might not be portable
    for (const constraint of constraints) {
      if (constraint.type === 'c' && constraint.definition) {
        const definition = constraint.definition.toLowerCase()
        
        // Check for SQLite-specific functions
        if (definition.includes('datetime(') || definition.includes('date(')) {
          compatibilityIssues.push(`Check constraint ${constraint.name} uses SQLite-specific date functions`)
        }

        if (definition.includes('substr(') || definition.includes('length(')) {
          compatibilityIssues.push(`Check constraint ${constraint.name} uses SQLite-specific string functions`)
        }
      }
    }

    // Recommendations for better portability
    if (compatibilityIssues.length > 0) {
      recommendations.push('Consider using standard SQL functions for better database portability')
    }

    return {
      recommendations,
      compatibilityIssues
    }
  }
}
