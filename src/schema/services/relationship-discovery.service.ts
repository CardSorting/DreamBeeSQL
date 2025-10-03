import { TableInfo, RelationshipInfo } from '../../types/index.js'
import { NameGenerator } from '../utils/name-generator.js'

/**
 * Service for discovering relationships between tables
 */
export class RelationshipDiscoveryService {
  private static instance: RelationshipDiscoveryService

  static getInstance(): RelationshipDiscoveryService {
    if (!RelationshipDiscoveryService.instance) {
      RelationshipDiscoveryService.instance = new RelationshipDiscoveryService()
    }
    return RelationshipDiscoveryService.instance
  }

  /**
   * Discover relationships between tables
   */
  async discoverRelationships(tables: TableInfo[]): Promise<RelationshipInfo[]> {
    const relationships: RelationshipInfo[] = []

    for (const table of tables) {
      for (const fk of table.foreignKeys) {
        // Find the referenced table
        const referencedTable = tables.find(t => t.name === fk.referencedTable)
        if (!referencedTable) continue

        // Create relationship name based on column name
        const relationshipName = NameGenerator.generateRelationshipName(fk.column, fk.referencedTable)

        // Determine relationship type
        const isUnique = referencedTable.primaryKey?.includes(fk.referencedColumn) || false
        const relationshipType = isUnique ? 'many-to-one' : 'one-to-many'

        relationships.push({
          name: relationshipName,
          type: relationshipType,
          fromTable: table.name,
          fromColumn: fk.column,
          toTable: fk.referencedTable,
          toColumn: fk.referencedColumn
        })

        // Add reverse relationship
        const reverseName = NameGenerator.generateReverseRelationshipName(table.name, fk.column)
        relationships.push({
          name: reverseName,
          type: relationshipType === 'many-to-one' ? 'one-to-many' : 'many-to-one',
          fromTable: fk.referencedTable,
          fromColumn: fk.referencedColumn,
          toTable: table.name,
          toColumn: fk.column
        })
      }
    }

    return relationships
  }
}
