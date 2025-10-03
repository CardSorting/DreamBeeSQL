import type { Kysely } from '../kysely.js'
import { TableInfo, RelationshipInfo, Repository, PerformanceConfig } from '../types'

/**
 * Repository factory that creates dynamic repository classes
 */
export class RepositoryFactory {
  constructor(
    private db: Kysely<any>,
    private config: PerformanceConfig = {}
  ) {}

  /**
   * Create a repository for the specified table
   */
  createRepository<T>(table: TableInfo, relationships: RelationshipInfo[]): Repository<T> {
    const repository: Repository<T> = {
      // Basic CRUD operations
      findById: async (id: any) => {
        const result = await this.db
          .selectFrom(table.name)
          .selectAll()
          .where(this.getPrimaryKeyCondition(table, id))
          .executeTakeFirst()
        
        return result as T | null
      },

      findAll: async () => {
        const results = await this.db
          .selectFrom(table.name)
          .selectAll()
          .execute()
        
        return results as T[]
      },

      create: async (data: Partial<T>) => {
        const result = await this.db
          .insertInto(table.name)
          .values(data as any)
          .returningAll()
          .executeTakeFirstOrThrow()
        
        return result as T
      },

      update: async (entity: T) => {
        const primaryKeyValue = this.getPrimaryKeyValue(table, entity)
        const updateData = this.getUpdateData(table, entity)
        
        const result = await this.db
          .updateTable(table.name)
          .set(updateData)
          .where(this.getPrimaryKeyCondition(table, primaryKeyValue))
          .returningAll()
          .executeTakeFirstOrThrow()
        
        return result as T
      },

      delete: async (id: any) => {
        const result = await this.db
          .deleteFrom(table.name)
          .where(this.getPrimaryKeyCondition(table, id))
          .execute()
        
        return result.length > 0
      },

      // Relationship operations
      findWithRelations: async (id: any, relations: string[]) => {
        const entity = await repository.findById(id)
        if (!entity) return null

        await this.loadRelationships([entity], relations, relationships)
        return entity
      },

      loadRelationships: async (entities: T[], relations: string[]) => {
        await this.loadRelationships(entities, relations, relationships)
      }
    }

    // Add custom finder methods based on table structure
    this.addCustomFinders(repository, table)

    return repository
  }

  /**
   * Add custom finder methods to repository
   */
  private addCustomFinders<T>(repository: Repository<T>, table: TableInfo): void {
    // Add findBy methods for unique columns
    for (const column of table.columns) {
      if (column.name !== table.primaryKey?.[0]) {
        const methodName = `findBy${this.toPascalCase(column.name)}`
        repository[methodName] = async (value: any) => {
          const result = await this.db
            .selectFrom(table.name)
            .selectAll()
            .where(column.name as any, '=', value)
            .executeTakeFirst()
          
          return result as T | null
        }
      }
    }

    // Add findManyBy methods for non-unique columns
    for (const column of table.columns) {
      const methodName = `findManyBy${this.toPascalCase(column.name)}`
      repository[methodName] = async (value: any) => {
        const results = await this.db
          .selectFrom(table.name)
          .selectAll()
          .where(column.name as any, '=', value)
          .execute()
        
        return results as T[]
      }
    }

    // Add count methods
    repository.count = async () => {
      const result = await this.db
        .selectFrom(table.name)
        .select(this.db.fn.count('*').as('count'))
        .executeTakeFirst()
      
      return Number(result?.count || 0)
    }

    // Add exists method
    repository.exists = async (id: any) => {
      const result = await this.db
        .selectFrom(table.name)
        .select(this.db.fn.count('*').as('count'))
        .where(this.getPrimaryKeyCondition(table, id))
        .executeTakeFirst()
      
      return Number(result?.count || 0) > 0
    }
  }

  /**
   * Load relationships for entities
   */
  private async loadRelationships<T>(
    entities: T[], 
    relations: string[], 
    allRelationships: RelationshipInfo[]
  ): Promise<void> {
    if (!this.config.enableBatchLoading) {
      // Load relationships one by one
      for (const entity of entities) {
        await this.loadEntityRelationships(entity, relations, allRelationships)
      }
      return
    }

    // Batch load relationships for performance
    const batchSize = this.config.maxBatchSize || 100
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize)
      await this.batchLoadRelationships(batch, relations, allRelationships)
    }
  }

  /**
   * Load relationships for a single entity
   */
  private async loadEntityRelationships<T>(
    entity: T, 
    relations: string[], 
    allRelationships: RelationshipInfo[]
  ): Promise<void> {
    for (const relationName of relations) {
      const relationship = allRelationships.find(r => r.name === relationName)
      if (!relationship) continue

      await this.loadSingleRelationship(entity, relationship)
    }
  }

  /**
   * Batch load relationships for multiple entities
   */
  private async batchLoadRelationships<T>(
    entities: T[], 
    relations: string[], 
    allRelationships: RelationshipInfo[]
  ): Promise<void> {
    for (const relationName of relations) {
      const relationship = allRelationships.find(r => r.name === relationName)
      if (!relationship) continue

      await this.batchLoadSingleRelationship(entities, relationship)
    }
  }

  /**
   * Load a single relationship for an entity
   */
  private async loadSingleRelationship<T>(entity: T, relationship: RelationshipInfo): Promise<void> {
    const entityValue = (entity as any)[relationship.fromColumn]
    if (!entityValue) return

    let relatedData: any

    switch (relationship.type) {
      case 'many-to-one':
        relatedData = await this.db
          .selectFrom(relationship.toTable)
          .selectAll()
          .where(relationship.toColumn as any, '=', entityValue)
          .executeTakeFirst()
        break

      case 'one-to-many':
        relatedData = await this.db
          .selectFrom(relationship.toTable)
          .selectAll()
          .where(relationship.fromColumn as any, '=', entityValue)
          .execute()
        break

      case 'many-to-many':
        // TODO: Implement many-to-many relationships
        relatedData = []
        break
    }

    (entity as any)[relationship.name] = relatedData
  }

  /**
   * Batch load a single relationship for multiple entities
   */
  private async batchLoadSingleRelationship<T>(entities: T[], relationship: RelationshipInfo): Promise<void> {
    const entityValues = entities
      .map(e => (e as any)[relationship.fromColumn])
      .filter(v => v !== undefined && v !== null)

    if (entityValues.length === 0) return

    let relatedData: any[]

    switch (relationship.type) {
      case 'many-to-one':
        relatedData = await this.db
          .selectFrom(relationship.toTable)
          .selectAll()
          .where(relationship.toColumn as any, 'in', entityValues)
          .execute()
        break

      case 'one-to-many':
        relatedData = await this.db
          .selectFrom(relationship.toTable)
          .selectAll()
          .where(relationship.fromColumn as any, 'in', entityValues)
          .execute()
        break

      case 'many-to-many':
        // TODO: Implement many-to-many relationships
        relatedData = []
        break

      default:
        relatedData = []
    }

    // Group related data by foreign key value
    const groupedData = new Map<any, any[]>()
    for (const item of relatedData) {
      const key = item[relationship.toColumn]
      if (!groupedData.has(key)) {
        groupedData.set(key, [])
      }
      groupedData.get(key)!.push(item)
    }

    // Assign related data to entities
    for (const entity of entities) {
      const entityValue = (entity as any)[relationship.fromColumn]
      if (entityValue) {
        let entityRelatedData: any
        if (relationship.type === 'many-to-one') {
          entityRelatedData = groupedData.get(entityValue)?.[0]
        } else {
          entityRelatedData = groupedData.get(entityValue) || []
        }
        (entity as any)[relationship.name] = entityRelatedData
      }
    }
  }

  /**
   * Get primary key condition for queries
   */
  private getPrimaryKeyCondition(table: TableInfo, id: any): any {
    if (table.primaryKey && table.primaryKey.length === 1) {
      return { [table.primaryKey[0]]: id }
    }
    
    // Handle composite primary keys
    if (table.primaryKey && table.primaryKey.length > 1) {
      const conditions: any = {}
      for (let i = 0; i < table.primaryKey.length; i++) {
        conditions[table.primaryKey[i]] = id[i]
      }
      return conditions
    }

    throw new Error(`No primary key defined for table ${table.name}`)
  }

  /**
   * Get primary key value from entity
   */
  private getPrimaryKeyValue(table: TableInfo, entity: any): any {
    if (table.primaryKey && table.primaryKey.length === 1) {
      return entity[table.primaryKey[0]]
    }
    
    // Handle composite primary keys
    if (table.primaryKey && table.primaryKey.length > 1) {
      return table.primaryKey.map(key => entity[key])
    }

    throw new Error(`No primary key defined for table ${table.name}`)
  }

  /**
   * Get update data (exclude primary key)
   */
  private getUpdateData(table: TableInfo, entity: any): any {
    const updateData: any = {}
    
    for (const column of table.columns) {
      if (!table.primaryKey?.includes(column.name)) {
        updateData[column.name] = entity[column.name]
      }
    }
    
    return updateData
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '')
  }
}
