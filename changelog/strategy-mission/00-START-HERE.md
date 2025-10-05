# NOORMME Development Handoff Checklist

## 🎯 Quick Summary

**What is NOORMME?**
Batteries-included framework for Next.js with zero-config SQLite, auth, admin, and RBAC - built on Kysely.

**Tech Stack:**
```
Next.js 13+ (App Router)
├── NOORMME (batteries-included framework)
│   ├── Auto-configured SQLite (WAL mode)
│   ├── NextAuth integration (out-of-box)
│   ├── Admin panel (auto-generated)
│   ├── RBAC (role-based access control)
│   └── Kysely (type-safe ORM layer)
```

**Key Principle:**
Django's philosophy of "batteries included" without Django's complexity - everything works immediately with zero boilerplate.

## 🎯 Core Mission

**The Problem:**
Starting a new Next.js app requires hours of boilerplate:
- Setting up SQLite or Postgres
- Configuring NextAuth
- Building an admin panel
- Implementing RBAC
- Writing schema migrations
- Connecting everything together

**The Solution:**
```bash
npx create-noormme-app my-app
cd my-app
npm run dev
```

You now have:
✅ SQLite database (auto-configured)
✅ Authentication (NextAuth pre-integrated)
✅ Admin panel at `/admin`
✅ RBAC with User/Role models
✅ Type-safe database queries (Kysely)
✅ Zero boilerplate schemas

**Not Django-like API, Django-like *experience*.**

## ✅ What's Already Built

### Foundation ✅
- [x] Kysely integration with SQLite
- [x] Type-safe database layer
- [x] NextAuth adapter
- [x] Basic schema introspection

**Note:** Previous Django-style API work (Manager, QuerySet) is being deprecated in favor of direct Kysely usage with zero-config setup.

## 🚧 What Still Needs Work

### Phase 1: Zero-Config Setup 🔄
Priority: **CRITICAL**

- [ ] `create-noormme-app` CLI tool
- [ ] Auto-configure SQLite (WAL mode, optimal settings)
- [ ] Pre-integrated NextAuth with SQLite adapter
- [ ] Default auth schemas (User, Session, Account)
- [ ] Auto-generate TypeScript types from schemas

**Why Important:** This IS the product - instant setup with zero boilerplate

**Estimated Effort:** 2-3 weeks

### Phase 2: Admin Panel 🔄
Priority: **CRITICAL**

- [ ] Auto-generated admin UI at `/admin`
- [ ] CRUD operations for all models
- [ ] Authentication-protected routes
- [ ] Responsive admin dashboard
- [ ] Customizable via config

**Why Important:** Django's killer feature - instant admin panel

**Estimated Effort:** 3-4 weeks

**Approach:** Start minimal (table views, basic forms), iterate based on usage

### Phase 3: RBAC System 📋
Priority: **HIGH**

- [ ] Role and Permission models (auto-included)
- [ ] Middleware for permission checking
- [ ] Decorators/helpers for Server Actions
- [ ] Admin UI for managing roles/permissions

**Why Important:** Production apps need access control

**Estimated Effort:** 2-3 weeks

### Phase 4: Schema Management 📋
Priority: **HIGH**

- [ ] Zero-boilerplate schema definition
- [ ] Auto-migration on schema changes (dev mode)
- [ ] Migration files for production
- [ ] Schema validation

**Why Important:** Developers shouldn't write SQL by hand

**Estimated Effort:** 3-4 weeks

**Key Decision:** Use Kysely's schema builder or create our own DSL?

### Phase 5: Developer Experience 📋
Priority: **MEDIUM**

- [ ] `noormme dev` - dev server with hot reload
- [ ] `noormme db:migrate` - run migrations
- [ ] `noormme db:seed` - seed database
- [ ] `noormme generate:model` - scaffold new model
- [ ] Type-safe query helpers (wrapping Kysely)

**Estimated Effort:** 2-3 weeks

## 🔑 Critical Implementation Details

### 1. Zero Config, Maximum Flexibility

```typescript
// ✅ Works immediately after `create-noormme-app`
import { db } from '@/lib/db';

const users = await db
  .selectFrom('users')
  .selectAll()
  .execute();

// ✅ But also customizable
// lib/db.config.ts
export default {
  dialect: 'sqlite',
  connection: process.env.DATABASE_URL,
  admin: {
    enabled: true,
    path: '/admin',
  },
  auth: {
    providers: ['github', 'google'],
  },
};
```

### 2. Use Kysely Directly - No Abstraction Layer

```typescript
// ❌ Don't create Manager/QuerySet wrappers
const user = await User.objects.filter({ email: 'test@test.com' }).first();

// ✅ Use Kysely directly (it's already great!)
const user = await db
  .selectFrom('users')
  .where('email', '=', 'test@test.com')
  .selectAll()
  .executeTakeFirst();
```

**Why?** Kysely is already type-safe and composable. Focus on setup automation, not API abstraction.

### 3. Auto-Generate Everything Possible

```typescript
// After creating a schema, auto-generate:
// 1. TypeScript types
// 2. Admin UI routes
// 3. RBAC permission checks
// 4. NextAuth callbacks

// Users write schemas, we generate the rest
```

### 4. Tight NextAuth Integration

```typescript
// ✅ Auto-configured in create-noormme-app
// app/api/auth/[...nextauth]/route.ts is already set up
// User/Session/Account models already exist
// Just add providers and go
```

## 🧪 Testing Requirements

### Must Have Tests For:
- [ ] All QuerySet methods (filter, exclude, get, all, etc.)
- [ ] Type generation from various SQLite schemas
- [ ] NextAuth adapter (all methods)
- [ ] Relationship loading (prefetch, lazy)
- [ ] Edge cases (empty results, multiple results, etc.)

### Test Coverage Target: 80%+

**Run tests:**
```bash
npm test
```

## 📦 File Structure

```
src/
├── core/
│   ├── database.ts       # Main NOORMME class
│   ├── manager.ts        # Manager (provides .objects)
│   ├── queryset.ts       # QuerySet implementation
│   └── lookups.ts        # Django field lookups (email__endswith)
│
├── introspection/
│   ├── schema-reader.ts  # SQLite introspection
│   ├── type-generator.ts # TypeScript type generation
│   └── relationships.ts  # Relationship detection
│
├── adapters/
│   └── nextauth.ts       # NextAuth adapter
│
├── dialects/
│   ├── sqlite.ts         # better-sqlite3
│   ├── libsql.ts         # Turso/LibSQL (Edge)
│   └── auto.ts           # Auto-detect runtime
│
└── nextjs/
    ├── server-components.ts
    ├── server-actions.ts
    └── cache.ts
```

## 🐛 Known Issues & Workarounds

### Issue 1: Edge Runtime Compatibility
**Problem:** `better-sqlite3` doesn't work in Edge Runtime
**Workaround:** Use Turso/LibSQL for Edge deployments
**Status:** Documented, needs testing

### Issue 2: Complex Relationship Loading
**Problem:** Nested prefetch not fully implemented
**Workaround:** Users can use raw Kysely joins
**Status:** In progress (Phase 5)

### Issue 3: Type Generation for Complex Schemas
**Problem:** Some SQLite types don't map perfectly to TypeScript
**Workaround:** Manual type overrides
**Status:** Documented, acceptable for now

## 🚀 Quick Start for Development

```bash
# 1. Clone and install
git clone <repo>
cd noormme
npm install

# 2. Run tests
npm test

# 3. Build
npm run build

# 4. Try example
cd examples/nextjs-app
npm install
npm run dev
```

## 📞 Questions to Answer Before Proceeding

1. **What's the priority?** Relationship loading, migrations, or DX improvements?
2. **Target users?** Kysely users, Django migrants, or Next.js beginners?
3. **Edge Runtime?** Is Edge Runtime support critical for launch?

## 🎯 Success Metrics

### Technical
- [ ] Query execution <10ms average
- [ ] Type safety: 100% (no `any` types in public API)
- [ ] Test coverage >80%
- [ ] Zero runtime dependencies beyond Kysely + SQLite driver

### Developer Experience
- [ ] 5-minute setup time
- [ ] Django developers feel at home
- [ ] Kysely users appreciate the ergonomics
- [ ] Clear error messages with suggestions

### Adoption
- [ ] 100+ GitHub stars
- [ ] 1,000+ NPM downloads/month
- [ ] 10+ production deployments
- [ ] Positive community feedback

## 📋 Immediate Next Steps

1. **Review Implementation Guide** - Understand the architecture
2. **Run existing tests** - Make sure everything works
3. **Pick a phase** - Choose what to build next (recommend Phase 5)
4. **Set up dev environment** - Get ready to code
5. **Read Kysely docs** - Understand the foundation

## 🔗 Essential Links

- [Kysely Documentation](https://kysely.dev/)
- [NextAuth Adapter Spec](https://authjs.dev/reference/adapters)
- [Django QuerySet API](https://docs.djangoproject.com/en/stable/ref/models/querysets/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## ✨ Remember

**Core Principle:** Django's batteries-included philosophy with Next.js-native patterns. Zero boilerplate, instant setup, maximum type safety.

**Not building:** Django's ORM API (we have Kysely for that)
**Building:** Django's "it just works" experience for Next.js

**When in doubt:** Ask "Does this reduce boilerplate?" and "Does this work out of the box?"

---

**Last Updated:** October 2025
**Status:** Strategic pivot to batteries-included framework ⚡
**Next Milestone:** Zero-config setup (Phase 1)
