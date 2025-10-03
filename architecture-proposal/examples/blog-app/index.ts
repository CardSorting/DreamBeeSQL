import { NOORMME } from 'noormme'

async function main() {
  // Initialize NOORMME
  const db = new NOORMME({
    dialect: 'postgresql', // Change to 'mysql' or 'sqlite' as needed
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'blog_db',
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password'
    },
    logging: {
      level: 'info',
      enabled: true
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
      content: 'NOORMME is a zero-configuration pseudo-ORM that automatically discovers your database schema and generates TypeScript types, entities, and repositories.',
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

    // Create another user and post to demonstrate batch loading
    console.log('\n👤 Creating another user...')
    const user2 = await userRepo.create({
      email: 'jane@example.com',
      username: 'janedoe',
      firstName: 'Jane',
      lastName: 'Doe',
      bio: 'Frontend developer'
    })

    const post2 = await postRepo.create({
      title: 'Advanced NOORMME Patterns',
      content: 'Learn advanced patterns and best practices...',
      slug: 'advanced-noormme-patterns',
      published: true,
      userId: user2.id
    })

    // Demonstrate batch loading with multiple users
    console.log('\n⚡ Batch loading multiple users...')
    const allUsers2 = await userRepo.findAll()
    await userRepo.loadRelationships(allUsers2, ['posts'])
    
    for (const u of allUsers2) {
      console.log(`User ${u.username} has ${u.posts?.length || 0} posts`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.close()
  }
}

// Run the example
main().catch(console.error)
