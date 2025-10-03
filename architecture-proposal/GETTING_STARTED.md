# NOORMME Getting Started Guide

> **Get NOORMME running in 5 minutes**

This guide will get you up and running with NOORMME in just a few minutes. No complex setup required!

## 🎯 What You'll Learn

- How to install and configure NOORMME
- Basic CRUD operations with type safety
- Working with relationships
- Common patterns and best practices
- Troubleshooting common issues

## 📋 Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **TypeScript 5+** (recommended)
- **A database** (PostgreSQL, MySQL, or SQLite)

> **💡 Don't have a database yet?** Check out our [Database Setup Guide](#database-setup) below.

## 🚀 Step 1: Installation

```bash
# Install NOORMME
npm install noormme

# Install database driver (choose one based on your database)
npm install pg                    # PostgreSQL
npm install mysql2               # MySQL  
npm install better-sqlite3       # SQLite
```

> **💡 Using yarn or pnpm?** Replace `npm install` with `yarn add` or `pnpm add`.

## 🔧 Step 2: Basic Setup

Create a new file `app.ts` (or `app.js` if you're not using TypeScript):

```typescript
import { NOORMME } from 'noormme'

// Initialize NOORMME
const db = new NOORMME({
  dialect: 'postgresql', // or 'mysql', 'sqlite'
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

// Initialize and discover schema
await db.initialize()
console.log('✅ NOORMME initialized successfully!')
```

> **⚠️ Important:** Make sure to replace the connection details with your actual database credentials.

## 📊 Step 3: Your First Query

```typescript
// Get a repository for the 'users' table
const userRepo = db.getRepository('users')

// Find all users
const users = await userRepo.findAll()
console.log('Users:', users)

// Find a user by ID
const user = await userRepo.findById('123')
console.log('User:', user)
```

> **💡 What just happened?** NOORMME automatically discovered your `users` table and created a type-safe repository for it!

## ✨ Step 4: CRUD Operations

```typescript
// Create a new user
const newUser = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})
console.log('Created user:', newUser)

// Update the user
newUser.firstName = 'Johnny'
const updatedUser = await userRepo.update(newUser)
console.log('Updated user:', updatedUser)

// Delete the user
await userRepo.delete(newUser.id)
console.log('User deleted')
```

> **💡 Type Safety:** Notice how TypeScript provides autocomplete and type checking for all these operations!

## 🔗 Step 5: Working with Relationships

```typescript
// Load user with their posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])
console.log('User with posts:', userWithPosts)

// Load nested relationships (posts with comments)
const userWithNested = await userRepo.findWithRelations(user.id, ['posts.comments'])
console.log('User with nested data:', userWithNested)
```

> **💡 Relationships:** NOORMME automatically discovers foreign key relationships and provides type-safe methods to load related data.

## 🎨 Step 6: Custom Queries

```typescript
// Use Kysely for complex queries
const activeUsers = await db
  .selectFrom('users')
  .where('active', '=', true)
  .selectAll()
  .execute()

console.log('Active users:', activeUsers)
```

> **💡 Custom Queries:** For complex queries, NOORMME provides full access to the Kysely query builder with type safety.

## 📝 Complete Example

Here's a complete working example:

```typescript
import { NOORMME } from 'noormme'

async function main() {
  // Initialize NOORMME
  const db = new NOORMME({
    dialect: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      username: 'user',
      password: 'password'
    }
  })

  try {
    // Initialize and discover schema
    await db.initialize()
    console.log('✅ NOORMME initialized successfully!')

    // Get repositories
    const userRepo = db.getRepository('users')
    const postRepo = db.getRepository('posts')

    // Create a user
    const user = await userRepo.create({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    })
    console.log('Created user:', user)

    // Create a post for the user
    const post = await postRepo.create({
      title: 'My First Post',
      content: 'Hello world!',
      userId: user.id
    })
    console.log('Created post:', post)

    // Load user with posts
    const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])
    console.log('User with posts:', userWithPosts)

    // Custom query
    const recentPosts = await db
      .selectFrom('posts')
      .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .selectAll()
      .execute()
    console.log('Recent posts:', recentPosts)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    // Clean up
    await db.close()
  }
}

main()
```

## 🎯 Common Patterns

### Environment Configuration

```typescript
const db = new NOORMME({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password'
  }
})
```

### Error Handling

```typescript
try {
  const user = await userRepo.findById(id)
  if (!user) {
    throw new Error('User not found')
  }
  return user
} catch (error) {
  console.error('Error:', error)
  throw error
}
```

### Batch Operations

```typescript
// Load relationships for multiple users efficiently
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts', 'profile'])
```

## 🚨 Common Issues

### 1. "NOORMME not initialized"
```typescript
// ❌ Wrong
const userRepo = db.getRepository('users')

// ✅ Correct
await db.initialize()
const userRepo = db.getRepository('users')
```

### 2. "Repository not found"
```typescript
// ❌ Wrong table name
const userRepo = db.getRepository('Users') // Should be 'users'

// ✅ Correct
const userRepo = db.getRepository('users')
```

### 3. Database connection issues
```typescript
// Test your connection
try {
  await db.initialize()
  console.log('✅ Database connected')
} catch (error) {
  console.error('❌ Connection failed:', error.message)
  // Check your connection details
}
```

## 🗄️ Database Setup

### PostgreSQL (Recommended)

```bash
# Install PostgreSQL
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
createdb myapp
```

### MySQL

```bash
# Install MySQL
# macOS with Homebrew
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Create database
mysql -u root -p
CREATE DATABASE myapp;
```

### SQLite (Development)

```bash
# No installation needed - SQLite comes with Node.js
# Database file will be created automatically
```

## 🎉 Next Steps

Congratulations! You've successfully set up NOORMME. Here's what to do next:

1. **Explore the docs** - Check out [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for comprehensive examples
2. **Try relationships** - Learn about loading related data in [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. **Migrate existing code** - See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) if you're coming from another ORM
4. **Advanced patterns** - Dive into [TYPESCRIPT_CHEAT_SHEET.md](./TYPESCRIPT_CHEAT_SHEET.md)

## 📚 Additional Resources

- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete guide with examples
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common operations cheat sheet
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[examples/](./examples/)** - Real-world usage patterns

---

**Need help?** Check out the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide or open an issue on GitHub!
