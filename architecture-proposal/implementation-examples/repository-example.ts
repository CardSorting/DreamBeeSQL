// Repository Example Implementation
// This file demonstrates how to use the Repository Registry system

import { BaseRepository } from '../src/repository/base-repository'
import { RepositoryRegistry } from '../src/repository/repository-registry'
import { Kysely } from 'kysely'
import { User, UserRow } from './entity-example'
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

// Usage Example
export function demonstrateRepositoryUsage() {
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
  
  // Demonstrate repository usage
  async function demonstrateUsage() {
    try {
      // Create user
      const user = new User()
      user.email = 'john@example.com'
      user.firstName = 'John'
      user.lastName = 'Doe'
      
      const savedUser = await userRepo.save(user)
      console.log('User saved:', savedUser.id)
      
      // Create profile
      const profile = new Profile()
      profile.user_id = savedUser.id
      profile.bio = 'Software developer'
      
      const savedProfile = await profileRepo.save(profile)
      console.log('Profile saved:', savedProfile.id)
      
      // Create post
      const post = new Post()
      post.title = 'My First Post'
      post.content = 'This is my first post content'
      post.user_id = savedUser.id
      
      const savedPost = await postRepo.save(post)
      console.log('Post saved:', savedPost.id)
      
      // Create comment
      const comment = new Comment()
      comment.content = 'Great post!'
      comment.post_id = savedPost.id
      comment.user_id = savedUser.id
      
      const savedComment = await commentRepo.save(comment)
      console.log('Comment saved:', savedComment.id)
      
      // Find user with posts and profile
      const userWithRelations = await userRepo.findWithPostsAndProfile(savedUser.id)
      console.log('User with relations:', userWithRelations)
      
      // Find post with comments
      const postWithComments = await postRepo.findWithComments(savedPost.id)
      console.log('Post with comments:', postWithComments)
      
      // Find comment with post and user
      const commentWithRelations = await commentRepo.findWithPostAndUser(savedComment.id)
      console.log('Comment with relations:', commentWithRelations)
      
      // Update user email
      const updatedUser = await userRepo.updateUserEmail(savedUser.id, 'john.doe@example.com')
      console.log('User email updated:', updatedUser.email)
      
      // Find recent posts
      const recentPosts = await postRepo.findRecentPosts(5)
      console.log('Recent posts:', recentPosts.length)
      
      // Find posts by title
      const postsByTitle = await postRepo.findPostsByTitle('First')
      console.log('Posts by title:', postsByTitle.length)
      
    } catch (error) {
      console.error('Repository usage error:', error)
    }
  }
  
  // Run demonstration
  demonstrateUsage()
}

// Database interface
export interface Database {
  users: UserRow
  posts: PostRow
  comments: CommentRow
  profiles: ProfileRow
}
