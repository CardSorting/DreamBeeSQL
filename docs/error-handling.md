# Error Handling in NOORMME

NOORMME provides comprehensive error handling with context-aware messages and helpful suggestions. This guide covers all error types and how to handle them effectively.

## Error Types

### NoormError (Base Class)

All NOORMME errors inherit from the `NoormError` base class, which provides:

- **Context-aware messages** with table, operation, and suggestion information
- **Formatted output** for better debugging
- **JSON serialization** for logging and monitoring

```typescript
import { NoormError } from 'noorm'

try {
  await userRepo.findById(123)
} catch (error) {
  if (error instanceof NoormError) {
    console.log(error.getFormattedMessage())
    console.log(JSON.stringify(error.toJSON(), null, 2))
  }
}
```

### Specific Error Types

#### ColumnNotFoundError

Thrown when referencing non-existent columns with smart suggestions.

```typescript
try {
  await userRepo.findByEmai('test@example.com') // Typo: should be 'email'
} catch (error) {
  // Error: Column 'emai' not found on table 'users'
  // Suggestion: Did you mean 'email'?
  // Available options: id, name, email, age, active
}
```

#### TableNotFoundError

Thrown when referencing non-existent tables.

```typescript
try {
  const repo = db.getRepository('user') // Should be 'users'
} catch (error) {
  // Error: Table 'user' not found in schema
  // Available tables: users, posts, comments
}
```

#### RelationshipNotFoundError

Thrown when referencing invalid relationships.

```typescript
try {
  await userRepo.withCount(1, ['invalid_relationship'])
} catch (error) {
  // Error: Relationship 'invalid_relationship' not found on table 'users'
  // Available relationships: posts, comments
}
```

#### ValidationError

Thrown for data validation issues.

```typescript
try {
  await userRepo.create({ name: null }) // name is required
} catch (error) {
  // Error: Validation failed for field 'name'
  // Suggestion: Check the value for field 'name'
}
```

#### ConnectionError

Thrown for database connection issues.

```typescript
try {
  await db.initialize()
} catch (error) {
  // Error: Database connection failed: ECONNREFUSED
  // Suggestion: Check your database connection string and ensure the database is running
}
```

## Error Context

Every NOORMME error includes rich context information:

```typescript
interface ErrorContext {
  table?: string;           // Affected table
  operation?: string;       // Operation being performed
  suggestion?: string;      // Helpful suggestion
  availableOptions?: string[]; // Available alternatives
  originalError?: Error;    // Original underlying error
}
```

## Error Handling Patterns

### Basic Error Handling

```typescript
import { NoormError, ColumnNotFoundError } from 'noorm'

async function findUser(email: string) {
  try {
    return await userRepo.findByEmail(email)
  } catch (error) {
    if (error instanceof ColumnNotFoundError) {
      console.error('Invalid column name:', error.message)
      console.log('Available columns:', error.context.availableOptions)
    } else if (error instanceof NoormError) {
      console.error('NOORMME Error:', error.getFormattedMessage())
    } else {
      console.error('Unexpected error:', error)
    }
    throw error
  }
}
```

### Error Recovery

```typescript
async function findUserWithFallback(identifier: string) {
  try {
    // Try by email first
    return await userRepo.findByEmail(identifier)
  } catch (error) {
    if (error instanceof ColumnNotFoundError) {
      // Fallback to ID search
      return await userRepo.findById(parseInt(identifier))
    }
    throw error
  }
}
```

### Logging and Monitoring

```typescript
import { NoormError } from 'noorm'

function logError(error: unknown) {
  if (error instanceof NoormError) {
    const errorData = error.toJSON()

    // Send to logging service
    logger.error('NOORMME Error', {
      message: errorData.message,
      context: errorData.context,
      stack: errorData.stack,
      timestamp: new Date().toISOString()
    })

    // Send to monitoring service
    monitoring.captureError(error, {
      tags: {
        table: errorData.context.table,
        operation: errorData.context.operation
      }
    })
  }
}
```

## Error Prevention

### Type Safety

Use TypeScript types to prevent many errors at compile time:

```typescript
import type { UsersTable, UsersRepository } from './types/database'

// Type-safe repository usage
const userRepo: UsersRepository = db.getRepository('users')

// Compile-time error for invalid column names
const users = await userRepo.paginate({
  where: { invalid_column: true } // TypeScript error
})
```

### Schema Validation

Validate your schema before operations:

```typescript
async function validateSchema() {
  const schema = await db.getSchemaInfo()

  const requiredTables = ['users', 'posts', 'comments']
  const missingTables = requiredTables.filter(
    table => !schema.tables.find(t => t.name === table)
  )

  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(', ')}`)
  }
}
```

### Connection Testing

Test database connections before critical operations:

```typescript
async function ensureConnection() {
  try {
    await db.getKysely().selectFrom('information_schema.tables').selectAll().limit(1).execute()
  } catch (error) {
    throw new ConnectionError('Database not accessible', error)
  }
}
```

## Error Handling in Different Environments

### Development

In development, show detailed error information:

```typescript
if (process.env.NODE_ENV === 'development') {
  // Enable detailed error logging
  db.enablePerformanceMonitoring({
    enabled: true,
    slowQueryThreshold: 500 // 500ms
  })

  // Log all errors with full context
  process.on('unhandledRejection', (error) => {
    if (error instanceof NoormError) {
      console.error(error.getFormattedMessage())
    }
  })
}
```

### Production

In production, log errors securely without exposing sensitive data:

```typescript
if (process.env.NODE_ENV === 'production') {
  // Sanitize error messages
  function sanitizeError(error: NoormError): object {
    return {
      type: error.constructor.name,
      table: error.context.table,
      operation: error.context.operation,
      timestamp: new Date().toISOString()
      // Don't include query or sensitive data
    }
  }
}
```

## Testing Error Scenarios

### Unit Tests

```typescript
import { TestUtils } from 'noorm/testing'

describe('Error Handling', () => {
  it('should handle column not found errors', async () => {
    const error = await TestUtils.expectError(
      userRepo.findByInvalidColumn('test'),
      'Column'
    )

    expect(error).toBeInstanceOf(ColumnNotFoundError)
  })
})
```

### Integration Tests

```typescript
it('should recover from connection errors', async () => {
  // Simulate connection loss
  await db.close()

  const error = await TestUtils.expectError(
    userRepo.findAll(),
    'connection'
  )

  expect(error).toBeInstanceOf(ConnectionError)

  // Reconnect and verify recovery
  await db.initialize()
  const users = await userRepo.findAll()
  expect(users).toBeDefined()
})
```

## Best Practices

### 1. Always Use Type Guards

```typescript
function isNoormError(error: unknown): error is NoormError {
  return error instanceof NoormError
}

if (isNoormError(error)) {
  // Handle NOORMME-specific error
}
```

### 2. Provide User-Friendly Messages

```typescript
function getUserFriendlyMessage(error: NoormError): string {
  switch (error.constructor.name) {
    case 'ColumnNotFoundError':
      return 'Invalid field name. Please check your input.'
    case 'ConnectionError':
      return 'Database temporarily unavailable. Please try again.'
    default:
      return 'An unexpected error occurred. Please contact support.'
  }
}
```

### 3. Implement Circuit Breakers

```typescript
class DatabaseCircuitBreaker {
  private failures = 0
  private readonly threshold = 5
  private isOpen = false

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open')
    }

    try {
      const result = await operation()
      this.failures = 0 // Reset on success
      return result
    } catch (error) {
      this.failures++
      if (this.failures >= this.threshold) {
        this.isOpen = true
      }
      throw error
    }
  }
}
```

### 4. Graceful Degradation

```typescript
async function getUsersWithFallback() {
  try {
    return await userRepo.findAll()
  } catch (error) {
    if (error instanceof ConnectionError) {
      // Return cached data or empty array
      return []
    }
    throw error
  }
}
```

## Error Monitoring and Alerting

### Error Tracking

```typescript
import * as Sentry from '@sentry/node'

// Configure error tracking
if (error instanceof NoormError) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', error.constructor.name)
    scope.setContext('noorm_context', error.context)
    Sentry.captureException(error)
  })
}
```

### Performance Monitoring

```typescript
// Monitor slow queries and errors
db.enablePerformanceMonitoring({
  slowQueryThreshold: 1000,
  nPlusOneDetection: true
})

db.onSchemaChange((changes) => {
  console.warn('Schema changes detected:', changes)
  // Alert development team
})
```

This comprehensive error handling system ensures that NOORMME provides helpful, actionable error messages that guide developers toward solutions rather than just reporting failures.