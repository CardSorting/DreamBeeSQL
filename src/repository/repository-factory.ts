import type { Kysely } from '../kysely.js'
import type { Repository, TableInfo, RelationshipInfo } from '../types/index.js'
import { RelationshipNotFoundError, ColumnNotFoundError } from '../errors/NoormError.js'

/**
 * Simple repository factory for creating table repositories
 */
export class RepositoryFactory {
  constructor(
    private db: Kysely<any>,
    private performanceConfig?: any
  ) {}

  /**
   * Transform boolean columns from SQLite integers (0/1) to JavaScript booleans
   */
  private transformBooleans<T>(data: T | T[], table: TableInfo): T | T[] {
    // Find all boolean columns
    const booleanColumns = table.columns
      .filter(col => col.type === 'boolean')
      .map(col => col.name)
    
    if (booleanColumns.length === 0) {
      return data
    }
    
    const transformRecord = (record: any): any => {
      if (!record || typeof record !== 'object') {
        return record
      }
      
      const transformed = { ...record }
      for (const col of booleanColumns) {
        if (col in transformed) {
          // Convert 0/1 to false/true
          transformed[col] = Boolean(transformed[col])
        }
      }
      return transformed
    }
    
    if (Array.isArray(data)) {
      return data.map(transformRecord) as T[]
    }
    
    return transformRecord(data) as T
  }

  /**
   * Create a repository for the specified table
   */
  createRepository<T>(
    table: TableInfo,
    relationships: RelationshipInfo[]
  ): Repository<T> {
    // Determine the primary key column name
    const primaryKey = table.columns.find(c => c.isPrimaryKey)?.name || 'id'

    const repository = {
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
        
        return (result ? this.transformBooleans(result, table) : null) as T | null
      },

      findAll: async () => {
        const results = await this.db
          .selectFrom(table.name as any)
          .selectAll()
          .execute()
        
        return this.transformBooleans(results, table) as T[]
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
        const transformedData = this.transformBooleans(data, table) as T[]
        
        return {
          data: transformedData,
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
        const rawEntity = await this.db
          .selectFrom(table.name as any)
          .selectAll()
          .where(primaryKey as any, '=', id)
          .executeTakeFirst()
        
        if (!rawEntity) {
          throw new Error(
            `Entity with ${primaryKey}=${id} not found in table ${table.name}`
          )
        }
        
        // Transform booleans in the entity
        const entity = this.transformBooleans(rawEntity, table) as any
        
        // Filter relationships to only those from this table
        const tableRelationships = relationships.filter(r => r.fromTable === table.name)
        const availableRelationshipNames = tableRelationships.map(r => r.name)
        
        // Validate all relationships exist before executing queries
        for (const relationshipName of relationshipNames) {
          const relationship = tableRelationships.find(r => r.name === relationshipName)
          if (!relationship) {
            throw new RelationshipNotFoundError(
              relationshipName,
              table.name,
              availableRelationshipNames
            )
          }
        }
        
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
            
            // Only count if the foreign key value is not NULL
            if (entityKeyValue != null) {
              // Build query to count related records
              let countQuery = this.db
                .selectFrom(relationship.toTable as any)
                .select((eb: any) => eb.fn.countAll().as('count'))
                .where(relationship.toColumn as any, '=', entityKeyValue)
              
              // Find the related table's foreign keys to exclude orphaned records
              // Get all relationships FROM the target table to find its foreign keys
              const targetTableInfo = relationships
                .filter(r => r.fromTable === relationship.toTable)
                .map(r => r.fromColumn)
              
              // Exclude records where any foreign key is NULL (orphaned records)
              for (const fkColumn of targetTableInfo) {
                countQuery = countQuery.where(fkColumn as any, 'is not', null)
              }
              
              const relatedCount = await countQuery.executeTakeFirst()
              
              // Use camelCase format for count property (e.g., "posts" -> "postsCount")
              counts[`${relationshipName}Count`] = Number((relatedCount as any)?.count || 0)
            } else {
              // If the foreign key is NULL, count is 0
              counts[`${relationshipName}Count`] = 0
            }
          }
        }
        
        return { ...entity, ...counts } as T & Record<string, number>
      }
    }
    
    // Wrap repository in Proxy to handle dynamic method calls like findByXxx
    return this.wrapWithDynamicMethods(repository as Repository<T>, table)
  }
  
  /**
   * Wrap repository with Proxy to handle dynamic method calls
   */
  private wrapWithDynamicMethods<T>(
    repository: Repository<T>,
    table: TableInfo
  ): Repository<T> {
    const availableColumns = table.columns.map(c => c.name)
    const db = this.db
    const transformBooleans = this.transformBooleans.bind(this)
    
    return new Proxy(repository, {
      get(target, prop, receiver) {
        // Check if property exists on target
        if (prop in target) {
          return Reflect.get(target, prop, receiver)
        }
        
        // Handle dynamic findByXxx methods
        if (typeof prop === 'string' && prop.startsWith('findBy')) {
          return async (value: any) => {
            // Extract column name from method name
            // findByEmail -> Email -> email
            // findByInvalidColumn -> InvalidColumn -> invalid_column
            const columnNameRaw = prop.substring(6) // Remove 'findBy'
            
            // Convert from PascalCase to snake_case
            // Handle both camelCase and PascalCase
            let columnName = columnNameRaw
              // Insert underscore before uppercase letters that follow lowercase
              .replace(/([a-z])([A-Z])/g, '$1_$2')
              // Insert underscore before uppercase letters that follow numbers
              .replace(/([0-9])([A-Z])/g, '$1_$2')
              // Convert to lowercase
              .toLowerCase()
            
            // Check if column exists (case-insensitive)
            const columnExists = availableColumns.some(
              col => col.toLowerCase() === columnName.toLowerCase()
            )
            
            if (!columnExists) {
              throw new ColumnNotFoundError(
                columnName,
                table.name,
                availableColumns
              )
            }
            
            // Execute query with the valid column
            const actualColumn = availableColumns.find(
              col => col.toLowerCase() === columnName.toLowerCase()
            )!
            
            const result = await db
              .selectFrom(table.name as any)
              .selectAll()
              .where(actualColumn as any, '=', value)
              .executeTakeFirst()
            
            return transformBooleans(result || null, table)
          }
        }
        
        return undefined
      }
    }) as Repository<T>
  }
}

