# Blog Application Example

> **Complete blog application with relationships and advanced patterns**

This example demonstrates how to build a full blog application using NOORMME, including users, posts, comments, and relationships.

## 🎯 What You'll Learn

- Working with relationships
- Nested relationship loading
- Batch loading for performance
- Complex queries with joins
- Real-world application patterns

## 📋 Prerequisites

- Node.js 18+
- TypeScript 5+
- PostgreSQL, MySQL, or SQLite database

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install noormme pg
# or
npm install noormme mysql2
# or
npm install noormme better-sqlite3
```

### 2. Set Up Database

Create the blog database schema:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post tags junction table
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### 3. Run the Example

```bash
npm start
```

## 📝 Example Code

```typescript
import { NOORMME } from 'noormme'

async function main() {
  // Initialize NOORMME
  const db = new NOORMME({
    dialect: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'blog_db',
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password'
    }
  })

  try {
    await db.initialize()
    console.log('✅ NOORMME initialized successfully!')

    // Get repositories
    const userRepo = db.getRepository('users')
    const postRepo = db.getRepository('posts')
    const commentRepo = db.getRepository('comments')
    const tagRepo = db.getRepository('tags')

    // Create a user
    console.log('\n👤 Creating a user...')
    const user = await userRepo.create({
      email: 'author@example.com',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Software developer and blogger'
    })
    console.log('Created user:', user)

    // Create a post
    console.log('\n📝 Creating a post...')
    const post = await postRepo.create({
      title: 'Getting Started with NOORMME',
      content: 'NOORMME is a zero-configuration pseudo-ORM...',
      slug: 'getting-started-with-noormme',
      published: true,
      userId: user.id
    })
    console.log('Created post:', post)

    // Create a comment
    console.log('\n💬 Creating a comment...')
    const comment = await commentRepo.create({
      content: 'Great post! Very helpful.',
      postId: post.id,
      userId: user.id
    })
    console.log('Created comment:', comment)

    // Load post with relationships
    console.log('\n🔗 Loading post with relationships...')
    const postWithRelations = await postRepo.findWithRelations(post.id, [
      'user',
      'comments.user'
    ])
    console.log('Post with relationships:', postWithRelations)

    // Load user with all their posts and comments
    console.log('\n👤 Loading user with all content...')
    const userWithContent = await userRepo.findWithRelations(user.id, [
      'posts',
      'comments'
    ])
    console.log('User with content:', userWithContent)

    // Complex query - Get all published posts with author info
    console.log('\n📊 Complex query - Published posts with authors...')
    const publishedPosts = await db
      .selectFrom('posts')
      .innerJoin('users', 'users.id', 'posts.user_id')
      .where('posts.published', '=', true)
      .select([
        'posts.id',
        'posts.title',
        'posts.slug',
        'posts.created_at',
        'users.username',
        'users.first_name',
        'users.last_name'
      ])
      .orderBy('posts.created_at', 'desc')
      .execute()
    console.log('Published posts:', publishedPosts)

    // Batch loading for performance
    console.log('\n⚡ Batch loading for performance...')
    const allUsers = await userRepo.findAll()
    await userRepo.loadRelationships(allUsers, ['posts', 'comments'])
    console.log('Users with batch-loaded relationships:', allUsers.length)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.close()
  }
}

main().catch(console.error)
```

## 🎯 Key Concepts

### 1. Relationships

NOORMME automatically discovers foreign key relationships:

```typescript
// Load user with their posts
const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

// Load nested relationships
const postWithComments = await postRepo.findWithRelations(post.id, ['comments.user'])
```

### 2. Batch Loading

Avoid N+1 queries by loading relationships in batches:

```typescript
// ❌ N+1 queries (slow)
const users = await userRepo.findAll()
for (const user of users) {
  await userRepo.loadRelationships(user, ['posts'])
}

// ✅ Batch loading (fast)
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

### 3. Complex Queries

Use Kysely for complex queries with joins:

```typescript
const postsWithAuthors = await db
  .selectFrom('posts')
  .innerJoin('users', 'users.id', 'posts.user_id')
  .where('posts.published', '=', true)
  .select([
    'posts.title',
    'users.username'
  ])
  .execute()
```

## 🔧 Advanced Patterns

### 1. Pagination

```typescript
const posts = await db
  .selectFrom('posts')
  .selectAll()
  .orderBy('created_at', 'desc')
  .limit(10)
  .offset(0)
  .execute()
```

### 2. Search

```typescript
const searchResults = await db
  .selectFrom('posts')
  .where('title', 'ilike', `%${searchTerm}%`)
  .orWhere('content', 'ilike', `%${searchTerm}%`)
  .selectAll()
  .execute()
```

### 3. Aggregations

```typescript
const postStats = await db
  .selectFrom('posts')
  .innerJoin('users', 'users.id', 'posts.user_id')
  .select([
    'users.username',
    db.fn.count('posts.id').as('post_count')
  ])
  .groupBy('users.username')
  .execute()
```

## 🚨 Common Issues

### 1. Relationship Loading

```typescript
// ❌ Wrong relationship name
const user = await userRepo.findWithRelations(id, ['Posts'])

// ✅ Correct
const user = await userRepo.findWithRelations(id, ['posts'])
```

### 2. N+1 Queries

```typescript
// ❌ N+1 queries
const users = await userRepo.findAll()
for (const user of users) {
  await userRepo.loadRelationships(user, ['posts'])
}

// ✅ Batch loading
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])
```

## 📚 Next Steps

- **Build an API** - Check out [api-server](../api-server/) example
- **Performance optimization** - See [performance](../performance/) example
- **E-commerce patterns** - Explore [ecommerce](../ecommerce/) example

## 🤝 Contributing

Found an issue or want to improve this example? We welcome contributions!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Ready for more?** Try the [api-server](../api-server/) example to build a real API!
