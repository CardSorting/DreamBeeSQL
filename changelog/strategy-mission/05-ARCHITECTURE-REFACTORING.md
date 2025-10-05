# NOORMME Framework Architecture

## Overview

NOORMME is architected as a **batteries-included framework** built around code generation, templating, and configuration automation - not as a runtime ORM layer.

## The Architecture:

```
┌─────────────────────────────────────┐
│         Next.js App Router          │
│     (User's application code)       │
└─────────────────────────────────────┘
↓
┌─────────────────────────────────────┐
│         NOORMME Framework           │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │  Admin   │       │
│  │(NextAuth)│  │  Panel   │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │   RBAC   │  │    DB    │       │
│  │  System  │  │ (SQLite) │       │
│  └──────────┘  └──────────┘       │
└─────────────────────────────────────┘
```

## Core Architectural Principles

### 1. Generate, Don't Abstract
- **Code Generation**: Generate working Next.js code instead of runtime wrappers
- **Templates**: Pre-built, customizable templates
- **Configuration**: Auto-configure optimal settings
- **Transparency**: Generated code is readable and modifiable

### 2. Build-Time over Runtime
- **CLI-First**: Setup happens at project creation
- **Static Generation**: Types and code generated upfront
- **No Runtime Overhead**: Minimal framework code at runtime
- **Standard Tools**: Use Next.js, Kysely, NextAuth directly

### 3. Composition over Complexity
- **Standard Tools**: Compose existing tools (Next.js, Kysely, NextAuth)
- **No Reinvention**: Don't rebuild what exists
- **Integration Layer**: Connect tools seamlessly
- **Escape Hatches**: Full access to underlying tools

## Architecture Layers

### Visual Overview

```
┌─────────────────────────────────────────────────────────┐
│              NOORMME Framework Architecture              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │          CLI Layer (create-noormme-app)         │   │
│  │  • Project scaffolding                          │   │
│  │  • Template copying                             │   │
│  │  • Dependency installation                      │   │
│  │  • Database initialization                      │   │
│  └────────────────────┬────────────────────────────┘   │
│                       │                                  │
│                       ▼                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Code Generation Layer                  │   │
│  │  • TypeScript types from schemas               │   │
│  │  • Admin UI routes                              │   │
│  │  • RBAC middleware                              │   │
│  │  • Migration files                              │   │
│  └────────────────────┬────────────────────────────┘   │
│                       │                                  │
│                       ▼                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Generated Next.js App                  │   │
│  │                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │ Database │  │   Auth   │  │  Admin   │     │   │
│  │  │ (Kysely) │  │(NextAuth)│  │  Panel   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘     │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────┐      │   │
│  │  │           RBAC System                │      │   │
│  │  │  (Roles, Permissions, Middleware)    │      │   │
│  │  └──────────────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘

Runtime: Minimal framework code, mostly standard Next.js/Kysely
```

### Directory Structure

**Framework Repository**:
```
noormme/
├── packages/
│   ├── create-noormme-app/         # CLI tool
│   │   ├── src/
│   │   │   ├── cli.ts              # Command line interface
│   │   │   ├── scaffold.ts         # Project scaffolding
│   │   │   ├── database.ts         # DB initialization
│   │   │   └── templates/          # Project templates
│   │   │       ├── base/           # Base Next.js setup
│   │   │       ├── lib/            # Generated utilities
│   │   │       ├── app/            # App Router structure
│   │   │       └── migrations/     # Initial migrations
│   │   └── package.json
│   │
│   ├── noormme-admin/              # Admin panel components
│   │   ├── components/
│   │   │   ├── DataTable.tsx
│   │   │   ├── Form.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Layout.tsx
│   │   ├── generators/
│   │   │   ├── page-generator.ts   # Generate CRUD pages
│   │   │   └── action-generator.ts # Generate Server Actions
│   │   └── package.json
│   │
│   ├── noormme-core/               # Core utilities
│   │   ├── schema/                 # Schema DSL
│   │   ├── migrations/             # Migration tools
│   │   ├── generators/             # Code generators
│   │   └── package.json
│   │
│   ├── noormme-cli/                # CLI commands
│   │   ├── commands/
│   │   │   ├── dev.ts
│   │   │   ├── migrate.ts
│   │   │   └── generate.ts
│   │   └── package.json
│   │
│   └── noormme-nextauth-adapter/   # NextAuth adapter
│       ├── src/
│       │   └── adapter.ts
│       └── package.json
│
└── examples/
    └── basic-app/                  # Example generated app
```

**Generated App Structure**:
```
my-app/                             # Created by CLI
├── app/
│   ├── admin/                      # Auto-generated admin
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── roles/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts        # Pre-configured
│   │
│   └── page.tsx
│
├── lib/
│   ├── db.ts                       # Auto-configured Kysely
│   ├── auth.ts                     # Pre-configured NextAuth
│   └── rbac.ts                     # RBAC helpers
│
├── schemas/                        # Optional user schemas
│   └── .gitkeep
│
├── database/
│   └── app.db                      # Auto-created SQLite
│
├── migrations/
│   └── 001_initial.sql             # Initial schema
│
└── noormme.config.ts               # Framework config
```

## Core Components

### 1. CLI Scaffolding Tool

**Purpose**: Generate complete Next.js project with zero configuration

**Architecture**:
```typescript
// packages/create-noormme-app/src/cli.ts
export class ProjectScaffolder {
  async create(projectName: string) {
    // 1. Create Next.js base
    await this.createNextApp(projectName);

    // 2. Install framework dependencies
    await this.installDependencies(projectName);

    // 3. Copy templates
    await this.copyTemplates(projectName);

    // 4. Initialize database
    await this.initDatabase(projectName);

    // 5. Run initial migration
    await this.runMigration(projectName);

    // 6. Generate types
    await this.generateTypes(projectName);
  }

  private async copyTemplates(projectPath: string) {
    // Copy all templates to project
    await fs.copy(
      path.join(__dirname, 'templates/lib'),
      path.join(projectPath, 'lib')
    );

    await fs.copy(
      path.join(__dirname, 'templates/app/admin'),
      path.join(projectPath, 'app/admin')
    );

    // Process templates (replace variables)
    await this.processTemplates(projectPath);
  }
}
```

**Design Decisions**:
- ✅ Generate code, don't provide runtime wrappers
- ✅ Create readable, modifiable files
- ✅ Use standard Next.js structure
- ✅ Pre-configure optimal settings

### 2. Template System

**Purpose**: Provide pre-built, customizable code templates

**Template Types**:
1. **Base Templates**: Core files (db.ts, auth.ts)
2. **Admin Templates**: CRUD pages and components
3. **RBAC Templates**: Middleware and helpers
4. **Migration Templates**: Database schemas

**Example Template**:
```typescript
// packages/create-noormme-app/templates/lib/db.ts.template
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import type { DB } from '@/types/db';

const dialect = new SqliteDialect({
  database: new Database('{{DATABASE_PATH}}', {
    verbose: {{VERBOSE_MODE}},
  }),
});

export const db = new Kysely<DB>({ dialect });

// Optimize SQLite settings
db.executeSync("PRAGMA journal_mode = WAL");
db.executeSync("PRAGMA synchronous = NORMAL");
db.executeSync("PRAGMA foreign_keys = ON");

// Template variables replaced at generation time
```

**Design Decisions**:
- ✅ Simple variable substitution
- ✅ No complex templating engine
- ✅ Readable generated code
- ✅ Easy to customize post-generation

### 3. Code Generation Layer

**Purpose**: Auto-generate types, pages, and migrations

**Generators**:

**A. Type Generator**:
```typescript
// packages/noormme-core/generators/type-generator.ts
export class TypeGenerator {
  async generateFromSchema(schemaPath: string) {
    // 1. Read schema definitions
    const schemas = await this.readSchemas(schemaPath);

    // 2. Generate TypeScript interfaces
    const types = schemas.map(schema =>
      this.generateInterface(schema)
    );

    // 3. Generate Kysely DB type
    const dbType = this.generateDBType(schemas);

    // 4. Write to types/db.ts
    await fs.writeFile(
      'types/db.ts',
      `${types.join('\n\n')}\n\n${dbType}`
    );
  }

  private generateInterface(schema: Schema): string {
    return `
export interface ${schema.name}Table {
  ${schema.fields.map(f =>
    `${f.name}: ${this.mapType(f.type)};`
  ).join('\n  ')}
}
    `.trim();
  }
}
```

**B. Admin Page Generator**:
```typescript
// packages/noormme-admin/generators/page-generator.ts
export class AdminPageGenerator {
  generateListPage(model: ModelSchema): string {
    return `
import { db } from '@/lib/db';
import { DataTable } from '@noormme/admin';

export default async function ${model.name}ListPage() {
  const items = await db
    .selectFrom('${model.tableName}')
    .selectAll()
    .execute();

  return (
    <div>
      <h1>${model.displayName}</h1>
      <DataTable
        data={items}
        columns={${JSON.stringify(model.columns)}}
      />
    </div>
  );
}
    `.trim();
  }
}
```

**Design Decisions**:
- ✅ Generate at build time, not runtime
- ✅ Readable, standard code
- ✅ Fully typed output
- ✅ No magic, just code generation

### 4. Admin Panel Architecture

**Purpose**: Auto-generated CRUD interface

**Component Hierarchy**:
```
AdminLayout
├── Navigation (sidebar)
├── Header (user menu)
└── Content
    ├── Dashboard (overview)
    ├── ModelList
    │   └── DataTable (generic)
    ├── ModelDetail
    │   └── Form (generic)
    └── Settings
```

**Generic Components**:
```typescript
// packages/noormme-admin/components/DataTable.tsx
export function DataTable<T>({ data, columns }: Props<T>) {
  return (
    <table>
      <thead>
        {columns.map(col => <th key={col.key}>{col.label}</th>)}
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            {columns.map(col => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Page Generation**:
- CRUD pages generated per model
- Uses generic components
- Server Components by default
- Server Actions for mutations

**Design Decisions**:
- ✅ Generate pages, not dynamic routing
- ✅ Reusable components from package
- ✅ Type-safe with generics
- ✅ Customizable post-generation

### 5. RBAC System

**Purpose**: Role-based access control built-in

**Architecture**:
```typescript
// lib/rbac.ts (generated)
import { auth } from './auth';
import { db } from './db';

export async function requireRole(role: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const hasRole = await db
    .selectFrom('user_roles')
    .innerJoin('roles', 'roles.id', 'user_roles.role_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('roles.name', '=', role)
    .executeTakeFirst();

  if (!hasRole) throw new Error(`Requires ${role} role`);
}

export async function requirePermission(
  resource: string,
  action: string
) {
  // Similar implementation
}
```

**Middleware**:
```typescript
// Generated middleware for routes
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Design Decisions**:
- ✅ Database-backed (not JWT claims)
- ✅ Flexible permission model
- ✅ Easy to extend
- ✅ Type-safe helpers

### 6. Database Layer

**Purpose**: Optimized SQLite with Kysely

**Configuration**:
```typescript
// lib/db.ts (generated)
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';

const db = new Database('./database/app.db');

// Optimize for production
db.pragma('journal_mode = WAL');        // Better concurrency
db.pragma('synchronous = NORMAL');      // Performance
db.pragma('cache_size = -64000');       // 64MB cache
db.pragma('temp_store = MEMORY');       // Speed
db.pragma('mmap_size = 30000000000');   // 30GB mmap
db.pragma('foreign_keys = ON');         // Integrity

export const kysely = new Kysely<DB>({
  dialect: new SqliteDialect({ database: db }),
});
```

**Design Decisions**:
- ✅ WAL mode for concurrency
- ✅ Optimized pragmas
- ✅ Direct Kysely usage (no wrapper)
- ✅ Connection singleton

## Design Patterns

### 1. Code Generation over Runtime

**Anti-pattern** (Runtime wrapper):
```typescript
// ❌ Don't do this
class NOORMME {
  model(name: string) {
    return new QueryBuilder(name);
  }
}

const User = db.model('users');
const users = await User.filter({ active: true });
```

**Pattern** (Generated code):
```typescript
// ✅ Do this
// Generate standard Kysely code
const users = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute();
```

### 2. Template-Based Scaffolding

**Pattern**:
1. Define templates with variables
2. CLI copies and processes templates
3. Generated code is standard Next.js
4. Developer can modify freely

### 3. Composition over Complexity

**Pattern**:
- Use existing tools (Next.js, Kysely, NextAuth)
- Don't reinvent (admin UI uses Shadcn, Tailwind)
- Generate integration code
- Provide helper utilities

### 4. Progressive Enhancement

**Pattern**:
1. **Level 0**: Generated code works
2. **Level 1**: Customize via config
3. **Level 2**: Modify generated files
4. **Level 3**: Replace components

## Performance Considerations

### Build-Time Performance

**Strategies**:
- Fast template copying
- Efficient code generation
- Parallel processing where possible
- Minimal dependencies

### Runtime Performance

**Strategies**:
- Minimal framework overhead
- Direct Kysely usage (no wrapper)
- SQLite optimization (WAL, pragmas)
- Static type checking

### Database Optimization

**Auto-configured**:
- WAL mode enabled
- Optimal pragma settings
- Connection pooling (if needed)
- Index recommendations (future)

## Testing Architecture

### Framework Testing

**Unit Tests**:
```typescript
// Test code generators
describe('TypeGenerator', () => {
  it('generates correct interfaces', () => {
    const schema = { name: 'User', fields: [...] };
    const output = generator.generateInterface(schema);
    expect(output).toContain('export interface UserTable');
  });
});
```

**Integration Tests**:
```typescript
// Test full scaffolding
describe('CLI', () => {
  it('creates working app', async () => {
    await createApp('test-app');
    expect(fs.existsSync('test-app/lib/db.ts')).toBe(true);
    expect(fs.existsSync('test-app/app/admin')).toBe(true);
  });
});
```

### Generated App Testing

**Tests Generated**:
- Admin page tests
- RBAC helper tests
- API route tests

## Migration Strategy

### From Manual Setup

**Before** (Manual):
```typescript
// Hours of setup
// 1. Choose ORM
// 2. Configure database
// 3. Set up NextAuth
// 4. Build admin panel
// 5. Implement RBAC
```

**After** (NOORMME):
```bash
# 2 minutes
npx create-noormme-app my-app
```

### From Other ORMs

**Gradual Migration**:
1. Create NOORMME project
2. Copy business logic
3. Adapt to Kysely queries
4. Use generated admin
5. Enable RBAC

## Future Architecture

### Phase 2: Enhanced Generation
- Schema hot reload
- Admin theme system
- Plugin architecture

### Phase 3: Advanced Features
- Multi-database support
- Advanced RBAC (attribute-based)
- Audit logging system

## Conclusion

NOORMME's architecture prioritizes:

1. **Code Generation**: Generate readable code, not runtime abstractions
2. **Standard Tools**: Use Next.js, Kysely, NextAuth directly
3. **Zero Config**: Everything works out-of-box
4. **Transparency**: Generated code is readable and modifiable

This approach provides the speed of scaffolding with the flexibility of hand-written code, avoiding the pitfalls of heavy runtime frameworks.
