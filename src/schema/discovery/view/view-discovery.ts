import { DatabaseIntrospector } from '../../../dialect/database-introspector.js'
import { ViewMetadata } from '../../types/schema-discovery-types.js'

/**
 * Specialized service for discovering database views
 */
export class ViewDiscovery {
  private static instance: ViewDiscovery

  static getInstance(): ViewDiscovery {
    if (!ViewDiscovery.instance) {
      ViewDiscovery.instance = new ViewDiscovery()
    }
    return ViewDiscovery.instance
  }

  /**
   * Discover views in the database
   */
  async discoverViews(introspector: DatabaseIntrospector): Promise<ViewMetadata[]> {
    try {
      // Get views using the introspector's getTables method with view filter
      const tables = await introspector.getTables({ withInternalKyselyTables: false })
      const views: ViewMetadata[] = []

      // Filter for views (this depends on the specific introspector implementation)
      for (const table of tables) {
        // Check if this is a view (different databases handle this differently)
        if (this.isView(table)) {
          views.push({
            name: table.name,
            schema: table.schema,
            definition: await this.getViewDefinition(introspector, table.name),
            columns: [] // Views don't have explicit columns in this context
          })
        }
      }

      return views
    } catch (error) {
      console.warn('Failed to discover views:', error)
      return []
    }
  }

  /**
   * Get view definition for a specific view
   */
  async getViewDefinition(introspector: DatabaseIntrospector, viewName: string): Promise<string | null> {
    try {
      // This would need to be implemented based on the specific database dialect
      // For PostgreSQL, we could query pg_views
      // For MySQL, we could query information_schema.views
      // For SQLite, we could query sqlite_master
      
      // For now, return a placeholder that indicates the view exists
      return `-- View definition for ${viewName} would be retrieved here`
    } catch (error) {
      console.warn(`Failed to get definition for view ${viewName}:`, error)
      return null
    }
  }

  /**
   * Check if a table metadata represents a view
   */
  private isView(table: any): boolean {
    // Different databases indicate views differently
    // PostgreSQL: table.isView or table.table_type === 'v'
    // MySQL: table.table_type === 'VIEW'
    // SQLite: table.type === 'view'
    
    return (
      table.isView === true ||
      table.table_type === 'v' ||
      table.table_type === 'VIEW' ||
      table.type === 'view'
    )
  }

  /**
   * Validate view metadata
   */
  validateView(view: ViewMetadata): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!view.name) {
      issues.push('View name is required')
    }

    if (!view.definition || view.definition.trim() === '') {
      issues.push('View definition is required')
    }

    // Check for SQL injection patterns in view definition
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM/i,
      /UPDATE\s+SET/i,
      /INSERT\s+INTO/i,
      /TRUNCATE/i,
      /ALTER\s+TABLE/i
    ]

    if (view.definition) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(view.definition)) {
          issues.push(`View definition contains potentially dangerous SQL: ${pattern.source}`)
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Analyze view dependencies
   */
  analyzeViewDependencies(views: ViewMetadata[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>()

    for (const view of views) {
      if (view.definition) {
        const deps = this.extractTableReferences(view.definition)
        dependencies.set(view.name, deps)
      }
    }

    return dependencies
  }

  /**
   * Extract table references from SQL definition
   */
  private extractTableReferences(sql: string): string[] {
    // Simple regex to extract table references from SQL
    // This is a basic implementation and could be enhanced with a proper SQL parser
    const tableRegex = /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    const joinRegex = /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    
    const references: string[] = []
    let match

    while ((match = tableRegex.exec(sql)) !== null) {
      references.push(match[1])
    }

    while ((match = joinRegex.exec(sql)) !== null) {
      references.push(match[1])
    }

    // Remove duplicates
    return [...new Set(references)]
  }
}
