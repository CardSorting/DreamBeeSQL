// Repository Example Implementation
// This file demonstrates how to use the Repository Registry system with DreamBeeSQL
//
// Key Concepts:
// - Repositories are auto-generated from your database schema
// - No manual repository definitions required
// - Full CRUD operations with type safety
// - Automatic relationship loading
// - Custom query methods support

import { BaseRepository } from '../src/repository/base-repository'
import { RepositoryRegistry } from '../src/repository/repository-registry'
import { Kysely } from 'kysely'
import { User, UserRow, Post, PostRow, Comment, CommentRow, Profile, ProfileRow } from './entity-example'
import { RelationshipEngine } from '../src/relationships/relationship-engine'

// User Repository
export class UserRepository extends BaseRepository<User, UserRow> {
  getTableName(): string { return 'users' }
  getPrimaryKey(): string { return 'id' }
  
  protected rowToEntity(row: UserRow): User {
    return new User().fromRow(row)
  }
  
  // Custom methods
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst()
    
    return row ? this.rowToEntity(row) : null
  }
  
  async findActiveUsers(): Promise<User[]> {
    const rows = await this.db
      .selectFrom('users')
      .where('active', '=', true)
      .selectAll()
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findWithPosts(id: string): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    // Load relationships using relationship engine
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([user], ['posts'])
    
    return user
  }
  
  async findWithProfile(id: string): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    // Load relationships using relationship engine
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([user], ['profile'])
    
    return user
  }
  
  async findWithPostsAndProfile(id: string): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    // Load multiple relationships
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([user], ['posts', 'profile'])
    
    return user
  }
  
  async createUserWithProfile(userData: Partial<User>, profileData: Partial<Profile>): Promise<User> {
    return this.db.transaction().execute(async (trx) => {
      // Create user
      const user = await trx
        .insertInto('users')
        .values(userData)
        .returningAll()
        .executeTakeFirstOrThrow()
      
      // Create profile
      await trx
        .insertInto('profiles')
        .values({ ...profileData, user_id: user.id })
        .execute()
      
      return this.rowToEntity(user)
    })
  }
  
  async updateUserEmail(id: string, email: string): Promise<User> {
    const user = await this.findById(id)
    if (!user) {
      throw new Error('User not found')
    }
    
    user.email = email
    return await this.update(user)
  }
  
  async deleteUserAndProfile(id: string): Promise<boolean> {
    return this.db.transaction().execute(async (trx) => {
      // Delete profile first
      await trx
        .deleteFrom('profiles')
        .where('user_id', '=', id)
        .execute()
      
      // Delete user
      const result = await trx
        .deleteFrom('users')
        .where('id', '=', id)
        .execute()
      
      return result.numDeletedRows > 0
    })
  }
}

// Post Repository
export class PostRepository extends BaseRepository<Post, PostRow> {
  getTableName(): string { return 'posts' }
  getPrimaryKey(): string { return 'id' }
  
  protected rowToEntity(row: PostRow): Post {
    return new Post().fromRow(row)
  }
  
  // Custom methods
  async findByUserId(userId: string): Promise<Post[]> {
    const rows = await this.db
      .selectFrom('posts')
      .where('user_id', '=', userId)
      .selectAll()
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findWithComments(id: string): Promise<Post | null> {
    const post = await this.findById(id)
    if (!post) return null
    
    // Load relationships
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([post], ['comments'])
    
    return post
  }
  
  async findWithUserAndComments(id: string): Promise<Post | null> {
    const post = await this.findById(id)
    if (!post) return null
    
    // Load multiple relationships
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([post], ['user', 'comments'])
    
    return post
  }
  
  async findRecentPosts(limit: number = 10): Promise<Post[]> {
    const rows = await this.db
      .selectFrom('posts')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findPostsByTitle(title: string): Promise<Post[]> {
    const rows = await this.db
      .selectFrom('posts')
      .where('title', 'like', `%${title}%`)
      .selectAll()
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
}

// Comment Repository
export class CommentRepository extends BaseRepository<Comment, CommentRow> {
  getTableName(): string { return 'comments' }
  getPrimaryKey(): string { return 'id' }
  
  protected rowToEntity(row: CommentRow): Comment {
    return new Comment().fromRow(row)
  }
  
  // Custom methods
  async findByPostId(postId: string): Promise<Comment[]> {
    const rows = await this.db
      .selectFrom('comments')
      .where('post_id', '=', postId)
      .selectAll()
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findByUserId(userId: string): Promise<Comment[]> {
    const rows = await this.db
      .selectFrom('comments')
      .where('user_id', '=', userId)
      .selectAll()
      .execute()
    
    return rows.map(row => this.rowToEntity(row))
  }
  
  async findWithPostAndUser(id: string): Promise<Comment | null> {
    const comment = await this.findById(id)
    if (!comment) return null
    
    // Load relationships
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([comment], ['post', 'user'])
    
    return comment
  }
}

// Profile Repository
export class ProfileRepository extends BaseRepository<Profile, ProfileRow> {
  getTableName(): string { return 'profiles' }
  getPrimaryKey(): string { return 'id' }
  
  protected rowToEntity(row: ProfileRow): Profile {
    return new Profile().fromRow(row)
  }
  
  // Custom methods
  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await this.db
      .selectFrom('profiles')
      .where('user_id', '=', userId)
      .selectAll()
      .executeTakeFirst()
    
    return row ? this.rowToEntity(row) : null
  }
  
  async findWithUser(id: string): Promise<Profile | null> {
    const profile = await this.findById(id)
    if (!profile) return null
    
    // Load relationships
    const relationshipEngine = RelationshipEngine.getInstance()
    await relationshipEngine.loadRelationships([profile], ['user'])
    
    return profile
  }
}

// Usage Example with Comprehensive Error Handling
export async function demonstrateRepositoryUsage() {
  try {
    // Setup database connection
    const db = new Kysely<Database>({
      dialect: new PostgresDialect({
        database: new Pool({
          host: 'localhost',
          port: 5432,
          database: 'myapp',
          user: 'user',
          password: 'password'
        })
      })
    })
    
    // Setup repository registry
    const registry = RepositoryRegistry.getInstance()
    registry.setDatabase(db)
    
    // Get repositories
    const userRepo = registry.getRepository(UserRepository)
    const postRepo = registry.getRepository(PostRepository)
    const commentRepo = registry.getRepository(CommentRepository)
    const profileRepo = registry.getRepository(ProfileRepository)
    
    console.log('✅ Repositories initialized successfully')
    
    // Demonstrate repository usage
    await demonstrateUsage(userRepo, postRepo, commentRepo, profileRepo)
    
  } catch (error) {
    console.error('❌ Repository setup error:', error.message)
    throw error
  }
}

async function demonstrateUsage(
  userRepo: UserRepository,
  postRepo: PostRepository,
  commentRepo: CommentRepository,
  profileRepo: ProfileRepository
) {
  try {
    console.log('\n🚀 Starting repository demonstration...\n')
    
    // Create user with validation
    console.log('1. Creating user...')
    const user = new User()
    user.email = 'john@example.com'
    user.firstName = 'John'
    user.lastName = 'Doe'
    
    if (!user.email) {
      throw new Error('Email is required')
    }
    
    const savedUser = await userRepo.save(user)
    console.log('✅ User saved:', savedUser.id)
    
    // Create profile with validation
    console.log('2. Creating profile...')
    const profile = new Profile()
    profile.user_id = savedUser.id
    profile.bio = 'Software developer'
    
    if (!profile.user_id) {
      throw new Error('user_id is required for profile')
    }
    
    const savedProfile = await profileRepo.save(profile)
    console.log('✅ Profile saved:', savedProfile.id)
    
    // Create post with validation
    console.log('3. Creating post...')
    const post = new Post()
    post.title = 'My First Post'
    post.content = 'This is my first post content'
    post.user_id = savedUser.id
    
    if (!post.title || !post.user_id) {
      throw new Error('Title and user_id are required for posts')
    }
    
    const savedPost = await postRepo.save(post)
    console.log('✅ Post saved:', savedPost.id)
    
    // Create comment with validation
    console.log('4. Creating comment...')
    const comment = new Comment()
    comment.content = 'Great post!'
    comment.post_id = savedPost.id
    comment.user_id = savedUser.id
    
    if (!comment.content || !comment.post_id || !comment.user_id) {
      throw new Error('Content, post_id, and user_id are required for comments')
    }
    
    const savedComment = await commentRepo.save(comment)
    console.log('✅ Comment saved:', savedComment.id)
    
    // Find user with posts and profile
    console.log('5. Loading user with relationships...')
    const userWithRelations = await userRepo.findWithPostsAndProfile(savedUser.id)
    if (!userWithRelations) {
      throw new Error('User not found')
    }
    console.log('✅ User with relations loaded:', {
      id: userWithRelations.id,
      email: userWithRelations.email,
      posts: userWithRelations.posts?.length || 0,
      profile: userWithRelations.profile ? 'Yes' : 'No'
    })
    
    // Find post with comments
    console.log('6. Loading post with comments...')
    const postWithComments = await postRepo.findWithComments(savedPost.id)
    if (!postWithComments) {
      throw new Error('Post not found')
    }
    console.log('✅ Post with comments loaded:', {
      id: postWithComments.id,
      title: postWithComments.title,
      comments: postWithComments.comments?.length || 0
    })
    
    // Find comment with post and user
    console.log('7. Loading comment with relations...')
    const commentWithRelations = await commentRepo.findWithPostAndUser(savedComment.id)
    if (!commentWithRelations) {
      throw new Error('Comment not found')
    }
    console.log('✅ Comment with relations loaded:', {
      id: commentWithRelations.id,
      content: commentWithRelations.content,
      post: commentWithRelations.post?.title || 'Unknown',
      user: commentWithRelations.user?.email || 'Unknown'
    })
    
    // Update user email
    console.log('8. Updating user email...')
    const updatedUser = await userRepo.updateUserEmail(savedUser.id, 'john.doe@example.com')
    console.log('✅ User email updated:', updatedUser.email)
    
    // Find recent posts
    console.log('9. Finding recent posts...')
    const recentPosts = await postRepo.findRecentPosts(5)
    console.log('✅ Recent posts found:', recentPosts.length)
    
    // Find posts by title
    console.log('10. Finding posts by title...')
    const postsByTitle = await postRepo.findPostsByTitle('First')
    console.log('✅ Posts by title found:', postsByTitle.length)
    
    console.log('\n🎉 Repository demonstration completed successfully!')
    
  } catch (error) {
    console.error('❌ Repository usage error:', error.message)
    throw error
  }
}

// Alternative: Using DreamBeeSQL auto-generated repositories
export async function demonstrateAutoGeneratedRepositories() {
  try {
    console.log('📝 Note: With DreamBeeSQL, repositories are auto-generated from your database schema')
    console.log('📝 No manual repository definitions required!')
    console.log('📝 Use: const userRepo = db.getRepository("users")')
    console.log('📝 All CRUD operations and relationships are automatically available')
    
    // Example of what you'd do with DreamBeeSQL:
    /*
    const db = new DreamBeeSQL(config)
    await db.initialize()
    
    const userRepo = db.getRepository('users')
    const postRepo = db.getRepository('posts')
    
    // All these methods are automatically available:
    const user = await userRepo.findById(id)
    const users = await userRepo.findAll()
    const newUser = await userRepo.create(userData)
    const updatedUser = await userRepo.update(user)
    await userRepo.delete(id)
    
    // Relationships are automatically detected and loaded:
    const userWithPosts = await userRepo.findWithRelations(id, ['posts'])
    */
    
  } catch (error) {
    console.error('❌ Auto-generated repository demonstration error:', error.message)
    throw error
  }
}

// Database interface
export interface Database {
  users: UserRow
  posts: PostRow
  comments: CommentRow
  profiles: ProfileRow
}
