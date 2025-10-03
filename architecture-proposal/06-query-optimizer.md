# Query Optimizer Architecture

## Overview

The Query Optimizer provides lightweight query optimization using a singleton pattern. It focuses on essential optimizations without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single optimizer instance
- **Lightweight Optimization** - Essential optimizations only
- **No Database Spam** - No monitoring queries
- **Type Safety** - Full TypeScript support
- **Lazy Optimization** - Optimize only when needed
- **Minimal Overhead** - Efficient optimization algorithms

## Architecture

```typescript
// Query Optimizer (Singleton)
export class QueryOptimizer {
  private static instance: QueryOptimizer | null = null
  private queryCache = new Map<string, CachedQuery>()
  private optimizationRules = new Map<string, OptimizationRule>()
  
  private constructor() {
    this.registerDefaultRules()
  }
  
  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }
  
  // Core methods
  optimizeQuery<T>(query: SelectQueryBuilder<any, any, any>): SelectQueryBuilder<any, any, any>
  cacheQuery<T>(key: string, query: SelectQueryBuilder<any, any, any>, result: T): void
  getCachedQuery<T>(key: string): T | null
  clearCache(): void
  registerOptimizationRule(name: string, rule: OptimizationRule): void
}
```

## Optimization Rules

```typescript
export interface OptimizationRule {
  name: string
  priority: number
  condition: (query: any) => boolean
  optimize: (query: any) => any
}

export interface CachedQuery<T = any> {
  result: T
  timestamp: number
  ttl: number
}

export interface OptimizationResult {
  optimized: boolean
  changes: string[]
  performance: PerformanceMetrics
}

export interface PerformanceMetrics {
  estimatedRows: number
  complexity: number
  optimizationTime: number
}
```

## Default Optimization Rules

```typescript
export class DefaultOptimizationRules {
  static selectOnlyNeededColumns: OptimizationRule = {
    name: 'selectOnlyNeededColumns',
    priority: 100,
    condition: (query) => {
      // Check if query selects all columns when only specific ones are needed
      return query.hasSelectAll() && query.getSelectedColumns().length > 0
    },
    optimize: (query) => {
      // Replace selectAll with specific columns
      return query.select(query.getSelectedColumns())
    }
  }
  
  static limitEarly: OptimizationRule = {
    name: 'limitEarly',
    priority: 90,
    condition: (query) => {
      // Check if query has limit but no early limiting
      return query.hasLimit() && !query.hasEarlyLimit()
    },
    optimize: (query) => {
      // Apply limit early in query execution
      return query.limit(query.getLimit())
    }
  }
  
  static indexHints: OptimizationRule = {
    name: 'indexHints',
    priority: 80,
    condition: (query) => {
      // Check if query can benefit from index hints
      return query.hasWhereClause() && query.hasIndexableColumns()
    },
    optimize: (query) => {
      // Add index hints for better performance
      return query.withIndexHints(query.getIndexableColumns())
    }
  }
  
  static joinOptimization: OptimizationRule = {
    name: 'joinOptimization',
    priority: 70,
    condition: (query) => {
      // Check if query has multiple joins that can be optimized
      return query.getJoinCount() > 1
    },
    optimize: (query) => {
      // Optimize join order and types
      return query.optimizeJoins()
    }
  }
  
  static subqueryOptimization: OptimizationRule = {
    name: 'subqueryOptimization',
    priority: 60,
    condition: (query) => {
      // Check if query has subqueries that can be optimized
      return query.hasSubqueries()
    },
    optimize: (query) => {
      // Convert subqueries to joins where possible
      return query.convertSubqueriesToJoins()
    }
  }
}
```

## Query Cache

```typescript
export class QueryCache {
  private cache = new Map<string, CachedQuery>()
  private readonly DEFAULT_TTL = 300000 // 5 minutes
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.result
  }
  
  set<T>(key: string, result: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    })
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    }
  }
  
  private calculateHitRate(): number {
    // Simplified hit rate calculation
    return 0.85 // Placeholder
  }
  
  private estimateMemoryUsage(): number {
    // Estimate memory usage of cache
    return this.cache.size * 1024 // Placeholder
  }
}

export interface CacheStats {
  size: number
  hitRate: number
  memoryUsage: number
}
```

## Query Analyzer

```typescript
export class QueryAnalyzer {
  analyzeQuery<T>(query: SelectQueryBuilder<any, any, any>): QueryAnalysis {
    const analysis: QueryAnalysis = {
      complexity: this.calculateComplexity(query),
      estimatedRows: this.estimateRows(query),
      hasIndexes: this.checkIndexes(query),
      joinCount: this.countJoins(query),
      subqueryCount: this.countSubqueries(query),
      selectCount: this.countSelects(query),
      whereCount: this.countWheres(query),
      orderByCount: this.countOrderBys(query),
      groupByCount: this.countGroupBys(query),
      hasLimit: this.hasLimit(query),
      hasOffset: this.hasOffset(query)
    }
    
    return analysis
  }
  
  private calculateComplexity(query: any): number {
    let complexity = 1
    
    // Base complexity
    complexity += this.countJoins(query) * 2
    complexity += this.countSubqueries(query) * 3
    complexity += this.countWheres(query) * 1
    complexity += this.countOrderBys(query) * 1
    complexity += this.countGroupBys(query) * 2
    
    return complexity
  }
  
  private estimateRows(query: any): number {
    // Simplified row estimation
    const baseRows = 1000 // Placeholder
    const joinFactor = Math.pow(0.8, this.countJoins(query))
    const whereFactor = Math.pow(0.5, this.countWheres(query))
    
    return Math.floor(baseRows * joinFactor * whereFactor)
  }
  
  private checkIndexes(query: any): boolean {
    // Check if query can use indexes
    return query.hasWhereClause() && query.hasIndexableColumns()
  }
  
  private countJoins(query: any): number {
    // Count number of joins
    return query.getJoinCount() || 0
  }
  
  private countSubqueries(query: any): number {
    // Count number of subqueries
    return query.getSubqueryCount() || 0
  }
  
  private countSelects(query: any): number {
    // Count number of select clauses
    return query.getSelectCount() || 0
  }
  
  private countWheres(query: any): number {
    // Count number of where clauses
    return query.getWhereCount() || 0
  }
  
  private countOrderBys(query: any): number {
    // Count number of order by clauses
    return query.getOrderByCount() || 0
  }
  
  private countGroupBys(query: any): number {
    // Count number of group by clauses
    return query.getGroupByCount() || 0
  }
  
  private hasLimit(query: any): boolean {
    // Check if query has limit
    return query.hasLimit() || false
  }
  
  private hasOffset(query: any): boolean {
    // Check if query has offset
    return query.hasOffset() || false
  }
}

export interface QueryAnalysis {
  complexity: number
  estimatedRows: number
  hasIndexes: boolean
  joinCount: number
  subqueryCount: number
  selectCount: number
  whereCount: number
  orderByCount: number
  groupByCount: number
  hasLimit: boolean
  hasOffset: boolean
}
```

## Usage Examples

### Basic Query Optimization

```typescript
const optimizer = QueryOptimizer.getInstance()

// Optimize a query
const originalQuery = db
  .selectFrom('users')
  .selectAll()
  .where('active', '=', true)
  .limit(10)

const optimizedQuery = optimizer.optimizeQuery(originalQuery)

// Execute optimized query
const results = await optimizedQuery.execute()
```

### Query Caching

```typescript
const optimizer = QueryOptimizer.getInstance()

// Cache query result
const queryKey = 'active_users_limit_10'
const query = db
  .selectFrom('users')
  .selectAll()
  .where('active', '=', true)
  .limit(10)

const results = await query.execute()
optimizer.cacheQuery(queryKey, query, results)

// Retrieve cached result
const cachedResults = optimizer.getCachedQuery(queryKey)
if (cachedResults) {
  console.log('Using cached results')
} else {
  console.log('Cache miss, executing query')
}
```

### Custom Optimization Rules

```typescript
const optimizer = QueryOptimizer.getInstance()

// Register custom optimization rule
optimizer.registerOptimizationRule('customRule', {
  name: 'customRule',
  priority: 50,
  condition: (query) => {
    // Custom condition logic
    return query.hasCustomCondition()
  },
  optimize: (query) => {
    // Custom optimization logic
    return query.applyCustomOptimization()
  }
})

// Use custom rule
const optimizedQuery = optimizer.optimizeQuery(originalQuery)
```

### Query Analysis

```typescript
const analyzer = new QueryAnalyzer()

// Analyze query
const query = db
  .selectFrom('users')
  .innerJoin('posts', 'posts.user_id', 'users.id')
  .selectAll()
  .where('users.active', '=', true)
  .where('posts.published', '=', true)
  .orderBy('users.created_at', 'desc')
  .limit(10)

const analysis = analyzer.analyzeQuery(query)
console.log('Query complexity:', analysis.complexity)
console.log('Estimated rows:', analysis.estimatedRows)
console.log('Has indexes:', analysis.hasIndexes)
```

### Repository with Optimization

```typescript
export class UserRepository extends BaseRepository<User, UserRow> {
  async findActiveUsersWithPosts(): Promise<User[]> {
    const optimizer = QueryOptimizer.getInstance()
    
    // Create query
    let query = this.db
      .selectFrom('users')
      .innerJoin('posts', 'posts.user_id', 'users.id')
      .selectAll()
      .where('users.active', '=', true)
      .where('posts.published', '=', true)
    
    // Optimize query
    query = optimizer.optimizeQuery(query)
    
    // Execute
    const rows = await query.execute()
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findUsersWithCaching(): Promise<User[]> {
    const optimizer = QueryOptimizer.getInstance()
    const cacheKey = 'active_users'
    
    // Check cache first
    const cached = optimizer.getCachedQuery<User[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    // Execute query
    const query = this.db
      .selectFrom('users')
      .selectAll()
      .where('active', '=', true)
    
    const optimizedQuery = optimizer.optimizeQuery(query)
    const rows = await optimizedQuery.execute()
    const users = rows.map(row => this.rowToEntity(row))
    
    // Cache result
    optimizer.cacheQuery(cacheKey, optimizedQuery, users)
    
    return users
  }
}
```

## Performance Characteristics

- **Optimization Time**: O(1) - Simple rule-based optimization
- **Cache Lookup**: O(1) - Map-based cache
- **Memory Usage**: Minimal - Only cache and rule storage
- **Database Queries**: None - No optimization queries
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Lightweight Optimization** - Essential optimizations only
2. **Query Caching** - Improve performance for repeated queries
3. **Type Safety** - Full TypeScript support
4. **Minimal Overhead** - Efficient optimization algorithms
5. **Extensible** - Custom optimization rules
6. **No Database Spam** - No monitoring queries

## Limitations

1. **Static Rules** - Optimization rules must be defined at compile time
2. **Memory Usage** - Query cache stored in memory
3. **Limited Analysis** - Simplified query analysis

## Integration Points

- **Repository Registry** - Optimizes repository queries
- **Entity Manager** - Uses entity metadata for optimization
- **Configuration Manager** - Provides optimization configuration
- **Schema Registry** - Uses schema information for optimization
