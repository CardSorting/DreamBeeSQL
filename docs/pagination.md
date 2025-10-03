# Pagination in NOORMME

NOORMME provides built-in pagination support with efficient counting, filtering, and sorting capabilities. This guide covers all pagination features and best practices.

## Basic Pagination

Every repository automatically includes a `paginate` method:

```typescript
const result = await userRepo.paginate({
  page: 1,
  limit: 20
})

console.log(result.data)        // Array of users (max 20)
console.log(result.pagination)  // Pagination metadata
```

### Pagination Result Structure

```typescript
interface PaginationResult<T> {
  data: T[]                    // The actual data
  pagination: {
    page: number              // Current page (1-based)
    limit: number             // Items per page
    total: number             // Total items in dataset
    totalPages: number        // Total number of pages
    hasNext: boolean          // Whether there's a next page
    hasPrev: boolean          // Whether there's a previous page
  }
}
```

## Pagination Options

### Basic Options

```typescript
interface PaginationOptions<T> {
  page: number                 // Current page (1-based)
  limit: number               // Items per page
  where?: Partial<T>          // Filter conditions
  orderBy?: {                 // Sorting
    column: keyof T
    direction: 'asc' | 'desc'
  }
}
```

### Examples

```typescript
// Simple pagination
const page1 = await userRepo.paginate({ page: 1, limit: 10 })

// With filtering
const activeUsers = await userRepo.paginate({
  page: 1,
  limit: 10,
  where: { active: true }
})

// With sorting
const sortedUsers = await userRepo.paginate({
  page: 1,
  limit: 10,
  orderBy: { column: 'created_at', direction: 'desc' }
})

// Combined filtering and sorting
const recentActiveUsers = await userRepo.paginate({
  page: 2,
  limit: 25,
  where: { active: true },
  orderBy: { column: 'created_at', direction: 'desc' }
})
```

## Advanced Filtering

### Multiple Conditions

```typescript
// All conditions must match (AND logic)
const result = await userRepo.paginate({
  page: 1,
  limit: 20,
  where: {
    active: true,
    age: 25,
    role: 'admin'
  }
})
```

### Type-Safe Filtering

With TypeScript, you get compile-time checking for column names and types:

```typescript
import type { UsersTable } from './types/database'

const userRepo = db.getRepository<UsersTable>('users')

const result = await userRepo.paginate({
  page: 1,
  limit: 10,
  where: {
    active: true,           // ✅ Valid boolean field
    name: 'John',          // ✅ Valid string field
    invalidField: 'test'   // ❌ TypeScript error
  }
})
```

## Sorting and Ordering

### Single Column Sorting

```typescript
// Sort by creation date (newest first)
const newest = await userRepo.paginate({
  page: 1,
  limit: 10,
  orderBy: { column: 'created_at', direction: 'desc' }
})

// Sort by name (alphabetical)
const alphabetical = await userRepo.paginate({
  page: 1,
  limit: 10,
  orderBy: { column: 'name', direction: 'asc' }
})
```

### Multiple Column Sorting

For complex sorting, use the underlying Kysely query:

```typescript
const customSort = await db.getKysely()
  .selectFrom('users')
  .selectAll()
  .where('active', '=', true)
  .orderBy('role', 'asc')      // Primary sort
  .orderBy('created_at', 'desc') // Secondary sort
  .limit(20)
  .offset((page - 1) * 20)
  .execute()
```

## Performance Optimization

### Efficient Counting

NOORMME uses efficient counting queries that don't load all data:

```typescript
// This generates: SELECT COUNT(*) FROM users WHERE active = true
// Not: SELECT * FROM users WHERE active = true (then count in memory)
const result = await userRepo.paginate({
  page: 1,
  limit: 10,
  where: { active: true }
})
```

### Index Optimization

Ensure your database has proper indexes for pagination performance:

```sql
-- For filtering
CREATE INDEX idx_users_active ON users(active);

-- For sorting
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- For combined filtering and sorting
CREATE INDEX idx_users_active_created_at ON users(active, created_at DESC);
```

### Large Dataset Considerations

For very large datasets, consider these strategies:

```typescript
// 1. Reasonable page limits
const result = await userRepo.paginate({
  page: 1,
  limit: Math.min(requestedLimit, 100) // Cap at 100
})

// 2. Cursor-based pagination for real-time data
const cursorPagination = await db.getKysely()
  .selectFrom('users')
  .selectAll()
  .where('created_at', '<', lastSeenTimestamp)
  .orderBy('created_at', 'desc')
  .limit(20)
  .execute()
```

## Pagination Patterns

### API Endpoint Pattern

```typescript
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const sort = req.query.sort as string || 'created_at'
  const order = req.query.order as 'asc' | 'desc' || 'desc'

  try {
    const result = await userRepo.paginate({
      page,
      limit,
      where: req.query.active ? { active: req.query.active === 'true' } : {},
      orderBy: { column: sort, direction: order }
    })

    res.json({
      users: result.data,
      pagination: result.pagination,
      links: {
        first: `/api/users?page=1&limit=${limit}`,
        prev: result.pagination.hasPrev ? `/api/users?page=${page - 1}&limit=${limit}` : null,
        next: result.pagination.hasNext ? `/api/users?page=${page + 1}&limit=${limit}` : null,
        last: `/api/users?page=${result.pagination.totalPages}&limit=${limit}`
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})
```

### React Component Pattern

```tsx
import { useState, useEffect } from 'react'

interface UsersTableProps {
  userRepo: any
}

export function UsersTable({ userRepo }: UsersTableProps) {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const loadUsers = async (pageNum: number) => {
    setLoading(true)
    try {
      const result = await userRepo.paginate({
        page: pageNum,
        limit: 20,
        orderBy: { column: 'created_at', direction: 'desc' }
      })
      setUsers(result.data)
      setPagination(result.pagination)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(page)
  }, [page])

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table>
            {/* Render users */}
          </table>

          <div className="pagination">
            <button
              disabled={!pagination?.hasPrev}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>

            <span>
              Page {pagination?.page} of {pagination?.totalPages}
            </span>

            <button
              disabled={!pagination?.hasNext}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

## Error Handling

### Common Pagination Errors

```typescript
try {
  const result = await userRepo.paginate({
    page: -1,  // Invalid page number
    limit: 0   // Invalid limit
  })
} catch (error) {
  if (error instanceof NoormError) {
    console.error('Pagination error:', error.message)
  }
}
```

### Validation

```typescript
function validatePaginationParams(page: number, limit: number) {
  if (page < 1) {
    throw new Error('Page must be >= 1')
  }
  if (limit < 1 || limit > 1000) {
    throw new Error('Limit must be between 1 and 1000')
  }
}
```

## Testing Pagination

### Unit Tests

```typescript
describe('Pagination', () => {
  it('should return correct pagination metadata', async () => {
    // Create test data
    await factory.createUsers(25)

    const result = await userRepo.paginate({ page: 1, limit: 10 })

    expect(result.pagination.page).toBe(1)
    expect(result.pagination.limit).toBe(10)
    expect(result.pagination.total).toBe(25)
    expect(result.pagination.totalPages).toBe(3)
    expect(result.pagination.hasNext).toBe(true)
    expect(result.pagination.hasPrev).toBe(false)
    expect(result.data.length).toBe(10)
  })

  it('should handle empty results', async () => {
    const result = await userRepo.paginate({ page: 1, limit: 10 })

    expect(result.pagination.total).toBe(0)
    expect(result.pagination.totalPages).toBe(0)
    expect(result.data.length).toBe(0)
  })
})
```

### Integration Tests

```typescript
it('should maintain consistent pagination across pages', async () => {
  await factory.createUsers(50)

  const page1 = await userRepo.paginate({ page: 1, limit: 10 })
  const page2 = await userRepo.paginate({ page: 2, limit: 10 })

  // No overlap between pages
  const page1Ids = page1.data.map(u => u.id)
  const page2Ids = page2.data.map(u => u.id)
  const overlap = page1Ids.filter(id => page2Ids.includes(id))

  expect(overlap.length).toBe(0)
})
```

## Best Practices

### 1. Set Reasonable Defaults

```typescript
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function normalizePaginationParams(page?: number, limit?: number) {
  return {
    page: Math.max(1, page || 1),
    limit: Math.min(limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  }
}
```

### 2. Cache Total Counts

For expensive count queries, consider caching:

```typescript
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedCount(cacheKey: string, countFn: () => Promise<number>) {
  let count = cache.get(cacheKey)
  if (!count) {
    count = await countFn()
    cache.set(cacheKey, count, CACHE_TTL)
  }
  return count
}
```

### 3. Provide Search Integration

```typescript
async function searchUsers(query: string, page: number = 1) {
  return await userRepo.paginate({
    page,
    limit: 20,
    where: {
      name: query // This would need proper search implementation
    },
    orderBy: { column: 'name', direction: 'asc' }
  })
}
```

### 4. Monitor Performance

```typescript
const { result, time } = await measureTime(() =>
  userRepo.paginate({ page: 1, limit: 50 })
)

if (time > 1000) {
  console.warn(`Slow pagination query: ${time}ms`)
}
```

This comprehensive pagination system provides efficient, type-safe, and user-friendly data access patterns that scale with your application's growth.