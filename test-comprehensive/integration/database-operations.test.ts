/**
 * Comprehensive integration tests for database operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'chai'
import { withTestDatabase, withMultipleDatabases, performanceHelper } from '../setup/test-helpers.js'
import { getEnabledDatabases } from '../setup/test-config.js'

describe('Database Operations Integration', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (enabledDatabases.length === 0) {
    console.warn('No databases enabled for testing')
    return
  }

  describe('CRUD Operations', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should perform complete CRUD lifecycle', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Create
          const newUser = await userRepo.create({
            id: 'crud-user',
            email: 'crud@example.com',
            firstName: 'CRUD',
            lastName: 'User',
            active: true
          })
          
          expect(newUser).to.exist
          expect(newUser.id).to.equal('crud-user')
          expect(newUser.email).to.equal('crud@example.com')
          
          // Read
          const foundUser = await userRepo.findById('crud-user')
          expect(foundUser).to.exist
          expect(foundUser!.id).to.equal('crud-user')
          expect(foundUser!.email).to.equal('crud@example.com')
          
          // Update
          foundUser!.firstName = 'Updated'
          foundUser!.lastName = 'Name'
          
          const updatedUser = await userRepo.update(foundUser!)
          expect(updatedUser.firstName).to.equal('Updated')
          expect(updatedUser.lastName).to.equal('Name')
          
          // Verify update
          const verifyUser = await userRepo.findById('crud-user')
          expect(verifyUser!.firstName).to.equal('Updated')
          expect(verifyUser!.lastName).to.equal('Name')
          
          // Delete
          const deleted = await userRepo.delete('crud-user')
          expect(deleted).to.be.true
          
          // Verify deletion
          const deletedUser = await userRepo.findById('crud-user')
          expect(deletedUser).to.be.null
        })

        it('should handle batch operations', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Create multiple users
          const users = []
          for (let i = 0; i < 10; i++) {
            const user = await userRepo.create({
              id: `batch-user-${i}`,
              email: `batch${i}@example.com`,
              firstName: `Batch${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
          }
          
          expect(users.length).to.equal(10)
          
          // Read all users
          const allUsers = await userRepo.findAll()
          expect(allUsers.length).to.be.greaterThanOrEqual(10)
          
          // Update multiple users
          for (const user of users) {
            user.firstName = `Updated${user.firstName}`
            await userRepo.update(user)
          }
          
          // Verify updates
          for (const user of users) {
            const updatedUser = await userRepo.findById(user.id)
            expect(updatedUser!.firstName).to.equal(`Updated${user.firstName}`)
          }
          
          // Delete all users
          for (const user of users) {
            const deleted = await userRepo.delete(user.id)
            expect(deleted).to.be.true
          }
          
          // Verify deletions
          for (const user of users) {
            const deletedUser = await userRepo.findById(user.id)
            expect(deletedUser).to.be.null
          }
        })

        it('should handle complex data types', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Create user with various data types
          const user = await userRepo.create({
            id: 'complex-user',
            email: 'complex@example.com',
            firstName: 'Complex',
            lastName: 'User',
            age: 30,
            active: true
          })
          
          expect(user).to.exist
          expect(user.id).to.equal('complex-user')
          expect(user.email).to.equal('complex@example.com')
          expect(user.firstName).to.equal('Complex')
          expect(user.lastName).to.equal('User')
          expect(user.age).to.equal(30)
          expect(user.active).to.be.true
          
          // Clean up
          await userRepo.delete('complex-user')
        })
      })
    }
  })

  describe('Relationship Operations', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should load one-to-many relationships', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          
          // Create user and posts
          const user = await userRepo.create({
            id: 'rel-user',
            email: 'rel@example.com',
            firstName: 'Rel',
            lastName: 'User',
            active: true
          })
          
          const posts = []
          for (let i = 0; i < 3; i++) {
            const post = await postRepo.create({
              id: `rel-post-${i}`,
              userId: user.id,
              title: `Post ${i}`,
              content: `Content ${i}`,
              published: true
            })
            posts.push(post)
          }
          
          // Load user with posts
          const userWithPosts = await userRepo.findWithRelations(user.id, ['posts'])
          
          expect(userWithPosts).to.exist
          expect(userWithPosts!.posts).to.exist
          expect(userWithPosts!.posts).to.be.an('array')
          expect(userWithPosts!.posts.length).to.equal(3)
          
          // Verify posts
          for (const post of userWithPosts!.posts) {
            expect(post.userId).to.equal(user.id)
            expect(post.title).to.include('Post')
          }
          
          // Clean up
          for (const post of posts) {
            await postRepo.delete(post.id)
          }
          await userRepo.delete(user.id)
        })

        it('should load many-to-one relationships', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          
          // Create user and post
          const user = await userRepo.create({
            id: 'rel-user-2',
            email: 'rel2@example.com',
            firstName: 'Rel2',
            lastName: 'User',
            active: true
          })
          
          const post = await postRepo.create({
            id: 'rel-post-2',
            userId: user.id,
            title: 'Test Post',
            content: 'Test Content',
            published: true
          })
          
          // Load post with user
          const postWithUser = await postRepo.findWithRelations(post.id, ['users'])
          
          expect(postWithUser).to.exist
          expect(postWithUser!.users).to.exist
          expect(postWithUser!.users).to.be.an('object')
          expect(postWithUser!.users.id).to.equal(user.id)
          expect(postWithUser!.users.email).to.equal(user.email)
          
          // Clean up
          await postRepo.delete(post.id)
          await userRepo.delete(user.id)
        })

        it('should load nested relationships', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          
          // Create user, post, and comments
          const user = await userRepo.create({
            id: 'nested-user',
            email: 'nested@example.com',
            firstName: 'Nested',
            lastName: 'User',
            active: true
          })
          
          const post = await postRepo.create({
            id: 'nested-post',
            userId: user.id,
            title: 'Nested Post',
            content: 'Nested Content',
            published: true
          })
          
          const comments = []
          for (let i = 0; i < 2; i++) {
            const comment = await commentRepo.create({
              id: `nested-comment-${i}`,
              postId: post.id,
              userId: user.id,
              content: `Comment ${i}`
            })
            comments.push(comment)
          }
          
          // Load user with posts and comments
          const userWithRelations = await userRepo.findWithRelations(user.id, ['posts'])
          
          expect(userWithRelations).to.exist
          expect(userWithRelations!.posts).to.exist
          expect(userWithRelations!.posts.length).to.equal(1)
          
          const userPost = userWithRelations!.posts[0]
          expect(userPost.id).to.equal(post.id)
          
          // Load post with comments
          const postWithComments = await postRepo.findWithRelations(post.id, ['comments'])
          
          expect(postWithComments).to.exist
          expect(postWithComments!.comments).to.exist
          expect(postWithComments!.comments.length).to.equal(2)
          
          // Clean up
          for (const comment of comments) {
            await commentRepo.delete(comment.id)
          }
          await postRepo.delete(post.id)
          await userRepo.delete(user.id)
        })

        it('should batch load relationships efficiently', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          
          // Create multiple users and posts
          const users = []
          const posts = []
          
          for (let i = 0; i < 5; i++) {
            const user = await userRepo.create({
              id: `batch-rel-user-${i}`,
              email: `batchrel${i}@example.com`,
              firstName: `BatchRel${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
            
            // Create 2 posts per user
            for (let j = 0; j < 2; j++) {
              const post = await postRepo.create({
                id: `batch-rel-post-${i}-${j}`,
                userId: user.id,
                title: `Post ${i}-${j}`,
                content: `Content ${i}-${j}`,
                published: true
              })
              posts.push(post)
            }
          }
          
          // Batch load relationships
          const start = performance.now()
          await userRepo.loadRelationships(users, ['posts'])
          const duration = performance.now() - start
          
          // Should be efficient
          expect(duration).to.be.lessThan(2000) // 2 seconds max
          
          // Verify all users have posts loaded
          for (const user of users) {
            expect(user.posts).to.exist
            expect(user.posts).to.be.an('array')
            expect(user.posts.length).to.equal(2)
          }
          
          // Clean up
          for (const post of posts) {
            await postRepo.delete(post.id)
          }
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })
      })
    }
  })

  describe('Transaction Operations', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should execute successful transactions', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          
          // Execute transaction
          const result = await db.transaction(async (trx) => {
            // Create user
            const user = await trx
              .insertInto('users')
              .values({
                id: 'tx-user',
                email: 'tx@example.com',
                firstName: 'Tx',
                lastName: 'User',
                active: true
              })
              .returningAll()
              .executeTakeFirstOrThrow()
            
            // Create post
            const post = await trx
              .insertInto('posts')
              .values({
                id: 'tx-post',
                userId: user.id,
                title: 'Transaction Post',
                content: 'Transaction Content',
                published: true
              })
              .returningAll()
              .executeTakeFirstOrThrow()
            
            return { user, post }
          })
          
          expect(result).to.exist
          expect(result.user.id).to.equal('tx-user')
          expect(result.post.id).to.equal('tx-post')
          expect(result.post.userId).to.equal(result.user.id)
          
          // Verify data exists
          const user = await userRepo.findById('tx-user')
          const post = await postRepo.findById('tx-post')
          
          expect(user).to.exist
          expect(post).to.exist
          expect(post!.userId).to.equal(user!.id)
          
          // Clean up
          await postRepo.delete('tx-post')
          await userRepo.delete('tx-user')
        })

        it('should rollback failed transactions', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          try {
            await db.transaction(async (trx) => {
              // Create user
              await trx
                .insertInto('users')
                .values({
                  id: 'rollback-user',
                  email: 'rollback@example.com',
                  firstName: 'Rollback',
                  lastName: 'User',
                  active: true
                })
                .execute()
              
              // Force an error
              throw new Error('Transaction rollback test')
            })
          } catch (error) {
            // Expected error
            expect(error).to.be.instanceOf(Error)
          }
          
          // User should not exist after rollback
          const user = await userRepo.findById('rollback-user')
          expect(user).to.be.null
        })

        it('should handle nested transactions', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Execute nested transaction
          const result = await db.transaction(async (outerTrx) => {
            // Create user in outer transaction
            const user = await outerTrx
              .insertInto('users')
              .values({
                id: 'nested-user',
                email: 'nested@example.com',
                firstName: 'Nested',
                lastName: 'User',
                active: true
              })
              .returningAll()
              .executeTakeFirstOrThrow()
            
            // Execute inner transaction
            const innerResult = await db.transaction(async (innerTrx) => {
              // Update user in inner transaction
              const updatedUser = await innerTrx
                .updateTable('users')
                .set({ firstName: 'Updated' })
                .where('id', '=', user.id)
                .returningAll()
                .executeTakeFirstOrThrow()
              
              return updatedUser
            })
            
            return { user, innerResult }
          })
          
          expect(result).to.exist
          expect(result.user.id).to.equal('nested-user')
          expect(result.innerResult.firstName).to.equal('Updated')
          
          // Verify data exists
          const user = await userRepo.findById('nested-user')
          expect(user).to.exist
          expect(user!.firstName).to.equal('Updated')
          
          // Clean up
          await userRepo.delete('nested-user')
        })
      })
    }
  })

  describe('Custom Queries', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should execute custom Kysely queries', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Create test users
          const users = []
          for (let i = 0; i < 5; i++) {
            const user = await userRepo.create({
              id: `custom-user-${i}`,
              email: `custom${i}@example.com`,
              firstName: `Custom${i}`,
              lastName: 'User',
              active: i % 2 === 0 // Every other user is active
            })
            users.push(user)
          }
          
          // Execute custom query
          const kysely = db.getKysely()
          const activeUsers = await kysely
            .selectFrom('users')
            .selectAll()
            .where('active', '=', true)
            .execute()
          
          expect(activeUsers).to.be.an('array')
          expect(activeUsers.length).to.equal(3) // 3 active users
          
          for (const user of activeUsers) {
            expect(user.active).to.be.true
          }
          
          // Clean up
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })

        it('should execute raw SQL queries', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Create test users
          const users = []
          for (let i = 0; i < 3; i++) {
            const user = await userRepo.create({
              id: `raw-user-${i}`,
              email: `raw${i}@example.com`,
              firstName: `Raw${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
          }
          
          // Execute raw SQL
          const result = await db.execute('SELECT COUNT(*) as count FROM users WHERE active = ?', [true])
          
          expect(result).to.be.an('array')
          expect(result[0]).to.have.property('count')
          expect(result[0].count).to.be.a('number')
          expect(result[0].count).to.be.greaterThanOrEqual(3)
          
          // Clean up
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })

        it('should execute complex queries with joins', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          
          // Create test data
          const user = await userRepo.create({
            id: 'join-user',
            email: 'join@example.com',
            firstName: 'Join',
            lastName: 'User',
            active: true
          })
          
          const posts = []
          for (let i = 0; i < 3; i++) {
            const post = await postRepo.create({
              id: `join-post-${i}`,
              userId: user.id,
              title: `Join Post ${i}`,
              content: `Join Content ${i}`,
              published: true
            })
            posts.push(post)
          }
          
          // Execute join query
          const kysely = db.getKysely()
          const usersWithPosts = await kysely
            .selectFrom('users')
            .innerJoin('posts', 'posts.userId', 'users.id')
            .select(['users.id', 'users.firstName', 'users.lastName', 'posts.title', 'posts.content'])
            .where('users.active', '=', true)
            .execute()
          
          expect(usersWithPosts).to.be.an('array')
          expect(usersWithPosts.length).to.equal(3) // 3 posts for 1 user
          
          for (const row of usersWithPosts) {
            expect(row.id).to.equal(user.id)
            expect(row.firstName).to.equal('Join')
            expect(row.lastName).to.equal('User')
            expect(row.title).to.include('Join Post')
          }
          
          // Clean up
          for (const post of posts) {
            await postRepo.delete(post.id)
          }
          await userRepo.delete(user.id)
        })
      })
    }
  })

  describe('Multi-Database Operations', () => {
    it('should work with multiple database dialects', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Not enough databases enabled for multi-database test')
        return
      }
      
      const sqliteDb = testDatabases.get('sqlite')
      const postgresDb = testDatabases.get('postgresql')
      
      if (!sqliteDb || !postgresDb) {
        console.warn('Required databases not available for multi-database test')
        return
      }
      
      await sqliteDb.db.initialize()
      await postgresDb.db.initialize()
      
      const sqliteUserRepo = sqliteDb.db.getRepository('users')
      const postgresUserRepo = postgresDb.db.getRepository('users')
      
      // Create users in both databases
      const sqliteUser = await sqliteUserRepo.create({
        id: 'multi-sqlite-user',
        email: 'sqlite@example.com',
        firstName: 'SQLite',
        lastName: 'User',
        active: true
      })
      
      const postgresUser = await postgresUserRepo.create({
        id: 'multi-postgres-user',
        email: 'postgres@example.com',
        firstName: 'PostgreSQL',
        lastName: 'User',
        active: true
      })
      
      // Verify users exist in respective databases
      const foundSqliteUser = await sqliteUserRepo.findById('multi-sqlite-user')
      const foundPostgresUser = await postgresUserRepo.findById('multi-postgres-user')
      
      expect(foundSqliteUser).to.exist
      expect(foundSqliteUser!.email).to.equal('sqlite@example.com')
      
      expect(foundPostgresUser).to.exist
      expect(foundPostgresUser!.email).to.equal('postgres@example.com')
      
      // Verify users don't exist in other databases
      const sqliteUserInPostgres = await postgresUserRepo.findById('multi-sqlite-user')
      const postgresUserInSqlite = await sqliteUserRepo.findById('multi-postgres-user')
      
      expect(sqliteUserInPostgres).to.be.null
      expect(postgresUserInSqlite).to.be.null
      
      // Clean up
      await sqliteUserRepo.delete('multi-sqlite-user')
      await postgresUserRepo.delete('multi-postgres-user')
    }))
  })

  describe('Performance', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle large datasets efficiently', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Create large dataset
          const start = performance.now()
          const users = []
          
          for (let i = 0; i < 100; i++) {
            const user = await userRepo.create({
              id: `perf-user-${i}`,
              email: `perf${i}@example.com`,
              firstName: `Perf${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
          }
          
          const createDuration = performance.now() - start
          
          // Read large dataset
          const readStart = performance.now()
          const allUsers = await userRepo.findAll()
          const readDuration = performance.now() - readStart
          
          // Update large dataset
          const updateStart = performance.now()
          for (const user of users) {
            user.firstName = `Updated${user.firstName}`
            await userRepo.update(user)
          }
          const updateDuration = performance.now() - updateStart
          
          // Delete large dataset
          const deleteStart = performance.now()
          for (const user of users) {
            await userRepo.delete(user.id)
          }
          const deleteDuration = performance.now() - deleteStart
          
          // Performance assertions
          expect(createDuration).to.be.lessThan(5000) // 5 seconds max
          expect(readDuration).to.be.lessThan(1000) // 1 second max
          expect(updateDuration).to.be.lessThan(5000) // 5 seconds max
          expect(deleteDuration).to.be.lessThan(5000) // 5 seconds max
          
          expect(allUsers.length).to.be.greaterThanOrEqual(100)
        })

        it('should handle concurrent operations efficiently', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          
          // Concurrent create operations
          const start = performance.now()
          const promises = []
          
          for (let i = 0; i < 20; i++) {
            promises.push(
              userRepo.create({
                id: `concurrent-user-${i}`,
                email: `concurrent${i}@example.com`,
                firstName: `Concurrent${i}`,
                lastName: 'User',
                active: true
              })
            )
          }
          
          const users = await Promise.all(promises)
          const duration = performance.now() - start
          
          expect(users.length).to.equal(20)
          expect(duration).to.be.lessThan(3000) // 3 seconds max
          
          // Concurrent read operations
          const readStart = performance.now()
          const readPromises = users.map(user => userRepo.findById(user.id))
          const readUsers = await Promise.all(readPromises)
          const readDuration = performance.now() - readStart
          
          expect(readUsers.length).to.equal(20)
          expect(readDuration).to.be.lessThan(1000) // 1 second max
          
          // Clean up
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })
      })
    }
  })
})
