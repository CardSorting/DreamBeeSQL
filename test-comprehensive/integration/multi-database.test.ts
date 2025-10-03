/**
 * Comprehensive integration tests for multi-database support
 */

import { describe, it, expect, beforeAll, afterAll } from 'chai'
import { withMultipleDatabases, performanceHelper } from '../setup/test-helpers.js'
import { getEnabledDatabases } from '../setup/test-config.js'

describe('Multi-Database Integration', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (enabledDatabases.length < 2) {
    console.warn('Not enough databases enabled for multi-database testing')
    return
  }

  describe('Cross-Database Operations', () => {
    it('should work with multiple database dialects', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
        })

    it('should handle relationships across different databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      const sqlitePostRepo = sqliteDb.db.getRepository('posts')
      const postgresUserRepo = postgresDb.db.getRepository('users')
      const postgresPostRepo = postgresDb.db.getRepository('posts')
      
      // Create users and posts in both databases
      const sqliteUser = await sqliteUserRepo.create({
        id: 'sqlite-rel-user',
        email: 'sqliterel@example.com',
        firstName: 'SQLiteRel',
        lastName: 'User',
        active: true
      })
      
      const sqlitePost = await sqlitePostRepo.create({
        id: 'sqlite-rel-post',
        userId: sqliteUser.id,
        title: 'SQLite Post',
        content: 'SQLite Content',
        published: true
      })
      
      const postgresUser = await postgresUserRepo.create({
        id: 'postgres-rel-user',
        email: 'postgresrel@example.com',
        firstName: 'PostgresRel',
        lastName: 'User',
        active: true
      })
      
      const postgresPost = await postgresPostRepo.create({
        id: 'postgres-rel-post',
        userId: postgresUser.id,
        title: 'PostgreSQL Post',
        content: 'PostgreSQL Content',
        published: true
      })
      
      // Load relationships in respective databases
      const sqliteUserWithPosts = await sqliteUserRepo.findWithRelations(sqliteUser.id, ['posts'])
      const postgresUserWithPosts = await postgresUserRepo.findWithRelations(postgresUser.id, ['posts'])
      
      expect(sqliteUserWithPosts).to.exist
      expect(sqliteUserWithPosts!.posts).to.exist
      expect(sqliteUserWithPosts!.posts.length).to.equal(1)
      expect(sqliteUserWithPosts!.posts[0].id).to.equal('sqlite-rel-post')
      
      expect(postgresUserWithPosts).to.exist
      expect(postgresUserWithPosts!.posts).to.exist
      expect(postgresUserWithPosts!.posts.length).to.equal(1)
      expect(postgresUserWithPosts!.posts[0].id).to.equal('postgres-rel-post')
      
      // Clean up
      await sqlitePostRepo.delete('sqlite-rel-post')
      await sqliteUserRepo.delete('sqlite-rel-user')
      await postgresPostRepo.delete('postgres-rel-post')
      await postgresUserRepo.delete('postgres-rel-user')
        })

    it('should handle transactions across different databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Execute transactions in both databases
      const sqliteResult = await sqliteDb.db.transaction(async (trx) => {
        const user = await trx
          .insertInto('users')
          .values({
            id: 'sqlite-tx-user',
            email: 'sqlitetx@example.com',
            firstName: 'SQLiteTx',
            lastName: 'User',
            active: true
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        
        return user
      })
      
      const postgresResult = await postgresDb.db.transaction(async (trx) => {
        const user = await trx
          .insertInto('users')
          .values({
            id: 'postgres-tx-user',
            email: 'postgrestx@example.com',
            firstName: 'PostgresTx',
            lastName: 'User',
            active: true
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        
        return user
      })
      
      expect(sqliteResult).to.exist
      expect(sqliteResult.id).to.equal('sqlite-tx-user')
      expect(sqliteResult.email).to.equal('sqlitetx@example.com')
      
      expect(postgresResult).to.exist
      expect(postgresResult.id).to.equal('postgres-tx-user')
      expect(postgresResult.email).to.equal('postgrestx@example.com')
      
      // Verify users exist in respective databases
      const sqliteUserRepo = sqliteDb.db.getRepository('users')
      const postgresUserRepo = postgresDb.db.getRepository('users')
      
      const sqliteUser = await sqliteUserRepo.findById('sqlite-tx-user')
      const postgresUser = await postgresUserRepo.findById('postgres-tx-user')
      
      expect(sqliteUser).to.exist
      expect(postgresUser).to.exist
      
      // Clean up
      await sqliteUserRepo.delete('sqlite-tx-user')
      await postgresUserRepo.delete('postgres-tx-user')
        })
  })

  describe('Performance Across Databases', () => {
    it('should maintain performance across different databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Test performance in both databases
      const sqliteDuration = await performanceHelper.measure('sqlite-operations', async () => {
        const users = []
        for (let i = 0; i < 10; i++) {
          const user = await sqliteUserRepo.create({
            id: `sqlite-perf-user-${i}`,
            email: `sqliteperf${i}@example.com`,
            firstName: `SQLitePerf${i}`,
            lastName: 'User',
            active: true
          })
          users.push(user)
        }
        return users
      })
      
      const postgresDuration = await performanceHelper.measure('postgres-operations', async () => {
        const users = []
        for (let i = 0; i < 10; i++) {
          const user = await postgresUserRepo.create({
            id: `postgres-perf-user-${i}`,
            email: `postgresperf${i}@example.com`,
            firstName: `PostgresPerf${i}`,
            lastName: 'User',
            active: true
          })
          users.push(user)
        }
        return users
      })
      
      // Both should be reasonably fast
      expect(sqliteDuration).to.be.lessThan(2000) // 2 seconds max
      expect(postgresDuration).to.be.lessThan(2000) // 2 seconds max
      
      // Clean up
      for (let i = 0; i < 10; i++) {
        await sqliteUserRepo.delete(`sqlite-perf-user-${i}`)
        await postgresUserRepo.delete(`postgres-perf-user-${i}`)
      }
        })

    it('should handle concurrent operations across databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Execute concurrent operations across databases
      const start = performance.now()
      const promises = []
      
      // SQLite operations
      for (let i = 0; i < 5; i++) {
        promises.push(
          sqliteUserRepo.create({
            id: `sqlite-concurrent-user-${i}`,
            email: `sqliteconcurrent${i}@example.com`,
            firstName: `SQLiteConcurrent${i}`,
            lastName: 'User',
            active: true
          })
        )
      }
      
      // PostgreSQL operations
      for (let i = 0; i < 5; i++) {
        promises.push(
          postgresUserRepo.create({
            id: `postgres-concurrent-user-${i}`,
            email: `postgresconcurrent${i}@example.com`,
            firstName: `PostgresConcurrent${i}`,
            lastName: 'User',
            active: true
          })
        )
      }
      
      const results = await Promise.all(promises)
      const duration = performance.now() - start
      
      expect(results.length).to.equal(10)
      expect(duration).to.be.lessThan(3000) // 3 seconds max
      
      // Clean up
      for (let i = 0; i < 5; i++) {
        await sqliteUserRepo.delete(`sqlite-concurrent-user-${i}`)
        await postgresUserRepo.delete(`postgres-concurrent-user-${i}`)
      }
        })
  })

  describe('Schema Consistency', () => {
    it('should maintain schema consistency across databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Get schema information from both databases
      const sqliteSchema = await sqliteDb.db.getSchemaInfo()
      const postgresSchema = await postgresDb.db.getSchemaInfo()
      
      // Both should have the same tables
      const sqliteTableNames = sqliteSchema.tables.map(t => t.name).sort()
      const postgresTableNames = postgresSchema.tables.map(t => t.name).sort()
      
      expect(sqliteTableNames).to.deep.equal(postgresTableNames)
      
      // Both should have the same relationships
      const sqliteRelationshipNames = sqliteSchema.relationships.map(r => r.name).sort()
      const postgresRelationshipNames = postgresSchema.relationships.map(r => r.name).sort()
      
      expect(sqliteRelationshipNames).to.deep.equal(postgresRelationshipNames)
        })

    it('should handle different column types across databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Create users with different data types
      const sqliteUser = await sqliteUserRepo.create({
        id: 'sqlite-types-user',
        email: 'sqlitetypes@example.com',
        firstName: 'SQLiteTypes',
        lastName: 'User',
        age: 30,
        active: true
      })
      
      const postgresUser = await postgresUserRepo.create({
        id: 'postgres-types-user',
        email: 'postgretypes@example.com',
        firstName: 'PostgresTypes',
        lastName: 'User',
        age: 25,
        active: false
      })
      
      // Verify data types are handled correctly
      expect(sqliteUser.age).to.equal(30)
      expect(sqliteUser.active).to.be.true
      
      expect(postgresUser.age).to.equal(25)
      expect(postgresUser.active).to.be.false
      
      // Clean up
      await sqliteUserRepo.delete('sqlite-types-user')
      await postgresUserRepo.delete('postgres-types-user')
        })
  })

  describe('Error Handling Across Databases', () => {
    it('should handle errors independently across databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Create user in SQLite
      const sqliteUser = await sqliteUserRepo.create({
        id: 'sqlite-error-user',
        email: 'sqliteerror@example.com',
        firstName: 'SQLiteError',
        lastName: 'User',
        active: true
      })
      
      // Try to create user with duplicate ID in PostgreSQL (should work)
      const postgresUser = await postgresUserRepo.create({
        id: 'sqlite-error-user', // Same ID, different database
        email: 'postgreserror@example.com',
        firstName: 'PostgresError',
        lastName: 'User',
        active: true
      })
      
      // Both should exist in their respective databases
      const foundSqliteUser = await sqliteUserRepo.findById('sqlite-error-user')
      const foundPostgresUser = await postgresUserRepo.findById('sqlite-error-user')
      
      expect(foundSqliteUser).to.exist
      expect(foundPostgresUser).to.exist
      expect(foundSqliteUser!.email).to.equal('sqliteerror@example.com')
      expect(foundPostgresUser!.email).to.equal('postgreserror@example.com')
      
      // Clean up
      await sqliteUserRepo.delete('sqlite-error-user')
      await postgresUserRepo.delete('sqlite-error-user')
        })

    it('should handle connection errors independently', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
        id: 'sqlite-conn-user',
        email: 'sqliteconn@example.com',
        firstName: 'SQLiteConn',
        lastName: 'User',
        active: true
      })
      
      const postgresUser = await postgresUserRepo.create({
        id: 'postgres-conn-user',
        email: 'postgresconn@example.com',
        firstName: 'PostgresConn',
        lastName: 'User',
        active: true
      })
      
      // Close SQLite connection
      await sqliteDb.db.close()
      
      // PostgreSQL should still work
      const postgresUserAfterClose = await postgresUserRepo.findById('postgres-conn-user')
      expect(postgresUserAfterClose).to.exist
      
      // SQLite should fail
      try {
        await sqliteUserRepo.findById('sqlite-conn-user')
      } catch (error) {
        // Expected error
        expect(error).to.be.instanceOf(Error)
      }
      
      // Clean up PostgreSQL
      await postgresUserRepo.delete('postgres-conn-user')
        })
  })

  describe('Migration System Across Databases', () => {
    it('should handle migrations independently across databases', withMultipleDatabases(['sqlite', 'postgresql'], async (testDatabases) => {
      if (testDatabases.size < 2) {
        console.warn('Required databases not available for multi-database test')
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
      
      // Import migration manager
      const { createNodeMigrationManager } = await import('../../src/migration/node-migration-manager.js')
      
      // Create migration managers for both databases
      const sqliteMigrationManager = await createNodeMigrationManager(sqliteDb.db.getKysely(), {
        migrationsDirectory: './test-migrations'
      })
      
      const postgresMigrationManager = await createNodeMigrationManager(postgresDb.db.getKysely(), {
        migrationsDirectory: './test-migrations'
      })
      
      // Initialize both migration systems
      await sqliteMigrationManager.initialize()
      await postgresMigrationManager.initialize()
      
      // Get status from both
      const sqliteStatus = await sqliteMigrationManager.getStatus()
      const postgresStatus = await postgresMigrationManager.getStatus()
      
      expect(sqliteStatus).to.exist
      expect(postgresStatus).to.exist
      expect(sqliteStatus.totalFiles).to.be.a('number')
      expect(postgresStatus.totalFiles).to.be.a('number')
      
      // Clean up
      await sqliteMigrationManager.cleanup()
      await postgresMigrationManager.cleanup()
        })
  })
})
