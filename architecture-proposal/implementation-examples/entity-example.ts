// Entity Example Implementation
// This file demonstrates how to use the Entity Manager system

import { Entity, Table, PrimaryKey, Column, HasMany, HasOne } from '../src/entity/entity'
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

// Usage Example
export function demonstrateEntityUsage() {
  const entityManager = EntityManager.getInstance()
  
  // Create entities
  const user = entityManager.createEntity(User)
  user.email = 'john@example.com'
  user.firstName = 'John'
  user.lastName = 'Doe'
  
  const post = entityManager.createEntity(Post)
  post.title = 'My First Post'
  post.content = 'This is my first post content'
  post.user_id = user.id
  
  const comment = entityManager.createEntity(Comment)
  comment.content = 'Great post!'
  comment.post_id = post.id
  comment.user_id = user.id
  
  const profile = entityManager.createEntity(Profile)
  profile.user_id = user.id
  profile.bio = 'Software developer'
  
  // Convert to rows
  const userRow = user.toRow()
  const postRow = post.toRow()
  const commentRow = comment.toRow()
  const profileRow = profile.toRow()
  
  console.log('User row:', userRow)
  console.log('Post row:', postRow)
  console.log('Comment row:', commentRow)
  console.log('Profile row:', profileRow)
  
  // Convert from rows
  const userFromRow = new User().fromRow(userRow)
  const postFromRow = new Post().fromRow(postRow)
  const commentFromRow = new Comment().fromRow(commentRow)
  const profileFromRow = new Profile().fromRow(profileRow)
  
  console.log('User from row:', userFromRow)
  console.log('Post from row:', postFromRow)
  console.log('Comment from row:', commentFromRow)
  console.log('Profile from row:', profileFromRow)
}
