// Relationship Example Implementation
// This file demonstrates how to use the Relationship Engine system

import { RelationshipEngine } from '../src/relationships/relationship-engine'
import { User, Post, Comment, Profile } from './entity-example'
import { UserRepository, PostRepository, CommentRepository, ProfileRepository } from './repository-example'

// Relationship Engine Usage Examples
export class RelationshipExamples {
  private relationshipEngine: RelationshipEngine
  private userRepo: UserRepository
  private postRepo: PostRepository
  private commentRepo: CommentRepository
  private profileRepo: ProfileRepository
  
  constructor(
    userRepo: UserRepository,
    postRepo: PostRepository,
    commentRepo: CommentRepository,
    profileRepo: ProfileRepository
  ) {
    this.relationshipEngine = RelationshipEngine.getInstance()
    this.userRepo = userRepo
    this.postRepo = postRepo
    this.commentRepo = commentRepo
    this.profileRepo = profileRepo
  }
  
  // Eager loading examples
  async demonstrateEagerLoading() {
    console.log('=== Eager Loading Examples ===')
    
    // Load users with their posts
    const users = await this.userRepo.findAll()
    await this.relationshipEngine.loadRelationships(users, ['posts'])
    
    console.log('Users with posts:')
    users.forEach(user => {
      console.log(`User ${user.email} has ${user.posts?.length || 0} posts`)
    })
    
    // Load users with their profiles
    await this.relationshipEngine.loadRelationships(users, ['profile'])
    
    console.log('Users with profiles:')
    users.forEach(user => {
      console.log(`User ${user.email} profile: ${user.profile?.bio || 'No bio'}`)
    })
    
    // Load posts with their comments
    const posts = await this.postRepo.findAll()
    await this.relationshipEngine.loadRelationships(posts, ['comments'])
    
    console.log('Posts with comments:')
    posts.forEach(post => {
      console.log(`Post "${post.title}" has ${post.comments?.length || 0} comments`)
    })
    
    // Load posts with their users
    await this.relationshipEngine.loadRelationships(posts, ['user'])
    
    console.log('Posts with users:')
    posts.forEach(post => {
      console.log(`Post "${post.title}" by ${post.user?.email || 'Unknown user'}`)
    })
    
    // Load comments with their posts and users
    const comments = await this.commentRepo.findAll()
    await this.relationshipEngine.loadRelationships(comments, ['post', 'user'])
    
    console.log('Comments with posts and users:')
    comments.forEach(comment => {
      console.log(`Comment by ${comment.user?.email || 'Unknown user'} on "${comment.post?.title || 'Unknown post'}"`)
    })
  }
  
  // Lazy loading examples
  async demonstrateLazyLoading() {
    console.log('=== Lazy Loading Examples ===')
    
    // Load user first
    const user = await this.userRepo.findById('user-id')
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log(`Loaded user: ${user.email}`)
    
    // Lazy load posts
    await this.relationshipEngine.loadRelationship(user, 'posts')
    console.log(`User has ${user.posts?.length || 0} posts`)
    
    // Lazy load profile
    await this.relationshipEngine.loadRelationship(user, 'profile')
    console.log(`User profile: ${user.profile?.bio || 'No bio'}`)
    
    // Load post
    const post = await this.postRepo.findById('post-id')
    if (!post) {
      console.log('Post not found')
      return
    }
    
    console.log(`Loaded post: ${post.title}`)
    
    // Lazy load comments
    await this.relationshipEngine.loadRelationship(post, 'comments')
    console.log(`Post has ${post.comments?.length || 0} comments`)
    
    // Lazy load user
    await this.relationshipEngine.loadRelationship(post, 'user')
    console.log(`Post by: ${post.user?.email || 'Unknown user'}`)
  }
  
  // Batch loading examples
  async demonstrateBatchLoading() {
    console.log('=== Batch Loading Examples ===')
    
    // Load multiple users with their posts
    const users = await this.userRepo.findAll()
    console.log(`Loading relationships for ${users.length} users`)
    
    // Batch load posts for all users
    await this.relationshipEngine.loadRelationships(users, ['posts'])
    
    // Batch load profiles for all users
    await this.relationshipEngine.loadRelationships(users, ['profile'])
    
    console.log('Batch loaded relationships:')
    users.forEach(user => {
      console.log(`User ${user.email}:`)
      console.log(`  - Posts: ${user.posts?.length || 0}`)
      console.log(`  - Profile: ${user.profile?.bio || 'No bio'}`)
    })
    
    // Load multiple posts with their comments
    const posts = await this.postRepo.findAll()
    console.log(`Loading relationships for ${posts.length} posts`)
    
    // Batch load comments for all posts
    await this.relationshipEngine.loadRelationships(posts, ['comments'])
    
    // Batch load users for all posts
    await this.relationshipEngine.loadRelationships(posts, ['user'])
    
    console.log('Batch loaded relationships:')
    posts.forEach(post => {
      console.log(`Post "${post.title}":`)
      console.log(`  - Comments: ${post.comments?.length || 0}`)
      console.log(`  - Author: ${post.user?.email || 'Unknown user'}`)
    })
  }
  
  // Complex relationship loading
  async demonstrateComplexRelationships() {
    console.log('=== Complex Relationship Examples ===')
    
    // Load user with posts and comments
    const user = await this.userRepo.findById('user-id')
    if (!user) {
      console.log('User not found')
      return
    }
    
    // Load posts
    await this.relationshipEngine.loadRelationship(user, 'posts')
    
    if (user.posts && user.posts.length > 0) {
      // Load comments for all posts
      await this.relationshipEngine.loadRelationships(user.posts, ['comments'])
      
      console.log(`User ${user.email} and their posts with comments:`)
      user.posts.forEach(post => {
        console.log(`  Post: "${post.title}"`)
        console.log(`    Comments: ${post.comments?.length || 0}`)
        
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(comment => {
            console.log(`      - ${comment.content}`)
          })
        }
      })
    }
    
    // Load user with profile
    await this.relationshipEngine.loadRelationship(user, 'profile')
    
    if (user.profile) {
      console.log(`User profile: ${user.profile.bio || 'No bio'}`)
    }
  }
  
  // Performance optimization examples
  async demonstratePerformanceOptimization() {
    console.log('=== Performance Optimization Examples ===')
    
    // Load users with posts and profiles in one go
    const users = await this.userRepo.findAll()
    
    console.log(`Loading ${users.length} users with relationships...`)
    const startTime = Date.now()
    
    // Load all relationships at once
    await this.relationshipEngine.loadRelationships(users, ['posts', 'profile'])
    
    const endTime = Date.now()
    console.log(`Loaded relationships in ${endTime - startTime}ms`)
    
    // Display results
    users.forEach(user => {
      console.log(`User ${user.email}:`)
      console.log(`  - Posts: ${user.posts?.length || 0}`)
      console.log(`  - Profile: ${user.profile?.bio || 'No bio'}`)
    })
    
    // Load posts with comments and users
    const posts = await this.postRepo.findAll()
    
    console.log(`Loading ${posts.length} posts with relationships...`)
    const startTime2 = Date.now()
    
    // Load all relationships at once
    await this.relationshipEngine.loadRelationships(posts, ['comments', 'user'])
    
    const endTime2 = Date.now()
    console.log(`Loaded relationships in ${endTime2 - startTime2}ms`)
    
    // Display results
    posts.forEach(post => {
      console.log(`Post "${post.title}":`)
      console.log(`  - Comments: ${post.comments?.length || 0}`)
      console.log(`  - Author: ${post.user?.email || 'Unknown user'}`)
    })
  }
  
  // Error handling examples
  async demonstrateErrorHandling() {
    console.log('=== Error Handling Examples ===')
    
    try {
      // Try to load relationship for non-existent entity
      const user = new User()
      user.id = 'non-existent-id'
      
      await this.relationshipEngine.loadRelationship(user, 'posts')
      console.log('Loaded relationship for non-existent user')
    } catch (error) {
      console.log('Error loading relationship:', error.message)
    }
    
    try {
      // Try to load non-existent relationship
      const user = await this.userRepo.findById('user-id')
      if (user) {
        await this.relationshipEngine.loadRelationship(user, 'nonExistentRelationship')
        console.log('Loaded non-existent relationship')
      }
    } catch (error) {
      console.log('Error loading non-existent relationship:', error.message)
    }
  }
  
  // Cache management examples
  async demonstrateCacheManagement() {
    console.log('=== Cache Management Examples ===')
    
    // Load relationships
    const users = await this.userRepo.findAll()
    await this.relationshipEngine.loadRelationships(users, ['posts'])
    
    console.log('Relationships loaded and cached')
    
    // Clear cache
    this.relationshipEngine.clearCache()
    console.log('Cache cleared')
    
    // Load again (will hit database)
    await this.relationshipEngine.loadRelationships(users, ['posts'])
    console.log('Relationships loaded again')
    
    // Clear cache for specific entity
    const user = users[0]
    if (user) {
      this.relationshipEngine.clearCacheForEntity(user.id)
      console.log(`Cache cleared for user ${user.id}`)
    }
  }
}

// Usage Example
export function demonstrateRelationshipUsage() {
  // Setup repositories (assuming they're already configured)
  const userRepo = new UserRepository(db)
  const postRepo = new PostRepository(db)
  const commentRepo = new CommentRepository(db)
  const profileRepo = new ProfileRepository(db)
  
  // Create relationship examples
  const relationshipExamples = new RelationshipExamples(
    userRepo,
    postRepo,
    commentRepo,
    profileRepo
  )
  
  // Run all examples
  async function runAllExamples() {
    try {
      await relationshipExamples.demonstrateEagerLoading()
      await relationshipExamples.demonstrateLazyLoading()
      await relationshipExamples.demonstrateBatchLoading()
      await relationshipExamples.demonstrateComplexRelationships()
      await relationshipExamples.demonstratePerformanceOptimization()
      await relationshipExamples.demonstrateErrorHandling()
      await relationshipExamples.demonstrateCacheManagement()
    } catch (error) {
      console.error('Relationship examples error:', error)
    }
  }
  
  // Run examples
  runAllExamples()
}
