// Entity Example Implementation
// This file demonstrates how to use the Entity Manager system with DreamBeeSQL
// 
// Key Concepts:
// - Entities are auto-generated from your database schema
// - No manual entity definitions required
// - Full TypeScript type safety with decorators
// - Automatic relationship mapping

import { Entity, Table, PrimaryKey, Column, HasMany, HasOne, BelongsTo } from '../src/entity/entity'
import { EntityManager } from '../src/entity/entity-manager'

// User Entity
@Table('users')
export class User extends Entity<UserRow> {
  @PrimaryKey()
  id!: string
  
  @Column({ nullable: false })
  email!: string
  
  @Column({ nullable: true })
  firstName?: string
  
  @Column({ nullable: true })
  lastName?: string
  
  @Column({ nullable: true })
  createdAt?: Date
  
  @Column({ nullable: true })
  updatedAt?: Date
  
  @HasMany(() => Post, { foreignKey: 'user_id' })
  posts?: Post[]
  
  @HasOne(() => Profile, { foreignKey: 'user_id' })
  profile?: Profile
  
  toRow(): UserRow {
    return {
      id: this.id,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }
  
  fromRow(row: UserRow): this {
    this.id = row.id
    this.email = row.email
    this.firstName = row.first_name
    this.lastName = row.last_name
    this.createdAt = row.created_at
    this.updatedAt = row.updated_at
    return this
  }
}

// Post Entity
@Table('posts')
export class Post extends Entity<PostRow> {
  @PrimaryKey()
  id!: string
  
  @Column({ nullable: false })
  title!: string
  
  @Column({ nullable: true })
  content?: string
  
  @Column({ nullable: false })
  user_id!: string
  
  @Column({ nullable: true })
  createdAt?: Date
  
  @Column({ nullable: true })
  updatedAt?: Date
  
  @BelongsTo(() => User, { foreignKey: 'user_id' })
  user?: User
  
  @HasMany(() => Comment, { foreignKey: 'post_id' })
  comments?: Comment[]
  
  toRow(): PostRow {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      user_id: this.user_id,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }
  
  fromRow(row: PostRow): this {
    this.id = row.id
    this.title = row.title
    this.content = row.content
    this.user_id = row.user_id
    this.createdAt = row.created_at
    this.updatedAt = row.updated_at
    return this
  }
}

// Comment Entity
@Table('comments')
export class Comment extends Entity<CommentRow> {
  @PrimaryKey()
  id!: string
  
  @Column({ nullable: false })
  content!: string
  
  @Column({ nullable: false })
  post_id!: string
  
  @Column({ nullable: false })
  user_id!: string
  
  @Column({ nullable: true })
  createdAt?: Date
  
  @BelongsTo(() => Post, { foreignKey: 'post_id' })
  post?: Post
  
  @BelongsTo(() => User, { foreignKey: 'user_id' })
  user?: User
  
  toRow(): CommentRow {
    return {
      id: this.id,
      content: this.content,
      post_id: this.post_id,
      user_id: this.user_id,
      created_at: this.createdAt
    }
  }
  
  fromRow(row: CommentRow): this {
    this.id = row.id
    this.content = row.content
    this.post_id = row.post_id
    this.user_id = row.user_id
    this.createdAt = row.created_at
    return this
  }
}

// Profile Entity
@Table('profiles')
export class Profile extends Entity<ProfileRow> {
  @PrimaryKey()
  id!: string
  
  @Column({ nullable: false })
  user_id!: string
  
  @Column({ nullable: true })
  bio?: string
  
  @Column({ nullable: true })
  avatar?: string
  
  @BelongsTo(() => User, { foreignKey: 'user_id' })
  user?: User
  
  toRow(): ProfileRow {
    return {
      id: this.id,
      user_id: this.user_id,
      bio: this.bio,
      avatar: this.avatar
    }
  }
  
  fromRow(row: ProfileRow): this {
    this.id = row.id
    this.user_id = row.user_id
    this.bio = row.bio
    this.avatar = row.avatar
    return this
  }
}

// Row Types
export interface UserRow {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: Date | null
  updated_at: Date | null
}

export interface PostRow {
  id: string
  title: string
  content: string | null
  user_id: string
  created_at: Date | null
  updated_at: Date | null
}

export interface CommentRow {
  id: string
  content: string
  post_id: string
  user_id: string
  created_at: Date | null
}

export interface ProfileRow {
  id: string
  user_id: string
  bio: string | null
  avatar: string | null
}

// Usage Example with Error Handling
export async function demonstrateEntityUsage() {
  try {
    const entityManager = EntityManager.getInstance()
    
    // Create entities with validation
    const user = entityManager.createEntity(User)
    user.email = 'john@example.com'
    user.firstName = 'John'
    user.lastName = 'Doe'
    
    // Validate required fields
    if (!user.email) {
      throw new Error('Email is required')
    }
    
    const post = entityManager.createEntity(Post)
    post.title = 'My First Post'
    post.content = 'This is my first post content'
    post.user_id = user.id
    
    // Validate required fields
    if (!post.title || !post.user_id) {
      throw new Error('Title and user_id are required for posts')
    }
    
    const comment = entityManager.createEntity(Comment)
    comment.content = 'Great post!'
    comment.post_id = post.id
    comment.user_id = user.id
    
    // Validate required fields
    if (!comment.content || !comment.post_id || !comment.user_id) {
      throw new Error('Content, post_id, and user_id are required for comments')
    }
    
    const profile = entityManager.createEntity(Profile)
    profile.user_id = user.id
    profile.bio = 'Software developer'
    
    // Validate required fields
    if (!profile.user_id) {
      throw new Error('user_id is required for profiles')
    }
    
    // Convert to rows (for database insertion)
    const userRow = user.toRow()
    const postRow = post.toRow()
    const commentRow = comment.toRow()
    const profileRow = profile.toRow()
    
    console.log('✅ Entity to Row conversion successful:')
    console.log('User row:', userRow)
    console.log('Post row:', postRow)
    console.log('Comment row:', commentRow)
    console.log('Profile row:', profileRow)
    
    // Convert from rows (for database retrieval)
    const userFromRow = new User().fromRow(userRow)
    const postFromRow = new Post().fromRow(postRow)
    const commentFromRow = new Comment().fromRow(commentRow)
    const profileFromRow = new Profile().fromRow(profileRow)
    
    console.log('✅ Row to Entity conversion successful:')
    console.log('User from row:', userFromRow)
    console.log('Post from row:', postFromRow)
    console.log('Comment from row:', commentFromRow)
    console.log('Profile from row:', profileFromRow)
    
    // Demonstrate relationship access
    console.log('✅ Relationship access:')
    console.log('User posts:', user.posts?.length || 0)
    console.log('User profile:', user.profile ? 'Yes' : 'No')
    console.log('Post comments:', post.comments?.length || 0)
    console.log('Comment post:', comment.post ? 'Yes' : 'No')
    
  } catch (error) {
    console.error('❌ Entity usage error:', error.message)
    throw error
  }
}

// Alternative: Using DreamBeeSQL auto-generated entities
export async function demonstrateAutoGeneratedEntities() {
  try {
    // With DreamBeeSQL, entities are auto-generated
    // This is just for demonstration - in real usage, you'd use:
    // const db = new DreamBeeSQL(config)
    // await db.initialize()
    // const userRepo = db.getRepository('users')
    
    console.log('📝 Note: With DreamBeeSQL, entities are auto-generated from your database schema')
    console.log('📝 No manual entity definitions required!')
    console.log('📝 Use: const userRepo = db.getRepository("users")')
    
  } catch (error) {
    console.error('❌ Auto-generated entity demonstration error:', error.message)
    throw error
  }
}
