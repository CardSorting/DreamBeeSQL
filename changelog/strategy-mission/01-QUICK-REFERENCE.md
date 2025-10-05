# NOORMME Quick Reference

**One-page guide to NOORMME's architecture, tech stack, and key decisions**

---

## 📦 What is NOORMME?

Django-style API wrapper built on Kysely for Next.js + SQLite applications

```typescript
// The goal:
const users = await User.objects
  .filter({ is_active: true })
  .exclude({ email__endswith: '@spam.com' })
  .all();
```

---

## 🏗️ Technology Stack

```
┌─────────────────────────────────────┐
│         Next.js 13+                 │
│         (App Router)                │
├─────────────────────────────────────┤
│         NextAuth                    │
│         (Authentication)            │
├─────────────────────────────────────┤
│         NOORMME                     │
│    (Django-style API Layer)         │
├─────────────────────────────────────┤
│         Kysely                      │
│   (Type-safe Query Builder)         │
├─────────────────────────────────────┤
│         SQLite                      │
│       (WAL Mode)                    │
└─────────────────────────────────────┘
```

---

## 🎯 Core Architecture Layers

### Layer 1: Kysely (Foundation)
- Type-safe SQL query building
- SQL generation
- TypeScript type inference

### Layer 2: NOORMME (Django API)
- `.objects.filter()`, `.exclude()`, `.get()`, `.all()`
- Wraps Kysely queries with Django syntax
- Maintains Kysely's type safety

### Layer 3: Auto-Discovery
- SQLite schema introspection
- TypeScript type generation
- Automatic model creation

### Layer 4: NextAuth Integration
- Built-in adapter for SQLite
- Session/account/user management
- Type-safe auth operations

---

## 🔑 Key Implementation Principles

### 1. **Wrap Kysely, Don't Replace**
```typescript
// ✅ GOOD: Wrap Kysely
filter(conditions) {
  this.kyselyQuery = this.kyselyQuery.where(...);
  return this;
}

// ❌ BAD: Rebuild from scratch
filter(conditions) {
  // Don't manually build SQL!
}
```

### 2. **Preserve Type Safety**
```typescript
// ✅ GOOD: Keep Kysely's types
class Manager<DB, TB extends keyof DB> {
  objects: QuerySet<DB, TB, DB[TB]>;
}

// ❌ BAD: Lose types
class Manager {
  objects: QuerySet<any>;
}
```

### 3. **Provide Escape Hatch**
```typescript
// Always allow dropping to raw Kysely
const result = await db.kysely
  .selectFrom('users')
  .where(/* complex query */)
  .execute();
```

### 4. **Cache Schema**
```typescript
// ✅ Cache schema introspection
let schemaCache = null;
const schema = schemaCache || await introspectDatabase(db);

// ❌ Don't introspect on every request
```

---

## 📁 File Structure

```
src/
├── core/
│   ├── database.ts       # Main NOORMME class
│   ├── manager.ts        # .objects manager
│   ├── queryset.ts       # QuerySet (filter, exclude, etc.)
│   └── lookups.ts        # Django field lookups
│
├── introspection/
│   ├── schema-reader.ts  # SQLite introspection
│   ├── type-generator.ts # TS type generation
│   └── relationships.ts  # Relationship detection
│
├── adapters/
│   └── nextauth.ts       # NextAuth adapter
│
├── dialects/
│   ├── sqlite.ts         # better-sqlite3
│   ├── libsql.ts         # Turso (Edge Runtime)
│   └── auto.ts           # Auto-detect
│
└── nextjs/
    ├── server-components.ts
    ├── server-actions.ts
    └── cache.ts
```

---

## ✅ What's Built (Phases 1-4)

- [x] **Core Kysely wrapper** with Django API
- [x] **Auto-discovery** from SQLite schema
- [x] **Type generation** for TypeScript
- [x] **Next.js integration** (Server Components, Actions, Edge)
- [x] **NextAuth adapter** for authentication

---

## 🚧 What's Next (Phases 5-8)

### Phase 5: Enhanced Relationships 🔄
Priority: **HIGH**
- Improve `prefetch()` for eager loading
- Nested relationships (`prefetch('author.profile')`)
- N+1 query prevention

### Phase 6: Advanced Queries 📋
Priority: **MEDIUM**
- Aggregations (`Count()`, `Sum()`, `Avg()`)
- `Q` objects for complex filters
- `.annotate()` for computed fields

### Phase 7: Migration System 📋
Priority: **MEDIUM**
- Simple migration generation
- Schema diffing
- Rollback support

### Phase 8: Developer Experience 📋
Priority: **LOW** (high impact)
- Better error messages
- Query debugging tools
- Performance warnings

---

## 🐛 Known Issues

1. **Edge Runtime:** `better-sqlite3` doesn't work → Use Turso/LibSQL
2. **Nested Prefetch:** Not fully implemented → Use raw Kysely joins
3. **Complex Type Mapping:** Some SQLite types → Manual overrides OK

---

## 🎯 API Example

```typescript
// Initialize
const db = new NOORMME({ database: './app.db' });

// Get model (auto-discovered)
const User = db.model('users');

// Django-style queries
const users = await User.objects
  .filter({ is_active: true })
  .exclude({ email__endswith: '@spam.com' })
  .orderBy('-created_at')
  .all();

// Single record
const user = await User.objects.get({ id: 1 });

// With relationships
const posts = await Post.objects
  .prefetch('author', 'comments')
  .filter({ published: true })
  .all();

// Drop to Kysely for complex queries
const complex = await db.kysely
  .selectFrom('users')
  .leftJoin('posts', 'users.id', 'posts.author_id')
  .select(['users.name', 'posts.title'])
  .execute();
```

---

## 📊 Success Metrics

**Technical:**
- Query time: <10ms average
- Type safety: 100% (no `any` in public API)
- Test coverage: >80%

**Developer Experience:**
- Setup time: 5 minutes
- Django devs feel at home
- Kysely users appreciate ergonomics

**Adoption:**
- 100+ GitHub stars
- 1,000+ NPM downloads/month
- 10+ production deployments

---

## 🔗 Essential Resources

- [Kysely Docs](https://kysely.dev/)
- [NextAuth Adapter Spec](https://authjs.dev/reference/adapters)
- [Django QuerySet API](https://docs.djangoproject.com/en/stable/ref/models/querysets/)

---

## 🚀 Quick Start Development

```bash
# Clone and setup
git clone <repo>
cd noormme
npm install

# Run tests
npm test

# Build
npm run build

# Example
cd examples/nextjs-app
npm install && npm run dev
```

---

## 💡 Remember

**We're NOT building:** Django ORM from scratch

**We ARE building:** Django-style API wrapper for Kysely

**Foundation:** Kysely (proven, type-safe, not proprietary)

**Target:** Next.js + SQLite developers who want Django's ergonomics

**Escape Hatch:** Always allow dropping to raw Kysely

---

**Last Updated:** October 2025
**Status:** Phases 1-4 Complete ✅
**Next:** Phase 5 (Enhanced Relationships)
