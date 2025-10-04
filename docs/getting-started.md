# Getting Started with NOORMME

Welcome to NOORMME - the most intelligent SQLite ORM! This guide will get you up and running in minutes.

## 🚀 Installation

### Prerequisites
- Node.js 16+ 
- TypeScript (recommended)
- SQLite database

### Install NOORMME
```bash
npm install noormme
```

### TypeScript Setup (Optional but Recommended)
```bash
npm install -D typescript @types/node tsx
```

## 📝 Quick Start

### 1. Basic Setup
Create a new file `app.ts`:

```typescript
import { NOORMME } from 'noormme'

const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './app.sqlite'
  }
})

async function main() {
  // Initialize NOORMME
  await db.initialize()
  
  // Get a repository for your table
  const userRepo = db.getRepository('users')
  
  // Use the repository
  const users = await userRepo.findAll()
  console.log('Users:', users)
}

main().catch(console.error)
```

### 2. Run Your App
```bash
npx tsx app.ts
```

That's it! NOORMME will automatically:
- ✅ Discover your database schema
- ✅ Generate TypeScript types
- ✅ Create optimized repositories
- ✅ Apply performance optimizations

## 🎯 Understanding the Magic

### What Happens During Initialization

When you call `db.initialize()`, NOORMME:

1. **Connects** to your SQLite database
2. **Discovers** all tables, columns, indexes, and relationships
3. **Generates** TypeScript types for type safety
4. **Creates** repository classes with CRUD operations
5. **Optimizes** database performance automatically
6. **Validates** foreign key constraints

### Auto-Generated Features

NOORMME automatically creates:

- **Repository classes** with CRUD operations
- **TypeScript interfaces** for type safety
- **Custom finder methods** based on your columns
- **Relationship handling** for foreign keys
- **Performance optimizations** for SQLite

## 📚 Basic Usage Examples

### CRUD Operations
```typescript
const userRepo = db.getRepository('users')

// Create a new user
const newUser = await userRepo.create({
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
})

// Find a user by ID
const user = await userRepo.findById(1)

// Update a user
const updatedUser = await userRepo.update({
  ...user,
  name: 'Jane Doe'
})

// Delete a user
await userRepo.delete(1)

// Get all users
const allUsers = await userRepo.findAll()
```

### Auto-Generated Finder Methods
```typescript
// These methods are automatically generated based on your table columns
const userByEmail = await userRepo.findByEmail('john@example.com')
const activeUsers = await userRepo.findManyByStatus('active')
const usersByRole = await userRepo.findManyByRole('admin')
```

### Pagination
```typescript
const result = await userRepo.paginate({
  page: 1,
  limit: 20,
  where: { status: 'active' },
  orderBy: { column: 'createdAt', direction: 'desc' }
})

console.log('Users:', result.data)
console.log('Total:', result.pagination.total)
console.log('Pages:', result.pagination.totalPages)
```

### Relationships
```typescript
// Load related data
const userWithPosts = await userRepo.findWithRelations(1, ['posts'])

// Count related records
const userWithCounts = await userRepo.withCount(1, ['posts', 'comments'])
```

## ⚙️ Configuration Options

### Basic Configuration
```typescript
const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './app.sqlite'
  }
})
```

### Advanced Configuration
```typescript
const db = new NOORMME({
  dialect: 'sqlite',
  connection: {
    database: './app.sqlite'
  },
  performance: {
    enableAutoOptimization: true,    // Enable automatic optimizations
    enableQueryOptimization: true,   // Enable query analysis
    enableBatchLoading: true,        // Enable batch loading for relationships
    maxBatchSize: 100                // Maximum batch size
  },
  introspection: {
    excludeTables: ['migrations'],   // Tables to exclude from discovery
    includeViews: false,             // Whether to include database views
    customTypeMappings: {            // Custom type mappings
      'jsonb': 'Record<string, any>'
    }
  },
  cache: {
    ttl: 300000,                     // Cache TTL in milliseconds
    maxSize: 1000                    // Maximum cache size
  },
  logging: {
    level: 'info',                   // Logging level
    enabled: true                    // Enable logging
  }
})
```

## 🔧 Environment Variables

You can also configure NOORMME using environment variables:

```bash
# .env
DATABASE_URL=sqlite:./app.sqlite
NOORM_LOG_LEVEL=info
NOORM_ENABLE_AUTO_OPTIMIZATION=true
```

Then initialize with:
```typescript
const db = new NOORMME() // Automatically reads from .env
await db.initialize()
```

## 🎯 Next Steps

Now that you have NOORMME running, explore these features:

1. **[Schema Discovery](schema-discovery.md)** - Learn how NOORMME discovers your database
2. **[Auto-Optimization](auto-optimization.md)** - Understand performance optimizations
3. **[Repository Pattern](repository-pattern.md)** - Master the repository API
4. **[SQLite Features](sqlite-features.md)** - Explore SQLite-specific features
5. **[Examples](../examples/)** - See real-world usage examples

## 🆘 Getting Help

If you run into issues:

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Review the [Examples](../examples/)
3. Open an issue on GitHub

## 🎉 Congratulations!

You've successfully set up NOORMME! Your SQLite database is now automatically optimized and ready for production use.

**Happy coding! 🚀**
