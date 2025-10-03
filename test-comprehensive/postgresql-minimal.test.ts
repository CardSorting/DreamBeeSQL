import { describe, it, before, after, beforeEach } from 'mocha'
import { expect } from 'chai'
import { withTestDatabase } from './setup/test-helpers.js'
import { getEnabledDatabases } from './setup/test-config.js'

/**
 * PostgreSQL Minimal Integration Tests
 * 
 * This test suite provides basic PostgreSQL functionality tests
 * to ensure NOORMME works correctly with PostgreSQL databases.
 * 
 * Key Features Being Tested:
 * 1. Basic database connection and initialization
 * 2. Simple CRUD operations
 * 3. Transaction support
 * 4. Repository functionality
 * 5. Relationship loading
 * 6. Error handling
 */

describe('PostgreSQL Minimal Integration', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (!enabledDatabases.includes('postgresql')) {
    console.warn('PostgreSQL not enabled for testing')
    return
  }

  describe('Basic Database Operations', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should initialize PostgreSQL database successfully', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          
          expect(db).to.exist
          expect(db.isInitialized()).to.be.true
          
          // Test basic query
          const result = await db.execute('SELECT version() as version')
          expect(result).to.be.an('array')
          expect(result[0]).to.have.property('version')
          expect(result[0].version).to.include('PostgreSQL')
        }))

        it('should perform basic CRUD operations', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_crud')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
            .addColumn('age', 'integer')
            .addColumn('active', 'boolean', (col) => col.defaultTo(true))
            .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
            .execute()

          // Create (Insert)
          const insertResult = await kysely
            .insertInto('test_crud')
            .values({
              name: 'John Doe',
              email: 'john@example.com',
              age: 30,
              active: true
            })
            .returningAll()
            .executeTakeFirstOrThrow()

          expect(insertResult).to.exist
          expect(insertResult.id).to.be.a('number')
          expect(insertResult.name).to.equal('John Doe')
          expect(insertResult.email).to.equal('john@example.com')
          expect(insertResult.age).to.equal(30)
          expect(insertResult.active).to.be.true

          // Read (Select)
          const selectResult = await kysely
            .selectFrom('test_crud')
            .selectAll()
            .where('id', '=', insertResult.id)
            .executeTakeFirstOrThrow()

          expect(selectResult).to.deep.equal(insertResult)

          // Update
          const updateResult = await kysely
            .updateTable('test_crud')
            .set({
              name: 'John Smith',
              age: 31
            })
            .where('id', '=', insertResult.id)
            .returningAll()
            .executeTakeFirstOrThrow()

          expect(updateResult.name).to.equal('John Smith')
          expect(updateResult.age).to.equal(31)
          expect(updateResult.email).to.equal('john@example.com') // Unchanged

          // Delete
          const deleteResult = await kysely
            .deleteFrom('test_crud')
            .where('id', '=', insertResult.id)
            .returningAll()
            .executeTakeFirstOrThrow()

          expect(deleteResult.id).to.equal(insertResult.id)

          // Verify deletion
          const verifyResult = await kysely
            .selectFrom('test_crud')
            .selectAll()
            .where('id', '=', insertResult.id)
            .execute()

          expect(verifyResult).to.have.length(0)
        }))

        it('should handle transactions correctly', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_transactions')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('amount', 'decimal', (col) => col.notNull())
            .execute()

          // Successful transaction
          const transactionResult = await kysely.transaction().execute(async (trx) => {
            const record1 = await trx
              .insertInto('test_transactions')
              .values({ name: 'Record 1', amount: 100.00 })
              .returningAll()
              .executeTakeFirstOrThrow()

            const record2 = await trx
              .insertInto('test_transactions')
              .values({ name: 'Record 2', amount: 200.00 })
              .returningAll()
              .executeTakeFirstOrThrow()

            return { record1, record2 }
          })

          expect(transactionResult.record1).to.exist
          expect(transactionResult.record2).to.exist

          // Verify both records were inserted
          const allRecords = await kysely
            .selectFrom('test_transactions')
            .selectAll()
            .execute()

          expect(allRecords).to.have.length(2)

          // Failed transaction (should rollback)
          try {
            await kysely.transaction().execute(async (trx) => {
              await trx
                .insertInto('test_transactions')
                .values({ name: 'Record 3', amount: 300.00 })
                .execute()

              // This should cause the transaction to fail
              await trx
                .insertInto('test_transactions')
                .values({ name: 'Record 4', amount: null }) // Invalid: amount cannot be null
                .execute()
            })

            expect.fail('Transaction should have failed')
          } catch (error) {
            // Expected to fail
            expect(error).to.exist
          }

          // Verify no additional records were inserted
          const recordsAfterFailure = await kysely
            .selectFrom('test_transactions')
            .selectAll()
            .execute()

          expect(recordsAfterFailure).to.have.length(2) // Only the successful transaction records
        }))

        it('should handle batch operations', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_batch')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('value', 'integer', (col) => col.notNull())
            .execute()

          // Batch insert
          const batchData = Array.from({ length: 10 }, (_, i) => ({
            name: `Item ${i + 1}`,
            value: (i + 1) * 10
          }))

          const insertResult = await kysely
            .insertInto('test_batch')
            .values(batchData)
            .returningAll()
            .execute()

          expect(insertResult).to.have.length(10)

          // Verify data
          const allData = await kysely
            .selectFrom('test_batch')
            .selectAll()
            .orderBy('id')
            .execute()

          expect(allData).to.have.length(10)
          allData.forEach((item, index) => {
            expect(item.name).to.equal(`Item ${index + 1}`)
            expect(item.value).to.equal((index + 1) * 10)
          })

          // Batch update using raw SQL
          const updateResult = await kysely
            .updateTable('test_batch')
            .set({ value: kysely.fn('value * 2') })
            .where('value', '>', 50)
            .returningAll()
            .execute()

          expect(updateResult).to.have.length(5) // Items with value > 50

          // Batch delete
          const deleteResult = await kysely
            .deleteFrom('test_batch')
            .where('value', '<', 100)
            .returningAll()
            .execute()

          expect(deleteResult).to.have.length(5) // Items with value < 100

          // Verify final state
          const finalData = await kysely
            .selectFrom('test_batch')
            .selectAll()
            .execute()

          expect(finalData).to.have.length(5)
          finalData.forEach(item => {
            expect(item.value).to.be.greaterThan(100)
          })
        }))
      })
    }
  })

  describe('Repository Operations', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should work with repository pattern', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb

          // Get repository for users table
          const userRepo = db.getRepository('users')

          expect(userRepo).to.exist

          // Create user
          const user = await userRepo.create({
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            active: true
          })

          expect(user).to.exist
          expect((user as any).id).to.equal('user-1')
          expect((user as any).email).to.equal('test@example.com')

          // Find user by ID
          const foundUser = await userRepo.findById('user-1')
          expect(foundUser).to.exist
          expect((foundUser as any)!.email).to.equal('test@example.com')

          // Update user
          ;(foundUser as any)!.firstName = 'Updated'
          const updatedUser = await userRepo.update(foundUser!)
          expect((updatedUser as any).firstName).to.equal('Updated')

          // Delete user
          const deleted = await userRepo.delete('user-1')
          expect(deleted).to.be.true

          // Verify deletion
          const deletedUser = await userRepo.findById('user-1')
          expect(deletedUser).to.be.null
        }))

        it('should handle repository queries', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const userRepo = db.getRepository('users')

          // Create multiple users
          await userRepo.create({
            id: 'user-1',
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Johnson',
            active: true
          })

          await userRepo.create({
            id: 'user-2',
            email: 'bob@example.com',
            firstName: 'Bob',
            lastName: 'Smith',
            active: true
          })

          await userRepo.create({
            id: 'user-3',
            email: 'charlie@example.com',
            firstName: 'Charlie',
            lastName: 'Brown',
            active: false
          })

          // Find all active users
          const activeUsers = await userRepo.findMany({ active: true })
          expect(activeUsers).to.have.length(2)

          // Find user by email
          const userByEmail = await userRepo.findOne({ email: 'bob@example.com' })
          expect(userByEmail).to.exist
          expect((userByEmail as any)!.firstName).to.equal('Bob')

          // Count users
          const userCount = await userRepo.count()
          expect(userCount).to.equal(3)

          // Count active users
          const activeCount = await userRepo.count()
          expect(activeCount).to.equal(2)
        }))
      })
    }
  })

  describe('Relationship Operations', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should load relationships correctly', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')

          // Create user
          const user = await userRepo.create({
            id: 'user-1',
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
            active: true
          })

          // Create posts for the user
          await postRepo.create({
            id: 'post-1',
            userId: (user as any).id,
            title: 'First Post',
            content: 'This is the first post content',
            published: true
          })

          await postRepo.create({
            id: 'post-2',
            userId: (user as any).id,
            title: 'Second Post',
            content: 'This is the second post content',
            published: false
          })

          // Load user with posts
          const userWithPosts = await userRepo.findWithRelations((user as any).id, ['posts'])
          expect(userWithPosts).to.exist
          expect((userWithPosts as any)!.posts).to.exist
          expect((userWithPosts as any)!.posts).to.have.length(2)

          const posts = (userWithPosts as any)!.posts
          expect(posts[0].title).to.be.oneOf(['First Post', 'Second Post'])
          expect(posts[1].title).to.be.oneOf(['First Post', 'Second Post'])

          // Load user with published posts only
          const userWithPublishedPosts = await userRepo.findWithRelations(
            (user as any).id,
            ['posts']
          )
          
          expect(userWithPublishedPosts).to.exist
          expect((userWithPublishedPosts as any)!.posts).to.have.length(1)
          expect((userWithPublishedPosts as any)!.posts[0].published).to.be.true
        }))

        it('should handle many-to-many relationships', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const postRepo = db.getRepository('posts')
          const tagRepo = db.getRepository('tags')

          // Create tags
          const tag1 = await tagRepo.create({
            id: 'tag-1',
            name: 'javascript',
            color: '#f7df1e'
          })

          const tag2 = await tagRepo.create({
            id: 'tag-2',
            name: 'typescript',
            color: '#3178c6'
          })

          const tag3 = await tagRepo.create({
            id: 'tag-3',
            name: 'database',
            color: '#336791'
          })

          // Create post
          const post = await postRepo.create({
            id: 'post-1',
            userId: 'user-1',
            title: 'JavaScript and TypeScript Guide',
            content: 'A comprehensive guide to JavaScript and TypeScript',
            published: true
          })

          // Add tags to post (using raw SQL for junction table)
          const kysely = db.getKysely()
          await kysely
            .insertInto('post_tags')
            .values([
              { postId: (post as any).id, tagId: (tag1 as any).id },
              { postId: (post as any).id, tagId: (tag2 as any).id },
              { postId: (post as any).id, tagId: (tag3 as any).id }
            ])
            .execute()

          // Load post with tags
          const postWithTags = await postRepo.findWithRelations((post as any).id, ['tags'])
          expect(postWithTags).to.exist
          expect((postWithTags as any)!.tags).to.exist
          expect((postWithTags as any)!.tags).to.have.length(3)

          const tags = (postWithTags as any)!.tags
          const tagNames = tags.map((tag: any) => tag.name)
          expect(tagNames).to.include('javascript')
          expect(tagNames).to.include('typescript')
          expect(tagNames).to.include('database')
        }))
      })
    }
  })

  describe('Error Handling', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle constraint violations', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const userRepo = db.getRepository('users')

          // Create user with duplicate email (should fail)
          await userRepo.create({
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            active: true
          })

          await expect(
            userRepo.create({
              id: 'user-2',
              email: 'test@example.com', // Duplicate email
              firstName: 'Another',
              lastName: 'User',
              active: true
            })
          ).to.be.rejected
        }))

        it('should handle invalid foreign key references', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const postRepo = db.getRepository('posts')

          // Try to create post with non-existent user (should fail)
          await expect(
            postRepo.create({
              id: 'post-1',
              userId: 'non-existent-user',
              title: 'Test Post',
              content: 'Test content',
              published: true
            })
          ).to.be.rejected
        }))

        it('should handle invalid SQL queries', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb

          // Invalid SQL should be rejected
          await expect(
            db.execute('SELECT * FROM non_existent_table')
          ).to.be.rejected

          // Malformed SQL should be rejected
          await expect(
            db.execute('SELECT * FROM users WHERE invalid_column = ?', ['value'])
          ).to.be.rejected
        }))

        it('should handle connection errors gracefully', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb

          // Close the database connection
          await db.close()

          // Operations should fail gracefully after connection is closed
          await expect(
            db.execute('SELECT 1')
          ).to.be.rejected

          // Repository operations should also fail
          const userRepo = db.getRepository('users')
          await expect(
            userRepo.findById('test')
          ).to.be.rejected
        }))
      })
    }
  })

  describe('Performance Tests', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should perform bulk operations efficiently', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const userRepo = db.getRepository('users')

          const startTime = Date.now()

          // Create 100 users
          const users = Array.from({ length: 100 }, (_, i) => ({
            id: `user-${i + 1}`,
            email: `user${i + 1}@example.com`,
            firstName: `User${i + 1}`,
            lastName: 'Test',
            active: true
          }))

          // Use batch insert for efficiency
          const kysely = db.getKysely()
          await kysely
            .insertInto('users')
            .values(users)
            .execute()

          const endTime = Date.now()
          const duration = endTime - startTime

          // Verify all users were created
          const userCount = await userRepo.count()
          expect(userCount).to.equal(100)

          // Should complete within reasonable time (adjust threshold as needed)
          expect(duration).to.be.lessThan(5000) // 5 seconds

          console.log(`Created 100 users in ${duration}ms`)
        }))

        it('should handle concurrent operations', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const userRepo = db.getRepository('users')

          // Create multiple users concurrently
          const promises = Array.from({ length: 10 }, (_, i) =>
            userRepo.create({
              id: `concurrent-user-${i + 1}`,
              email: `concurrent${i + 1}@example.com`,
              firstName: `Concurrent${i + 1}`,
              lastName: 'User',
              active: true
            })
          )

          const startTime = Date.now()
          const results = await Promise.all(promises)
          const endTime = Date.now()

          expect(results).to.have.length(10)
          results.forEach((user, index) => {
            expect((user as any).id).to.equal(`concurrent-user-${index + 1}`)
          })

          const duration = endTime - startTime
          console.log(`Created 10 users concurrently in ${duration}ms`)

          // Verify all users exist
          const userCount = await userRepo.count()
          expect(userCount).to.be.greaterThan(10)
        }))
      })
    }
  })
})
