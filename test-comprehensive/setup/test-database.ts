/**
 * Database setup utilities for NOORM comprehensive testing
 */

import { NOORMME } from '../../src/noormme.js'
import { getTestConfig, getDatabaseConfig, isDatabaseEnabled } from './test-config.js'

export interface TestDatabase {
  dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql'
  connection: any
  db: NOORMME
}

/**
 * Create a test database instance for a specific dialect
 */
export async function createTestDatabase(dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql'): Promise<TestDatabase> {
  if (!isDatabaseEnabled(dialect)) {
    throw new Error(`Database dialect ${dialect} is not enabled for testing`)
  }

  const config = getDatabaseConfig(dialect)
  
  let connection: any
  
  switch (dialect) {
    case 'sqlite':
      // Create unique database file for each test instance
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const uniqueDbPath = (config as any).database.replace('.db', `-${timestamp}-${random}.db`)
      
      connection = {
        host: '',
        port: 0,
        database: uniqueDbPath,
        username: '',
        password: ''
      }
      break
      
    case 'postgresql':
      connection = {
        host: (config as any).host,
        port: (config as any).port,
        database: (config as any).database,
        username: (config as any).username,
        password: (config as any).password
      }
      break
      
    case 'mysql':
      connection = {
        host: (config as any).host,
        port: (config as any).port,
        database: (config as any).database,
        username: (config as any).username,
        password: (config as any).password
      }
      break
      
    case 'mssql':
      connection = {
        host: (config as any).host,
        port: (config as any).port,
        database: (config as any).database,
        username: (config as any).username,
        password: (config as any).password
      }
      break
      
    default:
      throw new Error(`Unsupported dialect: ${dialect}`)
  }

  const db = new NOORMME({
    dialect,
    connection
  })

  return {
    dialect,
    connection,
    db
  }
}

/**
 * Setup test database with sample schema
 */
export async function setupTestDatabase(testDb: TestDatabase): Promise<void> {
  const { db } = testDb
  
  // Create test schema first (before initializing NOORMME)
  await createTestSchema(db)
  
  // Initialize NOORMME (this will discover the tables we just created)
  // Only initialize if not already initialized
  if (!db.isInitialized()) {
    await db.initialize()
  }
  
  // Insert test data
  await insertTestData(db)
}

/**
 * Create test schema for testing
 */
async function createTestSchema(db: NOORMME): Promise<void> {
  const kysely = db.getKysely()
  
  // Create users table
  await kysely.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('firstName', 'text', (col) => col.notNull())
    .addColumn('lastName', 'text', (col) => col.notNull())
    .addColumn('age', 'integer')
    .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .execute()

  // Create profiles table with inline foreign key for SQLite compatibility
  await kysely.schema
    .createTable('profiles')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull().references('users.id'))
    .addColumn('bio', 'text')
    .addColumn('avatar', 'text')
    .addColumn('website', 'text')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .execute()

  // Create posts table with inline foreign key for SQLite compatibility
  await kysely.schema
    .createTable('posts')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull().references('users.id'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('published', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .execute()

  // Create comments table with inline foreign keys for SQLite compatibility
  await kysely.schema
    .createTable('comments')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('postId', 'text', (col) => col.notNull().references('posts.id'))
    .addColumn('userId', 'text', (col) => col.notNull().references('users.id'))
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .execute()

  // Create tags table
  await kysely.schema
    .createTable('tags')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('color', 'text')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('now()'))
    .execute()

  // Create post_tags junction table with inline foreign keys for SQLite compatibility
  await kysely.schema
    .createTable('post_tags')
    .ifNotExists()
    .addColumn('postId', 'text', (col) => col.notNull().references('posts.id'))
    .addColumn('tagId', 'text', (col) => col.notNull().references('tags.id'))
    .addPrimaryKeyConstraint('post_tags_pkey', ['postId', 'tagId'])
    .execute()

  // Foreign key constraints are now defined inline in table creation for SQLite compatibility

  // Create indexes for performance
  try {
    await kysely.schema
      .createIndex('idx_users_email')
      .on('users')
      .column('email')
      .execute()

    await kysely.schema
      .createIndex('idx_posts_userId')
      .on('posts')
      .column('userId')
      .execute()

    await kysely.schema
      .createIndex('idx_comments_postId')
      .on('comments')
      .column('postId')
      .execute()

    await kysely.schema
      .createIndex('idx_comments_userId')
      .on('comments')
      .column('userId')
      .execute()
  } catch (error) {
    console.warn('Could not create indexes:', error)
  }
}

/**
 * Insert test data into the database
 */
async function insertTestData(db: NOORMME): Promise<void> {
  const kysely = db.getKysely()
  
  // Insert test users
  const users = [
    {
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      active: true
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      age: 25,
      active: true
    },
    {
      id: 'user-3',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Johnson',
      age: 35,
      active: false
    }
  ]

  for (const user of users) {
    await kysely
      .insertInto('users')
      .values(user)
      .execute()
  }

  // Insert test profiles
  const profiles = [
    {
      id: 'profile-1',
      userId: 'user-1',
      bio: 'Software developer and tech enthusiast',
      avatar: 'https://example.com/avatar1.jpg',
      website: 'https://johndoe.dev'
    },
    {
      id: 'profile-2',
      userId: 'user-2',
      bio: 'Designer and creative thinker',
      avatar: 'https://example.com/avatar2.jpg',
      website: 'https://janesmith.design'
    }
  ]

  for (const profile of profiles) {
    await kysely
      .insertInto('profiles')
      .values(profile)
      .execute()
  }

  // Insert test posts
  const posts = [
    {
      id: 'post-1',
      userId: 'user-1',
      title: 'Getting Started with NOORM',
      content: 'NOORM is a revolutionary approach to database access...',
      published: true
    },
    {
      id: 'post-2',
      userId: 'user-1',
      title: 'Advanced NOORM Features',
      content: 'In this post, we explore advanced features...',
      published: false
    },
    {
      id: 'post-3',
      userId: 'user-2',
      title: 'Designing User Interfaces',
      content: 'User interface design principles and best practices...',
      published: true
    }
  ]

  for (const post of posts) {
    await kysely
      .insertInto('posts')
      .values(post)
      .execute()
  }

  // Insert test comments
  const comments = [
    {
      id: 'comment-1',
      postId: 'post-1',
      userId: 'user-2',
      content: 'Great post! Very informative.'
    },
    {
      id: 'comment-2',
      postId: 'post-1',
      userId: 'user-3',
      content: 'Thanks for sharing this knowledge.'
    },
    {
      id: 'comment-3',
      postId: 'post-3',
      userId: 'user-1',
      content: 'Excellent design principles!'
    }
  ]

  for (const comment of comments) {
    await kysely
      .insertInto('comments')
      .values(comment)
      .execute()
  }

  // Insert test tags
  const tags = [
    {
      id: 'tag-1',
      name: 'javascript',
      color: '#f7df1e'
    },
    {
      id: 'tag-2',
      name: 'typescript',
      color: '#3178c6'
    },
    {
      id: 'tag-3',
      name: 'database',
      color: '#336791'
    },
    {
      id: 'tag-4',
      name: 'design',
      color: '#ff6b6b'
    }
  ]

  for (const tag of tags) {
    await kysely
      .insertInto('tags')
      .values(tag)
      .execute()
  }

  // Insert post-tag relationships
  const postTags = [
    { postId: 'post-1', tagId: 'tag-1' },
    { postId: 'post-1', tagId: 'tag-2' },
    { postId: 'post-1', tagId: 'tag-3' },
    { postId: 'post-2', tagId: 'tag-1' },
    { postId: 'post-2', tagId: 'tag-2' },
    { postId: 'post-3', tagId: 'tag-4' }
  ]

  for (const postTag of postTags) {
    await kysely
      .insertInto('post_tags')
      .values(postTag)
      .execute()
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(testDb: TestDatabase): Promise<void> {
  const { db } = testDb
  
  // Check if database is still initialized before attempting cleanup
  if (!db.isInitialized()) {
    // Database already closed, just clean up file if SQLite
    if (testDb.dialect === 'sqlite') {
      try {
        const fs = await import('fs')
        const dbPath = testDb.connection.database
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath)
        }
      } catch (error) {
        console.warn('Error removing SQLite database file:', error)
      }
    }
    return
  }
  
  try {
    // Drop all test tables first (before closing connection)
    await dropTestTables(testDb)
  } catch (error) {
    console.warn('Error dropping test tables:', error)
  }
  
  try {
    // Close database connection
    await db.close()
  } catch (error) {
    console.warn('Error closing database connection:', error)
  }
  
  // For SQLite, also remove the database file
  if (testDb.dialect === 'sqlite') {
    try {
      const fs = await import('fs')
      const dbPath = testDb.connection.database
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
      }
    } catch (error) {
      console.warn('Error removing SQLite database file:', error)
    }
  }
}

/**
 * Drop all test tables
 */
export async function dropTestTables(testDb: TestDatabase): Promise<void> {
  const { db } = testDb
  const kysely = db.getKysely()
  
  const tables = ['post_tags', 'comments', 'posts', 'profiles', 'users', 'tags']
  
  for (const table of tables) {
    try {
      await kysely.schema.dropTable(table).ifExists().execute()
    } catch (error) {
      console.warn(`Could not drop table ${table}:`, error)
    }
  }
}

/**
 * Reset test database (drop and recreate)
 */
export async function resetTestDatabase(testDb: TestDatabase): Promise<void> {
  await dropTestTables(testDb)
  await setupTestDatabase(testDb)
}

/**
 * Get test database connection string for a dialect
 */
export function getTestConnectionString(dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql'): string {
  const config = getDatabaseConfig(dialect)
  
  switch (dialect) {
    case 'sqlite':
      return (config as any).database
      
    case 'postgresql':
      return `postgresql://${(config as any).username}:${(config as any).password}@${(config as any).host}:${(config as any).port}/${(config as any).database}`
      
    case 'mysql':
      return `mysql://${(config as any).username}:${(config as any).password}@${(config as any).host}:${(config as any).port}/${(config as any).database}`
      
    case 'mssql':
      return `mssql://${(config as any).username}:${(config as any).password}@${(config as any).host}:${(config as any).port}/${(config as any).database}`
      
    default:
      throw new Error(`Unsupported dialect: ${dialect}`)
  }
}
