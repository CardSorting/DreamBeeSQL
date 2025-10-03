# Error Handling Architecture

## Overview

The Error Handling system provides centralized error management using a singleton pattern. It focuses on essential error handling without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single error handler instance
- **Centralized Error Management** - Single source of truth for errors
- **Type Safety** - Full TypeScript support
- **Minimal Overhead** - Efficient error handling
- **No Database Spam** - No error logging to database
- **Graceful Degradation** - Handle errors without breaking the system

## Architecture

```typescript
// Error Handler (Singleton)
export class ErrorHandler {
  private static instance: ErrorHandler | null = null
  private errorHandlers = new Map<string, ErrorHandlerFunction>()
  private errorLogger: ErrorLogger
  
  private constructor() {
    this.errorLogger = new ErrorLogger()
    this.registerDefaultHandlers()
  }
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }
  
  // Core methods
  handleError(error: Error, context?: ErrorContext): void
  registerHandler(name: string, handler: ErrorHandlerFunction): void
  getHandler(name: string): ErrorHandlerFunction | undefined
  clearHandlers(): void
}
```

## Error Types

```typescript
export class PseudoORMError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'PseudoORMError'
  }
}

export class ValidationError extends PseudoORMError {
  constructor(
    message: string,
    public validationErrors: ValidationErrorDetail[],
    context?: any
  ) {
    super(message, 'VALIDATION_ERROR', context)
    this.name = 'ValidationError'
  }
}

export class EntityError extends PseudoORMError {
  constructor(
    message: string,
    public entityName: string,
    context?: any
  ) {
    super(message, 'ENTITY_ERROR', context)
    this.name = 'EntityError'
  }
}

export class RepositoryError extends PseudoORMError {
  constructor(
    message: string,
    public repositoryName: string,
    context?: any
  ) {
    super(message, 'REPOSITORY_ERROR', context)
    this.name = 'RepositoryError'
  }
}

export class RelationshipError extends PseudoORMError {
  constructor(
    message: string,
    public relationshipName: string,
    context?: any
  ) {
    super(message, 'RELATIONSHIP_ERROR', context)
    this.name = 'RelationshipError'
  }
}

export class SchemaError extends PseudoORMError {
  constructor(
    message: string,
    public schemaName: string,
    context?: any
  ) {
    super(message, 'SCHEMA_ERROR', context)
    this.name = 'SchemaError'
  }
}

export class MigrationError extends PseudoORMError {
  constructor(
    message: string,
    public migrationName: string,
    context?: any
  ) {
    super(message, 'MIGRATION_ERROR', context)
    this.name = 'MigrationError'
  }
}

export interface ValidationErrorDetail {
  property: string
  message: string
  value: any
  rule: string
}

export interface ErrorContext {
  operation: string
  entity?: string
  repository?: string
  relationship?: string
  schema?: string
  migration?: string
  timestamp: Date
  userId?: string
  requestId?: string
}
```

## Error Handlers

```typescript
export type ErrorHandlerFunction = (error: Error, context?: ErrorContext) => void

export class DefaultErrorHandlers {
  static validationErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    if (error instanceof ValidationError) {
      console.error('Validation Error:', {
        message: error.message,
        errors: error.validationErrors,
        context
      })
    }
  }
  
  static entityErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    if (error instanceof EntityError) {
      console.error('Entity Error:', {
        message: error.message,
        entity: error.entityName,
        context
      })
    }
  }
  
  static repositoryErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    if (error instanceof RepositoryError) {
      console.error('Repository Error:', {
        message: error.message,
        repository: error.repositoryName,
        context
      })
    }
  }
  
  static relationshipErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    if (error instanceof RelationshipError) {
      console.error('Relationship Error:', {
        message: error.message,
        relationship: error.relationshipName,
        context
      })
    }
  }
  
  static schemaErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    if (error instanceof SchemaError) {
      console.error('Schema Error:', {
        message: error.message,
        schema: error.schemaName,
        context
      })
    }
  }
  
  static migrationErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    if (error instanceof MigrationError) {
      console.error('Migration Error:', {
        message: error.message,
        migration: error.migrationName,
        context
      })
    }
  }
  
  static genericErrorHandler: ErrorHandlerFunction = (error: Error, context?: ErrorContext) => {
    console.error('Generic Error:', {
      message: error.message,
      stack: error.stack,
      context
    })
  }
}
```

## Error Logger

```typescript
export class ErrorLogger {
  private logLevel: LogLevel
  
  constructor(logLevel: LogLevel = LogLevel.ERROR) {
    this.logLevel = logLevel
  }
  
  logError(error: Error, context?: ErrorContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, 'Error occurred', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      })
    }
  }
  
  logWarning(message: string, context?: ErrorContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context)
    }
  }
  
  logInfo(message: string, context?: ErrorContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context)
    }
  }
  
  logDebug(message: string, context?: ErrorContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context)
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }
  
  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data
    }
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry, null, 2))
        break
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry, null, 2))
        break
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry, null, 2))
        break
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry, null, 2))
        break
    }
  }
  
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}
```

## Error Recovery

```typescript
export class ErrorRecovery {
  private errorHandler: ErrorHandler
  
  constructor(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler
  }
  
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          this.errorHandler.handleError(lastError, {
            operation: 'retry_operation',
            timestamp: new Date()
          })
          throw lastError
        }
        
        // Wait before retry
        await this.delay(delay * attempt)
      }
    }
    
    throw lastError!
  }
  
  async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> {
    try {
      return await primaryOperation()
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        operation: 'fallback_operation',
        timestamp: new Date()
      })
      
      try {
        return await fallbackOperation()
      } catch (fallbackError) {
        this.errorHandler.handleError(fallbackError as Error, {
          operation: 'fallback_operation_failed',
          timestamp: new Date()
        })
        throw fallbackError
      }
    }
  }
  
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = 30000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutError = new Error(`Operation timed out after ${timeout}ms`)
          this.errorHandler.handleError(timeoutError, {
            operation: 'timeout_operation',
            timestamp: new Date()
          })
          reject(timeoutError)
        }, timeout)
      })
    ])
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

## Usage Examples

### Basic Error Handling

```typescript
// Setup error handler
const errorHandler = ErrorHandler.getInstance()

// Register custom handler
errorHandler.registerHandler('customHandler', (error: Error, context?: ErrorContext) => {
  console.log('Custom error handler:', error.message)
})

// Handle error
try {
  // Some operation that might fail
  throw new ValidationError('Validation failed', [])
} catch (error) {
  errorHandler.handleError(error as Error, {
    operation: 'validation',
    timestamp: new Date()
  })
}
```

### Validation Error Handling

```typescript
// Validation error handling
try {
  const validator = new EntityValidator()
  const result = await validator.validate(user)
  
  if (!result.isValid) {
    throw new ValidationError('Validation failed', result.errors)
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation errors:', error.validationErrors)
    
    // Handle validation errors
    error.validationErrors.forEach(err => {
      console.error(`${err.property}: ${err.message}`)
    })
  } else {
    errorHandler.handleError(error, {
      operation: 'validation',
      entity: 'User',
      timestamp: new Date()
    })
  }
}
```

### Repository Error Handling

```typescript
// Repository error handling
export class UserRepository extends BaseRepository<User, UserRow> {
  async save(entity: User): Promise<User> {
    try {
      // Validate entity
      const validator = new EntityValidator()
      const result = await validator.validate(entity)
      
      if (!result.isValid) {
        throw new ValidationError('Entity validation failed', result.errors)
      }
      
      // Save entity
      return await super.save(entity)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      
      throw new RepositoryError(
        `Failed to save user: ${error.message}`,
        'UserRepository',
        { entity: entity.toRow() }
      )
    }
  }
  
  async findById(id: string): Promise<User | null> {
    try {
      return await super.findById(id)
    } catch (error) {
      throw new RepositoryError(
        `Failed to find user by id: ${error.message}`,
        'UserRepository',
        { id }
      )
    }
  }
}
```

### Error Recovery

```typescript
// Error recovery
const errorRecovery = new ErrorRecovery(errorHandler)

// Retry operation
const result = await errorRecovery.withRetry(
  async () => {
    return await userRepo.save(user)
  },
  3, // max retries
  1000 // delay between retries
)

// Fallback operation
const result = await errorRecovery.withFallback(
  async () => {
    // Primary operation
    return await userRepo.findById(id)
  },
  async () => {
    // Fallback operation
    return await userRepo.findByEmail(email)
  }
)

// Timeout operation
const result = await errorRecovery.withTimeout(
  async () => {
    return await userRepo.findAll()
  },
  5000 // 5 second timeout
)
```

### Custom Error Handlers

```typescript
// Custom error handlers
errorHandler.registerHandler('databaseError', (error: Error, context?: ErrorContext) => {
  if (error.message.includes('connection')) {
    console.error('Database connection error:', error.message)
    // Handle database connection errors
  }
})

errorHandler.registerHandler('validationError', (error: Error, context?: ErrorContext) => {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.validationErrors)
    // Handle validation errors
  }
})

errorHandler.registerHandler('entityError', (error: Error, context?: ErrorContext) => {
  if (error instanceof EntityError) {
    console.error('Entity error:', error.entityName, error.message)
    // Handle entity errors
  }
})
```

### Error Context

```typescript
// Error context
const context: ErrorContext = {
  operation: 'create_user',
  entity: 'User',
  repository: 'UserRepository',
  timestamp: new Date(),
  userId: 'user123',
  requestId: 'req456'
}

try {
  const user = await userRepo.save(newUser)
} catch (error) {
  errorHandler.handleError(error as Error, context)
}
```

## Performance Characteristics

- **Error Handling**: O(1) - Direct handler lookup
- **Error Logging**: O(1) - Simple logging operation
- **Memory Usage**: Minimal - Only error handlers and logger
- **Database Queries**: None - No error logging to database
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Centralized Management** - Single error handling system
2. **Type Safety** - Full TypeScript support
3. **Minimal Overhead** - Efficient error handling
4. **No Database Spam** - No error logging to database
5. **Graceful Degradation** - Handle errors without breaking system
6. **Extensible** - Custom error handlers

## Limitations

1. **Static Handlers** - Error handlers must be defined at compile time
2. **Memory Usage** - Error handlers stored in memory
3. **No Persistence** - Errors not persisted to database

## Integration Points

- **Entity Manager** - Handles entity-related errors
- **Repository Registry** - Handles repository-related errors
- **Relationship Engine** - Handles relationship-related errors
- **Validation Core** - Handles validation-related errors
- **Schema Registry** - Handles schema-related errors
- **Migration System** - Handles migration-related errors
