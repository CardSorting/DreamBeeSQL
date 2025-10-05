/**
 * Django-style query patterns for NOORMME
 * Bringing Django's powerful query API to Next.js
 */

import { Kysely } from '../kysely.js'
import { sql } from '../raw-builder/sql.js'
import { TableInfo, RelationshipInfo } from '../types/index.js'
import { Logger } from '../logging/logger.js'

export interface DjangoQueryOptions {
  select_related?: string[]
  prefetch_related?: string[]
  distinct?: boolean
  order_by?: Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
  offset?: number
}

export interface DjangoFilter {
  field: string
  operator: 'exact' | 'iexact' | 'contains' | 'icontains' | 'startswith' | 'istartswith' | 
          'endswith' | 'iendswith' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'range' | 'isnull'
  value: any
}

export interface DjangoAggregation {
  field: string
  function: 'count' | 'sum' | 'avg' | 'min' | 'max'
  alias?: string
}

/**
 * Django-style QuerySet implementation
 */
export class DjangoQuerySet<T = any> {
  private filters: DjangoFilter[] = []
  private exclusions: DjangoFilter[] = []
  private options: DjangoQueryOptions = {}
  private aggregations: DjangoAggregation[] = []
  private executed = false
  private result: T[] | null = null

  constructor(
    private db: Kysely<any>,
    private table: TableInfo,
    private relationships: RelationshipInfo[],
    private logger: Logger
  ) {}

  /**
   * Django-style filter method
   * Equivalent to Django's .filter() method
   */
  filter(filters: Record<string, any>): DjangoQuerySet<T>
  filter(field: string, value: any): DjangoQuerySet<T>
  filter(field: string, operator: DjangoFilter['operator'], value: any): DjangoQuerySet<T>
  filter(fieldOrFilters: string | Record<string, any>, operatorOrValue?: any, value?: any): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    
    if (typeof fieldOrFilters === 'string') {
      // Single field filter
      const field = fieldOrFilters
      const operator = typeof operatorOrValue === 'string' ? operatorOrValue as DjangoFilter['operator'] : 'exact'
      const filterValue = value !== undefined ? value : operatorOrValue
      
      newQuerySet.filters.push({
        field,
        operator,
        value: filterValue
      })
    } else {
      // Object of filters
      Object.entries(fieldOrFilters).forEach(([field, value]) => {
        newQuerySet.filters.push({
          field,
          operator: 'exact',
          value
        })
      })
    }
    
    return newQuerySet
  }

  /**
   * Django-style exclude method
   * Equivalent to Django's .exclude() method
   */
  exclude(filters: Record<string, any>): DjangoQuerySet<T>
  exclude(field: string, value: any): DjangoQuerySet<T>
  exclude(field: string, operator: DjangoFilter['operator'], value: any): DjangoQuerySet<T>
  exclude(fieldOrFilters: string | Record<string, any>, operatorOrValue?: any, value?: any): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    
    if (typeof fieldOrFilters === 'string') {
      const field = fieldOrFilters
      const operator = typeof operatorOrValue === 'string' ? operatorOrValue as DjangoFilter['operator'] : 'exact'
      const filterValue = value !== undefined ? value : operatorOrValue
      
      newQuerySet.exclusions.push({
        field,
        operator,
        value: filterValue
      })
    } else {
      Object.entries(fieldOrFilters).forEach(([field, value]) => {
        newQuerySet.exclusions.push({
          field,
          operator: 'exact',
          value
        })
      })
    }
    
    return newQuerySet
  }

  /**
   * Django-style order_by method
   * Equivalent to Django's .order_by() method
   */
  order_by(...fields: string[]): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    newQuerySet.options.order_by = fields.map(field => ({
      field: field.startsWith('-') ? field.slice(1) : field,
      direction: field.startsWith('-') ? 'desc' : 'asc'
    }))
    return newQuerySet
  }

  /**
   * Django-style distinct method
   * Equivalent to Django's .distinct() method
   */
  distinct(): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    newQuerySet.options.distinct = true
    return newQuerySet
  }

  /**
   * Django-style select_related method
   * Equivalent to Django's .select_related() method
   */
  select_related(...fields: string[]): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    newQuerySet.options.select_related = fields
    return newQuerySet
  }

  /**
   * Django-style prefetch_related method
   * Equivalent to Django's .prefetch_related() method
   */
  prefetch_related(...fields: string[]): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    newQuerySet.options.prefetch_related = fields
    return newQuerySet
  }

  /**
   * Django-style limit method
   * Equivalent to Django's slicing [:n]
   */
  limit(count: number): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    newQuerySet.options.limit = count
    return newQuerySet
  }

  /**
   * Django-style offset method
   * Equivalent to Django's slicing [n:]
   */
  offset(count: number): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    newQuerySet.options.offset = count
    return newQuerySet
  }

  /**
   * Django-style count method
   * Equivalent to Django's .count() method
   */
  async count(): Promise<number> {
    const query = this.buildCountQuery()
    const result = await query.executeTakeFirst()
    return Number(result?.count ?? 0)
  }

  /**
   * Django-style exists method
   * Equivalent to Django's .exists() method
   */
  async exists(): Promise<boolean> {
    const query = this.buildBaseQuery().select('1').limit(1)
    const result = await query.executeTakeFirst()
    return !!result
  }

  /**
   * Django-style first method
   * Equivalent to Django's .first() method
   */
  async first(): Promise<T | null> {
    const results = await this.limit(1).all()
    return results.length > 0 ? results[0] : null
  }

  /**
   * Django-style last method
   * Equivalent to Django's .last() method
   */
  async last(): Promise<T | null> {
    // Get primary key for ordering
    const pkColumn = this.table.columns.find(col => col.isPrimaryKey)
    if (!pkColumn) {
      throw new Error(`No primary key found for table ${this.table.name}`)
    }
    
    const results = await this.order_by(`-${pkColumn.name}`).limit(1).all()
    return results.length > 0 ? results[0] : null
  }

  /**
   * Django-style all method
   * Equivalent to Django's .all() method
   */
  async all(): Promise<T[]> {
    if (this.executed && this.result) {
      return this.result
    }

    const query = this.buildSelectQuery()
    let results = await query.execute() as T[]

    // Apply select_related (joins)
    if (this.options.select_related && this.options.select_related.length > 0) {
      results = await this.applySelectRelated(results, this.options.select_related)
    }

    // Apply prefetch_related (separate queries)
    if (this.options.prefetch_related && this.options.prefetch_related.length > 0) {
      results = await this.applyPrefetchRelated(results, this.options.prefetch_related)
    }

    this.result = results
    this.executed = true
    return results
  }

  /**
   * Django-style get method
   * Equivalent to Django's .get() method
   */
  async get(filters?: Record<string, any>): Promise<T> {
    let querySet = this
    
    if (filters) {
      querySet = this.filter(filters)
    }

    const results = await querySet.all()
    
    if (results.length === 0) {
      throw new Error(`No ${this.table.name} found matching the given query`)
    }
    
    if (results.length > 1) {
      throw new Error(`Multiple ${this.table.name} objects found matching the given query`)
    }
    
    return results[0]
  }

  /**
   * Django-style aggregate method
   * Equivalent to Django's .aggregate() method
   */
  async aggregate(aggregations: Record<string, DjangoAggregation>): Promise<Record<string, any>> {
    const result = await this.buildAggregateQuery(aggregations)
    return result || {}
  }

  /**
   * Django-style values method
   * Equivalent to Django's .values() method
   */
  values(...fields: string[]): DjangoQuerySet<T> {
    const newQuerySet = this.clone()
    // This would modify the select clause to only include specified fields
    // Implementation depends on how we want to handle the return type
    return newQuerySet as this
  }

  /**
   * Django-style values_list method
   * Equivalent to Django's .values_list() method
   */
  async values_list(field: string, flat?: boolean): Promise<any[]> {
    // Implementation for getting specific field values
    return this.buildValuesListQuery(field, flat)
  }

  /**
   * Django-style update method
   * Equivalent to Django's .update() method
   */
  async update(updates: Partial<T>): Promise<number> {
    const query = this.buildUpdateQuery(updates)
    const result = await query.execute()
    return Array.isArray(result) ? result.length : 0
  }

  /**
   * Django-style delete method
   * Equivalent to Django's .delete() method
   */
  async delete(): Promise<number> {
    const query = this.buildDeleteQuery()
    const result = await query.execute()
    return Array.isArray(result) ? result.length : 0
  }

  /**
   * Django-style annotate method
   * Equivalent to Django's .annotate() method
   */
  annotate(annotations: Record<string, any>): DjangoQuerySet<T> {
    // This would add computed fields to the query
    // Implementation depends on the specific annotation types
    return this.clone()
  }

  // Private helper methods

  private clone(): DjangoQuerySet<T> {
    const newQuerySet = new DjangoQuerySet(this.db, this.table, this.relationships, this.logger)
    newQuerySet.filters = [...this.filters]
    newQuerySet.exclusions = [...this.exclusions]
    newQuerySet.options = { ...this.options }
    newQuerySet.aggregations = [...this.aggregations]
    return newQuerySet
  }

  private buildBaseQuery() {
    let query = this.db.selectFrom(this.table.name)

    // Apply filters
    this.filters.forEach(filter => {
      query = this.applyFilter(query, filter)
    })

    // Apply exclusions
    this.exclusions.forEach(filter => {
      query = this.applyExclusion(query, filter)
    })

    return query
  }

  private buildSelectQuery() {
    let query = this.buildBaseQuery().selectAll()

    // Apply ordering
    if (this.options.order_by) {
      this.options.order_by.forEach(order => {
        query = query.orderBy(order.field, order.direction)
      })
    }

    // Apply distinct
    if (this.options.distinct) {
      query = query.distinct()
    }

    // Apply limit and offset
    if (this.options.limit) {
      query = query.limit(this.options.limit)
    }

    if (this.options.offset) {
      query = query.offset(this.options.offset)
    }

    return query
  }

  private buildCountQuery() {
    return this.buildBaseQuery().select(({ fn }) => [fn.count<number>('*').as('count')])
  }

  private buildUpdateQuery(updates: Partial<T>) {
    let query = this.db.updateTable(this.table.name)
    
    Object.entries(updates).forEach(([key, value]) => {
      query = query.set(key, value)
    })
    
    // Apply filters to update query
    this.filters.forEach(filter => {
      query = this.applyFilter(query, filter)
    })
    
    return query
  }

  private buildDeleteQuery() {
    let query = this.db.deleteFrom(this.table.name)
    
    // Apply filters to delete query
    this.filters.forEach(filter => {
      query = this.applyFilter(query, filter)
    })
    
    return query
  }

  private async buildAggregateQuery(aggregations: Record<string, DjangoAggregation>) {
    let query = this.buildBaseQuery()
    
    const selectFields: any[] = []
    Object.entries(aggregations).forEach(([alias, agg]) => {
      const field = agg.field === '*' ? '*' : agg.field
      
      switch (agg.function) {
        case 'count':
          selectFields.push(sql<number>`count(${sql.id(field)})`.as(alias))
          break
        case 'sum':
          selectFields.push(sql<number>`sum(${sql.id(field)})`.as(alias))
          break
        case 'avg':
          selectFields.push(sql<number>`avg(${sql.id(field)})`.as(alias))
          break
        case 'min':
          selectFields.push(sql<number>`min(${sql.id(field)})`.as(alias))
          break
        case 'max':
          selectFields.push(sql<number>`max(${sql.id(field)})`.as(alias))
          break
        default:
          throw new Error(`Unsupported aggregation function: ${agg.function}`)
      }
    })
    
    return query.select(selectFields).executeTakeFirst()
  }

  private async buildValuesListQuery(field: string, flat?: boolean): Promise<any[]> {
    let query = this.buildBaseQuery().select(field as any)
    
    if (this.options.order_by) {
      this.options.order_by.forEach(order => {
        query = query.orderBy(order.field, order.direction)
      })
    }
    
    return query.execute().then(results => {
      if (flat) {
        return results.map((row: any) => row[field])
      }
      return results.map((row: any) => [row[field]])
    })
  }

  private applyFilter(query: any, filter: DjangoFilter) {
    const { field, operator, value } = filter
    
    switch (operator) {
      case 'exact':
        return query.where(field, '=', value)
      case 'iexact':
        return query.where(sql`LOWER(${sql.id(field)})`, '=', value.toLowerCase())
      case 'contains':
        return query.where(field, 'like', `%${value}%`)
      case 'icontains':
        return query.where(sql`LOWER(${sql.id(field)})`, 'like', `%${value.toLowerCase()}%`)
      case 'startswith':
        return query.where(field, 'like', `${value}%`)
      case 'istartswith':
        return query.where(sql`LOWER(${sql.id(field)})`, 'like', `${value.toLowerCase()}%`)
      case 'endswith':
        return query.where(field, 'like', `%${value}`)
      case 'iendswith':
        return query.where(sql`LOWER(${sql.id(field)})`, 'like', `%${value.toLowerCase()}`)
      case 'in':
        return query.where(field, 'in', Array.isArray(value) ? value : [value])
      case 'gt':
        return query.where(field, '>', value)
      case 'gte':
        return query.where(field, '>=', value)
      case 'lt':
        return query.where(field, '<', value)
      case 'lte':
        return query.where(field, '<=', value)
      case 'range':
        const [start, end] = Array.isArray(value) ? value : [value, value]
        return query.where(field, 'between', [start, end])
      case 'isnull':
        return value ? query.where(field, 'is', null) : query.where(field, 'is not', null)
      default:
        throw new Error(`Unsupported filter operator: ${operator}`)
    }
  }

  private applyExclusion(query: any, filter: DjangoFilter) {
    // Same as applyFilter but with NOT logic
    return query.where((eb: any) => eb.not(this.applyFilter(eb, filter)))
  }

  private async applySelectRelated(results: T[], fields: string[]): Promise<T[]> {
    // Implementation for select_related (JOIN queries)
    // This would perform JOINs to fetch related objects in a single query
    return results // Placeholder
  }

  private async applyPrefetchRelated(results: T[], fields: string[]): Promise<T[]> {
    // Implementation for prefetch_related (separate queries)
    // This would perform separate queries to fetch related objects
    return results // Placeholder
  }
}

/**
 * Django-style manager for repositories
 */
export class DjangoManager<T = any> {
  constructor(
    private db: Kysely<any>,
    private table: TableInfo,
    private relationships: RelationshipInfo[],
    private logger: Logger
  ) {}

  /**
   * Get all objects
   */
  all(): DjangoQuerySet<T> {
    return new DjangoQuerySet(this.db, this.table, this.relationships, this.logger)
  }

  /**
   * Filter objects
   */
  filter(filters: Record<string, any>): DjangoQuerySet<T> {
    return this.all().filter(filters)
  }

  /**
   * Get single object
   */
  async get(filters: Record<string, any>): Promise<T> {
    return this.all().get(filters)
  }

  /**
   * Create new object
   */
  async create(data: Partial<T>): Promise<T> {
    const result = await this.db
      .insertInto(this.table.name)
      .values(data as any)
      .returningAll()
      .executeTakeFirst()
    
    return result as T
  }

  /**
   * Get or create object
   */
  async get_or_create(defaults: Partial<T>, filters: Record<string, any>): Promise<[T, boolean]> {
    try {
      const obj = await this.get(filters)
      return [obj, false]
    } catch (error) {
      const data = { ...filters, ...defaults }
      const obj = await this.create(data)
      return [obj, true]
    }
  }

  /**
   * Update or create object
   */
  async update_or_create(defaults: Partial<T>, filters: Record<string, any>): Promise<[T, boolean]> {
    try {
      const obj = await this.get(filters)
      const updated = await this.db
        .updateTable(this.table.name)
        .set(defaults as any)
        .where(this.buildWhereConditions(filters))
        .returningAll()
        .executeTakeFirst()
      
      return [updated as T, false]
    } catch (error) {
      const data = { ...filters, ...defaults }
      const obj = await this.create(data)
      return [obj, true]
    }
  }

  /**
   * Bulk create objects
   */
  async bulk_create(objects: Partial<T>[]): Promise<T[]> {
    const results = await this.db
      .insertInto(this.table.name)
      .values(objects as any)
      .returningAll()
      .execute()
    
    return results as T[]
  }

  /**
   * Count objects
   */
  async count(): Promise<number> {
    return this.all().count()
  }

  /**
   * Check if objects exist
   */
  async exists(): Promise<boolean> {
    return this.all().exists()
  }

  /**
   * Get first object
   */
  async first(): Promise<T | null> {
    return this.all().first()
  }

  /**
   * Get last object
   */
  async last(): Promise<T | null> {
    return this.all().last()
  }

  private buildWhereConditions(filters: Record<string, any>) {
    return (eb: any) => {
      const conditions = Object.entries(filters).map(([key, value]) => 
        eb(key, '=', value)
      )
      return eb.and(conditions)
    }
  }
}