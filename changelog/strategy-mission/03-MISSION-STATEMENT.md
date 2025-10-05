# NOORMME Mission Statement

## Core Mission

**"Django-Inspired Type-Safe ORM Built on Kysely for Next.js"**

NOORMME is a specialized ORM built on Kysely that brings Django's elegant API patterns to Next.js + SQLite applications, with seamless NextAuth integration and full TypeScript support.

## Vision

To become the go-to ORM for Next.js developers who want Django's intuitive API patterns combined with Kysely's type-safety and performance, specialized for SQLite.

## Core Values

### 1. Built on Kysely
- **Type-Safe Foundation**: Leverages Kysely's excellent TypeScript inference
- **Query Builder**: Kysely's powerful, composable query building
- **SQLite Optimized**: Built specifically for SQLite with Kysely
- **Performance**: Kysely's lightweight, fast query execution

### 2. Django-Inspired API
- **Familiar Patterns**: Django-style `.objects.filter()` and query methods
- **Intuitive API**: Easy-to-learn query interface for Django developers
- **Relationship Loading**: Simplified eager/lazy loading patterns
- **Clean Syntax**: Readable, expressive query construction

### 3. Next.js Specialization
- **App Router First**: Optimized for Next.js 13+ App Router patterns
- **Server Components**: Seamless data fetching integration
- **Server Actions**: Form handling and mutations
- **Edge Runtime**: Full compatibility with Edge Runtime

### 4. SQLite Focus
- **Single Database**: Specialized for SQLite, not generic multi-database
- **WAL Mode**: Optimized for SQLite's Write-Ahead Logging
- **Auto-Discovery**: Automatic schema detection from existing SQLite databases
- **Type Generation**: TypeScript types generated from SQLite schema

### 5. NextAuth Integration
- **Built-in Adapter**: Native NextAuth database adapter
- **Session Management**: Optimized session storage and retrieval
- **User Authentication**: Seamless integration with NextAuth patterns
- **Type Safety**: Fully typed authentication models

## What We Build

### Core Features (Built on Kysely)
- **Django-Style Query API**: `.objects.filter()`, `.exclude()`, `.get()` wrapping Kysely queries
- **Type Generation**: Generate TypeScript types from SQLite schema
- **Auto-Discovery**: Automatically introspect existing SQLite databases
- **Relationship Helpers**: Simplified eager/lazy loading on top of Kysely joins
- **NextAuth Adapter**: Native integration for authentication and sessions

### Next.js Integration
- **Server Components**: Optimized data fetching patterns for RSC
- **Server Actions**: Form handling and mutations
- **Edge Runtime**: Full compatibility with Vercel Edge Runtime
- **App Router Patterns**: Best practices for Next.js 13+ App Router

### Developer Experience
- **Kysely + Django API**: Best of both worlds - type safety and intuitive syntax
- **TypeScript First**: Full type inference and autocomplete
- **Error Handling**: Clear, actionable error messages
- **Documentation**: Comprehensive guides for Next.js + SQLite + Kysely patterns

## What We Don't Build

### Not a Django ORM Port
- **Not Replicating Django**: Django-inspired API, not full Django ORM features
- **Built on Kysely**: Leverages Kysely, doesn't reinvent query building
- **SQLite Only**: Specialized for SQLite, not multi-database like Django
- **Next.js Focused**: Not a generic framework-agnostic ORM

### Not Generic Multi-Database
- **SQLite Specialization**: Not PostgreSQL, MySQL, or other databases
- **Kysely Handles Queries**: We build patterns on top, not replace Kysely
- **No Complex Migrations**: Simple migration helpers, not full migration framework
- **No ORM Magic**: Transparent, predictable behavior built on Kysely

### Not Framework Agnostic
- **Next.js First**: Optimized specifically for Next.js patterns
- **Not Express/Fastify/etc**: Focused on Next.js use cases
- **Not Generic Node**: Server Components and Server Actions focused
- **NextAuth Coupled**: Authentication integrated with NextAuth specifically

## Target Audience

### Primary Users
- **Next.js Developers**: Building modern web applications with Server Components and SQLite
- **Django Developers**: Transitioning to Next.js who want familiar query patterns
- **Kysely Users**: Looking for a higher-level, Django-inspired API on top of Kysely
- **Full-Stack Next.js Teams**: Building complete solutions with NextAuth authentication
- **Startup Teams**: Need rapid Next.js + SQLite development with type safety

### Use Cases

#### 1. Rapid Next.js Prototyping
**Scenario**: Build a Next.js MVP with SQLite in days

```typescript
// Django-inspired API built on Kysely
import { NOORMME } from 'noormme';

const db = new NOORMME({ database: './app.db' });

// Auto-discovers SQLite schema and generates TypeScript types
const User = db.model('users');
const users = await User.objects.all(); // Kysely-powered, Django-style API, fully typed!
```

**Benefits**: Kysely's type safety + Django's intuitive API for Next.js

#### 2. Next.js Production Apps with NextAuth
**Scenario**: Full-featured Next.js app with authentication

```typescript
// Built-in NextAuth adapter for SQLite
const db = new NOORMME({
  database: './prod.db',
  enableWAL: true, // SQLite WAL mode for concurrency
});

// NextAuth integration
import { NOORMMEAdapter } from 'noormme/nextauth';
export const authOptions = {
  adapter: NOORMMEAdapter(db),
  // ...
};

// Django-style API in Next.js Server Components
export default async function PostsPage() {
  const posts = await Post.objects
    .filter({ published: true })
    .prefetch('author') // Kysely joins under the hood
    .all();
  return <PostList posts={posts} />;
}
```

**Benefits**: NextAuth + Django API + Kysely type safety for Next.js

#### 3. Migration from Prisma/TypeORM to Kysely+NOORMME
**Scenario**: Moving to Kysely with a familiar API layer

```typescript
// Works with existing SQLite databases
const db = new NOORMME({ database: './existing.db' });

// Django-style queries on top of Kysely
const activeUsers = await User.objects
  .filter({ is_active: true })
  .exclude({ email__endswith: '@example.com' })
  .orderBy('-created_at')
  .all();

// Drop down to Kysely when needed
const complexQuery = await db.kysely
  .selectFrom('users')
  .where(/* complex Kysely query */)
  .execute();
```

**Benefits**: Familiar API + direct Kysely access when needed

#### 4. Learning Next.js + SQLite + Kysely
**Scenario**: Learning modern Next.js development patterns

```typescript
// Clear, Django-inspired API built on Kysely
const blog = await Blog.objects.get({ id: 1 });

// Django-style relationship loading (Kysely joins underneath)
const posts = await blog.posts.all();
const author = await posts[0].author.get();

// When you need raw Kysely power:
const stats = await db.kysely
  .selectFrom('posts')
  .select(({ fn }) => [
    fn.count('id').as('total'),
    fn.avg('view_count').as('avgViews')
  ])
  .groupBy('category')
  .execute();
```

**Benefits**: Learn Next.js patterns + Kysely power + Django API design

## Success Criteria

### Technical Excellence

#### Performance Benchmarks
- ⚡ **Query Execution**: <10ms average (p95), <5ms median (p50)
- 🚀 **Throughput**: >100 operations/second sustained load
- 💾 **Memory Efficiency**: <50MB baseline memory footprint
- 📊 **Cache Hit Rate**: >80% for repeated queries

**Measurement**:
```typescript
// Built-in performance monitoring
const metrics = db.getMetrics();
console.log(metrics);
// {
//   avgQueryTime: 4.2,
//   p95QueryTime: 9.8,
//   throughput: 156,
//   cacheHitRate: 0.84
// }
```

#### Reliability Metrics
- 🛡️ **Uptime**: 99.9% in production environments (8.76 hours downtime/year max)
- 🔄 **Error Recovery**: Automatic reconnection and retry mechanisms
- ✅ **Data Integrity**: Zero data corruption incidents
- 🔒 **Security**: Zero critical vulnerabilities in dependency audits

#### Compatibility Standards
- ✅ **Next.js Support**: 100% App Router, Pages Router, and Edge Runtime
- 📦 **TypeScript**: Full type safety with strict mode
- 🌐 **Node.js**: Support for LTS versions (18+, 20+)
- 🗄️ **SQLite**: Compatible with SQLite 3.35+ (WAL mode required)

### Developer Satisfaction

#### Onboarding Speed
- ⏱️ **Setup Time**: 5 minutes from install to first query
- 📚 **Learning Curve**: 1 hour to productivity (for Django devs: 15 minutes)
- 🎯 **First Success**: Working CRUD app in <30 minutes

**Example Onboarding**:
```bash
# 1. Install (30 seconds)
npm install noormme

# 2. Initialize (1 minute)
npx noormme init

# 3. First Query (2 minutes)
# Auto-discovery detects schema, generates types, ready to use!
```

#### Documentation Quality
- 📖 **Coverage**: 100% API coverage with examples
- 🎓 **Tutorials**: Step-by-step guides for all major use cases
- 💡 **Examples**: Real-world patterns and best practices
- 🔍 **Searchability**: Full-text search and categorization

**Standard**: Match Django ORM documentation quality and depth

#### Error Experience
- 🚨 **Clear Messages**: Plain English errors with context
- 🔧 **Actionable Suggestions**: Specific fixes for common issues
- 📍 **Source Location**: File and line number for debugging
- 📚 **Documentation Links**: Relevant docs for each error type

**Example Error**:
```
❌ Query Error: Column 'user_id' not found in table 'posts'

💡 Suggestion: Did you mean 'author_id'? Available columns:
   - id, title, content, author_id, created_at

📖 Learn more: https://docs.noormme.dev/errors/column-not-found
📍 Location: src/queries/post.ts:42
```

#### Type Safety
- 🔒 **Auto-Generated Types**: TypeScript types from database schema
- ✅ **Compile-Time Checks**: Catch errors before runtime
- 🎯 **IntelliSense**: Full autocomplete and hints
- 🛡️ **Strict Mode**: Compatible with TypeScript strict mode

### Community Growth

#### Adoption Metrics (12-month targets)
- 👥 **Users**: 1,000+ active projects
- ⭐ **GitHub Stars**: 500+ stars
- 📦 **NPM Downloads**: 10,000+ monthly downloads
- 🌍 **Geographic Reach**: Used in 20+ countries

#### Engagement Metrics
- 💬 **Active Contributors**: 10+ regular contributors
- 🐛 **Issue Resolution**: <48 hours median response time
- 📝 **Pull Requests**: 20+ merged PRs per quarter
- 🎤 **Community Events**: 4+ talks/workshops per year

#### Quality Indicators
- ⭐ **Ratings**: 4.5+ average rating
- 💯 **Satisfaction**: 80%+ positive feedback
- 🏆 **Awards**: Featured in "State of JS" survey
- 📈 **Growth**: 20% month-over-month growth

#### Ecosystem Development
- 🔌 **Integrations**: Next.js, Vercel, Netlify, Cloudflare
- 🛠️ **Tools**: CLI, migrations, admin panel, devtools
- 📚 **Resources**: Video tutorials, blog posts, courses
- 🤝 **Partnerships**: Collaborations with framework authors

## Principles in Action

### 1. Simplicity Over Complexity

**Principle**: Clean API, minimal configuration, clear documentation

**Example - Simple CRUD Operations**:
```typescript
// No complex setup, no schema definitions
const db = new NOORMME({ database: './app.db' });

// Intuitive, Django-style queries
const user = await User.objects.create({
  email: 'user@example.com',
  name: 'John Doe'
});

const users = await User.objects.filter({ is_active: true }).all();
const user = await User.objects.get({ id: 1 });
await user.update({ name: 'Jane Doe' });
await user.delete();
```

**vs. Complex Alternative**:
```typescript
// Traditional ORM requires extensive setup
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;
  // ... many more decorators and configuration
}
```

### 2. Power Through Simplicity

**Principle**: Advanced features with simple, intuitive API

**Example - Relationship Loading**:
```typescript
// Powerful eager loading with simple syntax
const posts = await Post.objects
  .prefetch('author', 'comments.user', 'tags')
  .filter({ published: true })
  .all();

// Access related data without additional queries (N+1 solved!)
posts.forEach(post => {
  console.log(post.author.name); // No query!
  console.log(post.comments.length); // No query!
  post.comments.forEach(comment => {
    console.log(comment.user.name); // No query!
  });
});
```

**Example - Auto-Discovery & Type Generation**:
```typescript
// NOORMME automatically generates TypeScript types
const User = db.model('users'); // Fully typed based on schema!

// IntelliSense knows all columns and relationships
const user = await User.objects.get({ id: 1 });
user.email; // ✅ TypeScript knows this exists
user.invalidField; // ❌ TypeScript error!

// Relationship types are inferred automatically
const posts = await user.posts.all(); // Type: Post[]
```

### 3. Production Focus

**Principle**: Performance, reliability, and monitoring built-in

**Example - Performance Optimization**:
```typescript
// Connection pooling and caching enabled by default
const db = new NOORMME({
  database: './prod.db',
  enableWAL: true, // WAL mode for concurrency
  poolSize: 10, // Connection pooling
  enableCache: true, // Query caching
  cacheConfig: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  }
});

// Automatic query optimization
const optimizedQuery = await Post.objects
  .select('id', 'title') // Only needed columns
  .filter({ category: 'tech' })
  .orderBy('-created_at')
  .limit(10);

// Get performance insights
const metrics = db.getMetrics();
if (metrics.slowQueries.length > 0) {
  console.log('Slow queries detected:', metrics.slowQueries);
  // Automatic suggestions for improvement
}
```

**Example - Error Handling & Recovery**:
```typescript
// Comprehensive error handling with recovery
try {
  const result = await db.transaction(async (trx) => {
    const user = await User.objects.create({ email: 'test@example.com' });
    const profile = await Profile.objects.create({ user_id: user.id });
    return { user, profile };
  });
} catch (error) {
  if (error.code === 'SQLITE_BUSY') {
    // Automatic retry with exponential backoff
    await db.retryWithBackoff(() => /* ... */);
  } else {
    // Clear error message with suggestions
    console.error(error.message);
    // "Transaction failed: Database is locked
    //  💡 Suggestion: Enable WAL mode for better concurrency
    //  📖 Learn more: https://docs.noormme.dev/wal-mode"
  }
}
```

### 4. Framework Independence

**Principle**: Works with any database, easy to migrate, adaptable

**Example - Zero Migration Setup**:
```typescript
// Works with existing SQLite database immediately
const db = new NOORMME({ database: './legacy-app.db' });

// No schema definition needed - auto-discovers everything
const LegacyUser = db.model('legacy_users');
const users = await LegacyUser.objects.all();

// Gradually migrate to better patterns
class ModernUserRepository extends Repository<LegacyUser> {
  async findActive() {
    return this.filter({ status: 'active' }).all();
  }
}
```

**Example - Next.js Integration (Framework Specific, Not Framework Locked)**:
```typescript
// app/actions.ts - Server Actions
'use server';
import { db } from '@/lib/db';

export async function createPost(formData: FormData) {
  const post = await Post.objects.create({
    title: formData.get('title'),
    content: formData.get('content')
  });
  revalidatePath('/posts');
  return post;
}

// app/posts/page.tsx - Server Component
import { db } from '@/lib/db';

export default async function PostsPage() {
  const posts = await Post.objects.all();
  return <PostList posts={posts} />;
}

// BUT: Same db instance works in API routes, middleware, etc.
// NOT locked into Next.js patterns!
```

**Example - Portable Across Projects**:
```typescript
// Same code works in different environments
// Next.js App:
const db = new NOORMME({ database: './app.db' });

// Express API:
const db = new NOORMME({ database: './api.db' });

// CLI Tool:
const db = new NOORMME({ database: process.env.DB_PATH });

// Same API, same patterns, zero code changes!

## Long-term Vision

### 1. Ecosystem Leader
- **Industry Standard**: Go-to ORM for Next.js + SQLite
- **Community Driven**: Active community and contributions
- **Ecosystem Integration**: Works seamlessly with other tools

### 2. Innovation Hub
- **Pattern Innovation**: New patterns and best practices
- **Performance Leadership**: Setting performance standards
- **Developer Experience**: Raising the bar for developer tools

### 3. Educational Resource
- **Learning Platform**: Teaching ORM patterns and best practices
- **Best Practices**: Establishing industry standards
- **Knowledge Sharing**: Community knowledge and expertise

## Conclusion

NOORMME's mission is to bring Django's powerful ORM patterns to Next.js developers while maintaining framework independence and avoiding vendor lock-in. We focus on simplicity, power, and production readiness, creating a tool that developers love to use and can rely on in production.

Our vision is to become the go-to ORM for Next.js + SQLite development, setting new standards for developer experience, performance, and reliability in the JavaScript ecosystem.
