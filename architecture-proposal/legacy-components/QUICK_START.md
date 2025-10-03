# DreamBeeSQL Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you get up and running with DreamBeeSQL in just a few minutes.

## 📋 Prerequisites

- Node.js 18+ 
- TypeScript 4.5+
- PostgreSQL, MySQL, SQLite, or MSSQL database
- Basic knowledge of TypeScript and SQL

## ⚡ Installation

```bash
# Install DreamBeeSQL
npm install dreambeesql

# Install database driver (choose one)
npm install pg                    # PostgreSQL
npm install mysql2               # MySQL
npm install better-sqlite3       # SQLite
npm install tedious              # MSSQL
```

## 🎯 Basic Usage

### 1. Initialize DreamBeeSQL

```typescript
import { DreamBeeSQL } from 'dreambeesql'

const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

// Discover schema and generate types automatically
await db.initialize()
```

### 2. Use Auto-Generated Repositories

```typescript
// Get auto-generated repository
const userRepo = db.getRepository('users')

// Create a new user
const user = await userRepo.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

console.log('Created user:', user.id)
```

### 3. Type-Safe Operations

```typescript
// Find user by ID (fully typed)
const foundUser = await userRepo.findById(user.id)

// Find all users
const allUsers = await userRepo.findAll()

// Update user
foundUser.firstName = 'Johnny'
const updatedUser = await userRepo.update(foundUser)

// Delete user
await userRepo.delete(user.id)
```

## 🔗 Working with Relationships

```typescript
// Load user with posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Load post with comments
const postRepo = db.getRepository('posts')
const postWithComments = await postRepo.findWithRelations(post.id, ['comments'])

// Load nested relationships
const userWithAll = await userRepo.findWithRelations(user.id, [
  'posts.comments',
  'profile'
])
```

## 🎨 Advanced Features

### Schema Evolution

```typescript
// Monitor schema changes
db.onSchemaChange((changes) => {
  console.log('Schema changes detected:', changes)
  // Types and entities are automatically updated
})

// Start monitoring
await db.startSchemaMonitoring()
```

### Custom Configuration

```typescript
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: { /* connection config */ },
  introspection: {
    includeViews: true,
    excludeTables: ['migrations', 'sessions']
  },
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  },
  logging: {
    level: 'info',
    enabled: true
  }
})
```

### Performance Optimization

```typescript
// Configure for production
db.updateConfig({
  cache: {
    ttl: 600000,
    maxSize: 5000,
    strategy: 'lru'
  },
  performance: {
    enableQueryOptimization: true,
    enableBatchLoading: true,
    maxBatchSize: 200
  }
})

// Preload frequently used data
await db.preloadSchema()
await db.preloadRelationships(['users.posts', 'posts.comments'])
```

## 🧪 Testing

```typescript
import { DreamBeeSQL } from 'dreambeesql'

describe('DreamBeeSQL', () => {
  let db: DreamBeeSQL
  
  beforeEach(async () => {
    db = new DreamBeeSQL({
      dialect: 'sqlite',
      connection: {
        database: ':memory:'
      }
    })
    await db.initialize()
  })
  
  afterEach(async () => {
    await db.close()
  })
  
  it('should create and find users', async () => {
    const userRepo = db.getRepository('users')
    
    const user = await userRepo.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    })
    
    expect(user.id).toBeDefined()
    
    const foundUser = await userRepo.findById(user.id)
    expect(foundUser).toEqual(user)
  })
})
```

## 🚨 Error Handling

```typescript
try {
  const user = await userRepo.findById('invalid-id')
  if (!user) {
    throw new Error('User not found')
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message)
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message)
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

## 📊 Database Schema Example

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 What Happens Under the Hood

1. **Schema Discovery** - DreamBeeSQL connects to your database and discovers all tables, columns, and relationships
2. **Type Generation** - TypeScript types are automatically generated from your database schema
3. **Entity Generation** - Entity classes are created with decorators and methods
4. **Repository Generation** - Repository classes are generated with CRUD operations
5. **Runtime Management** - All components are registered and ready for use

## 🔧 Configuration Options

### Database Connection

```typescript
// PostgreSQL
{
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
}

// MySQL
{
  dialect: 'mysql',
  connection: {
    host: 'localhost',
    port: 3306,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
}

// SQLite
{
  dialect: 'sqlite',
  connection: {
    database: './myapp.db'
  }
}
```

### Introspection Options

```typescript
{
  introspection: {
    includeViews: true,           // Include database views
    includeSystemTables: false,   // Exclude system tables
    customTypeMappings: {         // Custom type mappings
      'jsonb': 'Record<string, any>',
      'custom_type': 'CustomTypeInterface'
    },
    excludeTables: ['migrations', 'sessions'], // Exclude specific tables
    relationshipDepth: 3          // Maximum relationship depth
  }
}
```

### Cache Options

```typescript
{
  cache: {
    ttl: 300000,        // Cache TTL in milliseconds
    maxSize: 1000,      // Maximum cache entries
    strategy: 'lru',    // Cache eviction strategy
    preload: ['users', 'posts'] // Preload specific tables
  }
}
```

### Logging Options

```typescript
{
  logging: {
    level: 'info',      // Log level: debug, info, warn, error
    enabled: true,      // Enable logging
    file: './logs/dreambeesql.log' // Log file path
  }
}
```

## 🚀 Production Setup

```typescript
import { DreamBeeSQL } from 'dreambeesql'

// Production configuration
const db = new DreamBeeSQL({
  dialect: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  },
  introspection: {
    includeViews: true,
    excludeTables: ['migrations', 'sessions', 'logs']
  },
  cache: {
    ttl: 600000,
    maxSize: 5000,
    strategy: 'lru'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: true,
    file: './logs/dreambeesql.log'
  }
})

// Initialize with error handling
try {
  await db.initialize()
  console.log('DreamBeeSQL initialized successfully')
} catch (error) {
  console.error('Failed to initialize DreamBeeSQL:', error)
  process.exit(1)
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down DreamBeeSQL...')
  await db.close()
  process.exit(0)
})
```

## 🎉 Next Steps

1. **Explore Examples** - Check out the [implementation examples](./implementation-examples/) directory
2. **Read Documentation** - Dive deeper with the [full documentation](./README.md)
3. **Understand Architecture** - Learn about the [simplified architecture](./SIMPLIFIED_ARCHITECTURE.md)
4. **Follow Implementation Guide** - Build your own implementation with the [step-by-step guide](./IMPLEMENTATION_GUIDE.md)
5. **View Diagrams** - Visualize the system with [architecture diagrams](./ARCHITECTURE_DIAGRAMS.md)

## 🤝 Getting Help

- **Documentation** - Comprehensive guides and examples
- **GitHub Issues** - Report bugs and request features
- **Discussions** - Ask questions and share ideas
- **Examples** - Working code examples and patterns

## 🎯 Key Benefits

- **Zero Configuration** - Works with any existing database
- **Type Safety** - Full TypeScript support with auto-generated types
- **Automatic Discovery** - No need to manually define entities
- **Schema Evolution** - Automatically adapts to database changes
- **Performance Optimized** - Smart caching and query optimization
- **Production Ready** - Built for production use with monitoring and error handling

Start building with DreamBeeSQL today and experience the power of zero-configuration, type-safe database access!
