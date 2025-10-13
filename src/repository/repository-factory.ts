import type { Kysely } from '../kysely.js'
import type { Repository, TableInfo, RelationshipInfo } from '../types/index.js'

/**
 * Simple repository factory for creating table repositories
 */
export class RepositoryFactory {
  constructor(
    private db: Kysely<any>,
    private performanceConfig?: any
  ) {}

  /**
   * Create a repository for the specified table
   */
  createRepository<T>(
    table: TableInfo,
    relationships: RelationshipInfo[]
  ): Repository<T> {
    // Determine the primary key column name
    const primaryKey = table.columns.find(c => c.isPrimaryKey)?.name || 'id'

    return {
      // Django-style objects wrapper
      objects: {
        all: async () => {
          return await this.db
            .selectFrom(table.name as any)
            .selectAll()
            .execute()
        },
        get: async (id: any) => {
          return await this.db
            .selectFrom(table.name as any)
            .selectAll()
            .where(primaryKey as any, '=', id)
            .executeTakeFirst()
        },
        create: async (data: Partial<T>) => {
          return await this.db
            .insertInto(table.name as any)
            .values(data as any)
            .returningAll()
            .executeTakeFirst()
        },
        update: async (id: any, data: Partial<T>) => {
          return await this.db
            .updateTable(table.name as any)
            .set(data as any)
            .where(primaryKey as any, '=', id)
            .returningAll()
            .executeTakeFirst()
        },
        delete: async (id: any) => {
          return await this.db
            .deleteFrom(table.name as any)
            .where(primaryKey as any, '=', id)
            .executeTakeFirst()
        }
      },

      // Direct CRUD methods
      findById: async (id: string | number) => {
        const result = await this.db
          .selectFrom(table.name as any)
          .selectAll()
          .where(primaryKey as any, '=', id)
          .executeTakeFirst()
        return (result as T | undefined) ?? null
      },

      findAll: async () => {
        return await this.db
          .selectFrom(table.name as any)
          .selectAll()
          .execute() as T[]
      },

      create: async (data: Partial<T>) => {
        const result = await this.db
          .insertInto(table.name as any)
          .values(data as any)
          .returningAll()
          .executeTakeFirst()
        
        if (!result) {
          throw new Error(`Failed to create entity in table ${table.name}`)
        }
        
        return result as T
      },

      update: async (entity: T) => {
        const id = (entity as any)[primaryKey]
        
        if (id === undefined) {
          throw new Error(
            `Cannot update entity: missing primary key '${primaryKey}'. ` +
            `Please ensure the entity has a '${primaryKey}' property.`
          )
        }
        
        const result = await this.db
          .updateTable(table.name as any)
          .set(entity as any)
          .where(primaryKey as any, '=', id)
          .returningAll()
          .executeTakeFirst()
        
        if (!result) {
          throw new Error(
            `Failed to update entity with ${primaryKey}=${id} in table ${table.name}. ` +
            `Entity may not exist.`
          )
        }
        
        return result as T
      },

      delete: async (id: string | number) => {
        const result = await this.db
          .deleteFrom(table.name as any)
          .where(primaryKey as any, '=', id)
          .execute()
        
        return result.length > 0 && Number(result[0].numDeletedRows) > 0
      },

      // Utility methods
      count: async () => {
        const result = await this.db
          .selectFrom(table.name as any)
          .select((eb: any) => eb.fn.countAll().as('count'))
          .executeTakeFirst()
        
        return Number((result as any)?.count || 0)
      },

      exists: async (id: string | number) => {
        const result = await this.db
          .selectFrom(table.name as any)
          .select(primaryKey as any)
          .where(primaryKey as any, '=', id)
          .executeTakeFirst()
        
        return result !== undefined
      },

      // Pagination
      paginate: async (options: {
        page: number
        limit: number
        where?: Partial<T>
        orderBy?: { column: keyof T; direction: 'asc' | 'desc' }
      }) => {
        let query = this.db.selectFrom(table.name as any).selectAll()
        
        // Apply where conditions
        if (options.where) {
          for (const [key, value] of Object.entries(options.where)) {
            if (value !== undefined) {
              query = query.where(key as any, '=', value)
            }
          }
        }
        
        // Count total with same where conditions
        let countQuery = this.db
          .selectFrom(table.name as any)
          .select((eb: any) => eb.fn.countAll().as('count'))
        
        if (options.where) {
          for (const [key, value] of Object.entries(options.where)) {
            if (value !== undefined) {
              countQuery = countQuery.where(key as any, '=', value)
            }
          }
        }
        
        const countResult = await countQuery.executeTakeFirst()
        const total = Number((countResult as any)?.count || 0)
        
        // Apply order by
        if (options.orderBy) {
          query = query.orderBy(
            options.orderBy.column as string, 
            options.orderBy.direction
          )
        }
        
        // Apply pagination
        const offset = (options.page - 1) * options.limit
        query = query.limit(options.limit).offset(offset)
        
        const data = await query.execute()
        
        const totalPages = Math.ceil(total / options.limit)
        
        return {
          data: data as T[],
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            totalPages,
            hasNext: options.page < totalPages,
            hasPrev: options.page > 1
          }
        }
      },

      // Relationship methods
      findWithRelations: async (id: string | number, relations: string[]) => {
        // Basic implementation - fetches entity without loading relations
        // Full relationship loading would require additional implementation
        const result = await this.db
          .selectFrom(table.name as any)
          .selectAll()
          .where(primaryKey as any, '=', id)
          .executeTakeFirst()
        
        return (result as T | undefined) ?? null
      },

      loadRelationships: async (entities: T[], relations: string[]) => {
        // Stub implementation for relationship loading
        // Full implementation would load related entities based on relationship definitions
        // For now, this is a no-op to satisfy the interface
      },

      withCount: async (id: string | number, relationshipNames: string[]) => {
        // Fetch the base entity
        const entity = await this.db
          .selectFrom(table.name as any)
          .selectAll()
          .where(primaryKey as any, '=', id)
          .executeTakeFirst()
        
        if (!entity) {
          throw new Error(
            `Entity with ${primaryKey}=${id} not found in table ${table.name}`
          )
        }
        
        // Filter relationships to only those from this table
        const tableRelationships = relationships.filter(r => r.fromTable === table.name)
        
        // Create counts object for each relationship
        const counts: Record<string, number> = {}
        
        for (const relationshipName of relationshipNames) {
          // Find the relationship definition for this table
          const relationship = tableRelationships.find(
            r => r.name === relationshipName
          )
          
          if (relationship) {
            // Count related entities based on relationship type
            // For one-to-many: count records in toTable where toColumn matches our fromColumn value
            // Example: For user.posts, count posts where posts.user_id = user.id
            const entityKeyValue = (entity as any)[relationship.fromColumn]
            
            const relatedCount = await this.db
              .selectFrom(relationship.toTable as any)
              .select((eb: any) => eb.fn.countAll().as('count'))
              .where(relationship.toColumn as any, '=', entityKeyValue)
              .executeTakeFirst()
            
            // Use camelCase format for count property (e.g., "posts" -> "postsCount")
            counts[`${relationshipName}Count`] = Number((relatedCount as any)?.count || 0)
          } else {
            // If relationship not found, default to 0
            counts[`${relationshipName}Count`] = 0
          }
        }
        
        return { ...entity, ...counts } as T & Record<string, number>
      }
    } as Repository<T>
  }
}

