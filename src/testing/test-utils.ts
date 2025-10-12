import { NOORMME } from '../noormme.js'
import { NOORMConfig } from '../types/index.js'

/**
 * Testing utilities for NOORMME
 */

export interface TestDatabaseConfig {
  dialect?: 'sqlite'
  database?: string
  cleanup?: boolean
  seed?: boolean
}

/**
 * Create an in-memory SQLite database for testing
 */
export async function createTestDatabase(config: TestDatabaseConfig = {}): Promise<NOORMME> {
  const {
    dialect = 'sqlite',
    database = ':memory:',
    cleanup = true,
    seed = false
  } = config

  let dbConfig: NOORMConfig

  switch (dialect) {
    case 'sqlite':
      dbConfig = {
        dialect: 'sqlite',
        connection: {
          database,
          host: '',
          port: 0,
          username: '',
          password: ''
        },
        logging: {
          enabled: process.env.TEST_DEBUG === 'true' // Enable with TEST_DEBUG=true
        }
      }
      break



    default:
      throw new Error(`Unsupported test database dialect: ${dialect}`)
  }

  const db = new NOORMME(dbConfig)

  if (seed) {
    await setupTestSchema(db)
  }

  return db
}

/**
 * Create test schema with sample tables
 */
export async function setupTestSchema(db: NOORMME): Promise<void> {
  const kysely = db.getKysely()

  // Create users table
  await kysely.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('email', 'varchar(255)', col => col.notNull().unique())
    .addColumn('age', 'integer')
    .addColumn('active', 'boolean', col => col.defaultTo(true))
    .addColumn('created_at', 'timestamp', col => col.defaultTo('now()').notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo('now()').notNull())
    .execute()

  // Create posts table
  await kysely.schema
    .createTable('posts')
    .ifNotExists()
    .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
    .addColumn('title', 'varchar(255)', col => col.notNull())
    .addColumn('content', 'text')
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade'))
    .addColumn('published', 'boolean', col => col.defaultTo(false))
    .addColumn('created_at', 'timestamp', col => col.defaultTo('now()').notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo('now()').notNull())
    .execute()

  // Create comments table
  await kysely.schema
    .createTable('comments')
    .ifNotExists()
    .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
    .addColumn('content', 'text', col => col.notNull())
    .addColumn('post_id', 'integer', col => col.references('posts.id').onDelete('cascade'))
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamp', col => col.defaultTo('now()').notNull())
    .execute()

  // Create indexes for better performance
  await kysely.schema
    .createIndex('idx_posts_user_id')
    .ifNotExists()
    .on('posts')
    .column('user_id')
    .execute()

  await kysely.schema
    .createIndex('idx_comments_post_id')
    .ifNotExists()
    .on('comments')
    .column('post_id')
    .execute()

  await kysely.schema
    .createIndex('idx_comments_user_id')
    .ifNotExists()
    .on('comments')
    .column('user_id')
    .execute()

  // Initialize NOORMME to discover the schema
  await db.initialize()
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(db: NOORMME): Promise<void> {
  if (!db) return

  try {
    const kysely = db.getKysely()

    // Drop tables in reverse order to handle foreign keys
    await kysely.schema.dropTable('comments').ifExists().execute()
    await kysely.schema.dropTable('posts').ifExists().execute()
    await kysely.schema.dropTable('users').ifExists().execute()
  } catch (error) {
    // Ignore errors during cleanup
  }

  try {
    await db.close()
  } catch (error) {
    // Ignore close errors
  }
}

/**
 * Test data factory
 */
export class TestDataFactory {
  constructor(private db: NOORMME) {}

  /**
   * Create a test user
   */
  async createUser(overrides: Partial<any> = {}): Promise<any> {
    const userRepo = this.db.getRepository('users')

    const userData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      age: 25,
      active: true,
      ...overrides
    }

    return await userRepo.create(userData)
  }

  /**
   * Create multiple test users
   */
  async createUsers(count: number, overrides: Partial<any> = {}): Promise<any[]> {
    const users = []
    for (let i = 0; i < count; i++) {
      const user = await this.createUser({
        name: `Test User ${i + 1}`,
        email: `test${Date.now()}_${i}@example.com`,
        ...overrides
      })
      users.push(user)
    }
    return users
  }

  /**
   * Create a test post
   */
  async createPost(userId: number, overrides: Partial<any> = {}): Promise<any> {
    const postRepo = this.db.getRepository('posts')

    const postData = {
      title: 'Test Post',
      content: 'This is a test post content',
      user_id: userId,
      published: false,
      ...overrides
    }

    return await postRepo.create(postData)
  }

  /**
   * Create multiple test posts
   */
  async createPosts(userId: number, count: number, overrides: Partial<any> = {}): Promise<any[]> {
    const posts = []
    for (let i = 0; i < count; i++) {
      const post = await this.createPost(userId, {
        title: `Test Post ${i + 1}`,
        ...overrides
      })
      posts.push(post)
    }
    return posts
  }

  /**
   * Create a test comment
   */
  async createComment(postId: number, userId: number, overrides: Partial<any> = {}): Promise<any> {
    const commentRepo = this.db.getRepository('comments')

    const commentData = {
      content: 'This is a test comment',
      post_id: postId,
      user_id: userId,
      ...overrides
    }

    return await commentRepo.create(commentData)
  }

  /**
   * Create multiple test comments
   */
  async createComments(postId: number, userId: number, count: number, overrides: Partial<any> = {}): Promise<any[]> {
    const comments = []
    for (let i = 0; i < count; i++) {
      const comment = await this.createComment(postId, userId, {
        content: `Test comment ${i + 1}`,
        ...overrides
      })
      comments.push(comment)
    }
    return comments
  }

  /**
   * Create a complete test dataset
   */
  async createTestDataset(): Promise<{
    users: any[]
    posts: any[]
    comments: any[]
  }> {
    // Create users
    const users = await this.createUsers(3)

    // Create posts for each user
    const posts = []
    for (const user of users) {
      const userPosts = await this.createPosts(user.id, 2)
      posts.push(...userPosts)
    }

    // Create comments for each post
    const comments = []
    for (const post of posts) {
      // Each post gets comments from different users
      for (const user of users) {
        const postComments = await this.createComments(post.id, user.id, 1)
        comments.push(...postComments)
      }
    }

    return { users, posts, comments }
  }

  /**
   * Clear all test data
   */
  async clearAllData(): Promise<void> {
    const kysely = this.db.getKysely()

    // Delete in reverse order to handle foreign keys
    await kysely.deleteFrom('comments').execute()
    await kysely.deleteFrom('posts').execute()
    await kysely.deleteFrom('users').execute()
  }
}

/**
 * Test utilities for mocking and assertions
 */
export class TestUtils {
  /**
   * Wait for a promise to reject with a specific error
   */
  static async expectError<T>(
    promise: Promise<T>,
    expectedErrorMessage?: string
  ): Promise<Error> {
    try {
      await promise
      throw new Error('Expected promise to reject, but it resolved')
    } catch (error) {
      if (expectedErrorMessage && !String(error).includes(expectedErrorMessage)) {
        throw new Error(
          `Expected error message to contain "${expectedErrorMessage}", but got: ${error}`
        )
      }
      return error as Error
    }
  }

  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now()
    const result = await fn()
    const time = Date.now() - start
    return { result, time }
  }

  /**
   * Create a spy function for testing callbacks
   */
  static createSpy<T extends (...args: any[]) => any>(): T & { calls: any[][]; callCount: number } {
    const calls: any[][] = []
    const spy = ((...args: any[]) => {
      calls.push(args)
    }) as T & { calls: any[][]; callCount: number }

    Object.defineProperty(spy, 'calls', {
      get: () => calls
    })

    Object.defineProperty(spy, 'callCount', {
      get: () => calls.length
    })

    return spy
  }

  /**
   * Delay execution for testing timing-sensitive operations
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Test environment setup and teardown
 */
export class TestEnvironment {
  private static databases: NOORMME[] = []

  /**
   * Setup test environment
   */
  static async setup(): Promise<void> {
    // Any global test setup
  }

  /**
   * Teardown test environment
   */
  static async teardown(): Promise<void> {
    // Close all test databases
    for (const db of this.databases) {
      try {
        await db.close()
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.databases = []
  }

  /**
   * Register a database for automatic cleanup
   */
  static registerDatabase(db: NOORMME): void {
    this.databases.push(db)
  }
}