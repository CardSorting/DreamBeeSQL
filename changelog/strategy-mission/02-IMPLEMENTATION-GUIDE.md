# NOORMME Implementation Guide

## Quick Start: What You're Building

**NOORMME** = Django-style API wrapper on top of Kysely for Next.js + SQLite + NextAuth

```typescript
// The end goal API:
const users = await User.objects
  .filter({ is_active: true })
  .exclude({ email__endswith: '@spam.com' })
  .all(); // ← Django-style API powered by Kysely underneath
```

## Technology Stack

### Core Dependencies
1. **Kysely** - Type-safe SQL query builder (foundation)
2. **better-sqlite3** - SQLite driver for Node.js
3. **TypeScript** - Full type safety throughout

### Integration Stack
1. **Next.js** - App Router, Server Components, Server Actions
2. **NextAuth** - Authentication (we provide the adapter)
3. **SQLite** - Database with WAL mode

## Architecture Layers

### Layer 1: Kysely Foundation
**What Kysely Provides:**
- Type-safe query builder
- SQL generation
- TypeScript type inference
- Database connection management

**How We Use It:**
```typescript
// NOORMME wraps Kysely queries
class DjangoQuerySet<T> {
  filter(conditions: Partial<T>) {
    // Internally uses kysely.selectFrom().where()
    return this.kyselyQuery.where(/* convert conditions */);
  }
}
```

### Layer 2: Django-Style API
**What We Build:**
- `.objects` manager
- `.filter()`, `.exclude()`, `.get()`, `.all()` methods
- Relationship loading helpers
- QuerySet chaining

**Implementation Pattern:**
```typescript
// Core pattern: Wrap Kysely with Django API
export class Manager<T> {
  constructor(
    private kysely: Kysely<Database>,
    private tableName: string
  ) {}

  get objects() {
    return new QuerySet<T>(this.kysely, this.tableName);
  }
}

class QuerySet<T> {
  private kyselyQuery: SelectQueryBuilder<Database, any, any>;

  filter(conditions: Partial<T>): QuerySet<T> {
    // Convert Django-style conditions to Kysely where clauses
    this.kyselyQuery = this.kyselyQuery.where(/* ... */);
    return this;
  }

  async all(): Promise<T[]> {
    // Execute the Kysely query
    return await this.kyselyQuery.execute();
  }
}
```

### Layer 3: Auto-Discovery & Type Generation
**What We Build:**
- SQLite schema introspection
- TypeScript type generation
- Automatic model creation

**How It Works:**
```typescript
// 1. Introspect SQLite database
const schema = await introspectDatabase(db);
// {
//   users: {
//     columns: { id: 'INTEGER', email: 'TEXT', ... },
//     foreignKeys: [...],
//     indexes: [...]
//   }
// }

// 2. Generate TypeScript types
generateTypes(schema);
// Creates: types/database.ts with Kysely types

// 3. Create models automatically
const User = db.model('users'); // Returns Manager<User>
```

### Layer 4: NextAuth Integration
**What We Build:**
- NextAuth adapter for SQLite
- Session/account/user table management
- Type-safe auth operations

**Implementation:**
```typescript
export function NOORMMEAdapter(db: NOORMME): Adapter {
  return {
    async createUser(data) {
      return await db.model('users').objects.create(data);
    },
    async getUser(id) {
      return await db.model('users').objects.get({ id });
    },
    // ... other adapter methods
  };
}
```

## Implementation Roadmap

### Phase 1: Core Kysely Wrapper ✅

**Goal:** Basic Django-style API on top of Kysely

**Tasks:**
1. Set up Kysely with SQLite
2. Implement Manager class
3. Implement QuerySet with basic methods:
   - `.filter(conditions)`
   - `.exclude(conditions)`
   - `.get(conditions)`
   - `.all()`
   - `.first()`
   - `.count()`
4. Type safety through Kysely's inference

**Files to Create:**
```
src/
├── core/
│   ├── manager.ts        # Manager class
│   ├── queryset.ts       # QuerySet implementation
│   └── database.ts       # Main NOORMME class
```

**Example Implementation:**
```typescript
// src/core/queryset.ts
import { SelectQueryBuilder } from 'kysely';

export class QuerySet<DB, TB extends keyof DB, O> {
  constructor(
    private qb: SelectQueryBuilder<DB, TB, O>
  ) {}

  filter(conditions: Partial<O>): QuerySet<DB, TB, O> {
    let query = this.qb;

    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key as any, '=', value);
    }

    return new QuerySet(query);
  }

  exclude(conditions: Partial<O>): QuerySet<DB, TB, O> {
    let query = this.qb;

    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key as any, '!=', value);
    }

    return new QuerySet(query);
  }

  async all(): Promise<O[]> {
    return await this.qb.execute();
  }

  async get(conditions: Partial<O>): Promise<O> {
    const results = await this.filter(conditions).qb.limit(2).execute();

    if (results.length === 0) {
      throw new Error('Object does not exist');
    }
    if (results.length > 1) {
      throw new Error('Multiple objects returned');
    }

    return results[0];
  }
}
```

### Phase 2: Auto-Discovery & Type Generation ✅

**Goal:** Automatically detect schema and generate types

**Tasks:**
1. SQLite schema introspection
2. TypeScript type generation
3. Dynamic model creation
4. Relationship detection

**Files to Create:**
```
src/
├── introspection/
│   ├── schema-reader.ts     # Read SQLite schema
│   ├── type-generator.ts    # Generate TS types
│   └── relationship-detector.ts
```

**Key Implementation:**
```typescript
// src/introspection/schema-reader.ts
export async function introspectDatabase(db: Database) {
  // Query SQLite system tables
  const tables = await db
    .selectFrom('sqlite_master')
    .where('type', '=', 'table')
    .selectAll()
    .execute();

  const schema: DatabaseSchema = {};

  for (const table of tables) {
    // Get column info
    const columns = await db.pragma(`table_info(${table.name})`);

    // Get foreign keys
    const foreignKeys = await db.pragma(`foreign_key_list(${table.name})`);

    schema[table.name] = {
      columns: parseColumns(columns),
      foreignKeys: parseForeignKeys(foreignKeys),
    };
  }

  return schema;
}
```

### Phase 3: Next.js Integration ✅

**Goal:** Optimize for Next.js patterns

**Tasks:**
1. Server Component compatibility
2. Server Actions support
3. Edge Runtime compatibility
4. Connection pooling for serverless

**Files to Create:**
```
src/
├── nextjs/
│   ├── server-components.ts
│   ├── server-actions.ts
│   └── edge-runtime.ts
```

**Key Considerations:**
- SQLite in Edge Runtime (use edge-compatible driver or Turso)
- Connection pooling for serverless cold starts
- Optimized for App Router patterns

### Phase 4: NextAuth Adapter ✅

**Goal:** Seamless NextAuth integration

**Tasks:**
1. Implement NextAuth Adapter interface
2. Create auth table schemas
3. Type-safe auth operations
4. Session management

**Files to Create:**
```
src/
├── adapters/
│   └── nextauth.ts          # NextAuth adapter
```

**Implementation:**
```typescript
// src/adapters/nextauth.ts
import { Adapter } from 'next-auth/adapters';

export function NOORMMEAdapter(db: NOORMME): Adapter {
  const users = db.model('users');
  const accounts = db.model('accounts');
  const sessions = db.model('sessions');

  return {
    async createUser(data) {
      return await users.objects.create(data);
    },

    async getUser(id) {
      try {
        return await users.objects.get({ id });
      } catch {
        return null;
      }
    },

    async getUserByEmail(email) {
      try {
        return await users.objects.get({ email });
      } catch {
        return null;
      }
    },

    async updateUser(data) {
      const { id, ...updateData } = data;
      return await users.objects.filter({ id }).update(updateData);
    },

    async createSession(data) {
      return await sessions.objects.create(data);
    },

    async getSessionAndUser(sessionToken) {
      const session = await sessions.objects
        .filter({ sessionToken })
        .prefetch('user')
        .first();

      return session ? { session, user: session.user } : null;
    },

    async updateSession(data) {
      const { sessionToken, ...updateData } = data;
      return await sessions.objects
        .filter({ sessionToken })
        .update(updateData);
    },

    async deleteSession(sessionToken) {
      return await sessions.objects
        .filter({ sessionToken })
        .delete();
    },

    async linkAccount(data) {
      return await accounts.objects.create(data);
    },

    async unlinkAccount({ provider, providerAccountId }) {
      return await accounts.objects
        .filter({ provider, providerAccountId })
        .delete();
    },
  };
}
```

### Phase 5: Relationship Loading 🔄

**Goal:** Efficient relationship loading

**Tasks:**
1. `prefetch()` for eager loading
2. Lazy loading helpers
3. Nested relationship support
4. N+1 query prevention

**Implementation Strategy:**
```typescript
// Django-style prefetch using Kysely joins
class QuerySet<T> {
  async prefetch(...relations: string[]): QuerySet<T> {
    for (const relation of relations) {
      // Analyze relationship from schema
      const fk = this.schema.relationships[relation];

      // Add Kysely join
      this.kyselyQuery = this.kyselyQuery
        .leftJoin(fk.table, `${this.tableName}.${fk.column}`, `${fk.table}.id`)
        .select(/* select related fields */);
    }

    return this;
  }
}
```

### Phase 6: Advanced Features 📋

**Future enhancements:**
1. Query optimization and analysis
2. Migration system
3. Transaction support
4. Aggregation helpers
5. Raw SQL escape hatch
6. Performance monitoring

## Critical Implementation Details

### 1. Type Safety Strategy

**Problem:** How to maintain type safety when wrapping Kysely?

**Solution:** Leverage Kysely's generic types throughout

```typescript
// DON'T: Lose type safety
class Manager {
  objects: QuerySet<any>; // ❌
}

// DO: Preserve Kysely's types
class Manager<DB, TB extends keyof DB> {
  objects: QuerySet<DB, TB, DB[TB]>; // ✅

  constructor(
    private kysely: Kysely<DB>,
    private tableName: TB
  ) {
    this.objects = new QuerySet(
      kysely.selectFrom(tableName).selectAll()
    );
  }
}
```

### 2. Django-Style Field Lookups

**Problem:** Django has `email__endswith`, `created_at__gte`, etc.

**Solution:** Parse lookup syntax and convert to Kysely operators

```typescript
// src/core/lookups.ts
export function parseLookup(field: string, value: any) {
  const [fieldName, lookup = 'exact'] = field.split('__');

  const operators = {
    exact: '=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    contains: 'like',
    startswith: 'like',
    endswith: 'like',
  };

  let finalValue = value;
  if (lookup === 'contains') finalValue = `%${value}%`;
  if (lookup === 'startswith') finalValue = `${value}%`;
  if (lookup === 'endswith') finalValue = `%${value}`;

  return {
    field: fieldName,
    operator: operators[lookup],
    value: finalValue,
  };
}

// Usage in QuerySet
filter(conditions: Record<string, any>) {
  let query = this.qb;

  for (const [field, value] of Object.entries(conditions)) {
    const { field: fieldName, operator, value: finalValue } = parseLookup(field, value);
    query = query.where(fieldName as any, operator as any, finalValue);
  }

  return new QuerySet(query);
}
```

### 3. Connection Management

**Problem:** Serverless cold starts and connection pooling

**Solution:** Singleton pattern with lazy initialization

```typescript
// src/core/connection.ts
let dbInstance: Kysely<Database> | null = null;

export function getDatabase(config: Config) {
  if (!dbInstance) {
    dbInstance = new Kysely<Database>({
      dialect: new SqliteDialect({
        database: new Database(config.database),
      }),
    });
  }
  return dbInstance;
}

// Usage
export class NOORMME {
  private db: Kysely<Database>;

  constructor(config: Config) {
    this.db = getDatabase(config);
  }
}
```

### 4. Edge Runtime Compatibility

**Problem:** `better-sqlite3` doesn't work in Edge Runtime

**Solutions:**
1. **Development**: Use `better-sqlite3` (Node.js)
2. **Edge Production**: Use Turso/LibSQL (HTTP-based)

```typescript
// src/dialects/auto.ts
export function createDialect(config: Config) {
  if (config.runtime === 'edge') {
    // Use HTTP-based SQLite (Turso)
    return new LibsqlDialect({
      url: config.url,
      authToken: config.authToken,
    });
  } else {
    // Use better-sqlite3 (Node.js)
    return new SqliteDialect({
      database: new Database(config.database),
    });
  }
}
```

## File Structure

```
noormme/
├── src/
│   ├── core/
│   │   ├── database.ts           # Main NOORMME class
│   │   ├── manager.ts            # Manager (provides .objects)
│   │   ├── queryset.ts           # QuerySet (filter, exclude, etc.)
│   │   └── lookups.ts            # Django-style field lookups
│   │
│   ├── introspection/
│   │   ├── schema-reader.ts      # Read SQLite schema
│   │   ├── type-generator.ts     # Generate TypeScript types
│   │   └── relationships.ts      # Detect relationships
│   │
│   ├── adapters/
│   │   └── nextauth.ts           # NextAuth adapter
│   │
│   ├── dialects/
│   │   ├── sqlite.ts             # better-sqlite3 dialect
│   │   ├── libsql.ts             # Turso/LibSQL for Edge
│   │   └── auto.ts               # Auto-detect runtime
│   │
│   ├── nextjs/
│   │   ├── server-components.ts  # RSC helpers
│   │   ├── server-actions.ts     # Server action helpers
│   │   └── cache.ts              # Next.js cache integration
│   │
│   └── index.ts                  # Public API
│
├── types/
│   └── database.d.ts             # Generated types
│
└── tests/
    ├── core/
    ├── introspection/
    └── adapters/
```

## Testing Strategy

### 1. Core QuerySet Tests
```typescript
// tests/core/queryset.test.ts
describe('QuerySet', () => {
  it('should filter records', async () => {
    const users = await User.objects.filter({ is_active: true }).all();
    expect(users).toHaveLength(2);
  });

  it('should chain filters', async () => {
    const users = await User.objects
      .filter({ is_active: true })
      .exclude({ email__endswith: '@spam.com' })
      .all();
    expect(users).toHaveLength(1);
  });

  it('should throw on multiple results for get()', async () => {
    await expect(
      User.objects.get({ is_active: true })
    ).rejects.toThrow('Multiple objects returned');
  });
});
```

### 2. Type Generation Tests
```typescript
// tests/introspection/type-generator.test.ts
describe('Type Generator', () => {
  it('should generate correct types from schema', async () => {
    const schema = await introspectDatabase(db);
    const types = generateTypes(schema);

    expect(types).toContain('export interface User');
    expect(types).toContain('id: number');
    expect(types).toContain('email: string');
  });
});
```

### 3. NextAuth Adapter Tests
```typescript
// tests/adapters/nextauth.test.ts
describe('NextAuth Adapter', () => {
  const adapter = NOORMMEAdapter(db);

  it('should create user', async () => {
    const user = await adapter.createUser({
      email: 'test@example.com',
      emailVerified: null,
    });

    expect(user.email).toBe('test@example.com');
  });

  it('should get session and user', async () => {
    const result = await adapter.getSessionAndUser('session-token');
    expect(result?.user).toBeDefined();
    expect(result?.session).toBeDefined();
  });
});
```

## Performance Considerations

### 1. Query Optimization
- Use `.select()` to limit columns
- Implement query analysis
- Add index suggestions

### 2. Connection Pooling
- Singleton pattern for connections
- Lazy initialization
- Proper cleanup on shutdown

### 3. Caching Strategy
- Integrate with Next.js cache
- Query result caching
- Schema cache (don't introspect on every request)

```typescript
// Cache schema introspection
let schemaCache: DatabaseSchema | null = null;

export async function getSchema(db: Kysely<Database>, refresh = false) {
  if (!schemaCache || refresh) {
    schemaCache = await introspectDatabase(db);
  }
  return schemaCache;
}
```

## Common Pitfalls & Solutions

### Pitfall 1: Losing Type Safety
**Problem:** Using `any` types breaks Kysely's inference
**Solution:** Always use generic types and preserve Kysely's type parameters

### Pitfall 2: N+1 Queries
**Problem:** Lazy loading causes N+1 queries
**Solution:** Implement `prefetch()` for eager loading with Kysely joins

### Pitfall 3: Edge Runtime Incompatibility
**Problem:** `better-sqlite3` uses native modules
**Solution:** Auto-detect runtime and use LibSQL/Turso for Edge

### Pitfall 4: Schema Introspection Overhead
**Problem:** Introspecting schema on every request is slow
**Solution:** Cache schema, only regenerate on schema changes

## Next Steps for Implementation

### Immediate Priorities
1. ✅ Implement core QuerySet with Django API
2. ✅ Add auto-discovery and type generation
3. ✅ Build NextAuth adapter
4. 📋 Enhance relationship loading
5. 📋 Add migration system
6. 📋 Performance monitoring

### Documentation Needed
1. API Reference (all methods)
2. Next.js integration guide
3. Migration from Prisma/Drizzle guide
4. Best practices and patterns
5. Troubleshooting guide

### Community & Ecosystem
1. Example Next.js projects
2. Starter templates
3. Video tutorials
4. Blog posts and announcements

## Resources

### Essential Reading
- [Kysely Documentation](https://kysely.dev/)
- [NextAuth Adapter Spec](https://authjs.dev/reference/adapters)
- [Django QuerySet API](https://docs.djangoproject.com/en/stable/ref/models/querysets/)
- [SQLite Schema Introspection](https://www.sqlite.org/pragma.html#pragma_table_info)

### Related Projects
- **Kysely**: Foundation we build on
- **Drizzle ORM**: Schema-first approach (different strategy)
- **Prisma**: Schema-first with custom engine (different strategy)
- **Django ORM**: Inspiration for API design
