# NOORMME Mission Statement

## Core Mission

**"Django's Batteries-Included Philosophy for Next.js"**

NOORMME is a batteries-included framework for Next.js that eliminates setup hell by providing instant configuration for SQLite, authentication, admin panel, RBAC, and background jobs - built on proven tools like Kysely, NextAuth, and Queuebase.

## Vision

To become the fastest way to start a production-ready Next.js application, eliminating hours of boilerplate setup and letting developers focus on building features instead of infrastructure.

**From idea to deployed app in < 2 minutes.**

## Core Values

### 1. Zero Configuration
- **Instant Setup**: One command creates a fully-featured app
- **Smart Defaults**: Optimal configuration out-of-box
- **Convention Over Configuration**: Common patterns pre-configured
- **Customizable**: Override defaults when needed

### 2. Batteries Included
- **Database**: Zero-config SQLite with auto-discovery
- **Auth**: NextAuth pre-configured (never rewrite again)
- **Admin**: Auto-generated admin panel (Django admin vibes)
- **RBAC**: Built-in role-based access control
- **Queue**: Background jobs & task management (Queuebase)
- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Philosophy**: "Just works"

### 3. Next.js Native
- **App Router First**: Optimized for Next.js 13+ App Router
- **React Server Components**: Leverages RSC patterns
- **Server Actions**: Built-in form handling
- **Type-Safe**: Full TypeScript integration

### 4. Built on Kysely
- **No Abstraction Layer**: Use Kysely directly for queries
- **Type-Safe Queries**: Leverage Kysely's excellent type inference
- **Composable**: Full power of Kysely's query builder
- **Transparent**: No magic, just configured tools

### 5. Production Ready
- **Performance**: SQLite optimized for production workloads
- **Security**: RBAC and authentication by default
- **Scalability**: Designed for real applications
- **Monitoring**: Built-in admin tools for management

## What We Build

### Core Offering
- **CLI Scaffolding**: `create-noormme-app` for instant project setup
- **Database Setup**: Auto-configured SQLite with optimal settings
- **Authentication**: NextAuth pre-integrated with adapters
- **Admin Panel**: Auto-generated CRUD interface (Django admin vibes)
- **RBAC System**: Role-based access control ready to use
- **Queue System**: Background jobs & task management (Queuebase)
- **Schema Management**: Zero-boilerplate schema definition

### The Promise
```bash
npx create-noormme-app my-app
cd my-app
npm run dev

# You get:
# Working database ✅
# Working auth ✅
# Working admin panel ✅
# Working permissions ✅
# Working background jobs ✅
# Ready to build features ✅

# Batteries included. 🔋
```

### Developer Tools
- **CLI Commands**: `noormme dev`, `db:migrate`, `generate:model`, `generate:task`
- **Type Generation**: Auto-generate TypeScript types from schemas
- **Hot Reload**: Schema changes reflected immediately (dev mode)
- **Migration System**: Automatic in dev, files in production
- **Task Management**: Queue dashboard, retry failed tasks

### Integration Layer
- **NextAuth Adapter**: Kysely-based adapter for SQLite
- **Admin Components**: Reusable UI components for CRUD
- **RBAC Helpers**: Middleware and Server Action decorators
- **Queue Integration**: Task management in admin panel
- **Template System**: Customizable project templates

## What We Don't Build

### Not an ORM
- **Use Kysely Directly**: No abstraction over Kysely's API
- **No ORM Wrapper**: Kysely is already excellent
- **No Custom DSL**: TypeScript + Kysely is enough
- **Transparent**: Developers use Kysely, not a wrapper

### Not Multi-Database
- **SQLite Only**: Specialized for SQLite use cases
- **No Postgres/MySQL**: Focus on doing one thing well
- **Simple Stack**: Reduce complexity, increase reliability
- **Edge Compatible**: Via Turso/LibSQL when needed

### Not Framework Agnostic
- **Next.js Specific**: Optimized for Next.js patterns
- **Not Express/Fastify**: Different use cases
- **App Router Focus**: Built for modern Next.js
- **Opinionated**: Best practices baked in

### Not a Headless CMS
- **We're a Framework**: Not a content management system
- **Not Low-Code**: We're for developers, not no-code users
- **Not Everything to Everyone**: We're focused on Next.js + SQLite

## Target Audience

### Primary Users

#### 1. Rapid Prototypers
**Profile**: Building MVPs and prototypes quickly

**Needs**:
- Zero setup time
- Working auth immediately
- Admin panel for testing
- Quick iterations

**Value Proposition**:
```bash
npx create-noormme-app my-mvp
cd my-mvp
npm run dev

# 2 minutes later: fully-featured app
```

#### 2. Solo Developers
**Profile**: Indie hackers, side projects, freelancers

**Needs**:
- Don't want to configure infrastructure
- Need auth and admin for client demos
- Want to focus on features
- Type-safe development

**Value Proposition**:
- No DevOps knowledge needed
- Admin panel impresses clients
- RBAC for multi-tenant SaaS
- Ship faster

#### 3. Startup Teams
**Profile**: Small teams building production apps

**Needs**:
- Fast initial development
- Production-ready foundation
- Team collaboration (RBAC)
- Maintainable codebase

**Value Proposition**:
- Week 1: MVP shipped
- Built-in user management
- Type-safe across team
- Scales with growth

#### 4. Next.js Beginners
**Profile**: Learning Next.js, need structure

**Needs**:
- Best practices guidance
- Working examples
- Type safety
- Clear patterns

**Value Proposition**:
- Learn by seeing working code
- Pre-configured best practices
- Type hints guide development
- Production patterns from day 1

## Use Cases

### 1. SaaS Application

```bash
# Day 1: Setup
npx create-noormme-app my-saas
cd my-saas

# Already have:
# ✅ User authentication (GitHub OAuth)
# ✅ Admin panel for user management
# ✅ RBAC (admin, user, guest roles)
# ✅ Database with proper indexes
# ✅ Type-safe queries

# Day 2: Add business logic
# schemas/subscription.ts
export const Subscription = schema.table('subscriptions', {
  id: schema.text().primaryKey(),
  userId: schema.text().references('users.id'),
  plan: schema.text(),
  status: schema.text(),
  createdAt: schema.datetime().default('CURRENT_TIMESTAMP'),
});

# Auto-generates:
# - Migration file
# - TypeScript types
# - Admin UI routes
# - RBAC permissions
# - Background task handlers

# Day 3: Add background jobs
# Queue welcome emails, process payments, send notifications
await tasks.sendWelcomeEmail.enqueue({ userId: user.id });

# Day 4: Ship to production
```

### 2. Internal Tool

```typescript
// Built-in admin panel = instant internal tool
// app/admin customization
import { AdminLayout } from '@noormme/admin';

export default function CustomAdmin() {
  return (
    <AdminLayout
      models={['users', 'orders', 'products']}
      theme="corporate"
      logo="/company-logo.png"
    />
  );
}

// Team has admin access immediately
// RBAC controls who can edit what
// No custom UI building needed
```

### 3. Learning Project

```typescript
// Perfect for tutorials and learning
// Everything is pre-configured and working

// lib/db.ts - already exists, fully typed
import { db } from '@/lib/db';

// Students learn Kysely, not configuration
const users = await db
  .selectFrom('users')
  .where('isActive', '=', true)
  .selectAll()
  .execute();

// RBAC teaches security patterns
import { requireRole } from '@/lib/rbac';

export async function deleteUser(id: string) {
  await requireRole('admin'); // Security by default
  return db.deleteFrom('users').where('id', '=', id).execute();
}
```

### 4. API Backend

```typescript
// Use as backend for mobile/web apps
// app/api/posts/route.ts

import { db } from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function GET() {
  const posts = await db
    .selectFrom('posts')
    .selectAll()
    .execute();

  return Response.json(posts);
}

export async function POST(req: Request) {
  await requirePermission('posts', 'create');

  const data = await req.json();
  const post = await db
    .insertInto('posts')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow();

  return Response.json(post);
}

// Admin panel = instant API dashboard
// RBAC = instant API security
```

## Success Criteria

### Setup Speed (Primary Metric)

**Goal**: Fastest time from zero to working app

Metrics:
- ⚡ **Project Creation**: < 60 seconds
- 🚀 **First Query**: < 2 minutes from start
- 🎯 **Auth Working**: < 5 minutes (add OAuth keys)
- 📊 **Admin Panel**: < 3 minutes (visit `/admin`)
- ✅ **Production Deploy**: < 15 minutes

**Benchmark**:
```bash
# Stopwatch test
time npx create-noormme-app test-app
# Target: < 60 seconds

# Time to first successful query
# Target: < 120 seconds total
```

**Success**: User has working app in 2 minutes

### Feature Completeness

**Goal**: Everything needed for production

Checklist:
- ✅ Database (SQLite, WAL mode)
- ✅ Authentication (NextAuth)
- ✅ User Management (admin panel)
- ✅ Authorization (RBAC)
- ✅ Background Jobs (Queuebase)
- ✅ Type Safety (TypeScript + Kysely)
- ✅ Migrations (auto + manual)
- ✅ Admin UI (CRUD)
- ✅ Security (role-based access)

**Measure**: Can ship SaaS MVP without adding infrastructure

### Developer Experience

**Goal**: Delightful to use, minimal friction

Metrics:
- 😊 **Satisfaction**: 90%+ positive feedback
- 📚 **Learning Curve**: < 1 hour to productivity
- 🐛 **Setup Issues**: < 5% failure rate
- 💬 **Support Requests**: < 10 per 100 users

**Indicators**:
- "Just worked" feedback
- Minimal configuration questions
- Low setup-related issues
- Positive social mentions

### Production Adoption

**Goal**: Used in real production apps

Targets (12 months):
- 🚀 **Apps Deployed**: 500+ production deployments
- 👥 **Active Users**: 5,000+ developers
- ⭐ **GitHub Stars**: 2,000+ stars
- 📦 **NPM Downloads**: 50,000+ monthly

**Quality Indicators**:
- Production success stories
- Case studies from users
- Featured in Next.js ecosystem
- Recommended by community

## Principles in Action

### 1. Zero Config Wins

**Principle**: Working app before configuration

**Good**:
```bash
npx create-noormme-app my-app
cd my-app
npm run dev

# Already working:
# - Database ✅
# - Auth ✅
# - Admin ✅
# - RBAC ✅
```

**Bad**:
```bash
npm install orm
# Now configure database...
# Now set up auth...
# Now build admin panel...
# Now implement RBAC...
# (Hours of work before "hello world")
```

### 2. Batteries Included

**Principle**: Everything needed, nothing more

**Included**:
- ✅ Database (SQLite + Kysely)
- ✅ Auth (NextAuth)
- ✅ Admin (auto-generated)
- ✅ RBAC (roles + permissions)
- ✅ Queue (background jobs + Queuebase)
- ✅ Types (auto-generated)
- ✅ Migrations (automated)

**Not Included**:
- ❌ Bloat (unused features)
- ❌ Complex config
- ❌ Proprietary lock-in
- ❌ Magic behavior

### 3. Progressive Customization

**Principle**: Defaults work, customization available

**Level 1 - Zero Config**:
```bash
# Just works with defaults
npx create-noormme-app my-app
```

**Level 2 - Simple Config**:
```typescript
// noormme.config.ts
export default {
  admin: {
    path: '/dashboard', // change admin path
  },
  auth: {
    providers: ['google', 'github'], // add provider
  },
  queue: {
    tasks: {
      'send-notification': { retries: 3 }, // add custom task
    },
  },
};
```

**Level 3 - Full Control**:
```typescript
// Override anything
// lib/db.ts - customize database
// app/admin - rebuild admin UI
// lib/rbac.ts - custom permissions

// Still get the scaffolding benefits
```

### 4. Production First

**Principle**: Production-ready by default

**Performance**:
- WAL mode enabled
- Optimal SQLite pragmas
- Connection pooling
- Query optimization

**Security**:
- RBAC from day 1
- Auth required for admin
- Secure session management
- Input validation

**Reliability**:
- Type-safe queries
- Error boundaries
- Transaction support
- Backup patterns

**Monitoring**:
- Admin panel insights
- User activity tracking
- Query performance
- Error logging

## Long-term Vision

### Year 1: Foundation
- ✅ Solid core framework
- ✅ 500+ production apps
- ✅ Active community
- ✅ Comprehensive docs

### Year 2: Ecosystem
- 🔌 Plugin system
- 🎨 Admin themes
- 📊 Analytics integration
- 🔄 Multi-database (Postgres)

### Year 3: Platform
- ☁️ Hosted service option
- 📱 Mobile admin app
- 🤝 Enterprise features
- 🌍 Global adoption

## Conclusion

NOORMME's mission is to eliminate the tedious setup work that precedes every Next.js project. By providing a batteries-included framework built on proven tools (Next.js, Kysely, NextAuth, Queuebase, SQLite), we let developers focus on building features instead of configuring infrastructure.

Our vision is to become the default starting point for Next.js applications, known for:
- **Speed**: Fastest setup in the ecosystem
- **Completeness**: Everything needed out-of-box
- **Quality**: Production-ready from day 1
- **Simplicity**: No configuration needed

We succeed when developers say: *"I went from idea to deployed app in a day."*

**The Pitch:**
- Django: Batteries included framework for Python
- Laravel: Batteries included framework for PHP
- Rails: Batteries included framework for Ruby
- **NOORMME: Batteries included framework for Next.js**

Stop building auth.
Stop building admin panels.
Stop building RBAC.
Stop setting up background jobs.
Start building features. 🚀

**No pain, everything to gain** 🔋
