# NOORMME Implementation Guide

## What You're Building

**NOORMME** = Batteries-included framework for Next.js with zero-config SQLite, auth, admin, and RBAC.

```bash
# One command creates a fully-featured app
npx create-noormme-app my-app
cd my-app
npm run dev

# You now have:
# ✅ SQLite database (configured)
# ✅ NextAuth (working)
# ✅ Admin panel (/admin)
# ✅ RBAC (roles & permissions)
```

---

## Technology Stack

### Core Dependencies
1. **Kysely** - Type-safe query builder (we use it directly, no wrapper)
2. **better-sqlite3** - SQLite driver for Node.js
3. **NextAuth** - Authentication (pre-configured)
4. **TypeScript** - Full type safety

### Framework Stack
1. **Next.js 13+** - App Router (required)
2. **React Server Components** - For admin UI
3. **Server Actions** - For CRUD operations
4. **SQLite + WAL** - Database with optimal config

---

## Architecture Overview

### Layer 1: CLI & Setup
**What it does:**
- Scaffolds Next.js project
- Auto-configures SQLite with WAL mode
- Sets up NextAuth with default providers
- Creates auth schemas (User, Session, Account)
- Generates admin panel routes
- Configures RBAC (Role, Permission models)

**Key files created:**
```
my-app/
├── lib/
│   ├── db.ts          # Kysely instance, auto-configured
│   ├── auth.ts        # NextAuth config, pre-integrated
│   └── rbac.ts        # Role/permission helpers
├── app/
│   ├── admin/         # Auto-generated admin panel
│   └── api/auth/      # NextAuth routes
└── noormme.config.ts  # Framework configuration
```

### Layer 2: Database (Kysely Direct)
**What it does:**
- Provides configured Kysely instance
- Auto-generates TypeScript types
- Connection pooling for serverless
- WAL mode for performance

**NOT building:** ORM abstraction layer
**Using:** Kysely's native API

```typescript
// lib/db.ts (auto-generated)
import { Kysely } from 'kysely';
import { SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';

export const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new Database('./database/app.db', {
      verbose: console.log, // dev only
    }),
  }),
});

// Enable WAL mode for performance
db.executeSync("PRAGMA journal_mode = WAL");
db.executeSync("PRAGMA synchronous = NORMAL");
db.executeSync("PRAGMA foreign_keys = ON");
```

### Layer 3: NextAuth Integration
**What it does:**
- Pre-configured NextAuth setup
- SQLite adapter (using Kysely)
- User/Session/Account tables
- OAuth providers ready

**Auto-generated:**
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { KyselyAdapter } from '@noormme/nextauth-adapter';
import { db } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: KyselyAdapter(db),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
});
```

### Layer 4: Admin Panel
**What it does:**
- Auto-generated CRUD UI for all models
- Authentication-protected
- Responsive design
- Role-based access control

**File structure:**
```
app/admin/
├── layout.tsx        # Admin layout with navigation
├── page.tsx          # Dashboard
├── users/
│   ├── page.tsx      # List users
│   ├── [id]/
│   │   ├── page.tsx  # View/edit user
│   │   └── delete/
│   │       └── page.tsx
├── roles/
├── permissions/
└── components/
    ├── DataTable.tsx
    ├── Form.tsx
    └── Navigation.tsx
```

### Layer 5: RBAC System
**What it does:**
- Role and Permission models (auto-created)
- Middleware for route protection
- Helpers for Server Actions
- Admin UI for management

**Auto-generated models:**
```typescript
// Auto-created tables:
CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id TEXT REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

---

## Implementation Roadmap

### Phase 1: CLI & Zero-Config Setup ⚡

**Goal:** One command creates working app

**Tasks:**
1. Build `create-noormme-app` CLI
2. Scaffold Next.js project with templates
3. Auto-configure SQLite (WAL, pragmas, optimal settings)
4. Generate auth schemas
5. Set up NextAuth with adapter
6. Create initial migration

**Files to create:**
```
packages/
├── create-noormme-app/
│   ├── index.ts              # CLI entry
│   ├── templates/
│   │   ├── base/             # Next.js base
│   │   ├── lib/
│   │   │   ├── db.ts.template
│   │   │   ├── auth.ts.template
│   │   │   └── rbac.ts.template
│   │   ├── app/
│   │   │   └── api/auth/
│   │   └── migrations/
│   │       └── 001_initial.sql
│   └── utils/
│       ├── scaffold.ts
│       └── database.ts
```

**Key implementation:**
```typescript
// packages/create-noormme-app/index.ts
import { Command } from 'commander';
import { scaffold } from './utils/scaffold';

const program = new Command();

program
  .name('create-noormme-app')
  .argument('<project-name>')
  .action(async (projectName) => {
    console.log(`Creating NOORMME app: ${projectName}`);

    // 1. Scaffold Next.js project
    await scaffold.createNextApp(projectName);

    // 2. Install dependencies
    await scaffold.installDependencies([
      'kysely',
      'better-sqlite3',
      'next-auth',
      '@noormme/nextauth-adapter',
    ]);

    // 3. Copy templates
    await scaffold.copyTemplates(projectName);

    // 4. Initialize database
    await scaffold.initializeDatabase(projectName);

    // 5. Run initial migration
    await scaffold.runMigration(projectName, '001_initial.sql');

    console.log('✅ Done! Run: cd', projectName, '&& npm run dev');
  });

program.parse();
```

**Database initialization:**
```typescript
// utils/database.ts
export async function initializeDatabase(projectPath: string) {
  const dbPath = path.join(projectPath, 'database', 'app.db');

  // Create database directory
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  // Initialize SQLite with optimal settings
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Optimize for performance
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 30000000000'); // 30GB mmap

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  db.close();
}
```

### Phase 2: Admin Panel Generation ⚡

**Goal:** Auto-generated admin UI for all models

**Tasks:**
1. Create admin layout and navigation
2. Build reusable DataTable component
3. Generate CRUD pages for each model
4. Implement Server Actions for mutations
5. Add authentication protection

**File structure:**
```
packages/
├── noormme-admin/
│   ├── components/
│   │   ├── DataTable.tsx      # Generic table
│   │   ├── Form.tsx           # Generic form
│   │   ├── Navigation.tsx     # Sidebar
│   │   └── Field/
│   │       ├── TextField.tsx
│   │       ├── SelectField.tsx
│   │       └── DateField.tsx
│   ├── generators/
│   │   ├── page-generator.ts   # Generate CRUD pages
│   │   └── action-generator.ts # Generate Server Actions
│   └── templates/
│       ├── list-page.tsx.template
│       ├── detail-page.tsx.template
│       └── form-page.tsx.template
```

**DataTable component:**
```typescript
// packages/noormme-admin/components/DataTable.tsx
'use client';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  onEdit,
  onDelete
}: DataTableProps<T>) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(item[col.key])
                  : String(item[col.key])}
              </td>
            ))}
            <td>
              {onEdit && (
                <button onClick={() => onEdit(item)}>Edit</button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(item)}>Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Page generator:**
```typescript
// packages/noormme-admin/generators/page-generator.ts
export function generateListPage(model: ModelSchema) {
  return `
import { db } from '@/lib/db';
import { DataTable } from '@noormme/admin/components/DataTable';

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
        columns={[
          ${model.fields.map(f => `{ key: '${f.name}', label: '${f.label}' }`).join(',\n          ')}
        ]}
      />
    </div>
  );
}
  `.trim();
}
```

### Phase 3: RBAC Implementation 📋

**Goal:** Role-based access control out-of-box

**Tasks:**
1. Create Role and Permission models
2. Build middleware for route protection
3. Create helpers for Server Actions
4. Add admin UI for role management

**RBAC helpers:**
```typescript
// lib/rbac.ts (auto-generated)
import { auth } from './auth';
import { db } from './db';

export async function requireRole(roleName: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasRole = await db
    .selectFrom('user_roles')
    .innerJoin('roles', 'roles.id', 'user_roles.role_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('roles.name', '=', roleName)
    .selectAll()
    .executeTakeFirst();

  if (!hasRole) {
    throw new Error(`Forbidden: Requires ${roleName} role`);
  }
}

export async function requirePermission(
  resource: string,
  action: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await db
    .selectFrom('user_roles')
    .innerJoin('role_permissions', 'role_permissions.role_id', 'user_roles.role_id')
    .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('permissions.resource', '=', resource)
    .where('permissions.action', '=', action)
    .selectAll()
    .executeTakeFirst();

  if (!hasPermission) {
    throw new Error(`Forbidden: Requires ${action} on ${resource}`);
  }
}
```

**Usage in Server Actions:**
```typescript
'use server';

import { requireRole } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function deleteUser(id: string) {
  await requireRole('admin');

  return db
    .deleteFrom('users')
    .where('id', '=', id)
    .execute();
}
```

### Phase 4: Schema Management 📋

**Goal:** Zero-boilerplate schema definition and migrations

**Tasks:**
1. Create schema DSL (TypeScript-based)
2. Auto-generate migrations from schema changes
3. Migration runner (dev auto-applies, prod generates files)
4. Type generation from schemas

**Schema DSL:**
```typescript
// schemas/user.ts
import { schema } from '@noormme/core';

export const User = schema.table('users', {
  id: schema.text().primaryKey(),
  email: schema.text().unique().notNull(),
  name: schema.text(),
  emailVerified: schema.datetime(),
  image: schema.text(),
  createdAt: schema.datetime().default('CURRENT_TIMESTAMP'),
  updatedAt: schema.datetime().default('CURRENT_TIMESTAMP'),
});

// Auto-generates migration:
// migrations/002_add_users.sql
```

**Migration generator:**
```typescript
// packages/noormme-core/schema/migrator.ts
export async function generateMigration(
  schema: SchemaDefinition,
  currentDb: Kysely<any>
) {
  // 1. Introspect current database
  const currentSchema = await introspect(currentDb);

  // 2. Diff with new schema
  const changes = diff(currentSchema, schema);

  // 3. Generate SQL migration
  const sql = changes.map(change => {
    if (change.type === 'add_table') {
      return `CREATE TABLE ${change.table} (${change.columns.join(', ')});`;
    }
    if (change.type === 'add_column') {
      return `ALTER TABLE ${change.table} ADD COLUMN ${change.column};`;
    }
    // ... other change types
  }).join('\n');

  // 4. Save migration file
  const timestamp = Date.now();
  await fs.writeFile(
    `migrations/${timestamp}_auto.sql`,
    sql
  );
}
```

### Phase 5: CLI Tools 📋

**Goal:** Developer experience tools

**Tasks:**
1. `noormme dev` - dev server with hot reload
2. `noormme db:migrate` - run migrations
3. `noormme db:seed` - seed database
4. `noormme generate:model` - scaffold model

**CLI implementation:**
```typescript
// packages/noormme-cli/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .command('dev')
  .description('Start dev server with auto-migration')
  .action(async () => {
    // Run migrations
    await runMigrations();

    // Start Next.js dev
    spawn('next', ['dev'], { stdio: 'inherit' });
  });

program
  .command('db:migrate')
  .description('Run database migrations')
  .action(async () => {
    await runMigrations();
  });

program
  .command('generate:model <name>')
  .description('Generate a new model')
  .action(async (name) => {
    await generateModel(name);
  });

program.parse();
```

---

## Critical Implementation Details

### 1. Zero Config Philosophy

**Key principle:** Everything works immediately, customization optional

```typescript
// Default config (noormme.config.ts)
export default {
  database: {
    path: './database/app.db',
    wal: true,
    pool: {
      min: 1,
      max: 10,
    },
  },
  admin: {
    enabled: true,
    path: '/admin',
    title: 'Admin Panel',
  },
  auth: {
    providers: ['github'], // Pre-configured
  },
  rbac: {
    enabled: true,
    defaultRole: 'user',
  },
};
```

### 2. Type Safety Throughout

**Strategy:** Generate types from schemas, use Kysely's inference

```typescript
// Auto-generated: types/db.ts
export interface DB {
  users: UserTable;
  sessions: SessionTable;
  accounts: AccountTable;
  roles: RoleTable;
  permissions: PermissionTable;
  role_permissions: RolePermissionTable;
  user_roles: UserRoleTable;
}

// Usage (fully typed):
const users = await db
  .selectFrom('users')
  .where('email', '=', 'test@example.com')
  .selectAll()
  .execute(); // Type: UserTable[]
```

### 3. Admin Panel Architecture

**Component hierarchy:**
```
AdminLayout (auth check, navigation)
├── Dashboard (overview)
├── ModelList (generic table view)
│   └── DataTable (reusable)
├── ModelDetail (view/edit)
│   └── Form (reusable)
└── ModelDelete (confirmation)
```

### 4. NextAuth Adapter

**Kysely-based adapter:**
```typescript
// packages/noormme-nextauth-adapter/index.ts
import { Adapter } from 'next-auth/adapters';
import { Kysely } from 'kysely';

export function KyselyAdapter(db: Kysely<any>): Adapter {
  return {
    async createUser(data) {
      const user = await db
        .insertInto('users')
        .values({
          id: crypto.randomUUID(),
          ...data,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return user;
    },

    async getUser(id) {
      return await db
        .selectFrom('users')
        .where('id', '=', id)
        .selectAll()
        .executeTakeFirst() ?? null;
    },

    // ... other adapter methods
  };
}
```

---

## File Structure (Full Framework)

```
noormme/
├── packages/
│   ├── create-noormme-app/      # CLI for scaffolding
│   │   ├── templates/
│   │   └── index.ts
│   │
│   ├── noormme-core/            # Core utilities
│   │   ├── schema/              # Schema DSL
│   │   ├── migrations/          # Migration tools
│   │   └── generators/          # Code generation
│   │
│   ├── noormme-admin/           # Admin panel
│   │   ├── components/          # UI components
│   │   └── generators/          # Page generation
│   │
│   ├── noormme-cli/             # CLI tools
│   │   └── commands/
│   │
│   └── noormme-nextauth-adapter/ # NextAuth adapter
│       └── index.ts
│
└── examples/
    └── basic-app/               # Example generated app
```

---

## Testing Strategy

### 1. CLI Tests
```typescript
describe('create-noormme-app', () => {
  it('should scaffold project', async () => {
    await createApp('test-app');

    expect(fs.existsSync('test-app/lib/db.ts')).toBe(true);
    expect(fs.existsSync('test-app/app/admin')).toBe(true);
  });
});
```

### 2. Admin Generation Tests
```typescript
describe('Admin Generator', () => {
  it('should generate list page', () => {
    const code = generateListPage({
      name: 'User',
      tableName: 'users',
      fields: [{ name: 'email', label: 'Email' }],
    });

    expect(code).toContain('selectFrom');
    expect(code).toContain('DataTable');
  });
});
```

### 3. RBAC Tests
```typescript
describe('RBAC', () => {
  it('should enforce role requirement', async () => {
    await expect(
      requireRole('admin')
    ).rejects.toThrow('Forbidden');
  });
});
```

---

## Performance Considerations

### 1. SQLite Optimization
- WAL mode enabled by default
- Optimized pragmas (cache, mmap)
- Connection pooling for serverless

### 2. Admin Panel
- RSC for server-side rendering
- Pagination for large tables
- Lazy loading for relationships

### 3. Type Generation
- Cache generated types
- Only regenerate on schema changes
- Use incremental build

---

## Next Steps

### Immediate (Phase 1)
1. Build `create-noormme-app` CLI
2. Create project templates
3. Implement database initialization
4. Generate auth schemas

### Short-term (Phases 2-3)
1. Admin panel components
2. Page generators
3. RBAC implementation

### Long-term (Phases 4-5)
1. Schema DSL
2. Migration system
3. CLI tools

---

## Resources

- [Kysely Documentation](https://kysely.dev/)
- [NextAuth Documentation](https://authjs.dev/)
- [SQLite Optimization](https://www.sqlite.org/pragma.html)
- [Next.js App Router](https://nextjs.org/docs/app)
