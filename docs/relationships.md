# Relationships in NOORMME

NOORMME automatically discovers database relationships and provides powerful loading patterns without the complexity of traditional ORMs. This guide covers relationship loading, counting, and optimization.

## Automatic Relationship Discovery

NOORMME analyzes your database schema to automatically discover relationships:

```typescript
// NOORMME automatically detects:
// users.id -> posts.user_id (one-to-many)
// posts.id -> comments.post_id (one-to-many)
// users.id -> comments.user_id (one-to-many)

await db.initialize() // Discovers all relationships
const schema = await db.getSchemaInfo()
console.log(schema.relationships)
```

## Relationship Types

### One-to-Many

The most common relationship type:

```sql
-- Database schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  user_id INTEGER REFERENCES users(id)
);
```

```typescript
// NOORMME automatically creates these relationships:
// User -> Posts (one-to-many)
// Post -> User (many-to-one)
```

### Many-to-One

The inverse of one-to-many:

```typescript
// A post belongs to a user
const post = await postRepo.findById(1)
const postWithUser = await postRepo.findWithRelations(1, ['user'])
console.log(postWithUser.user) // User object
```

### Many-to-Many

Handled through junction tables:

```sql
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255));
CREATE TABLE roles (id SERIAL PRIMARY KEY, name VARCHAR(255));
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id)
);
```

```typescript
// NOORMME detects the junction table pattern
const userWithRoles = await userRepo.findWithRelations(1, ['roles'])
```

## Loading Relationships

### Single Relationship Loading

Load one relationship with an entity:

```typescript
const userRepo = db.getRepository('users')

// Load user with their posts
const userWithPosts = await userRepo.findWithRelations(1, ['posts'])

console.log(userWithPosts.posts) // Array of post objects
```

### Multiple Relationship Loading

Load multiple relationships simultaneously:

```typescript
// Load user with posts and comments
const userWithRelations = await userRepo.findWithRelations(1, ['posts', 'comments'])

console.log(userWithRelations.posts)    // User's posts
console.log(userWithRelations.comments) // User's comments
```

### Batch Relationship Loading

Load relationships for multiple entities efficiently:

```typescript
const users = await userRepo.findAll()

// Load posts for all users in batched queries
await userRepo.loadRelationships(users, ['posts'])

// Now all users have their posts loaded
users.forEach(user => {
  console.log(`${user.name} has ${user.posts.length} posts`)
})
```

## Relationship Counting

Get relationship counts without loading the actual data:

### Single Count

```typescript
const userWithCounts = await userRepo.withCount(1, ['posts'])

console.log(userWithCounts.postsCount) // 5 (just the count, not the data)
console.log(userWithCounts.posts)      // undefined (data not loaded)
```

### Multiple Counts

```typescript
const userWithCounts = await userRepo.withCount(1, ['posts', 'comments'])

console.log(userWithCounts.postsCount)    // 5
console.log(userWithCounts.commentsCount) // 23
```

### Count with Filtering

Use the underlying query for filtered counts:

```typescript
// Count only published posts
const kysely = db.getKysely()
const publishedPostCount = await kysely
  .selectFrom('posts')
  .where('user_id', '=', userId)
  .where('published', '=', true)
  .select(({ fn }) => fn.count<number>('*').as('count'))
  .executeTakeFirst()
```

## Performance Optimization

### Batch Loading vs N+1 Queries

NOORMME automatically uses batch loading to prevent N+1 query problems:

```typescript
// Bad: N+1 queries (1 query + N queries for each user's posts)
const users = await userRepo.findAll()
for (const user of users) {
  user.posts = await postRepo.findManyByUserId(user.id) // N queries!
}

// Good: Batch loading (2 queries total)
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts']) // 2 queries total
```

### Selective Loading

Only load the relationships you need:

```typescript
// Only load posts when needed
const userForProfile = await userRepo.findById(1)

// Only load posts for the posts page
const userForPosts = await userRepo.findWithRelations(1, ['posts'])
```

### Relationship Counting vs Loading

Use counting for performance when you only need quantities:

```typescript
// Fast: Only gets the count
const userStats = await userRepo.withCount(1, ['posts', 'comments'])
console.log(`User has ${userStats.postsCount} posts`)

// Slower: Loads all post data just to count
const userWithPosts = await userRepo.findWithRelations(1, ['posts'])
console.log(`User has ${userWithPosts.posts.length} posts`)
```

## Advanced Relationship Patterns

### Nested Relationships

Load relationships of relationships:

```typescript
// Load user with posts, and comments for each post
const user = await userRepo.findWithRelations(1, ['posts'])

// For each post, load its comments
for (const post of user.posts) {
  const postWithComments = await postRepo.findWithRelations(post.id, ['comments'])
  post.comments = postWithComments.comments
}
```

### Conditional Relationship Loading

Load relationships based on conditions:

```typescript
async function getUserWithOptionalPosts(userId: number, includePosts: boolean) {
  const relations = includePosts ? ['posts'] : []
  return await userRepo.findWithRelations(userId, relations)
}
```

### Relationship Aggregations

Calculate aggregations across relationships:

```typescript
// Get users with their post statistics
const kysely = db.getKysely()
const usersWithStats = await kysely
  .selectFrom('users')
  .leftJoin('posts', 'posts.user_id', 'users.id')
  .select([
    'users.id',
    'users.name',
    kysely.fn.count('posts.id').as('postCount'),
    kysely.fn.avg('posts.views').as('avgViews')
  ])
  .groupBy(['users.id', 'users.name'])
  .execute()
```

## Relationship Patterns in Practice

### Blog Application

```typescript
interface BlogUser {
  id: number
  name: string
  posts?: BlogPost[]
  postsCount?: number
}

interface BlogPost {
  id: number
  title: string
  user_id: number
  user?: BlogUser
  comments?: Comment[]
  commentsCount?: number
}

// Homepage: Show users with post counts
const usersForHomepage = await Promise.all(
  (await userRepo.findAll()).map(async user =>
    await userRepo.withCount(user.id, ['posts'])
  )
)

// User profile: Show user with their posts
const userProfile = await userRepo.findWithRelations(userId, ['posts'])

// Post page: Show post with user and comments
const postPage = await postRepo.findWithRelations(postId, ['user', 'comments'])
```

### E-commerce Application

```typescript
// Product catalog: Show products with review counts
const products = await Promise.all(
  (await productRepo.findAll()).map(async product =>
    await productRepo.withCount(product.id, ['reviews'])
  )
)

// Order details: Load order with items and customer
const orderDetails = await orderRepo.findWithRelations(orderId, ['items', 'customer'])

// Customer dashboard: Show customer with recent orders
const customerDashboard = await customerRepo.findWithRelations(customerId, ['orders'])
```

### Social Media Application

```typescript
// User feed: Show posts with engagement counts
const feedPosts = await Promise.all(
  (await postRepo.findAll()).map(async post =>
    await postRepo.withCount(post.id, ['likes', 'comments', 'shares'])
  )
)

// User profile: Show user with follower/following counts
const userProfile = await userRepo.withCount(userId, ['followers', 'following', 'posts'])

// Post details: Load post with all interactions
const postDetails = await postRepo.findWithRelations(postId, ['likes', 'comments', 'shares'])
```

## Testing Relationships

### Unit Tests

```typescript
describe('User Relationships', () => {
  it('should load user posts', async () => {
    const user = await factory.createUser()
    await factory.createPosts(user.id, 3)

    const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])

    expect(userWithPosts.posts).toHaveLength(3)
    expect(userWithPosts.posts[0]).toHaveProperty('title')
  })

  it('should count user relationships', async () => {
    const user = await factory.createUser()
    await factory.createPosts(user.id, 5)
    await factory.createComments(user.id, 10)

    const userWithCounts = await userRepo.withCount(user.id, ['posts', 'comments'])

    expect(userWithCounts.postsCount).toBe(5)
    expect(userWithCounts.commentsCount).toBe(10)
  })
})
```

### Performance Tests

```typescript
it('should avoid N+1 queries', async () => {
  const users = await factory.createUsers(10)
  for (const user of users) {
    await factory.createPosts(user.id, 5)
  }

  // Mock query tracking
  const queryTracker = jest.fn()
  db.onQuery = queryTracker

  // Load all users with their posts
  const allUsers = await userRepo.findAll()
  await userRepo.loadRelationships(allUsers, ['posts'])

  // Should be 2 queries: 1 for users, 1 for all posts
  expect(queryTracker).toHaveBeenCalledTimes(2)
})
```

## Error Handling

### Invalid Relationships

```typescript
try {
  await userRepo.withCount(1, ['invalid_relationship'])
} catch (error) {
  console.error(error.message) // "Relationship 'invalid_relationship' not found"
  console.log(error.context.availableOptions) // ['posts', 'comments']
}
```

### Missing Entities

```typescript
try {
  await userRepo.findWithRelations(99999, ['posts'])
} catch (error) {
  console.error('User not found')
}
```

## Best Practices

### 1. Use Counting for Performance

```typescript
// Good: Fast count for display
const userStats = await userRepo.withCount(userId, ['posts'])
console.log(`${userStats.postsCount} posts`)

// Avoid: Loading all data just to count
const user = await userRepo.findWithRelations(userId, ['posts'])
console.log(`${user.posts.length} posts`)
```

### 2. Batch Load When Possible

```typescript
// Good: Batch load for multiple entities
const users = await userRepo.findAll()
await userRepo.loadRelationships(users, ['posts'])

// Avoid: Individual loads
for (const user of users) {
  user.posts = await userRepo.findWithRelations(user.id, ['posts'])
}
```

### 3. Be Selective with Relationships

```typescript
// Good: Only load what you need
const userForProfile = await userRepo.findWithRelations(userId, ['posts'])

// Avoid: Loading unnecessary data
const userWithEverything = await userRepo.findWithRelations(userId, [
  'posts', 'comments', 'likes', 'followers', 'following'
])
```

### 4. Cache Expensive Relationship Counts

```typescript
// Cache expensive counts
const cacheKey = `user_${userId}_stats`
let userStats = cache.get(cacheKey)

if (!userStats) {
  userStats = await userRepo.withCount(userId, ['posts', 'comments'])
  cache.set(cacheKey, userStats, 300000) // 5 minutes
}
```

NOORMME's relationship system provides the power of traditional ORMs with the performance and simplicity of direct SQL queries, giving you the best of both worlds.