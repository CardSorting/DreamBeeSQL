# NOORMME - The NO-ORM for Normies

[![npm version](https://img.shields.io/npm/v/noormme)](https://www.npmjs.com/package/noormme)
[![npm downloads](https://img.shields.io/npm/dm/noormme)](https://www.npmjs.com/package/noormme)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)](https://nodejs.org/)

> **"Finally, an ORM that doesn't make me feel dumb."** - Every Developer Ever

**NOORMME** (pronounced "normie") makes your SQLite file work like a PostgreSQL server. 

No setup. No configuration. Just point it at your database and start coding.

## 🤔 Why Should You Care?

### **The Problem:**
Most developers think SQLite is just for prototypes and PostgreSQL is for "real" apps. So they:
- Set up complex database servers they don't need
- Write tons of boilerplate code for simple database operations
- Spend hours configuring ORMs and managing database connections
- Deal with network latency and server management headaches

### **The NOORMME Solution:**
Your SQLite file gets all the power of PostgreSQL, but:
- **No server setup** - It's just a file on your computer
- **No configuration** - Works out of the box
- **No boilerplate** - Methods are generated automatically
- **No network delays** - Direct file access is lightning fast
- **No server management** - Just copy the file and you're done

### **Real Benefits:**
- 🚀 **Faster development** - Start coding in 60 seconds, not 60 minutes
- 💰 **Lower costs** - No database server hosting fees
- 🔧 **Easier deployment** - One file instead of a whole database server
- ⚡ **Better performance** - Direct file access beats network calls every time
- 🛡️ **Simpler security** - No network attack surface to worry about

**Bottom line:** You get enterprise database features without enterprise complexity.

## 🚀 What's the Big Deal?

**Before NOORMME:** You write SQL by hand, manage types manually, and pray everything works.

**With NOORMME:** Your SQLite file automatically becomes a fully-featured database with:
- ✅ Auto-generated TypeScript types
- ✅ Smart repository methods  
- ✅ Relationship handling
- ✅ Performance optimization
- ✅ Production-ready features

**It's literally just a file that acts like a server.** 🤯

## ⚡ Get Started in 60 Seconds

### 1. Install It
```bash
npm install noormme
```

### 2. Connect to Your Database
```typescript
import { NOORMME } from 'noormme'

const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './your-database.sqlite'  // Point to your existing database
  }
})

await db.initialize()
```

### 3. Start Using Auto-Generated Methods
```typescript
// NOORMME automatically finds your 'users' table and creates methods
const userRepo = db.getRepository('users')

// These methods are automatically available based on your table columns:
const users = await userRepo.findAll()
const user = await userRepo.findByEmail('john@example.com')
const activeUsers = await userRepo.findManyByStatus('active')

// Full CRUD with type safety
const newUser = await userRepo.create({
  name: 'Jane Doe',
  email: 'jane@example.com'
})
```

**That's it!** Your SQLite file now works like a PostgreSQL server. 🎉

## 🎯 What NOORMME Does For You

### 🔍 **Auto-Discovery**
NOORMME looks at your database and figures out:
- What tables you have
- What columns are in each table
- How tables are related to each other
- What data types everything is

### 🏗️ **Auto-Generated Types**
Instead of writing TypeScript interfaces by hand:
```typescript
// NOORMME automatically generates this for you:
interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  createdAt: Date
}
```

### 🚀 **Smart Repository Methods**
Based on your table columns, NOORMME creates methods like:
- `findById(id)` - Find by primary key
- `findByEmail(email)` - Find by email column
- `findManyByStatus(status)` - Find multiple by status
- `create(data)` - Create new records
- `update(id, data)` - Update existing records
- `delete(id)` - Delete records

### ⚡ **Performance Optimization**
NOORMME automatically:
- Enables WAL mode for better concurrency
- Sets optimal cache sizes
- Recommends indexes for faster queries
- Monitors query performance

## 🛠️ CLI Tools (For When You Want to Feel Like a Pro)

NOORMME includes command-line tools that make database management stupidly simple:

### Analyze Your Database
```bash
# See what's slow and get recommendations
npx noormme analyze --database ./app.sqlite
```

### Optimize Performance
```bash
# Make your database faster automatically
npx noormme optimize --database ./app.sqlite
```

### Watch and Auto-Optimize
```bash
# Set it and forget it - NOORMME watches your database
npx noormme watch --auto-optimize
```

## 💡 Real Examples

### Blog App
```typescript
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './blog.sqlite' }
})

await db.initialize()

// Auto-generated repositories
const postRepo = db.getRepository('posts')
const userRepo = db.getRepository('users')

// Smart methods based on your schema
const recentPosts = await postRepo.findManyByPublished(true)
const adminUsers = await userRepo.findManyByRole('admin')

// Complex queries with full type safety
const postWithAuthor = await db.getKysely()
  .selectFrom('posts')
  .innerJoin('users', 'users.id', 'posts.author_id')
  .select(['posts.title', 'users.name as author'])
  .where('posts.published', '=', true)
  .execute()
```

### E-commerce App
```typescript
// Point at your existing e-commerce database
const db = new NOORMME({
  dialect: 'sqlite',
  connection: { database: './shop.sqlite' }
})

await db.initialize()

const productRepo = db.getRepository('products')
const orderRepo = db.getRepository('orders')

// Auto-generated methods work with your existing data
const featuredProducts = await productRepo.findManyByFeatured(true)
const pendingOrders = await orderRepo.findManyByStatus('pending')
```

## 🔧 Configuration (Optional)

For most people, the default settings work perfectly. But if you want to customize:

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

## 🚀 Production Ready

NOORMME is already running in production applications. It includes:

- **Health monitoring** - Know when something's wrong
- **Performance metrics** - See how fast your queries are
- **Security features** - Protection against common attacks
- **Migration support** - Move from PostgreSQL to SQLite easily
- **Backup strategies** - Your data is safe

## ❓ FAQ for Normies

**Q: Do I need to learn SQL?**
A: Nope! NOORMME handles most things automatically. You only need SQL for complex queries.

**Q: Can I use my existing database?**
A: Yes! Just point NOORMME at your existing SQLite file and it figures everything out.

**Q: Is this really production-ready?**
A: Absolutely. Real applications are using it right now with better performance than PostgreSQL.

**Q: What if I'm already using another ORM?**
A: NOORMME works alongside other tools. You can migrate gradually or use both.

**Q: Do I need TypeScript?**
A: NOORMME works with JavaScript too, but TypeScript gives you the best experience.

## 🤝 Contributing

Found a bug? Have an idea? We'd love your help!

```bash
git clone https://github.com/cardsorting/noormme.git
cd noormme
npm install
npm test
```

## 📄 License

Apache 2.0 License - see [LICENSE](LICENSE) file for details.

## 🎉 Start Today

Ready to make your database work for you instead of against you?

```bash
npm install noormme
```

**Because database development should be normal, not rocket science.** 🚀

---

*NOORMME - Making SQLite automation so simple, even normies can use it.*
