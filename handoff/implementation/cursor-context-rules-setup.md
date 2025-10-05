# Cursor Context Rules Setup for NOORMME

## Overview

This document provides a comprehensive guide for setting up Cursor IDE context rules to autogenerate and maintain consistent configuration, architecture, and coding style for the NOORMME project. Based on Cursor's rule system documentation, this guide will help establish persistent, reusable context that ensures consistency across the codebase.

## Understanding Cursor's Rule System

### Rule Types
- **Always**: Rules that are always included in the model context
- **Auto-Attached**: Rules included when files matching specific patterns are referenced
- **Agent Requested**: Rules that the AI can decide to include based on relevance
- **Manual**: Rules included only when explicitly referenced

### File Format
Rules are stored in `.cursor/rules` directory as `.mdc` files with metadata headers:

```markdown
---
description: [Brief description of the rule]
globs: [File patterns the rule applies to]
alwaysApply: [true/false]
---

[Detailed instructions or guidelines]
```

## Setup Instructions

### 1. Create Rules Directory Structure

```bash
mkdir -p /Users/bozoegg/Desktop/NOORMME/.cursor/rules
```

### 2. Directory Structure

```
NOORMME/
├── .cursor/
│   └── rules/
│       ├── architecture.mdc
│       ├── coding-style.mdc
│       ├── configuration.mdc
│       ├── database.mdc
│       ├── nextjs-patterns.mdc
│       ├── testing.mdc
│       ├── documentation.mdc
│       └── cli.mdc
├── src/
├── handoff/
└── README.md
```

## NOORMME-Specific Rules

### 1. Architecture Guidelines (`architecture.mdc`)

```markdown
---
description: NOORMME architectural principles and patterns
globs: '**/*.ts'
alwaysApply: true
---

# NOORMME Architecture Guidelines

## Core Principles

### Marie Kondo Methodology
- Keep only what sparks joy (simplicity, performance, organization)
- Thank complexity for its service and let it go
- Organize what remains with proven patterns

### Composition over Creation
- Use existing excellent tools (Next.js, Kysely, NextAuth, SQLite)
- Apply proven organizational patterns (Django, Laravel, Rails)
- Compose solutions instead of creating new frameworks
- Maintain flexibility and avoid lock-in

## Architectural Layers

### Layer 1: Core Tools (Existing)
- Next.js: App Router, Server Components, Server Actions
- Kysely: Type-safe SQL query builder
- NextAuth: Authentication for Next.js
- SQLite: Simple, reliable database with WAL mode
- TypeScript: Full type safety

### Layer 2: NOORMME Automation (New)
- Auto-Discovery: Schema introspection and type generation
- Repository Pattern: Type-safe CRUD operations
- Performance Optimization: WAL mode, caching, index recommendations
- CLI Tools: Database management and project scaffolding

### Layer 3: Organizational Patterns (New)
- Django Structure: Organized folders, clear separation of concerns
- Laravel Services: Service classes, repository patterns
- Rails Conventions: Naming conventions, file organization
- Next.js Patterns: App Router, Server Components

### Layer 4: Templates (New)
- Project Templates: Pre-organized Next.js projects
- Code Templates: Common patterns and utilities
- Configuration Templates: Smart defaults and conventions

## Implementation Guidelines

### Modular Architecture
- Organize code into distinct modules within `src/` directory
- Separate concerns: database, services, components, utilities
- Use dependency injection for loose coupling
- Ensure all modules are stateless and pure functions where possible

### Service Layer Pattern
- Encapsulate business logic in service classes
- Use repository pattern for data access
- Implement middleware for cross-cutting concerns
- Follow single responsibility principle

### Error Handling
- Use standardized error types with actionable messages
- Implement error recovery mechanisms
- Provide comprehensive error documentation
- Handle errors gracefully with user-friendly messages
```

### 2. Coding Style (`coding-style.mdc`)

```markdown
---
description: NOORMME coding style and conventions
globs: '**/*.{ts,tsx,js,jsx}'
alwaysApply: true
---

# NOORMME Coding Style Guidelines

## General Style

### Indentation and Formatting
- Use 2 spaces for indentation (no tabs)
- Use single quotes for strings
- Use trailing commas in objects and arrays
- Limit line length to 100 characters
- Use semicolons consistently

### Naming Conventions
- **Variables and Functions**: camelCase (`userName`, `getUserById`)
- **Classes**: PascalCase (`UserService`, `DatabaseConnection`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `DATABASE_URL`)
- **Interfaces**: PascalCase with descriptive names (`UserData`, `DatabaseConfig`)
- **Types**: PascalCase (`UserStatus`, `QueryResult`)

### TypeScript Specific
- Use strict TypeScript configuration
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Include JSDoc comments for all public functions and classes

## NOORMME-Specific Conventions

### Database Operations
```typescript
// Repository pattern
const userRepo = db.getRepository('users')
const user = await userRepo.findById(id)

// Kysely queries
const kysely = db.getKysely()
const result = await kysely
  .selectFrom('users')
  .where('status', '=', 'active')
  .execute()
```

### Service Classes
```typescript
export class UserService extends BaseService<User> {
  constructor(db: NOORMME) {
    super(db.getRepository('users'), db)
  }

  async createUser(data: CreateUserData): Promise<User> {
    // Business logic here
    const user = await this.repository.create(data)
    return user
  }
}
```

### Error Handling
```typescript
export class NOORMError extends Error {
  constructor(
    message: string,
    public code: string,
    public actionable?: string
  ) {
    super(message)
  }
}
```

### Documentation
- Include JSDoc comments for all public APIs
- Document complex business logic
- Provide usage examples in comments
- Keep documentation up-to-date with code changes
```

### 3. Configuration Management (`configuration.mdc`)

```markdown
---
description: NOORMME configuration standards and patterns
globs: '**/*.config.{ts,js}'
alwaysApply: true
---

# NOORMME Configuration Guidelines

## Configuration Principles

### Environment Variables
- Use environment variables for sensitive information
- Provide default values for development
- Validate configuration values at application startup
- Document all configuration options

### Configuration Structure
```typescript
interface NOORMConfig {
  dialect: 'sqlite'
  connection: {
    database: string
    host?: string
    port?: number
    username?: string
    password?: string
  }
  automation: {
    enableAutoOptimization: boolean
    enableIndexRecommendations: boolean
    enableQueryAnalysis: boolean
    enableMigrationGeneration: boolean
  }
  performance: {
    enableCaching: boolean
    enableBatchOperations: boolean
    maxCacheSize: number
  }
  optimization: {
    enableWALMode: boolean
    enableForeignKeys: boolean
    cacheSize: number
    synchronous: 'NORMAL' | 'FULL' | 'OFF'
    tempStore: 'MEMORY' | 'FILE'
  }
}
```

### Default Configuration
```typescript
const defaultConfig: NOORMConfig = {
  dialect: 'sqlite',
  connection: {
    database: './database.sqlite'
  },
  automation: {
    enableAutoOptimization: true,
    enableIndexRecommendations: true,
    enableQueryAnalysis: true,
    enableMigrationGeneration: true
  },
  performance: {
    enableCaching: true,
    enableBatchOperations: true,
    maxCacheSize: 1000
  },
  optimization: {
    enableWALMode: true,
    enableForeignKeys: true,
    cacheSize: -64000,
    synchronous: 'NORMAL',
    tempStore: 'MEMORY'
  }
}
```

### Environment Variables
```bash
# Database
DATABASE_PATH=./database.sqlite

# Automation
AUTO_OPTIMIZE=true
AUTO_INDEX=true
ENABLE_QUERY_ANALYSIS=true

# Performance
ENABLE_CACHING=true
MAX_CACHE_SIZE=1000

# Optimization
ENABLE_WAL_MODE=true
CACHE_SIZE=-64000
```

### Validation
- Validate all configuration values at startup
- Provide clear error messages for invalid configurations
- Use TypeScript for compile-time validation
- Implement runtime validation for environment variables
```

### 4. Database Patterns (`database.mdc`)

```markdown
---
description: NOORMME database patterns and SQLite optimization
globs: '**/*.{ts,js}'
alwaysApply: true
---

# NOORMME Database Guidelines

## SQLite Configuration

### WAL Mode Setup
```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=-64000;
PRAGMA temp_store=MEMORY;
PRAGMA foreign_keys=ON;
```

### Performance Optimization
- Enable WAL mode for concurrent access
- Set optimal cache size (-64000 = 64MB)
- Use memory-based temporary storage
- Enable foreign key constraints

## Repository Pattern

### Base Repository
```typescript
export abstract class BaseRepository<T> {
  protected tableName: string
  protected db: Kysely<Database>

  constructor(tableName: string, db: Kysely<Database>) {
    this.tableName = tableName
    this.db = db
  }

  async findById(id: string): Promise<T | null> {
    return await this.db
      .selectFrom(this.tableName)
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst()
  }

  async findAll(): Promise<T[]> {
    return await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .execute()
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.db
      .insertInto(this.tableName)
      .values(data)
      .returningAll()
      .executeTakeFirst()
  }
}
```

### Dynamic Finders
```typescript
// Auto-generated methods based on schema
const userRepo = db.getRepository('users')
const user = await userRepo.findByEmail('john@example.com')
const activeUsers = await userRepo.findManyByStatus('active')
```

## Query Optimization

### Index Recommendations
- Analyze query patterns automatically
- Recommend indexes for frequently queried columns
- Create indexes for foreign keys
- Monitor query performance

### Caching Strategy
- Cache frequently accessed data
- Use intelligent cache invalidation
- Monitor cache hit rates
- Implement cache warming

## Migration Management

### Migration Generation
```typescript
export class MigrationGenerator {
  async generateMigration(
    databasePath: string,
    name: string
  ): Promise<MigrationFile> {
    // Detect schema changes
    const changes = await this.detectSchemaChanges(databasePath)
    
    // Generate migration file
    return this.createMigrationFile(name, changes)
  }
}
```

### Migration Validation
- Validate migration syntax
- Check for breaking changes
- Ensure rollback compatibility
- Test migrations in development
```

### 5. Next.js Patterns (`nextjs-patterns.mdc`)

```markdown
---
description: Next.js organizational patterns for NOORMME
globs: '**/*.{tsx,ts}'
alwaysApply: true
---

# NOORMME Next.js Patterns

## App Router Structure

### Folder Organization (Django-style)
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── signin/        # Sign-in page
│   │   ├── signup/        # Sign-up page
│   │   └── layout.tsx     # Auth layout
│   ├── admin/             # Admin panel
│   │   ├── users/         # User management
│   │   ├── dashboard/     # Admin dashboard
│   │   └── layout.tsx     # Admin layout
│   ├── api/               # API routes
│   │   ├── auth/          # Auth API routes
│   │   └── admin/         # Admin API routes
│   ├── dashboard/         # Protected dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Client providers
├── lib/
│   ├── db.ts              # NOORMME database instance
│   ├── auth.ts            # NextAuth configuration
│   ├── services/          # Service layer
│   ├── repositories/      # Repository layer
│   ├── middleware/        # Middleware layer
│   └── utils/             # Utility functions
├── components/
│   ├── ui/                # Reusable UI components
│   ├── admin/             # Admin panel components
│   └── auth/              # Auth components
└── types/
    ├── database.ts        # Auto-generated types
    └── api.ts             # API types
```

## Server Components

### Data Fetching
```typescript
// app/dashboard/page.tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }

  const userRepo = db.getRepository('users')
  const users = await userRepo.findAll()

  return (
    <div>
      <h1>Dashboard</h1>
      <UserList users={users} />
    </div>
  )
}
```

### Server Actions
```typescript
// app/admin/users/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const userRepo = db.getRepository('users')
  
  const user = await userRepo.create({
    name: formData.get('name') as string,
    email: formData.get('email') as string
  })

  revalidatePath('/admin/users')
  return user
}
```

## Authentication Integration

### NextAuth Configuration
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import { NoormmeAdapter } from 'noormme/adapters/nextauth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: NoormmeAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })
  ],
  session: { strategy: 'database' }
})
```

### Protected Routes
```typescript
// middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
})
```

## Service Layer Integration

### Laravel-style Services
```typescript
// lib/services/user.service.ts
export class UserService extends BaseService<User> {
  constructor(db: NOORMME) {
    super(db.getRepository('users'), db)
  }

  async createUser(data: CreateUserData): Promise<User> {
    // Business logic here
    const user = await this.repository.create(data)
    
    // Additional processing
    await this.sendWelcomeEmail(user.email)
    
    return user
  }
}
```

### Middleware Patterns
```typescript
// lib/middleware/auth.middleware.ts
export class AuthMiddleware extends BaseMiddleware {
  async execute(req: NextRequest, context: any): Promise<NextResponse | void> {
    const session = await auth()
    
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return this.next(req, context)
  }
}
```
```

### 6. Testing Guidelines (`testing.mdc`)

```markdown
---
description: NOORMME testing standards and patterns
globs: '**/*.test.{ts,tsx,js,jsx}'
alwaysApply: true
---

# NOORMME Testing Guidelines

## Testing Philosophy

### Test-Driven Development
- Write tests before implementation
- Use tests to drive design decisions
- Maintain high test coverage (>90%)
- Test behavior, not implementation

### Testing Pyramid
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load

## Testing Tools

### Test Framework
- **Vitest**: Fast test runner with TypeScript support
- **@testing-library/react**: Component testing utilities
- **@testing-library/jest-dom**: DOM assertions
- **Supertest**: API endpoint testing

### Test Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts']
  }
})
```

## Testing Patterns

### Unit Tests
```typescript
// test/services/user.service.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { UserService } from '@/lib/services/user.service'
import { NOORMME } from 'noormme'

describe('UserService', () => {
  let userService: UserService
  let db: NOORMME

  beforeEach(async () => {
    db = new NOORMME({
      dialect: 'sqlite',
      connection: { database: ':memory:' }
    })
    await db.initialize()
    userService = new UserService(db)
  })

  test('should create user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    }

    const user = await userService.createUser(userData)

    expect(user).toBeDefined()
    expect(user.name).toBe(userData.name)
    expect(user.email).toBe(userData.email)
  })
})
```

### Integration Tests
```typescript
// test/integration/database.test.ts
import { describe, test, expect } from 'vitest'
import { NOORMME } from 'noormme'

describe('Database Integration', () => {
  test('should auto-discover schema', async () => {
    const db = new NOORMME({
      dialect: 'sqlite',
      connection: { database: './test.db' }
    })

    await db.initialize()

    const schema = db.getSchema()
    expect(schema.tables).toBeDefined()
    expect(schema.tables.length).toBeGreaterThan(0)
  })
})
```

### Component Tests
```typescript
// test/components/user-list.test.tsx
import { render, screen } from '@testing-library/react'
import { UserList } from '@/components/user-list'

describe('UserList', () => {
  test('should render user list', () => {
    const users = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ]

    render(<UserList users={users} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })
})
```

## Performance Testing

### Benchmark Tests
```typescript
// test/performance/benchmark.test.ts
import { describe, test, expect } from 'vitest'
import { NOORMME } from 'noormme'

describe('Performance Benchmarks', () => {
  test('should execute queries under 50ms', async () => {
    const db = new NOORMME({
      dialect: 'sqlite',
      connection: { database: './test.db' }
    })

    await db.initialize()

    const start = Date.now()
    const userRepo = db.getRepository('users')
    await userRepo.findAll()
    const duration = Date.now() - start

    expect(duration).toBeLessThan(50)
  })
})
```

## Test Data Management

### Test Database
- Use in-memory SQLite for unit tests
- Use test database files for integration tests
- Clean up test data after each test
- Use factories for test data generation

### Mocking
- Mock external dependencies
- Use dependency injection for testability
- Mock database connections for unit tests
- Use real database for integration tests

## Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test
      - run: npm run test:coverage
```
```

### 7. Documentation Standards (`documentation.mdc`)

```markdown
---
description: NOORMME documentation standards and patterns
globs: '**/*.{md,mdx}'
alwaysApply: true
---

# NOORMME Documentation Guidelines

## Documentation Philosophy

### User-Centric Documentation
- Write for the user, not the developer
- Focus on solving problems, not explaining features
- Provide clear examples and use cases
- Keep documentation up-to-date with code

### Documentation Types
- **API Documentation**: Complete reference for all public APIs
- **Getting Started**: Quick start guides and tutorials
- **Best Practices**: Guidelines and recommendations
- **Examples**: Real-world usage examples
- **Troubleshooting**: Common issues and solutions

## Documentation Structure

### README.md
```markdown
# NOORMME - The NO-ORM for Normies

## Quick Start
1. Install: `npm install noormme`
2. Initialize: `npx noormme init`
3. Start coding: `npm run dev`

## Features
- Auto-discovery of SQLite schema
- Type-safe repository pattern
- Performance optimization
- Next.js integration

## Examples
[Code examples and usage patterns]
```

### API Documentation
```typescript
/**
 * NOORMME - No ORM, just magic!
 * Zero-configuration pseudo-ORM that works with any existing database
 * 
 * @example
 * ```typescript
 * const db = new NOORMME({
 *   dialect: 'sqlite',
 *   connection: { database: './app.db' }
 * })
 * 
 * await db.initialize()
 * const userRepo = db.getRepository('users')
 * const users = await userRepo.findAll()
 * ```
 */
export class NOORMME {
  /**
   * Initialize the database connection and discover schema
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Implementation
  }

  /**
   * Get a repository for the specified table
   * @param tableName - Name of the database table
   * @returns Repository instance with type-safe CRUD operations
   */
  getRepository<T>(tableName: string): Repository<T> {
    // Implementation
  }
}
```

## Code Examples

### Inline Examples
```typescript
// Always provide working examples in documentation
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './app.db' }
})

// Show both simple and complex usage
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()

// Complex query example
const kysely = db.getKysely()
const result = await kysely
  .selectFrom('users')
  .innerJoin('posts', 'posts.user_id', 'users.id')
  .select(['users.name', 'posts.title'])
  .where('users.status', '=', 'active')
  .execute()
```

### Example Applications
- Create complete working examples
- Include setup instructions
- Provide expected output
- Explain the reasoning behind decisions

## Documentation Maintenance

### Keeping Documentation Current
- Update documentation with every code change
- Use automated tools to detect outdated documentation
- Regular documentation reviews
- User feedback integration

### Documentation Testing
- Test all code examples
- Validate setup instructions
- Check for broken links
- Ensure examples work with current version

## Style Guidelines

### Writing Style
- Use clear, concise language
- Avoid jargon and technical terms when possible
- Use active voice
- Write in second person ("you")

### Formatting
- Use consistent markdown formatting
- Include code syntax highlighting
- Use tables for structured data
- Include diagrams for complex concepts

### Examples
- Always provide complete, working examples
- Include error handling in examples
- Show both simple and advanced usage
- Explain the output and expected behavior
```

### 8. CLI Guidelines (`cli.mdc`)

```markdown
---
description: NOORMME CLI development standards
globs: '**/cli/**/*.{ts,js}'
alwaysApply: true
---

# NOORMME CLI Guidelines

## CLI Design Principles

### User Experience
- Commands should be intuitive and discoverable
- Provide clear help text and examples
- Use consistent command structure
- Handle errors gracefully with actionable messages

### Command Structure
```bash
# Consistent command structure
noormme <command> [options] [arguments]

# Examples
noormme init --template nextjs
noormme analyze --database ./app.db
noormme optimize --dry-run
```

## Command Implementation

### Base Command Class
```typescript
import { Command } from 'commander'
import chalk from 'chalk'

export abstract class BaseCommand {
  protected program: Command

  constructor() {
    this.program = new Command()
    this.setupCommand()
  }

  protected abstract setupCommand(): void
  protected abstract execute(options: any): Promise<void>

  protected log(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red
    }
    console.log(colors[type](message))
  }

  protected handleError(error: Error) {
    this.log(`Error: ${error.message}`, 'error')
    if (error.stack) {
      console.log(chalk.gray(error.stack))
    }
    process.exit(1)
  }
}
```

### Command Examples
```typescript
// src/cli/commands/init.ts
export class InitCommand extends BaseCommand {
  protected setupCommand() {
    this.program
      .command('init')
      .description('Initialize NOORMME in existing project')
      .option('-t, --template <template>', 'Project template', 'nextjs')
      .option('-d, --database <path>', 'Database path', './database.sqlite')
      .action(async (options) => {
        try {
          await this.execute(options)
        } catch (error) {
          this.handleError(error)
        }
      })
  }

  protected async execute(options: any) {
    this.log('🚀 Initializing NOORMME...', 'info')
    
    // Implementation
    await this.generateProjectFiles(options)
    await this.updatePackageJson(options)
    await this.createConfigFiles(options)
    
    this.log('✅ NOORMME initialized successfully!', 'success')
    this.log('Next steps:', 'info')
    this.log('1. npm install', 'info')
    this.log('2. npm run dev', 'info')
  }
}
```

## Error Handling

### Error Messages
```typescript
export class CLIError extends Error {
  constructor(
    message: string,
    public code: string,
    public actionable?: string
  ) {
    super(message)
  }
}

// Usage
if (!fs.existsSync(databasePath)) {
  throw new CLIError(
    `Database file not found: ${databasePath}`,
    'DATABASE_NOT_FOUND',
    'Check the database path or run "noormme init" to create a new database'
  )
}
```

### Progress Indicators
```typescript
import ora from 'ora'

export class ProgressIndicator {
  private spinner: ora.Ora

  constructor(message: string) {
    this.spinner = ora(message).start()
  }

  update(message: string) {
    this.spinner.text = message
  }

  success(message: string) {
    this.spinner.succeed(message)
  }

  error(message: string) {
    this.spinner.fail(message)
  }
}

// Usage
const progress = new ProgressIndicator('Analyzing database...')
try {
  await analyzeDatabase()
  progress.success('Database analysis complete')
} catch (error) {
  progress.error('Database analysis failed')
}
```

## Output Formatting

### Consistent Styling
```typescript
import chalk from 'chalk'
import { table } from 'table'

export class OutputFormatter {
  static success(message: string) {
    console.log(chalk.green(`✅ ${message}`))
  }

  static error(message: string) {
    console.log(chalk.red(`❌ ${message}`))
  }

  static info(message: string) {
    console.log(chalk.blue(`ℹ️  ${message}`))
  }

  static warning(message: string) {
    console.log(chalk.yellow(`⚠️  ${message}`))
  }

  static table(data: any[], columns: string[]) {
    const tableData = [
      columns,
      ...data.map(row => columns.map(col => row[col]))
    ]
    console.log(table(tableData))
  }
}
```

## Testing CLI Commands

### Command Testing
```typescript
// test/cli/init.test.ts
import { describe, test, expect } from 'vitest'
import { InitCommand } from '@/cli/commands/init'

describe('InitCommand', () => {
  test('should initialize project with default options', async () => {
    const command = new InitCommand()
    
    // Mock file system operations
    const mockWriteFile = vi.fn()
    vi.mock('fs/promises', () => ({
      writeFile: mockWriteFile
    }))

    await command.execute({})

    expect(mockWriteFile).toHaveBeenCalled()
  })
})
```

## Help and Documentation

### Command Help
```typescript
// Always provide comprehensive help
this.program
  .addHelpText('after', `
${chalk.blue.bold('🚀 NOORMME - Complete SQLite Automation')}

${chalk.green.bold('Quick Start:')}
  $ noormme init                          # Zero-config setup
  $ noormme inspect                       # Discover schema
  $ noormme optimize                      # Optimize performance

${chalk.yellow('Pro Tips:')}
  • Point NOORMME at your existing SQLite database
  • Use --dry-run with optimize to see what would be improved
  • Enable watch mode for continuous optimization

${chalk.blue('📚 Learn more: https://github.com/noormme/noormme')}
`)
```
```

## Implementation Script

### Auto-Generation Script

Create a script to automatically generate these rules from the existing documentation:

```typescript
// scripts/generate-cursor-rules.ts
import fs from 'fs/promises'
import path from 'path'

const rulesDir = '.cursor/rules'
const handoffDir = 'handoff'

const ruleTemplates = {
  'architecture.mdc': 'engineering/architecture-overview.md',
  'coding-style.mdc': 'engineering/implementation-roadmap.md',
  'configuration.mdc': 'implementation/phase-1-sqlite-foundation.md',
  'database.mdc': 'implementation/phase-1-sqlite-foundation.md',
  'nextjs-patterns.mdc': 'implementation/phase-2-nextjs-organization.md',
  'testing.mdc': 'engineering/implementation-roadmap.md',
  'documentation.mdc': 'engineering/implementation-roadmap.md',
  'cli.mdc': 'engineering/implementation-roadmap.md'
}

async function generateCursorRules() {
  // Ensure .cursor/rules directory exists
  await fs.mkdir(rulesDir, { recursive: true })

  // Generate each rule file
  for (const [ruleFile, sourceDoc] of Object.entries(ruleTemplates)) {
    const rulePath = path.join(rulesDir, ruleFile)
    const sourcePath = path.join(handoffDir, sourceDoc)
    
    try {
      const sourceContent = await fs.readFile(sourcePath, 'utf-8')
      const ruleContent = extractRuleContent(sourceContent, ruleFile)
      
      await fs.writeFile(rulePath, ruleContent)
      console.log(`✅ Generated ${ruleFile}`)
    } catch (error) {
      console.error(`❌ Failed to generate ${ruleFile}:`, error)
    }
  }
}

function extractRuleContent(sourceContent: string, ruleFile: string): string {
  // Extract relevant content from source documentation
  // This would need to be customized based on the specific rule
  return sourceContent
}

// Run the script
generateCursorRules().catch(console.error)
```

## Usage Instructions

### 1. Setup
```bash
# Create the rules directory
mkdir -p .cursor/rules

# Copy the rule files to the directory
cp handoff/implementation/cursor-context-rules-setup.md .cursor/rules/
```

### 2. Customization
- Modify the rule files to match your specific requirements
- Add or remove rules as needed
- Update the `globs` patterns to target specific file types
- Adjust the `alwaysApply` setting based on your needs

### 3. Verification
- Open Cursor IDE in the NOORMME project
- Check that rules are being applied in the AI context
- Test code generation to ensure rules are working
- Verify that the AI follows the established patterns

## Benefits

### Consistency
- Ensures all code follows the same patterns
- Maintains architectural consistency
- Enforces coding standards automatically
- Reduces code review overhead

### Productivity
- AI generates code that follows project conventions
- Reduces time spent on boilerplate
- Provides consistent examples and patterns
- Automates repetitive tasks

### Quality
- Enforces best practices automatically
- Reduces bugs through consistent patterns
- Improves code maintainability
- Ensures documentation standards

## Conclusion

This Cursor context rules setup provides a comprehensive framework for maintaining consistency across the NOORMME project. By implementing these rules, you ensure that:

1. **All code follows established patterns** - Architecture, coding style, and conventions
2. **AI assistance is contextually aware** - Rules guide AI to generate appropriate code
3. **Documentation standards are maintained** - Consistent documentation across the project
4. **Testing practices are enforced** - Comprehensive testing guidelines and patterns

The rules are designed to be:
- **Comprehensive**: Cover all aspects of the NOORMME project
- **Flexible**: Can be customized for specific needs
- **Maintainable**: Easy to update as the project evolves
- **Effective**: Provide clear guidance for both humans and AI

---

**Status**: ✅ Ready for implementation
**Next Steps**: Copy rule files to `.cursor/rules` directory
**Success Criteria**: AI generates code that follows NOORMME patterns consistently
