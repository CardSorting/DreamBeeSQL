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

### 4. Admin Panel Architecture (Next.js 15 Patterns)

**Purpose**: Auto-generated CRUD interface using modern Next.js patterns

**Modern Component Architecture**:
```
AdminLayout (Server Component)
├── Navigation (Server Component)
├── Header (Client Component - user menu)
└── Content
    ├── Dashboard (Server Component)
    ├── ModelList (Server Component)
    │   └── DataTable (Server Component + Client actions)
    ├── ModelDetail (Server Component)
    │   └── Form (Client Component + Server Actions)
    └── Settings (Server Component)
```

**Server Components with Server Actions**:
```typescript
// packages/noormme-admin/components/DataTable.tsx
import { deleteRecord } from './actions';

export function DataTable<T>({ data, columns }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={String(col.key)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(row => (
            <tr key={row.id}>
              {columns.map(col => (
                <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[col.key]}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <EditButton id={row.id} />
                <DeleteButton id={row.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Server Action for mutations
async function deleteRecord(id: string) {
  'use server';
  
  await db
    .deleteFrom('users')
    .where('id', '=', id)
    .execute();
    
  revalidatePath('/admin/users');
}
```

**Modern Page Generation**:
- Server Components for data fetching
- Client Components for interactivity
- Server Actions for mutations
- Progressive enhancement
- Type-safe with generics

**Design Decisions**:
- ✅ Server Components by default (better performance)
- ✅ Client Components only when needed
- ✅ Server Actions for mutations
- ✅ Modern CSS patterns (Tailwind)
- ✅ Progressive enhancement

### 5. RBAC System (Modern Next.js 15 Patterns)

**Purpose**: Role-based access control with modern middleware and Server Actions

**Modern RBAC Architecture**:
```typescript
// lib/rbac.ts (generated)
import { auth } from './auth';
import { db } from './db';
import { redirect } from 'next/navigation';

export async function requireRole(role: string) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const hasRole = await db
    .selectFrom('user_roles')
    .innerJoin('roles', 'roles.id', 'user_roles.role_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('roles.name', '=', role)
    .executeTakeFirst();

  if (!hasRole) {
    redirect('/unauthorized');
  }
  
  return session;
}

export async function requirePermission(
  resource: string,
  action: string
) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const hasPermission = await db
    .selectFrom('user_roles')
    .innerJoin('role_permissions', 'role_permissions.role_id', 'user_roles.role_id')
    .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('permissions.resource', '=', resource)
    .where('permissions.action', '=', action)
    .executeTakeFirst();

  if (!hasPermission) {
    redirect('/unauthorized');
  }
  
  return session;
}
```

**Modern Middleware (Edge Runtime)**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Admin routes require authentication
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check admin role
    const isAdmin = await checkUserRole(session.user.id, 'admin');
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/protected/:path*'
  ],
};
```

**Server Actions with RBAC**:
```typescript
// app/admin/users/actions.ts
'use server';

import { requireRole } from '@/lib/rbac';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteUser(id: string) {
  await requireRole('admin');
  
  await db
    .deleteFrom('users')
    .where('id', '=', id)
    .execute();
    
  revalidatePath('/admin/users');
}

export async function updateUserRole(userId: string, roleId: number) {
  await requireRole('admin');
  
  await db
    .insertInto('user_roles')
    .values({ user_id: userId, role_id: roleId })
    .onConflict(['user_id', 'role_id'])
    .doUpdateSet({ role_id: roleId })
    .execute();
    
  revalidatePath('/admin/users');
}
```

**Design Decisions**:
- ✅ Modern middleware with Edge Runtime
- ✅ Server Actions for mutations
- ✅ Redirect patterns (not exceptions)
- ✅ Type-safe helpers
- ✅ Progressive enhancement

### 6. Database Layer (Modern Patterns)

**Purpose**: Optimized SQLite with Kysely and modern connection patterns

**Modern Database Configuration**:
```typescript
// lib/db.ts (generated)
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { type DB } from './types';

// Connection singleton with proper error handling
let db: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (!db) {
    db = new Database('./database/app.db', {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Optimize for production
    db.pragma('journal_mode = WAL');        // Better concurrency
    db.pragma('synchronous = NORMAL');      // Performance
    db.pragma('cache_size = -64000');       // 64MB cache
    db.pragma('temp_store = MEMORY');       // Speed
    db.pragma('mmap_size = 30000000000');   // 30GB mmap
    db.pragma('foreign_keys = ON');         // Integrity
    db.pragma('optimize');                  // Auto-optimize on connection
  }
  
  return db;
}

// Kysely instance with proper typing
export const kysely = new Kysely<DB>({
  dialect: new SqliteDialect({ database: getDatabase() }),
});

// Server-side helper for Server Actions
export async function withDatabase<T>(
  operation: (db: Kysely<DB>) => Promise<T>
): Promise<T> {
  return await operation(kysely);
}
```

**Modern Connection Patterns**:
```typescript
// lib/db-utils.ts
import { kysely } from './db';
import { unstable_cache } from 'next/cache';

// Cached queries for better performance
export const getCachedUsers = unstable_cache(
  async () => {
    return await kysely
      .selectFrom('users')
      .selectAll()
      .where('isActive', '=', true)
      .execute();
  },
  ['users-active'],
  {
    tags: ['users'],
    revalidate: 300, // 5 minutes
  }
);

// Transaction helper
export async function withTransaction<T>(
  operation: (db: Kysely<DB>) => Promise<T>
): Promise<T> {
  return await kysely.transaction().execute(operation);
}
```

**Design Decisions**:
- ✅ Connection singleton with lazy initialization
- ✅ Proper error handling and logging
- ✅ Cached queries with Next.js cache
- ✅ Transaction helpers
- ✅ Type-safe with generated types

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
