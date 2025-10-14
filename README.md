# NOORMME - The NO-ORM for Normies

[![npm version](https://img.shields.io/npm/v/noormme)](https://www.npmjs.com/package/noormme)
[![npm downloads](https://img.shields.io/npm/dm/noormme)](https://www.npmjs.com/package/noormme)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)](https://nodejs.org/)

> **"Finally, an ORM that doesn't make me feel dumb."** - Every Normie Developer Ever

**NOORMME** (pronounced "normie") is the toolkit that makes you feel like a coding genius without actually being one. It's like having a senior developer in your pocket, but without the attitude.

**The Mission**: Make AI-assisted development so easy, even your grandma could build a startup (if she wanted to).

## 🤔 Why Should You Care? (Spoiler: You Should)

### **The Problem (AKA Why You're Reading This):**
You're probably here because:
- Setting up databases makes you want to throw your laptop out the window
- You've spent more time configuring ORMs than actually coding
- AI tools keep suggesting code that doesn't work with your setup
- You're tired of feeling like you need a computer science degree to build a simple app
- Your project structure looks like a tornado hit a code factory

### **The NOORMME Solution (AKA Your New Best Friend):**
We fixed all that nonsense:
- **Zero-config database** - Point, click, done (well, almost)
- **AI that actually helps** - No more "helpful" suggestions that break everything
- **Organized by default** - Your code will look like a senior dev wrote it
- **Minimal setup** - From "I have an idea" to "I have an app" in 5 minutes
- **No vendor lock-in** - You're not trapped in framework jail

### **Real Benefits (The Stuff That Actually Matters):**
- 🚀 **Feel like a coding wizard** - AI that understands your project
- 🗄️ **Multi-database support** - SQLite for simplicity, PostgreSQL for power
- 💰 **Save money** - SQLite for dev/small apps, PostgreSQL when you need it
- 🔧 **Deploy easily** - SQLite = one file, PostgreSQL = full production ready
- ⚡ **Go fast** - Optimized performance for both SQLite and PostgreSQL
- 🛡️ **Stay secure** - Built-in connection pooling and security best practices
- 😊 **Have fun** - Finally, coding that doesn't make you cry

**Bottom line:** You get enterprise-grade superpowers with your choice of database.

## 🚀 What's the Big Deal? (Spoiler: It's Actually Pretty Big)

**Before NOORMME:** You spend 8 hours setting up a database, 4 hours organizing your project, and 2 hours fighting with AI tools that suggest code from 2019.

**With NOORMME:** Your development environment becomes AI-ready in 5 minutes:
- ✅ **SQLite & PostgreSQL support** - Start simple, scale when needed
- ✅ **Organized architecture** - Patterns that actually make sense
- ✅ **AI context rules** - Cursor IDE integration that works
- ✅ **Type safety** - TypeScript that doesn't make you want to throw things
- ✅ **Production features** - WAL mode, connection pooling, caching, and performance optimization

**It's literally a development environment that makes AI assistance useful.** 🤯

## 🗄️ Database Support

NOORMME supports multiple database systems with the same API:

### SQLite - Perfect for:
- 🚀 **Prototyping & MVPs** - Get started in seconds
- 📱 **Edge deployments** - Cloudflare Workers, Vercel Edge, etc.
- 💻 **Local-first apps** - Embedded databases in desktop/mobile apps
- 🧪 **Testing** - Fast, isolated test environments
- 💰 **Small to medium apps** - No database server needed

### PostgreSQL - Perfect for:
- 🏢 **Production applications** - Battle-tested reliability
- 📊 **Complex queries** - Advanced SQL features
- 🔒 **Multi-user systems** - Robust concurrency handling
- 📈 **Scaling** - Handle millions of records
- 🌐 **Traditional deployments** - Client-server architecture

## ⚡ Get Started in 60 Seconds (No, Really)

### 1. Install It (The Easy Part)
```bash
npm install noormme
```

### 2. Initialize Your Project (The Even Easier Part)
```bash
npx noormme init
```

### 3. Point at Your Database (The "Wait, That's It?" Part)

#### Option A: SQLite (Simplest)
```typescript
import { NOORMME } from 'noormme'

const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './your-database.sqlite'
  }
})

await db.initialize()
```

#### Option B: PostgreSQL (Production-Ready)
```typescript
import { NOORMME } from 'noormme'

const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'your_database',
    username: 'postgres',
    password: 'your_password'
  }
})

await db.initialize()
```

#### Option C: Connection String (Easiest)
```typescript
import { NOORMME } from 'noormme'

// SQLite
const db = new NOORMME('sqlite:./your-database.sqlite')

// PostgreSQL
// const db = new NOORMME('postgresql://user:password@localhost:5432/database')

// Or use DATABASE_URL environment variable
// const db = new NOORMME()  // Reads from process.env.DATABASE_URL

await db.initialize()
```

### 4. Start Building with AI Assistance (The "I'm a Genius Now" Part)
```typescript
// NOORMME automatically finds your 'users' table and creates methods
const userRepo = db.getRepository('users')

// These methods are automatically available based on your table columns:
const users = await userRepo.findAll()
const user = await userRepo.findByEmail('john@example.com')
const activeUsers = await userRepo.findManyByStatus('active')

// Full CRUD with type safety (because we're not animals)
const newUser = await userRepo.create({
  name: 'Jane Doe',
  email: 'jane@example.com'
})
```

**That's it!** Your development environment is now AI-ready and organized. 🎉

## 🎯 What NOORMME Does For You (The Magic Behind the Curtain)

### 🔍 **Database Automation (AKA "How Did It Know That?")**
NOORMME looks at your SQLite database and goes "Oh, I see what you're trying to do here":
- **Auto-discovery** - Finds tables, columns, and relationships (like a detective, but for databases)
- **Type generation** - Creates TypeScript interfaces (because guessing types is for amateurs)
- **Performance optimization** - WAL mode, caching, and index recommendations (because slow is the enemy)
- **Health monitoring** - Real-time performance tracking (because knowing is half the battle)

### 🏗️ **Organized Architecture (AKA "Finally, Code That Makes Sense")**
NOORMME applies patterns from frameworks that actually work:
- **Django-style structure** - Organized folders and clear separation (because chaos is not a feature)
- **Laravel-style services** - Service classes and repository patterns (because organization is beautiful)
- **Rails-style conventions** - Naming conventions and file organization (because consistency is key)
- **Next.js patterns** - App Router, Server Components, and modern React patterns (because we live in 2025)

### 🤖 **AI-Ready Development (AKA "Finally, AI That Actually Helps")**
NOORMME makes AI assistance useful (revolutionary, we know):
- **Cursor IDE integration** - Context rules that AI tools understand (because context matters)
- **Consistent patterns** - AI generates code that follows your conventions (because consistency is everything)
- **Type safety** - AI suggestions are always type-safe (because runtime errors are for the weak)
- **Documentation** - AI understands your project structure (because understanding is power)

### ⚡ **Performance Optimization (AKA "Speed Is Life")**
NOORMME automatically makes everything faster:
- **WAL mode** - Concurrent read/write operations (because waiting is for losers)
- **Intelligent caching** - Cache frequently accessed data (because memory is cheap, time is not)
- **Query optimization** - Automatic index recommendations (because slow queries are the enemy)
- **Real-time monitoring** - Performance metrics and health checks (because ignorance is not bliss)

## 🔥 WAL Mode: Why This Changes Everything (The Technical Stuff Made Simple)

**The Problem:** Most SQLite databases are slow and lock up when multiple people try to use them. It's like having a single-lane road for a busy intersection during rush hour.

**The NOORMME Solution:** WAL Mode (Write-Ahead Logging) turns your SQLite file into a multi-lane highway with express lanes.

### **What WAL Mode Actually Does (In Plain English):**

**Before WAL Mode (The Dark Ages):**
- When someone writes to the database, EVERYONE has to wait
- Reading data blocks writing data (and vice versa)
- Your app freezes when multiple users try to do things at once
- It's like having one checkout lane at Walmart on Black Friday

**With NOORMME's WAL Mode (The Renaissance):**
- ✅ **Multiple readers can access data simultaneously** - No more waiting in line
- ✅ **Writers don't block readers** - Updates happen in the background
- ✅ **3x faster write operations** - Append-only logging is lightning fast
- ✅ **Better crash recovery** - Your data is safer than Fort Knox
- ✅ **Real production performance** - Handles thousands of concurrent users

### **Real-World Proof (Because We Don't Make Stuff Up):**
NOORMME's WAL Mode is already running in production at **DreamBeesArt**, where it:
- Handles multiple users creating and editing content simultaneously
- Processes orders and inventory updates without blocking customer browsing
- Maintains sub-second response times even under heavy load
- Provides enterprise-level reliability in a simple SQLite file

### **The Magic Behind the Scenes (The Technical Wizardry):**
Instead of one database file, WAL Mode creates three files:
- `your-database.db` - Your actual data (the main file)
- `your-database.db-wal` - Pending changes (like a shopping cart)
- `your-database.db-shm` - Coordination between processes (like traffic lights)

**Don't worry** - NOORMME handles all three files automatically. You just see your database working like a high-performance server.

### **Why You Should Care (The Bottom Line):**
- 🚀 **Your app won't freeze** when multiple users are active
- 💰 **Save money** - No need for expensive database servers
- 🔧 **Easier deployment** - Copy one file instead of managing servers
- ⚡ **Better user experience** - Everything feels snappy and responsive
- 🛡️ **More reliable** - Your data is safer with better crash recovery

**Bottom line:** Your SQLite file becomes as powerful as PostgreSQL, but without the complexity.

## 🛠️ CLI Tools (For When You Want to Feel Like a Pro)

NOORMME includes command-line tools that make development stupidly simple:

### Analyze Your Database (The "What's Wrong?" Tool)
```bash
# See what's slow and get recommendations
npx noormme analyze --database ./app.sqlite
```

### Optimize Performance (The "Make It Faster" Tool)
```bash
# Make your database faster automatically
npx noormme optimize --database ./app.sqlite
```

### Watch and Auto-Optimize (The "Set It and Forget It" Tool)
```bash
# Set it and forget it - NOORMME watches your database
npx noormme watch --auto-optimize
```

### Generate Project Structure (The "I'm Too Lazy" Tool)
```bash
# Create organized Next.js project with NOORMME
npx noormme create --template nextjs --name my-app
```

## 💡 Real Examples (Because Examples Are Everything)

### Blog App with AI Assistance (The "I Want to Build a Blog" Example)
```typescript
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './blog.sqlite' }
})

await db.initialize()

// Auto-generated repositories (because we're not writing boilerplate)
const postRepo = db.getRepository('posts')
const userRepo = db.getRepository('users')

// Smart methods based on your schema (because we're smart like that)
const recentPosts = await postRepo.findManyByPublished(true)
const adminUsers = await userRepo.findManyByRole('admin')

// Complex queries with full type safety (because we're not animals)
const postWithAuthor = await db.getKysely()
  .selectFrom('posts')
  .innerJoin('users', 'users.id', 'posts.author_id')
  .select(['posts.title', 'users.name as author'])
  .where('posts.published', '=', true)
  .execute()
```

### E-commerce App with Organized Architecture (The "I Want to Make Money" Example)
```typescript
// Point at your existing e-commerce database
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './shop.sqlite' }
})

await db.initialize()

const productRepo = db.getRepository('products')
const orderRepo = db.getRepository('orders')

// Auto-generated methods work with your existing data (because we're not picky)
const featuredProducts = await productRepo.findManyByFeatured(true)
const pendingOrders = await orderRepo.findManyByStatus('pending')
```

### Production App with PostgreSQL (The "I'm Going Big" Example)
```typescript
// Connect to PostgreSQL for production-grade performance
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      max: 20,  // Maximum connections
      min: 5,   // Minimum connections
      idleTimeoutMillis: 30000,
    }
  }
})

await db.initialize()

// Same API as SQLite - just more powerful!
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()

// Advanced PostgreSQL features work seamlessly
const analytics = await db.getKysely()
  .selectFrom('orders')
  .select(({ fn }) => [
    fn.count('id').as('total_orders'),
    fn.sum('amount').as('total_revenue'),
    fn.avg('amount').as('avg_order_value'),
  ])
  .where('created_at', '>=', new Date('2024-01-01'))
  .groupBy('user_id')
  .execute()
```

## 🔧 Configuration (Optional, Because We're Not Dictators)

For most people, the default settings work perfectly. But if you want to customize (because you're a special snowflake):

### SQLite Configuration
```typescript
const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './app.sqlite'
  },
  automation: {
    enableAutoOptimization: true,     // Make it fast automatically
    enableIndexRecommendations: true, // Suggest better indexes
    enableQueryAnalysis: true,        // Find slow queries
  },
  performance: {
    enableCaching: true,              // Cache results for speed
    maxCacheSize: 1000               // How much to cache
  }
})
```

### PostgreSQL Configuration
```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'postgres',
    password: 'secret',
    ssl: true,  // Enable SSL
    pool: {
      max: 20,                    // Maximum pool size
      min: 5,                     // Minimum pool size
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Timeout for acquiring connection
    }
  },
  automation: {
    enableAutoOptimization: true,
    enableIndexRecommendations: true,
    enableQueryAnalysis: true,
  },
  performance: {
    enableCaching: true,
    maxCacheSize: 1000
  }
})
```

### PostgreSQL-Specific Features (The Power Tools)

NOORMME provides comprehensive support for PostgreSQL-specific features:

#### Array Types
```typescript
import { PostgresArrayHelpers } from 'noormme/helpers/postgresql'

// Create table with array columns
await db.kysely.schema
  .createTable('posts')
  .addColumn('tags', 'text[]')
  .addColumn('scores', 'integer[]')
  .execute()

// Query with array operations
const posts = await db.kysely
  .selectFrom('posts')
  .where(PostgresArrayHelpers.contains('tags', ['typescript']))
  .execute()
```

#### JSON/JSONB Operations
```typescript
import { PostgresJSONHelpers } from 'noormme/helpers/postgresql'

// Extract and query JSON fields
const users = await db.kysely
  .selectFrom('users')
  .select(PostgresJSONHelpers.extract('metadata', 'email').as('email'))
  .where(PostgresJSONHelpers.hasKey('metadata', 'phone'))
  .execute()
```

#### Full-Text Search
```typescript
import { PostgresFullTextHelpers } from 'noormme/helpers/postgresql'

// Add full-text search
await PostgresFullTextHelpers.addGeneratedTSVectorColumn(
  db.kysely, 'articles', 'search_vector', ['title', 'content']
)

// Search with ranking
const results = await db.kysely
  .selectFrom('articles')
  .select(PostgresFullTextHelpers.rank('search_vector', 'typescript').as('rank'))
  .where(PostgresFullTextHelpers.match('search_vector', 'typescript'))
  .orderBy('rank', 'desc')
  .execute()
```

#### Materialized Views
```typescript
import { PostgresMaterializedViewHelpers } from 'noormme/helpers/postgresql'

// Create and manage materialized views
await PostgresMaterializedViewHelpers.create(
  db.kysely, 'user_stats',
  sql`SELECT user_id, COUNT(*) as post_count FROM posts GROUP BY user_id`
)

await PostgresMaterializedViewHelpers.refresh(db.kysely, 'user_stats', {
  concurrently: true
})
```

**📚 Learn More:** 
- [PostgreSQL Features Documentation](docs/postgresql-features.md) for detailed feature guides
- [PostgreSQL Support Documentation](docs/postgresql/POSTGRESQL_SUPPORT.md) for comprehensive overview

### Database Migration Tools (The "Time to Move" Feature)

NOORMME provides powerful tools for migrating databases between SQLite and PostgreSQL:

#### Automated Migration

```typescript
import { createMigrationManager } from 'noormme/helpers/postgresql'

// Source database (SQLite)
const sourceDb = new NOORMME('sqlite:./source.sqlite')

// Target database (PostgreSQL)
const targetDb = new NOORMME('postgresql://user:pass@localhost/target')

await sourceDb.initialize()
await targetDb.initialize()

// Create migration manager
const migrationManager = createMigrationManager(
  sourceDb.getKysely(),
  targetDb.getKysely(),
  {
    source: {
      dialect: 'sqlite',
      database: './source.sqlite',
    },
    target: {
      dialect: 'postgresql',
      database: 'target',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
    },
    options: {
      batchSize: 1000,
      verbose: true,
    },
  }
)

// Perform complete migration (schema + data)
const result = await migrationManager.migrate()
console.log(`Migrated ${result.rowsMigrated} rows in ${(result.duration / 1000).toFixed(2)}s`)
```

#### Schema Comparison & Sync

```typescript
// Compare schemas
const comparison = await migrationManager.compareSchemas()
console.log(`Differences: ${comparison.differences.length}`)

// Generate sync SQL
const syncResult = await migrationManager.syncSchema({
  generateSQL: true,
  apply: false,  // Preview changes without applying
})

syncResult.sqlStatements.forEach(sql => console.log(sql))
```

#### Key Migration Features

- ✅ **Bidirectional Migration** - SQLite ↔ PostgreSQL
- ✅ **Automatic Type Conversion** - Smart mapping between database types
- ✅ **Value Transformation** - Handle booleans, arrays, JSON, and dates
- ✅ **Batch Processing** - Efficient large dataset migration
- ✅ **Parallel Migration** - Multi-table concurrent processing
- ✅ **Progress Tracking** - Real-time migration progress
- ✅ **Schema Diff** - Detect schema differences
- ✅ **Verification** - Automated post-migration checks

**📚 Learn More:** See [Migration Tools Documentation](docs/migration-tools.md) for detailed guides and examples.

## 🚀 Production Ready (Because We're Not Playing Around)

NOORMME is already running in production applications with real-world success stories. It includes:

- **Health monitoring** - Know when something's wrong (because ignorance is not bliss)
- **Performance metrics** - See how fast your queries are (because speed is life)
- **Security features** - Protection against common attacks (because security matters)
- **Migration support** - Move from PostgreSQL to SQLite easily (because change is good)
- **Backup strategies** - Your data is safe (because data loss is not fun)
- **WAL Mode implementation** - Proven in production at DreamBeesArt with enterprise-level performance

### **Real Production Success (Because We Don't Make Stuff Up):**
The DreamBeesArt application successfully migrated from Drizzle ORM to NOORMME with WAL Mode, achieving:
- **Better concurrent access** - Multiple users can create/edit content simultaneously
- **Improved write performance** - 3x faster operations with append-only logging
- **Enhanced reliability** - Better crash recovery and data integrity
- **Reduced complexity** - From complex database server setup to a single SQLite file
- **Lower costs** - No database hosting fees while maintaining enterprise performance

## ❓ FAQ for Normies (The Questions You're Too Afraid to Ask)

**Q: Do I need to learn SQL?**
A: Nope! NOORMME handles most things automatically. You only need SQL for complex queries (and even then, we'll help you).

**Q: Can I use my existing database?**
A: Yes! Just point NOORMME at your existing SQLite or PostgreSQL database and it figures everything out (because we're not picky).

**Q: Should I use SQLite or PostgreSQL?**
A: Start with SQLite for prototyping and small apps (it's faster to set up). Switch to PostgreSQL when you need multi-user support, complex queries, or scaling. The API is identical, so switching is easy!

**Q: Is this really production-ready?**
A: Absolutely. Real applications are using it right now:
- SQLite with WAL mode for edge deployments and local-first apps
- PostgreSQL for traditional production deployments with millions of records

**Q: What if I'm already using another ORM?**
A: NOORMME works alongside other tools. You can migrate gradually or use both (because we're not territorial).

**Q: Do I need TypeScript?**
A: NOORMME works with JavaScript too, but TypeScript gives you the best experience (because types are your friends).

**Q: How does this work with AI tools like Cursor?**
A: NOORMME includes Cursor IDE context rules that make AI assistance actually useful. The AI understands your project structure and generates code that follows your conventions (because we're not savages).

**Q: What makes this different from other toolkits?**
A: NOORMME combines database automation, organized architecture, and AI-ready patterns in one integrated toolkit. It's not just an ORM - it's a complete development environment that supports both SQLite and PostgreSQL with the same API (because we're ambitious).

**Q: Can I migrate from SQLite to PostgreSQL later?**
A: Yes! Since NOORMME uses the same API for both databases, migrating is as simple as changing the connection config. Your application code stays the same!

**Q: Will this make me a better developer?**
A: Probably not, but it will make you feel like one (which is half the battle).

## 🤝 Contributing (Because We're Not Perfect)

Found a bug? Have an idea? We'd love your help! (Because we're not too proud to ask for help)

```bash
git clone https://github.com/cardsorting/noormme.git
cd noormme
npm install
npm test
```

## 📄 License (The Legal Stuff)

Apache 2.0 License - see [LICENSE](LICENSE) file for details. (Because we're not lawyers, but we try to be responsible)

## 🎉 Start Today (Because Tomorrow Is Overrated)

Ready to make your development environment work for you instead of against you?

```bash
npm install noormme
```

**Because AI-assisted development should be normal, not rocket science.** 🚀

---

*NOORMME - Making AI-assisted development so simple, even normies can use it.*