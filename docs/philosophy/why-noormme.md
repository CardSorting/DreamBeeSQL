# Why NOORMME?

## Django's ORM Without The Framework Prison

Django has a brilliant ORM:
- Auto-discovery
- Powerful migrations
- Elegant relationship handling

But using it means living in Django's framework.

NOORMME brings Django's ORM brilliance to Next.js:
- Same auto-discovery philosophy
- Same migration power
- Same relationship elegance
- But with Next.js freedom

You get:
- Django ORM patterns ✅
- React components ✅
- Server/Client components ✅
- Modern TypeScript ✅
- No framework lock-in ✅

## The Problem We're Solving

### The ORM Dilemma

Most ORMs force you to choose between:

1. **Powerful but Complex** (Prisma, TypeORM)
   - Schema files to maintain
   - Complex setup and configuration
   - Framework-specific patterns
   - Heavy abstractions

2. **Simple but Limited** (Raw SQL, Query Builders)
   - No auto-discovery
   - Manual type definitions
   - No relationship handling
   - Repetitive boilerplate

### The NOORMME Solution

NOORMME gives you the best of both worlds:

- **Auto-discovery** like Django
- **Type safety** like Prisma
- **Simplicity** like raw SQL
- **Next.js native** integration

## Core Philosophy

### 1. Auto-Discovery First

Instead of defining your schema in code, NOORMME discovers it from your existing database:

```typescript
// Traditional ORM approach
const user = prisma.user.create({ data: { name: "John" } })

// NOORMME approach - discover existing schema
const db = new NOORMME({ dialect: 'sqlite', connection: { database: './app.db' }})
await db.initialize() // Discovers all tables, columns, relationships
const userRepo = db.getRepository('users')
const user = await userRepo.create({ name: "John" })
```

### 2. Database-First Design

Your database is the source of truth. NOORMME reads your existing schema and generates types automatically:

```sql
-- Your existing SQLite database
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

```typescript
// NOORMME automatically generates these types
interface User {
  id: number
  name: string
  email: string
  created_at: Date
}

// And creates these methods
const userRepo = db.getRepository('users')
await userRepo.findByEmail('john@example.com')
await userRepo.create({ name: 'John', email: 'john@example.com' })
```

### 3. Framework Freedom

NOORMME works with any framework, but we focus on Next.js because it's where the magic happens:

```typescript
// Server Component
export default async function UsersPage() {
  const db = await getDB()
  const users = await db.getRepository('users').findAll()
  return <UserList users={users} />
}

// Server Action
export async function createUser(formData: FormData) {
  'use server'
  const db = await getDB()
  await db.getRepository('users').create({
    name: formData.get('name'),
    email: formData.get('email')
  })
  revalidatePath('/users')
}

// API Route
export async function GET() {
  const db = await getDB()
  const users = await db.getRepository('users').findAll()
  return Response.json(users)
}
```

## What Makes NOORMME Different

### vs Prisma

| Feature | Prisma | NOORMME |
|---------|--------|---------|
| Schema Definition | `schema.prisma` file | Auto-discovery from database |
| Type Generation | Generated from schema | Generated from database |
| Migrations | Prisma migrations | SQL-based migrations |
| Framework | Framework agnostic | Next.js optimized |
| Learning Curve | Steep | Gentle |

**Prisma Example:**
```prisma
// schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  posts Post[]
}

model Post {
  id     Int    @id @default(autoincrement())
  title  String
  userId Int
  user   User   @relation(fields: [userId], references: [id])
}
```

**NOORMME Example:**
```sql
-- Just create your tables normally
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id)
);
```

```typescript
// NOORMME discovers everything automatically
const db = new NOORMME({ dialect: 'sqlite', connection: { database: './app.db' }})
await db.initialize()

// Types are generated automatically
const userRepo = db.getRepository('users')
const postRepo = db.getRepository('posts')

// Relationships work automatically
const userWithPosts = await userRepo.findWithRelations(userId, ['posts'])
```

### vs TypeORM

| Feature | TypeORM | NOORMME |
|---------|---------|---------|
| Entity Definition | Decorators/Classes | Auto-discovery |
| Database Support | Many databases | SQLite focused |
| Type Safety | Good | Excellent |
| Performance | Variable | Optimized for SQLite |
| Next.js Integration | Manual | Native |

### vs Raw SQL

| Feature | Raw SQL | NOORMME |
|---------|---------|---------|
| Type Safety | None | Full |
| Boilerplate | High | Minimal |
| Relationships | Manual | Automatic |
| Auto-discovery | None | Full |
| Developer Experience | Poor | Excellent |

## The NOORMME Advantage

### 1. Zero Configuration

Most ORMs require extensive setup. NOORMME works out of the box:

```typescript
// That's it. No schema files, no decorators, no configuration
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './app.db' }
})
await db.initialize()
```

### 2. Database-First Workflow

Work with your existing database. No need to define schemas in code:

```bash
# Create your database however you want
sqlite3 app.db < schema.sql

# Or use your favorite migration tool
npm run migrate

# NOORMME discovers everything automatically
```

### 3. Type Safety Without Complexity

Get full TypeScript support without maintaining schema files:

```typescript
// Auto-generated types from your database
interface User {
  id: number
  name: string
  email: string
  created_at: Date
}

// Auto-generated repository methods
const userRepo = db.getRepository('users')
await userRepo.findByEmail('john@example.com') // Type-safe!
await userRepo.create({ name: 'John', email: 'john@example.com' }) // Type-safe!
```

### 4. Next.js Native

Built specifically for Next.js with patterns that feel natural:

```typescript
// Server Components
export default async function UserProfile({ userId }: { userId: string }) {
  const db = await getDB()
  const user = await db.getRepository('users').findById(userId)
  return <div>Hello {user.name}!</div>
}

// Server Actions
export async function updateUser(userId: string, formData: FormData) {
  'use server'
  const db = await getDB()
  await db.getRepository('users').update(userId, {
    name: formData.get('name')
  })
  revalidatePath('/profile')
}

// API Routes
export async function GET(request: Request) {
  const db = await getDB()
  const users = await db.getRepository('users').findAll()
  return Response.json(users)
}
```

### 5. WAL Mode Magic

SQLite with WAL mode gives you PostgreSQL-level performance:

```typescript
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './app.db' },
  optimization: {
    enableWALMode: true // Enables concurrent reads/writes
  }
})
```

Benefits:
- Multiple readers can access simultaneously
- Writers don't block readers
- 3x faster write operations
- Better crash recovery
- Real production performance

## When to Use NOORMME

### ✅ Perfect For

- **Next.js applications** with SQLite
- **Rapid prototyping** and development
- **Small to medium** applications
- **Teams** that want Django ORM patterns without Django
- **Projects** that need simple, reliable database access
- **Applications** that value developer experience

### ❌ Not For

- **Large enterprise** applications with complex requirements
- **Multi-database** applications (we focus on SQLite)
- **Real-time** applications with high concurrency needs
- **Teams** that prefer schema-first approaches
- **Applications** that need advanced ORM features

## Getting Started

Ready to experience Django's ORM brilliance with Next.js freedom?

```bash
npm install noormme
```

```typescript
import { NOORMME } from 'noormme'

const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './app.db' }
})

await db.initialize()
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()
```

That's it. You're ready to build amazing Next.js applications with Django-inspired ORM patterns.

## The Bottom Line

NOORMME is Django's ORM philosophy liberated for Next.js developers. You get the power and elegance of Django's ORM without the framework constraints. Perfect for developers who want:

- **Django ORM patterns** ✅
- **Next.js freedom** ✅
- **SQLite simplicity** ✅
- **Type safety** ✅
- **Zero configuration** ✅

One framework. One database. Done right.
