# Validation Core Architecture

## Overview

The Validation Core provides a lightweight, centralized validation system using a singleton pattern. It focuses on essential validation without aggressive monitoring or database spam.

## Design Principles

- **Singleton Pattern** - Single validation engine
- **Decorator-Based** - Validation rules defined via decorators
- **Minimal Overhead** - No unnecessary validation queries
- **Type Safety** - Full TypeScript support
- **Lazy Validation** - Validate only when needed
- **No Database Spam** - No validation queries to database

## Architecture

```typescript
// Validation Core (Singleton)
export class ValidationCore {
  private static instance: ValidationCore | null = null
  private validators = new Map<string, ValidatorFunction>()
  private entityValidators = new Map<string, EntityValidator>()
  
  private constructor() {
    this.registerDefaultValidators()
  }
  
  static getInstance(): ValidationCore {
    if (!ValidationCore.instance) {
      ValidationCore.instance = new ValidationCore()
    }
    return ValidationCore.instance
  }
  
  // Core methods
  async validateEntity<T extends Entity>(entity: T): Promise<ValidationResult>
  registerValidator(name: string, validator: ValidatorFunction): void
  getValidator(name: string): ValidatorFunction | undefined
  clearEntityValidators(): void
}
```

## Validation Metadata

```typescript
export interface ValidationMetadata {
  property: string
  rules: ValidationRule[]
}

export interface ValidationRule {
  name: string
  options?: any
  message?: string
  customValidator?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  property: string
  message: string
  value: any
  rule: string
}

export interface ValidationWarning {
  property: string
  message: string
  value: any
  rule: string
}

export type ValidatorFunction = (value: any, options?: any) => boolean | string
```

## Validation Decorators

```typescript
export function Required(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'required',
      message: message || `${propertyKey} is required`
    })
  }
}

export function Email(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'email',
      message: message || `${propertyKey} must be a valid email`
    })
  }
}

export function MinLength(min: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'minLength',
      options: { min },
      message: message || `${propertyKey} must be at least ${min} characters`
    })
  }
}

export function MaxLength(max: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'maxLength',
      options: { max },
      message: message || `${propertyKey} must be at most ${max} characters`
    })
  }
}

export function Min(min: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'min',
      options: { min },
      message: message || `${propertyKey} must be at least ${min}`
    })
  }
}

export function Max(max: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'max',
      options: { max },
      message: message || `${propertyKey} must be at most ${max}`
    })
  }
}

export function Pattern(regex: RegExp, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'pattern',
      options: { regex },
      message: message || `${propertyKey} format is invalid`
    })
  }
}

export function Custom(validatorName: string, options?: any, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidationRule(target, propertyKey, {
      name: 'custom',
      customValidator: validatorName,
      options,
      message: message || `${propertyKey} validation failed`
    })
  }
}

function addValidationRule(target: any, propertyKey: string, rule: ValidationRule) {
  if (!target.constructor.validationMetadata) {
    target.constructor.validationMetadata = new Map()
  }
  
  const metadata = target.constructor.validationMetadata.get(propertyKey) || { property: propertyKey, rules: [] }
  metadata.rules.push(rule)
  target.constructor.validationMetadata.set(propertyKey, metadata)
}
```

## Default Validators

```typescript
export class DefaultValidators {
  static required(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  }
  
  static email(value: any): boolean {
    if (typeof value !== 'string') return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }
  
  static minLength(value: any, options: { min: number }): boolean {
    if (typeof value !== 'string') return false
    return value.length >= options.min
  }
  
  static maxLength(value: any, options: { max: number }): boolean {
    if (typeof value !== 'string') return false
    return value.length <= options.max
  }
  
  static min(value: any, options: { min: number }): boolean {
    if (typeof value !== 'number') return false
    return value >= options.min
  }
  
  static max(value: any, options: { max: number }): boolean {
    if (typeof value !== 'number') return false
    return value <= options.max
  }
  
  static pattern(value: any, options: { regex: RegExp }): boolean {
    if (typeof value !== 'string') return false
    return options.regex.test(value)
  }
}
```

## Entity Validator

```typescript
export class EntityValidator {
  private validationCore: ValidationCore
  
  constructor() {
    this.validationCore = ValidationCore.getInstance()
  }
  
  async validate<T extends Entity>(entity: T): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    const metadata = this.getValidationMetadata(entity)
    if (!metadata) {
      return { isValid: true, errors: [], warnings: [] }
    }
    
    for (const [property, validationMetadata] of metadata) {
      const value = entity[property]
      
      for (const rule of validationMetadata.rules) {
        const result = await this.validateRule(value, rule)
        
        if (result === false) {
          errors.push({
            property,
            message: rule.message || `${property} validation failed`,
            value,
            rule: rule.name
          })
        } else if (typeof result === 'string') {
          warnings.push({
            property,
            message: result,
            value,
            rule: rule.name
          })
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  private async validateRule(value: any, rule: ValidationRule): Promise<boolean | string> {
    const validator = this.validationCore.getValidator(rule.name)
    if (!validator) {
      throw new Error(`Validator '${rule.name}' not found`)
    }
    
    try {
      return validator(value, rule.options)
    } catch (error) {
      throw new Error(`Validation error for rule '${rule.name}': ${error.message}`)
    }
  }
  
  private getValidationMetadata(entity: Entity): Map<string, ValidationMetadata> | null {
    return entity.constructor.validationMetadata || null
  }
}
```

## Usage Examples

### Entity with Validation

```typescript
@Entity('users')
export class User extends Entity<UserRow> {
  @PrimaryKey()
  id!: string
  
  @Column()
  @Required()
  @Email()
  email!: string
  
  @Column()
  @Required()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string
  
  @Column()
  @Required()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string
  
  @Column()
  @Min(18)
  @Max(120)
  age?: number
  
  @Column()
  @Pattern(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  phone?: string
  
  @Column()
  @Custom('uniqueEmail')
  uniqueEmail!: string
  
  toRow(): UserRow {
    return {
      id: this.id,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      age: this.age,
      phone: this.phone,
      unique_email: this.uniqueEmail
    }
  }
  
  fromRow(row: UserRow): this {
    this.id = row.id
    this.email = row.email
    this.firstName = row.first_name
    this.lastName = row.last_name
    this.age = row.age
    this.phone = row.phone
    this.uniqueEmail = row.unique_email
    return this
  }
}
```

### Custom Validators

```typescript
// Register custom validator
const validationCore = ValidationCore.getInstance()
validationCore.registerValidator('uniqueEmail', async (value: string) => {
  // Custom validation logic
  const userRepo = RepositoryRegistry.getInstance().getRepository(UserRepository)
  const existingUser = await userRepo.findByEmail(value)
  return !existingUser
})
```

### Validation in Repository

```typescript
export class UserRepository extends BaseRepository<User, UserRow> {
  async save(entity: User): Promise<User> {
    // Validate before save
    const validator = new EntityValidator()
    const result = await validator.validate(entity)
    
    if (!result.isValid) {
      throw new ValidationError(result.errors)
    }
    
    // Save entity
    return super.save(entity)
  }
  
  async update(entity: User): Promise<User> {
    // Validate before update
    const validator = new EntityValidator()
    const result = await validator.validate(entity)
    
    if (!result.isValid) {
      throw new ValidationError(result.errors)
    }
    
    // Update entity
    return super.update(entity)
  }
}
```

### Validation in Service

```typescript
export class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async createUser(userData: Partial<User>): Promise<User> {
    const user = new User()
    Object.assign(user, userData)
    
    // Validate
    const validator = new EntityValidator()
    const result = await validator.validate(user)
    
    if (!result.isValid) {
      throw new ValidationError(result.errors)
    }
    
    // Save
    return await this.userRepo.save(user)
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new Error('User not found')
    }
    
    Object.assign(user, userData)
    
    // Validate
    const validator = new EntityValidator()
    const result = await validator.validate(user)
    
    if (!result.isValid) {
      throw new ValidationError(result.errors)
    }
    
    // Update
    return await this.userRepo.update(user)
  }
}
```

## Performance Characteristics

- **Validation Execution**: O(n) - Depends on number of rules
- **Memory Usage**: Minimal - Only validation metadata
- **Database Queries**: None - No validation queries
- **Type Safety**: Full - TypeScript compile-time checking
- **Lazy Validation**: Only when needed

## Benefits

1. **Centralized Management** - Single validation engine
2. **Decorator-Based** - Clean validation definitions
3. **Type Safety** - Full TypeScript support
4. **Minimal Overhead** - No unnecessary validation
5. **Extensible** - Custom validators support
6. **No Database Spam** - No validation queries

## Limitations

1. **Static Configuration** - Validation rules must be defined at compile time
2. **Memory Usage** - Validation metadata stored in memory
3. **No Runtime Rules** - Cannot add validation rules at runtime

## Integration Points

- **Entity Manager** - Provides entity metadata
- **Repository Registry** - Validates entities before save/update
- **Configuration Manager** - Provides validation configuration
- **Error Handling** - Throws validation errors
