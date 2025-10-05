# NOORMME Quick Reference

**One-page guide to NOORMME's batteries-included approach for Next.js**

---

## 📦 What is NOORMME?

Batteries-included framework for Next.js with zero-config SQLite, auth, admin, and RBAC.

```bash
# Before NOORMME: Hours of boilerplate
# - Setup database
# - Configure auth
# - Build admin panel
# - Implement RBAC
# - Write migrations

# With NOORMME: One command
npx create-noormme-app my-app
cd my-app
npm run dev

# You get:
# Working database ✅
# Working auth ✅
# Working admin panel ✅
# Working permissions ✅
# Ready to build features ✅

# Batteries included. 🔋
```

## The Stack:

✅ **Database:** Zero-config SQLite (with auto-discovery)
✅ **Auth:** NextAuth pre-configured (never rewrite again)
✅ **Admin:** Auto-generated admin panel (Django admin vibes)
✅ **RBAC:** Built-in role-based access control
✅ **Queue:** Background jobs & task management (Queuebase)
✅ **Framework:** Next.js App Router
✅ **Language:** TypeScript
✅ **Philosophy:** "Just works"

---

## 🏗️ Modern Technology Stack

```
┌─────────────────────────────────────┐
│         Next.js 15+                 │
│    (App Router + Server Components) │
├─────────────────────────────────────┤
│         NOORMME CLI                 │
│    (Setup & Code Generation)        │
├─────────────────────────────────────┤
│  ┌─────────┬──────────┬──────────┐  │
│  │ Auth.js │  Admin   │   RBAC   │  │
│  │   v5    │  Panel   │(Server   │  │
│  │(Modern) │(Server   │Actions)  │  │
│  │         │Components)│          │  │
│  └─────────┴──────────┴──────────┘  │
├─────────────────────────────────────┤
│         Queuebase                   │
│   (Background Jobs & Tasks)         │
├─────────────────────────────────────┤
│         Kysely                      │
│   (Type-safe Query Builder)         │
├─────────────────────────────────────┤
│         SQLite                      │
│    (Auto-configured WAL)            │
└─────────────────────────────────────┘
```

---

## 🎯 Core Components

### 1. Zero-Config Database
- SQLite auto-configured with WAL mode
- Connection pooling for performance
- Type-safe queries via Kysely
- No manual setup required

### 2. Modern Authentication (Auth.js v5)
- Auth.js v5 pre-integrated
- User/Session/Account tables ready
- OAuth providers (GitHub, Google, etc.)
- Modern middleware with Edge Runtime
- Progressive enhancement

### 3. Modern Admin Panel (Server Components)
- `/admin` route with Server Components
- CRUD with Server Actions
- Role-based access control
- Responsive UI with Tailwind CSS
- Progressive enhancement

### 4. Modern RBAC (Server Actions)
- Role and Permission models
- Modern middleware with Edge Runtime
- Server Actions for mutations
- Redirect patterns (not exceptions)
- Type-safe helpers

### 5. Background Jobs & Tasks (Queuebase)
- Zero-config task queue with Queuebase
- Auto-generated task definitions
- Admin panel integration for monitoring
- Type-safe task handlers
- Scheduled jobs and retries

---

## 🔑 Key Implementation Principles

### 1. **Zero Config, Maximum Flexibility**
```typescript
// ✅ Works immediately after setup
import { db } from '@/lib/db';

const users = await db
  .selectFrom('users')
  .selectAll()
  .execute();

// ✅ But also customizable
// noormme.config.ts
export default {
  database: {
    path: './data/app.db',
    wal: true,
  },
  admin: {
    enabled: true,
    path: '/admin',
  },
  auth: {
    providers: ['github', 'google'],
  },
};
```

### 2. **Use Kysely Directly**
```typescript
// ✅ GOOD: Kysely is already type-safe
const user = await db
  .selectFrom('users')
  .where('email', '=', 'user@example.com')
  .selectAll()
  .executeTakeFirst();

// ❌ BAD: Don't create abstraction layers
const user = await User.objects
  .filter({ email: 'user@example.com' })
  .first();
```

**Why?** Kysely is excellent. We focus on setup automation, not API replacement.

### 3. **Modern Code Generation**
```typescript
// Define schema (simple TypeScript)
// schemas/user.ts
export const userSchema = {
  id: serial(),
  email: string().unique(),
  name: string(),
  createdAt: timestamp(),
};

// NOORMME auto-generates:
// ✅ Database tables
// ✅ TypeScript types
// ✅ Server Components for admin UI
// ✅ Server Actions for mutations
// ✅ Modern middleware for RBAC
// ✅ Auth.js v5 integration
// ✅ Progressive enhancement
```

### 4. **Convention Over Configuration**
```typescript
// Default paths (but customizable):
/admin          → Admin panel
/api/auth       → NextAuth routes
/api/db         → Database playground (dev only)

// Auto-created models:
User, Session, Account, Role, Permission
```

---

## 📁 File Structure (After Setup)

```
my-app/
├── app/
│   ├── admin/              # Auto-generated admin panel
│   │   ├── page.tsx
│   │   ├── users/
│   │   ├── roles/
│   │   └── tasks/          # Task management dashboard
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts  # Pre-configured NextAuth
│   │
│   └── page.tsx
│
├── lib/
│   ├── db.ts               # Auto-configured database
│   ├── auth.ts             # NextAuth config
│   ├── rbac.ts             # RBAC helpers
│   ├── queue.ts            # Queuebase configuration
│   ├── tasks.ts            # Task definitions
│   └── task-handlers.ts    # Task execution logic
│
├── schemas/                # Your models (optional)
│   └── user.ts
│
├── noormme.config.ts       # Framework config
└── database/
    └── app.db              # Auto-created SQLite
```

---

## ✅ What Works Out-of-Box

After `npx create-noormme-app`:

- [x] **SQLite database** configured with WAL mode
- [x] **NextAuth** with User/Session/Account models
- [x] **Admin panel** at `/admin` with login protection
- [x] **RBAC** with Role/Permission system
- [x] **Background jobs** with Queuebase integration
- [x] **Type-safe queries** via Kysely
- [x] **Auto-generated TypeScript types**
- [x] **Hot reload** for schema changes (dev mode)
- [x] **Migration system** for production

---

## 🚧 Development Roadmap

### Priority 1: Project Generator (Week 1) ⚡
**Task:** CLI that scaffolds complete working app
**Output:**
```bash
npx create-noormme-app my-app
cd my-app
npm run dev

# Opens to:
# - Working login page
# - Working admin panel  
# - Working database
# - Working RBAC
# - Ready to build features
```
**Success:** User has working app in 2 minutes

### Priority 2: Admin Panel (Week 2-3) ⚡
**Task:** Auto-generated admin interface
**Features:**
- Table list view (all tables from DB)
- CRUD operations per table
- Relationship handling
- Search and filters
- Bulk actions
- Export to CSV

**Inspiration:** Django admin, but React

### Priority 3: RBAC System (Week 4) 📋
**Task:** Built-in permission system
**Features:**
- Role definitions
- Permission checks
- Middleware integration
- API route protection
- Component-level protection

### Priority 4: Auth Integration (Week 5) 📋
**Task:** NextAuth fully configured and working
**Features:**
- Pre-configured for SQLite
- Email/password working
- OAuth provider support
- Session management
- User registration flow

### Priority 5: Queue & Task Management (Week 6) ⚡
**Task:** Background jobs with Queuebase integration
**Features:**
- Zero-config task queue setup
- Auto-generated task definitions
- Admin panel integration for monitoring
- Type-safe task handlers
- Scheduled jobs and retries
- CLI commands for task management

---

## 🐛 Known Constraints

1. **SQLite-First:** Optimized for SQLite (Postgres support later)
2. **Next.js 13+:** Requires App Router
3. **Node.js Runtime:** `better-sqlite3` (Edge support via Turso)

---

## 🎯 Modern Usage Example

```typescript
// Server Component for data fetching
// app/admin/users/page.tsx
import { getCachedUsers } from '@/lib/db-utils';
import { DataTable } from '@/components/DataTable';

export default async function UsersPage() {
  const users = await getCachedUsers();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <DataTable data={users} />
    </div>
  );
}

// Server Action with modern RBAC
// app/admin/users/actions.ts
'use server';

import { requireRole } from '@/lib/rbac';
import { withDatabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteUser(id: string) {
  await requireRole('admin');

  await withDatabase(async (db) => {
    await db
      .deleteFrom('users')
      .where('id', '=', id)
      .execute();
  });
  
  revalidatePath('/admin/users');
}

// Modern middleware for route protection
// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

// Background job with Queuebase
// lib/tasks.ts
import { queue } from '@/lib/queue';

export const tasks = {
  sendWelcomeEmail: queue.task('send-welcome-email'),
  processUserUpload: queue.task('process-user-upload'),
  cleanupExpiredSessions: queue.task('cleanup-expired-sessions'),
};

// Task handler
// lib/task-handlers.ts
import { db } from '@/lib/db';

export async function handleSendWelcomeEmail(payload: { userId: string }) {
  const user = await db
    .selectFrom('users')
    .where('id', '=', payload.userId)
    .selectAll()
    .executeTakeFirstOrThrow();
    
  // Send email logic here
  console.log(`Sending welcome email to ${user.email}`);
}
```

---

## 📊 Success Metrics

**Setup Time:**
- From zero → working app: **< 2 minutes**
- Add new model → admin UI: **< 30 seconds**

**Technical:**
- Type safety: 100%
- Zero boilerplate schemas
- Auto-generated admin
- Built-in security (RBAC)

**Developer Experience:**
- No database configuration
- No auth setup
- No admin panel building
- No queue setup required
- Focus on features, not plumbing

---

## 🔗 Essential Resources

- [Kysely Docs](https://kysely.dev/) - Query builder we use
- [NextAuth Docs](https://authjs.dev/) - Auth system
- [SQLite Docs](https://www.sqlite.org/docs.html) - Database
- [Queuebase Docs](https://queuebase.dev/) - Background jobs

---

## 🚀 Modern Quick Start

```bash
# Create new app with modern Next.js patterns
npx create-noormme-app my-app

# Start dev server
cd my-app
npm run dev

# Visit http://localhost:3000
# Admin panel: http://localhost:3000/admin

# Modern features:
# ✅ Server Components for data fetching
# ✅ Server Actions for mutations
# ✅ Modern middleware with Edge Runtime
# ✅ Auth.js v5 integration
# ✅ Background jobs with Queuebase
# ✅ Progressive enhancement

# Add a model (optional)
noormme generate:model Post title:string content:text

# Add a background task (optional)
noormme generate:task send-notification

# Database migrates automatically in dev
# Server Components auto-update
```

---

## 💡 Philosophy

**NOT building:** Django's ORM API (`.filter()`, `.get()`, etc.)

**Building:** Django's "it just works" experience

**Foundation:** Kysely (proven, type-safe)

**Goal:** Zero → Production in minutes, not hours

**Inspiration:** Rails scaffolding + Django admin + Next.js patterns

## Comparison:
- Django: Batteries included, but Python
- NOORMME: Batteries included, but Next.js 🔥

## Non-Goals
What We're NOT:
- ❌ Multi-database (SQLite only, that's the point)
- ❌ Headless CMS (we're a framework)
- ❌ Low-code builder (we're for developers)
- ❌ Everything to everyone (we're focused)

---

**Last Updated:** October 2025
**Status:** Strategic pivot to batteries-included ⚡
**Next:** Phase 1 implementation (Zero-config setup)
