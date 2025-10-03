# Basic CRUD Example

> **Learn fundamental NOORM operations in 5 minutes**

This example demonstrates the core CRUD (Create, Read, Update, Delete) operations using NOORM.

## 🎯 What You'll Learn

- How to set up NOORM
- Basic CRUD operations
- Working with auto-generated types
- Error handling patterns

## 📋 Prerequisites

- Node.js 18+
- TypeScript 5+
- PostgreSQL, MySQL, or SQLite database

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install noorm pg
# or
npm install noorm mysql2
# or
npm install noorm better-sqlite3
```

### 2. Set Up Database

Create a simple `users` table:

```sql
-- PostgreSQL
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MySQL
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SQLite
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Run the Example

```bash
npm start
```

## 📝 Example Code

```typescript
import { NOORM } from 'noorm'

async function main() {
  // Initialize NOORM
  const db = new NOORM({
    dialect: 'postgresql', // or 'mysql', 'sqlite'
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'example_db',
      username: 'user',
      password: 'password'
    }
  })

  try {
    // Initialize and discover schema
    await db.initialize()
    console.log('✅ NOORM initialized successfully!')

    // Get repository for users table
    const userRepo = db.getRepository('users')

    // CREATE - Add a new user
    console.log('\n📝 Creating a new user...')
    const newUser = await userRepo.create({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    })
    console.log('Created user:', newUser)

    // READ - Find user by ID
    console.log('\n🔍 Finding user by ID...')
    const foundUser = await userRepo.findById(newUser.id)
    console.log('Found user:', foundUser)

    // READ - Find all users
    console.log('\n📋 Finding all users...')
    const allUsers = await userRepo.findAll()
    console.log('All users:', allUsers)

    // UPDATE - Modify the user
    console.log('\n✏️ Updating user...')
    foundUser.firstName = 'Johnny'
    const updatedUser = await userRepo.update(foundUser)
    console.log('Updated user:', updatedUser)

    // DELETE - Remove the user
    console.log('\n🗑️ Deleting user...')
    const deleted = await userRepo.delete(updatedUser.id)
    console.log('User deleted:', deleted)

    // Verify deletion
    const deletedUser = await userRepo.findById(updatedUser.id)
    console.log('User after deletion:', deletedUser) // Should be null

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    // Clean up
    await db.close()
  }
}

main()
```

## 🎯 Key Concepts

### 1. Auto-Generated Types

NOORM automatically generates TypeScript types from your database schema:

```typescript
// Auto-generated User interface
interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  createdAt?: Date
  updatedAt?: Date
}
```

### 2. Repository Pattern

Each table gets its own repository with CRUD methods:

```typescript
const userRepo = db.getRepository('users')

// All these methods are auto-generated and type-safe
await userRepo.create(data)
await userRepo.findById(id)
await userRepo.findAll()
await userRepo.update(entity)
await userRepo.delete(id)
```

### 3. Error Handling

Always wrap database operations in try-catch blocks:

```typescript
try {
  const user = await userRepo.create(data)
  return user
} catch (error) {
  console.error('Failed to create user:', error)
  throw error
}
```

## 🔧 Configuration Options

### Environment Variables

```typescript
const db = new NOORM({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'example_db',
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password'
  }
})
```

### Debug Mode

```typescript
const db = new NOORM({
  // ... connection config
  logging: {
    level: 'debug',
    enabled: true
  }
})
```

## 🚨 Common Issues

### 1. "NOORM not initialized"
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
const userRepo = db.getRepository('Users')

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
}
```

## 📚 Next Steps

- **Learn relationships** - Check out [blog-app](../blog-app/) example
- **Build an API** - See [api-server](../api-server/) example
- **Performance tips** - Explore [performance](../performance/) example

## 🤝 Contributing

Found an issue or want to improve this example? We welcome contributions!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Ready for more?** Try the [blog-app](../blog-app/) example to learn about relationships!
