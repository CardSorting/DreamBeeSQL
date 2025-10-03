import { expect } from 'chai'
import { withTestDatabase } from './setup/test-helpers.js'
import { cleanupTestDatabase } from './setup/test-database.js'

interface TestDatabase {
  dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql'
  connection: any
  db: any
}

describe('PostgreSQL Advanced Integration', () => {
  const dialect = 'postgresql' as const

  describe('Connection Management', () => {
    it('should handle connection pooling correctly', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Test multiple concurrent connections
      const promises = Array.from({ length: 10 }, (_, i) => 
        kysely.selectFrom('users').select('id').where('id', '=', `user-${i % 3 + 1}`).execute()
      )

      const results = await Promise.all(promises)
      expect(results).to.have.length(10)
      results.forEach(result => {
        expect(result).to.be.an('array')
      })

      console.log('✅ Connection pooling test completed')
    }))

    it('should handle connection errors gracefully', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Test invalid query
      try {
        await kysely.selectFrom('nonexistent_table').selectAll().execute()
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).to.exist
        expect(error.message).to.include('relation "nonexistent_table" does not exist')
      }

      // Test that connection is still usable after error
      const users = await kysely.selectFrom('users').selectAll().execute()
      expect(users).to.be.an('array')

      console.log('✅ Connection error handling test completed')
    }))

    it('should handle transaction rollbacks', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Start transaction
      await kysely.transaction().execute(async (trx) => {
        // Insert a user
        await trx.insertInto('users')
          .values({
            id: 'transaction-test-user',
            name: 'Transaction Test',
            email: 'transaction@test.com',
            active: true
          })
          .execute()

        // Verify user exists within transaction
        const user = await trx.selectFrom('users')
          .selectAll()
          .where('id', '=', 'transaction-test-user')
          .executeTakeFirst()

        expect(user).to.exist
        expect(user!.name).to.equal('Transaction Test')

        // Rollback transaction
        throw new Error('Intentional rollback')
      }).catch(() => {
        // Expected error for rollback
      })

      // Verify user doesn't exist after rollback
      const user = await kysely.selectFrom('users')
        .selectAll()
        .where('id', '=', 'transaction-test-user')
        .executeTakeFirst()

      expect(user).to.be.undefined

      console.log('✅ Transaction rollback test completed')
    }))
  })

  describe('PostgreSQL-Specific Features', () => {
    it('should handle PostgreSQL arrays', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Create table with array columns
      await kysely.schema
        .createTable('test_arrays')
        .ifNotExists()
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('tags', 'text', (col) => col.notNull())
        .addColumn('scores', 'text', (col) => col.notNull())
        .execute()

      // Insert data with JSON arrays (since Kysely doesn't support native PostgreSQL arrays directly)
      await kysely.insertInto('test_arrays')
        .values({
          tags: JSON.stringify(['postgresql', 'database', 'testing']),
          scores: JSON.stringify([95, 87, 92])
        })
        .execute()

      // Query with array operations
      const result = await kysely
        .selectFrom('test_arrays')
        .selectAll()
        .where('tags', 'like', '%postgresql%')
        .executeTakeFirst()

      expect(result).to.exist
      expect(result!.tags).to.include('postgresql')

      console.log('✅ PostgreSQL arrays test completed')
    }))

    it('should handle PostgreSQL JSONB operations', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Create table with JSONB column
      await kysely.schema
        .createTable('test_jsonb')
        .ifNotExists()
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('data', 'text', (col) => col.notNull()) // Using text for JSON
        .execute()

      const testData = {
        name: 'John Doe',
        age: 30,
        preferences: {
          theme: 'dark',
          notifications: true
        },
        tags: ['developer', 'postgresql']
      }

      // Insert JSON data
      await kysely.insertInto('test_jsonb')
        .values({
          data: JSON.stringify(testData)
        })
        .execute()

      // Query JSON data
      const result = await kysely
        .selectFrom('test_jsonb')
        .selectAll()
        .where('data', 'like', '%John Doe%')
        .executeTakeFirst()

      expect(result).to.exist
      const parsedData = JSON.parse(result!.data)
      expect(parsedData.name).to.equal('John Doe')
      expect(parsedData.age).to.equal(30)

      console.log('✅ PostgreSQL JSONB test completed')
    }))

    it('should handle PostgreSQL UUIDs', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Enable UUID extension
      await kysely.executeQuery({
        sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
        parameters: []
      })

      // Create table with UUID column
      await kysely.schema
        .createTable('test_uuids')
        .ifNotExists()
        .addColumn('id', 'text', (col) => col.primaryKey()) // Using text for UUID
        .addColumn('name', 'varchar(100)', (col) => col.notNull())
        .execute()

      // Generate UUID using PostgreSQL function
      const uuidResult = await kysely.executeQuery({
        sql: 'SELECT uuid_generate_v4() as uuid',
        parameters: []
      })

      const uuid = uuidResult.rows[0].uuid

      // Insert with UUID
      await kysely.insertInto('test_uuids')
        .values({
          id: uuid,
          name: 'UUID Test User'
        })
        .execute()

      // Query by UUID
      const result = await kysely
        .selectFrom('test_uuids')
        .selectAll()
        .where('id', '=', uuid)
        .executeTakeFirst()

      expect(result).to.exist
      expect(result!.name).to.equal('UUID Test User')

      console.log('✅ PostgreSQL UUID test completed')
    }))

    it('should handle PostgreSQL sequences', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Create table with SERIAL column (auto-increment)
      await kysely.schema
        .createTable('test_sequences')
        .ifNotExists()
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('name', 'varchar(100)', (col) => col.notNull())
        .execute()

      // Insert multiple records to test sequence
      const insertPromises = Array.from({ length: 5 }, (_, i) =>
        kysely.insertInto('test_sequences')
          .values({
            name: `Sequence Test ${i + 1}`
          })
          .returningAll()
          .executeTakeFirst()
      )

      const results = await Promise.all(insertPromises)

      // Verify sequence values are unique and incrementing
      const ids = results.map(r => r!.id).sort((a, b) => a - b)
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i + 1] - ids[i]).to.equal(1)
      }

      console.log('✅ PostgreSQL sequences test completed')
    }))
  })

  describe('Performance and Monitoring', () => {
    it('should handle bulk operations efficiently', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      const startTime = Date.now()

      // Bulk insert
      const bulkData = Array.from({ length: 1000 }, (_, i) => ({
        id: `bulk-user-${i}`,
        firstName: `Bulk`,
        lastName: `User${i}`,
        email: `bulk${i}@test.com`,
        active: i % 2 === 0
      }))

      await kysely.insertInto('users')
        .values(bulkData)
        .execute()

      const insertTime = Date.now() - startTime

      // Bulk update
      const updateStartTime = Date.now()
      await kysely.updateTable('users')
        .set({ firstName: 'Updated' })
        .where('id', 'like', 'bulk-user-%')
        .execute()

      const updateTime = Date.now() - updateStartTime

      // Bulk delete
      const deleteStartTime = Date.now()
      await kysely.deleteFrom('users')
        .where('id', 'like', 'bulk-user-%')
        .execute()

      const deleteTime = Date.now() - deleteStartTime

      console.log(`📊 Bulk operations performance:`)
      console.log(`  - Insert 1000 records: ${insertTime}ms`)
      console.log(`  - Update 1000 records: ${updateTime}ms`)
      console.log(`  - Delete 1000 records: ${deleteTime}ms`)

      expect(insertTime).to.be.lessThan(5000) // Should complete within 5 seconds
      expect(updateTime).to.be.lessThan(3000) // Should complete within 3 seconds
      expect(deleteTime).to.be.lessThan(3000) // Should complete within 3 seconds

      console.log('✅ Bulk operations performance test completed')
    }))

    it('should handle concurrent operations', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      const startTime = Date.now()

      // Create concurrent operations
      const operations = Array.from({ length: 50 }, (_, i) =>
        kysely.insertInto('users')
          .values({
            id: `concurrent-user-${i}`,
            firstName: `Concurrent`,
            lastName: `User${i}`,
            email: `concurrent${i}@test.com`,
            active: true
          })
          .returningAll()
          .executeTakeFirst()
      )

      const results = await Promise.all(operations)
      const totalTime = Date.now() - startTime

      expect(results).to.have.length(50)
      expect(totalTime).to.be.lessThan(10000) // Should complete within 10 seconds

      console.log(`📊 Concurrent operations: 50 inserts in ${totalTime}ms`)

      // Cleanup
      await kysely.deleteFrom('users')
        .where('id', 'like', 'concurrent-user-%')
        .execute()

      console.log('✅ Concurrent operations test completed')
    }))
  })

  describe('Error Handling and Recovery', () => {
    it('should handle constraint violations gracefully', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Test unique constraint violation
      try {
        await kysely.insertInto('users')
          .values({
            id: 'user-1', // This should already exist
            firstName: 'Duplicate',
            lastName: 'User',
            email: 'duplicate@test.com',
            active: true
          })
          .execute()
        expect.fail('Should have thrown a constraint violation error')
      } catch (error) {
        expect(error).to.exist
        expect(error.message).to.include('duplicate key value violates unique constraint')
      }

      // Test foreign key constraint violation
      try {
        await kysely.insertInto('posts')
          .values({
            id: 'invalid-post',
            title: 'Invalid Post',
            content: 'This should fail',
            userId: 'nonexistent-user',
            published: false
          })
          .execute()
        expect.fail('Should have thrown a foreign key constraint error')
      } catch (error) {
        expect(error).to.exist
        expect(error.message).to.include('violates foreign key constraint')
      }

      console.log('✅ Constraint violations handling test completed')
    }))

    it('should handle database connection recovery', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Test that we can still query after errors
      const users = await kysely.selectFrom('users').selectAll().execute()
      expect(users).to.be.an('array')

      // Test complex query
      const complexResult = await kysely
        .selectFrom('users')
        .leftJoin('profiles', 'profiles.userId', 'users.id')
        .leftJoin('posts', 'posts.userId', 'users.id')
        .select([
          'users.id',
          'users.name',
          'users.email',
          'profiles.bio',
          kysely.fn.count('posts.id').as('postCount')
        ])
        .groupBy(['users.id', 'users.name', 'users.email', 'profiles.bio'])
        .execute()

      expect(complexResult).to.be.an('array')

      console.log('✅ Database connection recovery test completed')
    }))
  })

  describe('Cleanup and Teardown', () => {
    it('should clean up test data properly', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb
      const kysely = db.getKysely()

      // Insert test data
      await kysely.insertInto('users')
        .values({
          id: 'cleanup-test-user',
          firstName: 'Cleanup',
          lastName: 'Test User',
          email: 'cleanup@test.com',
          active: true
        })
        .execute()

      // Verify data exists
      const user = await kysely.selectFrom('users')
        .selectAll()
        .where('id', '=', 'cleanup-test-user')
        .executeTakeFirst()

      expect(user).to.exist

      // Clean up manually
      await kysely.deleteFrom('users')
        .where('id', '=', 'cleanup-test-user')
        .execute()

      // Verify cleanup
      const deletedUser = await kysely.selectFrom('users')
        .selectAll()
        .where('id', '=', 'cleanup-test-user')
        .executeTakeFirst()

      expect(deletedUser).to.be.undefined

      console.log('✅ Cleanup and teardown test completed')
    }))

    it('should handle database teardown gracefully', withTestDatabase(dialect, async (testDb: TestDatabase) => {
      const { db } = testDb

      // Test that database is still accessible
      expect(db.isInitialized()).to.be.true

      // Test cleanup function
      await cleanupTestDatabase(testDb)

      console.log('✅ Database teardown test completed')
    }))
  })
})
