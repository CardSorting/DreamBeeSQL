# Lifecycle Hooks Architecture

## Overview

The Lifecycle Hooks system provides a lightweight hook mechanism for entity lifecycle events using a singleton pattern. It focuses on essential hooks without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single hook manager instance
- **Lightweight Hooks** - Essential lifecycle events only
- **Type Safety** - Full TypeScript support
- **Minimal Overhead** - Efficient hook execution
- **No Database Queries** - Hooks don't query database
- **Event-Driven** - Simple event-based architecture

## Architecture

```typescript
// Lifecycle Hook Manager (Singleton)
export class LifecycleHookManager {
  private static instance: LifecycleHookManager | null = null
  private hooks = new Map<string, HookFunction[]>()
  private globalHooks = new Map<string, HookFunction[]>()
  
  private constructor() {
    this.registerDefaultHooks()
  }
  
  static getInstance(): LifecycleHookManager {
    if (!LifecycleHookManager.instance) {
      LifecycleHookManager.instance = new LifecycleHookManager()
    }
    return LifecycleHookManager.instance
  }
  
  // Core methods
  registerHook(entityName: string, event: HookEvent, hook: HookFunction): void
  registerGlobalHook(event: HookEvent, hook: HookFunction): void
  async executeHooks(entityName: string, event: HookEvent, context: HookContext): Promise<void>
  async executeGlobalHooks(event: HookEvent, context: HookContext): Promise<void>
  clearHooks(entityName?: string): void
}
```

## Hook Types

```typescript
export enum HookEvent {
  BEFORE_SAVE = 'beforeSave',
  AFTER_SAVE = 'afterSave',
  BEFORE_UPDATE = 'beforeUpdate',
  AFTER_UPDATE = 'afterUpdate',
  BEFORE_DELETE = 'beforeDelete',
  AFTER_DELETE = 'afterDelete',
  BEFORE_LOAD = 'beforeLoad',
  AFTER_LOAD = 'afterLoad'
}

export type HookFunction = (context: HookContext) => Promise<void> | void

export interface HookContext {
  entity: Entity
  entityName: string
  event: HookEvent
  data?: any
  timestamp: Date
  userId?: string
  requestId?: string
}

export interface HookResult {
  success: boolean
  errors: HookError[]
  warnings: HookWarning[]
}

export interface HookError {
  hook: string
  message: string
  error: Error
}

export interface HookWarning {
  hook: string
  message: string
}
```

## Default Hooks

```typescript
export class DefaultHooks {
  static beforeSaveHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Set timestamps
    if (entity.createdAt === undefined) {
      entity.createdAt = new Date()
    }
    entity.updatedAt = new Date()
    
    // Generate ID if not present
    if (!entity.id) {
      entity.id = this.generateId()
    }
  }
  
  static afterSaveHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Log save event
    console.log(`Entity ${context.entityName} saved with ID: ${entity.id}`)
  }
  
  static beforeUpdateHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Update timestamp
    entity.updatedAt = new Date()
  }
  
  static afterUpdateHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Log update event
    console.log(`Entity ${context.entityName} updated with ID: ${entity.id}`)
  }
  
  static beforeDeleteHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Log delete event
    console.log(`Entity ${context.entityName} being deleted with ID: ${entity.id}`)
  }
  
  static afterDeleteHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Log delete event
    console.log(`Entity ${context.entityName} deleted with ID: ${entity.id}`)
  }
  
  static beforeLoadHook: HookFunction = async (context: HookContext) => {
    // Pre-load processing
    console.log(`Loading entity ${context.entityName}`)
  }
  
  static afterLoadHook: HookFunction = async (context: HookContext) => {
    const entity = context.entity
    
    // Post-load processing
    console.log(`Entity ${context.entityName} loaded with ID: ${entity.id}`)
  }
  
  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}
```

## Hook Decorators

```typescript
export function BeforeSave() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.BEFORE_SAVE, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function AfterSave() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.AFTER_SAVE, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function BeforeUpdate() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.BEFORE_UPDATE, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function AfterUpdate() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.AFTER_UPDATE, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function BeforeDelete() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.BEFORE_DELETE, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function AfterDelete() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.AFTER_DELETE, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function BeforeLoad() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.BEFORE_LOAD, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}

export function AfterLoad() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const entityName = target.constructor.getTableName()
    const hookManager = LifecycleHookManager.getInstance()
    
    hookManager.registerHook(entityName, HookEvent.AFTER_LOAD, async (context) => {
      await descriptor.value.call(context.entity, context)
    })
  }
}
```

## Hook Executor

```typescript
export class HookExecutor {
  private hookManager: LifecycleHookManager
  private errorHandler: ErrorHandler
  
  constructor() {
    this.hookManager = LifecycleHookManager.getInstance()
    this.errorHandler = ErrorHandler.getInstance()
  }
  
  async executeHooks(
    entityName: string,
    event: HookEvent,
    entity: Entity,
    data?: any
  ): Promise<HookResult> {
    const context: HookContext = {
      entity,
      entityName,
      event,
      data,
      timestamp: new Date()
    }
    
    const result: HookResult = {
      success: true,
      errors: [],
      warnings: []
    }
    
    try {
      // Execute global hooks first
      await this.executeGlobalHooks(event, context, result)
      
      // Execute entity-specific hooks
      await this.executeEntityHooks(entityName, event, context, result)
      
    } catch (error) {
      result.success = false
      result.errors.push({
        hook: 'hook_executor',
        message: 'Hook execution failed',
        error: error as Error
      })
      
      this.errorHandler.handleError(error as Error, {
        operation: 'execute_hooks',
        entity: entityName,
        timestamp: new Date()
      })
    }
    
    return result
  }
  
  private async executeGlobalHooks(
    event: HookEvent,
    context: HookContext,
    result: HookResult
  ): Promise<void> {
    const hooks = this.hookManager.getGlobalHooks(event)
    
    for (const hook of hooks) {
      try {
        await hook(context)
      } catch (error) {
        result.errors.push({
          hook: 'global_hook',
          message: `Global hook failed: ${error.message}`,
          error: error as Error
        })
      }
    }
  }
  
  private async executeEntityHooks(
    entityName: string,
    event: HookEvent,
    context: HookContext,
    result: HookResult
  ): Promise<void> {
    const hooks = this.hookManager.getEntityHooks(entityName, event)
    
    for (const hook of hooks) {
      try {
        await hook(context)
      } catch (error) {
        result.errors.push({
          hook: `${entityName}_hook`,
          message: `Entity hook failed: ${error.message}`,
          error: error as Error
        })
      }
    }
  }
}
```

## Usage Examples

### Entity with Hooks

```typescript
@Entity('users')
export class User extends Entity<UserRow> {
  @PrimaryKey()
  id!: string
  
  @Column()
  email!: string
  
  @Column()
  firstName!: string
  
  @Column()
  lastName!: string
  
  @Column()
  createdAt?: Date
  
  @Column()
  updatedAt?: Date
  
  @BeforeSave()
  async beforeSave(context: HookContext) {
    console.log('Before saving user:', this.email)
    
    // Set timestamps
    if (!this.createdAt) {
      this.createdAt = new Date()
    }
    this.updatedAt = new Date()
  }
  
  @AfterSave()
  async afterSave(context: HookContext) {
    console.log('User saved:', this.id)
    
    // Send welcome email
    await this.sendWelcomeEmail()
  }
  
  @BeforeUpdate()
  async beforeUpdate(context: HookContext) {
    console.log('Before updating user:', this.id)
    
    // Update timestamp
    this.updatedAt = new Date()
  }
  
  @AfterUpdate()
  async afterUpdate(context: HookContext) {
    console.log('User updated:', this.id)
    
    // Send update notification
    await this.sendUpdateNotification()
  }
  
  @BeforeDelete()
  async beforeDelete(context: HookContext) {
    console.log('Before deleting user:', this.id)
    
    // Archive user data
    await this.archiveUserData()
  }
  
  @AfterDelete()
  async afterDelete(context: HookContext) {
    console.log('User deleted:', this.id)
    
    // Send deletion notification
    await this.sendDeletionNotification()
  }
  
  private async sendWelcomeEmail(): Promise<void> {
    // Implementation
  }
  
  private async sendUpdateNotification(): Promise<void> {
    // Implementation
  }
  
  private async archiveUserData(): Promise<void> {
    // Implementation
  }
  
  private async sendDeletionNotification(): Promise<void> {
    // Implementation
  }
  
  toRow(): UserRow {
    return {
      id: this.id,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }
  
  fromRow(row: UserRow): this {
    this.id = row.id
    this.email = row.email
    this.firstName = row.first_name
    this.lastName = row.last_name
    this.createdAt = row.created_at
    this.updatedAt = row.updated_at
    return this
  }
}
```

### Repository with Hooks

```typescript
export class UserRepository extends BaseRepository<User, UserRow> {
  private hookExecutor: HookExecutor
  
  constructor(db: Kysely<any>) {
    super(db, User)
    this.hookExecutor = new HookExecutor()
  }
  
  async save(entity: User): Promise<User> {
    // Execute before save hooks
    const beforeResult = await this.hookExecutor.executeHooks(
      'users',
      HookEvent.BEFORE_SAVE,
      entity
    )
    
    if (!beforeResult.success) {
      throw new Error(`Before save hooks failed: ${beforeResult.errors.map(e => e.message).join(', ')}`)
    }
    
    // Save entity
    const savedEntity = await super.save(entity)
    
    // Execute after save hooks
    const afterResult = await this.hookExecutor.executeHooks(
      'users',
      HookEvent.AFTER_SAVE,
      savedEntity
    )
    
    if (!afterResult.success) {
      console.warn(`After save hooks failed: ${afterResult.errors.map(e => e.message).join(', ')}`)
    }
    
    return savedEntity
  }
  
  async update(entity: User): Promise<User> {
    // Execute before update hooks
    const beforeResult = await this.hookExecutor.executeHooks(
      'users',
      HookEvent.BEFORE_UPDATE,
      entity
    )
    
    if (!beforeResult.success) {
      throw new Error(`Before update hooks failed: ${beforeResult.errors.map(e => e.message).join(', ')}`)
    }
    
    // Update entity
    const updatedEntity = await super.update(entity)
    
    // Execute after update hooks
    const afterResult = await this.hookExecutor.executeHooks(
      'users',
      HookEvent.AFTER_UPDATE,
      updatedEntity
    )
    
    if (!afterResult.success) {
      console.warn(`After update hooks failed: ${afterResult.errors.map(e => e.message).join(', ')}`)
    }
    
    return updatedEntity
  }
  
  async delete(id: string): Promise<boolean> {
    // Find entity first
    const entity = await this.findById(id)
    if (!entity) {
      return false
    }
    
    // Execute before delete hooks
    const beforeResult = await this.hookExecutor.executeHooks(
      'users',
      HookEvent.BEFORE_DELETE,
      entity
    )
    
    if (!beforeResult.success) {
      throw new Error(`Before delete hooks failed: ${beforeResult.errors.map(e => e.message).join(', ')}`)
    }
    
    // Delete entity
    const deleted = await super.delete(id)
    
    if (deleted) {
      // Execute after delete hooks
      const afterResult = await this.hookExecutor.executeHooks(
        'users',
        HookEvent.AFTER_DELETE,
        entity
      )
      
      if (!afterResult.success) {
        console.warn(`After delete hooks failed: ${afterResult.errors.map(e => e.message).join(', ')}`)
      }
    }
    
    return deleted
  }
}
```

### Global Hooks

```typescript
// Register global hooks
const hookManager = LifecycleHookManager.getInstance()

// Global audit hook
hookManager.registerGlobalHook(HookEvent.AFTER_SAVE, async (context) => {
  console.log(`Global audit: ${context.entityName} saved at ${context.timestamp}`)
  
  // Log to audit system
  await auditLogger.log({
    action: 'save',
    entity: context.entityName,
    entityId: context.entity.id,
    timestamp: context.timestamp
  })
})

// Global validation hook
hookManager.registerGlobalHook(HookEvent.BEFORE_SAVE, async (context) => {
  // Additional validation
  if (context.entityName === 'users') {
    const user = context.entity as User
    if (!user.email || !user.email.includes('@')) {
      throw new Error('Invalid email format')
    }
  }
})

// Global notification hook
hookManager.registerGlobalHook(HookEvent.AFTER_UPDATE, async (context) => {
  console.log(`Global notification: ${context.entityName} updated`)
  
  // Send notification
  await notificationService.send({
    type: 'entity_updated',
    entity: context.entityName,
    entityId: context.entity.id
  })
})
```

### Custom Hook Registration

```typescript
// Custom hook registration
const hookManager = LifecycleHookManager.getInstance()

// Register custom hooks
hookManager.registerHook('users', HookEvent.BEFORE_SAVE, async (context) => {
  const user = context.entity as User
  
  // Custom validation
  if (user.email && user.email.includes('test@')) {
    throw new Error('Test emails not allowed')
  }
  
  // Custom processing
  user.email = user.email.toLowerCase()
})

hookManager.registerHook('users', HookEvent.AFTER_SAVE, async (context) => {
  const user = context.entity as User
  
  // Custom post-processing
  await userService.sendWelcomeEmail(user)
  await userService.createDefaultProfile(user)
})

// Register hooks for multiple entities
const entities = ['users', 'posts', 'comments']
const events = [HookEvent.BEFORE_SAVE, HookEvent.AFTER_SAVE]

for (const entity of entities) {
  for (const event of events) {
    hookManager.registerHook(entity, event, async (context) => {
      console.log(`Custom hook: ${entity} ${event}`)
    })
  }
}
```

## Performance Characteristics

- **Hook Execution**: O(n) - Depends on number of hooks
- **Hook Registration**: O(1) - Direct map insertion
- **Memory Usage**: Minimal - Only hook functions
- **Database Queries**: None - Hooks don't query database
- **Type Safety**: Full - TypeScript compile-time checking

## Benefits

1. **Lightweight** - Essential lifecycle events only
2. **Type Safety** - Full TypeScript support
3. **Minimal Overhead** - Efficient hook execution
4. **No Database Queries** - Hooks don't query database
5. **Event-Driven** - Simple event-based architecture
6. **Extensible** - Custom hooks support

## Limitations

1. **Static Hooks** - Hooks must be defined at compile time
2. **Memory Usage** - Hook functions stored in memory
3. **No Persistence** - Hooks not persisted to database

## Integration Points

- **Entity Manager** - Provides entity information for hooks
- **Repository Registry** - Executes hooks during repository operations
- **Error Handler** - Handles hook execution errors
- **Configuration Manager** - Provides hook configuration
