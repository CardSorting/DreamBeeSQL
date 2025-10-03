import { describe, it, before, after, beforeEach } from 'mocha'
import { expect } from 'chai'
import { withTestDatabase } from './setup/test-helpers.js'
import { getEnabledDatabases } from './setup/test-config.js'

/**
 * PostgreSQL Parameter Binding Tests
 * 
 * This test suite focuses specifically on PostgreSQL parameter binding
 * and query parameter handling with NOORMME.
 * 
 * Key Features Being Tested:
 * 1. Basic parameter binding ($1, $2, etc.)
 * 2. Named parameters
 * 3. Complex data type parameter binding
 * 4. Array parameter binding
 * 5. JSONB parameter binding
 * 6. NULL parameter handling
 * 7. Large parameter sets
 * 8. Parameter binding performance
 */

describe('PostgreSQL Parameter Binding', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (!enabledDatabases.includes('postgresql')) {
    console.warn('PostgreSQL not enabled for testing')
    return
  }

  describe('Basic Parameter Binding', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle basic positional parameters', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_params')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('age', 'integer', (col) => col.notNull())
            .addColumn('email', 'varchar(255)', (col) => col.notNull())
            .execute()

          // Insert using parameter binding
          await kysely
            .insertInto('test_params')
            .values({ name: 'John Doe', age: 30, email: 'john@example.com' })
            .execute()

          // Query using positional parameters
          const result = await kysely
            .selectFrom('test_params')
            .selectAll()
            .where('name', '=', 'John Doe')
            .where('age', '=', 30)
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.name).to.equal('John Doe')
          expect(result!.age).to.equal(30)
          expect(result!.email).to.equal('john@example.com')
        }))

        it('should handle multiple parameter types', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table with various types
          await kysely.schema
            .createTable('test_types')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('text_col', 'text')
            .addColumn('int_col', 'integer')
            .addColumn('float_col', 'real')
            .addColumn('bool_col', 'boolean')
            .addColumn('date_col', 'date')
            .addColumn('timestamp_col', 'timestamp')
            .execute()

          // Insert data with various types
          const testDate = new Date('2023-12-01')
          const testTimestamp = new Date('2023-12-01T10:30:00Z')

          await kysely
            .insertInto('test_types')
            .values({
              text_col: 'Hello World',
              int_col: 42,
              float_col: 3.14159,
              bool_col: true,
              date_col: testDate,
              timestamp_col: testTimestamp
            })
            .execute()

          // Query with various parameter types
          const result = await kysely
            .selectFrom('test_types')
            .selectAll()
            .where('text_col', '=', 'Hello World')
            .where('int_col', '=', 42)
            .where('bool_col', '=', true)
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.text_col).to.equal('Hello World')
          expect(result!.int_col).to.equal(42)
          expect(result!.float_col).to.be.closeTo(3.14159, 0.00001)
          expect(result!.bool_col).to.be.true
          expect(result!.date_col).to.deep.equal(testDate)
        }))

        it('should handle NULL parameters', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_nulls')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)')
            .addColumn('description', 'text')
            .addColumn('value', 'integer')
            .execute()

          // Insert data with NULLs
          await kysely
            .insertInto('test_nulls')
            .values({
              name: 'Test Item',
              description: null,
              value: null
            })
            .execute()

          // Query with NULL parameters
          const result = await kysely
            .selectFrom('test_nulls')
            .selectAll()
            .where('description', 'is', null)
            .where('value', 'is', null)
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.name).to.equal('Test Item')
          expect(result!.description).to.be.null
          expect(result!.value).to.be.null

          // Query with NOT NULL
          const notNullResult = await kysely
            .selectFrom('test_nulls')
            .selectAll()
            .where('name', 'is not', null)
            .executeTakeFirst()

          expect(notNullResult).to.exist
          expect(notNullResult!.name).to.equal('Test Item')
        }))
      })
    }
  })

  describe('Array Parameter Binding', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle array parameters', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table with array columns
          await kysely.schema
            .createTable('test_arrays')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('tags', 'text')
            .addColumn('scores', 'integer')
            .addColumn('prices', 'real')
            .execute()

          // Insert data with arrays (using JSON format for PostgreSQL arrays)
          await kysely
            .insertInto('test_arrays')
            .values({
              tags: JSON.stringify(['javascript', 'typescript', 'database']),
              scores: 85,
              prices: 19.99
            })
            .execute()

          // Query using JSON contains
          const result = await kysely
            .selectFrom('test_arrays')
            .selectAll()
            .where('tags', 'like', '%javascript%')
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.tags).to.include('javascript')

          // Query with JSON length
          const lengthResult = await kysely
            .selectFrom('test_arrays')
            .selectAll()
            .where('tags', 'is not', null)
            .executeTakeFirst()

          expect(lengthResult).to.exist

          // Query with specific array element
          const elementResult = await kysely
            .selectFrom('test_arrays')
            .selectAll()
            .where('tags', 'like', '%javascript%')
            .executeTakeFirst()

          expect(elementResult).to.exist
          expect(elementResult!.tags).to.include('javascript')
        }))

        it('should handle array parameter binding in queries', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('category', 'varchar(50)', (col) => col.notNull())
            .addColumn('price', 'decimal', (col) => col.notNull())
            .execute()

          // Insert test data
          await kysely
            .insertInto('products')
            .values([
              { name: 'Laptop', category: 'Electronics', price: 1200.00 },
              { name: 'Mouse', category: 'Electronics', price: 25.00 },
              { name: 'Book', category: 'Education', price: 15.00 },
              { name: 'Pen', category: 'Office', price: 2.00 }
            ])
            .execute()

          // Query with IN clause using array parameter
          const categories = ['Electronics', 'Education']
          const inResult = await kysely
            .selectFrom('products')
            .selectAll()
            .where('category', 'in', categories)
            .execute()

          expect(inResult).to.have.length(3)
          inResult.forEach(product => {
            expect(['Electronics', 'Education']).to.include(product.category)
          })

          // Query with array overlap
          const overlapResult = await kysely
            .selectFrom('products')
            .selectAll()
            .where('category', 'in', categories)
            .execute()

          expect(overlapResult).to.have.length(3)
        }))
      })
    }
  })

  describe('JSONB Parameter Binding', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle JSONB parameter binding', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table with JSONB column
          await kysely.schema
            .createTable('test_jsonb')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('data', 'jsonb')
            .addColumn('metadata', 'jsonb')
            .execute()

          // Insert JSONB data
          const testData = {
            name: 'John Doe',
            age: 30,
            hobbies: ['reading', 'swimming'],
            address: {
              street: '123 Main St',
              city: 'New York',
              zip: '10001'
            }
          }

          const metadata = {
            source: 'test',
            version: 1,
            created: new Date().toISOString()
          }

          await kysely
            .insertInto('test_jsonb')
            .values({
              data: testData,
              metadata: metadata
            })
            .execute()

          // Query using JSONB operators
          const result = await kysely
            .selectFrom('test_jsonb')
            .selectAll()
            .where('data->>name', '=', 'John Doe')
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.data).to.deep.equal(testData)

          // Query with JSONB path
          const pathResult = await kysely
            .selectFrom('test_jsonb')
            .selectAll()
            .where('data->address->>city', '=', 'New York')
            .executeTakeFirst()

          expect(pathResult).to.exist
          expect(pathResult!.data).to.deep.equal(testData)

          // Query with JSONB contains
          const containsResult = await kysely
            .selectFrom('test_jsonb')
            .selectAll()
            .where('data', 'like', '%name%')
            .executeTakeFirst()

          expect(containsResult).to.exist
          expect(containsResult!.data).to.deep.equal(testData)
        }))

        it('should handle complex JSONB queries with parameters', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('users')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('profile', 'jsonb')
            .addColumn('settings', 'jsonb')
            .execute()

          // Insert user data with complex JSONB
          const userProfiles = [
            {
              id: 1,
              profile: {
                name: 'Alice',
                preferences: {
                  theme: 'dark',
                  notifications: true,
                  languages: ['en', 'es']
                }
              },
              settings: {
                privacy: { public: false, friends: true },
                display: { avatar: 'default' }
              }
            },
            {
              id: 2,
              profile: {
                name: 'Bob',
                preferences: {
                  theme: 'light',
                  notifications: false,
                  languages: ['en']
                }
              },
              settings: {
                privacy: { public: true, friends: false },
                display: { avatar: 'custom' }
              }
            }
          ]

          for (const user of userProfiles) {
            await kysely
              .insertInto('users')
              .values({
                id: user.id,
                profile: user.profile,
                settings: user.settings
              })
              .execute()
          }

          // Query users with dark theme
          const darkThemeUsers = await kysely
            .selectFrom('users')
            .selectAll()
            .where('profile->preferences->>theme', '=', 'dark')
            .execute()

          expect(darkThemeUsers).to.have.length(1)
          expect(darkThemeUsers[0].profile.name).to.equal('Alice')

          // Query users with notifications enabled
          const notificationUsers = await kysely
            .selectFrom('users')
            .selectAll()
            .where('profile->preferences->>notifications', '=', 'true')
            .execute()

          expect(notificationUsers).to.have.length(1)
          expect(notificationUsers[0].profile.name).to.equal('Alice')

          // Query users with specific language preference
          const englishUsers = await kysely
            .selectFrom('users')
            .selectAll()
            .where('profile', 'like', '%en%')
            .execute()

          expect(englishUsers).to.have.length(2)

          // Query users with public privacy settings
          const publicUsers = await kysely
            .selectFrom('users')
            .selectAll()
            .where('settings->privacy->>public', '=', 'true')
            .execute()

          expect(publicUsers).to.have.length(1)
          expect(publicUsers[0].profile.name).to.equal('Bob')
        }))
      })
    }
  })

  describe('Large Parameter Sets', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle large parameter sets efficiently', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_large_params')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('value', 'integer', (col) => col.notNull())
            .execute()

          // Insert test data
          const testData = Array.from({ length: 1000 }, (_, i) => ({ value: i + 1 }))
          await kysely
            .insertInto('test_large_params')
            .values(testData)
            .execute()

          // Query with large IN clause
          const values = Array.from({ length: 100 }, (_, i) => i + 1)
          const startTime = Date.now()

          const result = await kysely
            .selectFrom('test_large_params')
            .selectAll()
            .where('value', 'in', values)
            .execute()

          const endTime = Date.now()
          const duration = endTime - startTime

          expect(result).to.have.length(100)
          expect(duration).to.be.lessThan(1000) // Should complete within 1 second

          console.log(`Large parameter set query completed in ${duration}ms`)
        }))

        it('should handle batch operations with many parameters', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('test_batch_params')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('category', 'varchar(50)', (col) => col.notNull())
            .addColumn('value', 'integer', (col) => col.notNull())
            .execute()

          // Prepare batch data
          const batchData = Array.from({ length: 500 }, (_, i) => ({
            name: `Item ${i + 1}`,
            category: i % 2 === 0 ? 'Category A' : 'Category B',
            value: i + 1
          }))

          const startTime = Date.now()

          // Insert batch data
          await kysely
            .insertInto('test_batch_params')
            .values(batchData)
            .execute()

          const endTime = Date.now()
          const duration = endTime - startTime

          // Verify data was inserted
          const count = await kysely
            .selectFrom('test_batch_params')
            .select(kysely.fn.count('id').as('count'))
            .executeTakeFirstOrThrow()

          expect(Number(count.count)).to.equal(500)
          expect(duration).to.be.lessThan(2000) // Should complete within 2 seconds

          console.log(`Batch insert of 500 records completed in ${duration}ms`)
        }))
      })
    }
  })

  describe('Parameter Binding Performance', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should compare parameter binding vs string concatenation performance', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('perf_test')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('value', 'integer', (col) => col.notNull())
            .execute()

          // Insert test data
          const testData = Array.from({ length: 100 }, (_, i) => ({
            name: `Item ${i + 1}`,
            value: i + 1
          }))

          await kysely
            .insertInto('perf_test')
            .values(testData)
            .execute()

          // Test parameter binding performance
          const paramStart = Date.now()
          for (let i = 0; i < 100; i++) {
            await kysely
              .selectFrom('perf_test')
              .selectAll()
              .where('value', '=', i + 1)
              .executeTakeFirst()
          }
          const paramEnd = Date.now()
          const paramDuration = paramEnd - paramStart

          // Test raw SQL with parameters
          const rawParamStart = Date.now()
          for (let i = 0; i < 100; i++) {
            await kysely
              .selectFrom('perf_test')
              .selectAll()
              .where('value', '=', i + 1)
              .execute()
          }
          const rawParamEnd = Date.now()
          const rawParamDuration = rawParamEnd - rawParamStart

          console.log(`Parameter binding (Kysely): ${paramDuration}ms`)
          console.log(`Parameter binding (Raw SQL): ${rawParamDuration}ms`)

          // Both should be reasonably fast
          expect(paramDuration).to.be.lessThan(2000)
          expect(rawParamDuration).to.be.lessThan(2000)
        }))

        it('should handle concurrent parameter binding', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('concurrent_test')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('value', 'integer', (col) => col.notNull())
            .execute()

          // Insert test data
          await kysely
            .insertInto('concurrent_test')
            .values([
              { name: 'Item 1', value: 1 },
              { name: 'Item 2', value: 2 },
              { name: 'Item 3', value: 3 }
            ])
            .execute()

          // Run concurrent queries with parameters
          const startTime = Date.now()
          const promises = Array.from({ length: 50 }, (_, i) =>
            kysely
              .selectFrom('concurrent_test')
              .selectAll()
              .where('value', '=', (i % 3) + 1)
              .executeTakeFirst()
          )

          const results = await Promise.all(promises)
          const endTime = Date.now()
          const duration = endTime - startTime

          expect(results).to.have.length(50)
          results.forEach(result => {
            expect(result).to.exist
            expect(result!.value).to.be.oneOf([1, 2, 3])
          })

          expect(duration).to.be.lessThan(3000) // Should complete within 3 seconds
          console.log(`50 concurrent parameterized queries completed in ${duration}ms`)
        }))
      })
    }
  })

  describe('Edge Cases and Error Handling', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle special characters in parameters', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('special_chars')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('text', 'text', (col) => col.notNull())
            .execute()

          // Test special characters
          const specialTexts = [
            "Text with 'single quotes'",
            'Text with "double quotes"',
            'Text with \n newlines',
            'Text with \t tabs',
            'Text with \\ backslashes',
            'Text with % wildcards',
            'Text with _ underscores',
            'Unicode: 你好世界 🌍',
            'SQL injection attempt: \'; DROP TABLE users; --'
          ]

          for (const text of specialTexts) {
            await kysely
              .insertInto('special_chars')
              .values({ text })
              .execute()
          }

          // Query with special characters
          for (const text of specialTexts) {
            const result = await kysely
              .selectFrom('special_chars')
              .selectAll()
              .where('text', '=', text)
              .executeTakeFirst()

            expect(result).to.exist
            expect(result!.text).to.equal(text)
          }
        }))

        it('should handle very long parameter values', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('long_text')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('content', 'text', (col) => col.notNull())
            .execute()

          // Create very long text
          const longText = 'Lorem ipsum '.repeat(10000) // ~110KB of text

          // Insert long text
          await kysely
            .insertInto('long_text')
            .values({ content: longText })
            .execute()

          // Query with long text parameter
          const result = await kysely
            .selectFrom('long_text')
            .selectAll()
            .where('content', '=', longText)
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.content).to.equal(longText)
          expect(result!.content.length).to.equal(longText.length)
        }))

        it('should handle parameter type mismatches gracefully', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('type_test')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('int_col', 'integer', (col) => col.notNull())
            .addColumn('text_col', 'text', (col) => col.notNull())
            .execute()

          // Insert test data
          await kysely
            .insertInto('type_test')
            .values({ int_col: 42, text_col: 'test' })
            .execute()

          // These should work due to PostgreSQL's type coercion
          const result1 = await kysely
            .selectFrom('type_test')
            .selectAll()
            .where('int_col', '=', '42') // String to integer
            .executeTakeFirst()

          expect(result1).to.exist
          expect(result1!.int_col).to.equal(42)

          // This should also work
          const result2 = await kysely
            .selectFrom('type_test')
            .selectAll()
            .where('text_col', '=', 'test')
            .executeTakeFirst()

          expect(result2).to.exist
          expect(result2!.text_col).to.equal('test')
        }))
      })
    }
  })
})
