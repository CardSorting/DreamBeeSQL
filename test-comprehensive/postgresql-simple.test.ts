import { describe, it } from 'mocha'
import { expect } from 'chai'
import { NOORMME } from '../src/noormme.js'

describe('PostgreSQL Simple Test', () => {
  it('should connect to PostgreSQL and run a simple query', async () => {
    const db = new NOORMME({
      dialect: 'postgresql',
      connection: {
        host: 'localhost',
        port: 5434,
        database: 'kysely_test',
        username: 'kysely',
        password: ''
      }
    })

    try {
      // Initialize the database
      await db.initialize()
      
      // Test basic query
      const result = await db.execute('SELECT version() as version')
      console.log('Query result:', result)
      
      expect(result).to.exist
      
      // Check if we can get the Kysely instance
      const kysely = db.getKysely()
      expect(kysely).to.exist
      
      // Test a simple select
      const versionResult = await kysely.selectFrom('pg_stat_activity')
        .select('version')
        .limit(1)
        .execute()
      
      console.log('Kysely result:', versionResult)
      expect(versionResult).to.be.an('array')
      
    } finally {
      // Clean up
      if (db.isInitialized()) {
        await db.close()
      }
    }
  }).timeout(15000)
})
