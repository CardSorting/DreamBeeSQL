import { describe, it, before, after, beforeEach } from 'mocha'
import { expect } from 'chai'
import { withTestDatabase } from './setup/test-helpers.js'
import { getEnabledDatabases } from './setup/test-config.js'

/**
 * PostgreSQL Syntax Compatibility Tests
 * 
 * This test suite focuses specifically on PostgreSQL syntax features
 * and compatibility with NOORMME.
 * 
 * Key Features Being Tested:
 * 1. PostgreSQL-specific data types (SERIAL, BIGSERIAL, JSONB, etc.)
 * 2. Advanced SQL features (arrays, window functions, CTEs)
 * 3. PostgreSQL-specific functions and operators
 * 4. Schema and namespace handling
 * 5. Advanced indexing features
 */

describe('PostgreSQL Syntax Compatibility', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (!enabledDatabases.includes('postgresql')) {
    console.warn('PostgreSQL not enabled for testing')
    return
  }

  describe('PostgreSQL Data Types', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support SERIAL and BIGSERIAL types', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with SERIAL primary key
          await kysely.schema
            .createTable('test_serial')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
            .execute()

          // Create table with BIGSERIAL primary key
          await kysely.schema
            .createTable('test_bigserial')
            .ifNotExists()
            .addColumn('id', 'bigserial', (col) => col.primaryKey())
            .addColumn('description', 'text')
            .execute()

          // Insert data and verify auto-increment
          await kysely
            .insertInto('test_serial')
            .values({ name: 'Test 1' })
            .execute()

          await kysely
            .insertInto('test_serial')
            .values({ name: 'Test 2' })
            .execute()

          const results = await kysely
            .selectFrom('test_serial')
            .selectAll()
            .execute()

          expect(results).to.have.length(2)
          expect(results[0].id).to.equal(1)
          expect(results[1].id).to.equal(2)
        }))

        it('should support JSONB data type', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with JSONB column
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

          await kysely
            .insertInto('test_jsonb')
            .values({
              data: testData,
              metadata: { source: 'test', version: 1 }
            })
            .execute()

          // Query JSONB data
          const result = await kysely
            .selectFrom('test_jsonb')
            .selectAll()
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.data).to.deep.equal(testData)
          expect(result!.metadata).to.deep.equal({ source: 'test', version: 1 })
        }))

        it('should support array data types', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with array columns
          await kysely.schema
            .createTable('test_arrays')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('tags', 'text[]')
            .addColumn('scores', 'integer[]')
            .addColumn('coordinates', 'real[]')
            .execute()

          // Insert array data
          await kysely
            .insertInto('test_arrays')
            .values({
              tags: ['javascript', 'typescript', 'database'],
              scores: [85, 92, 78, 96],
              coordinates: [40.7128, -74.0060]
            })
            .execute()

          // Query array data
          const result = await kysely
            .selectFrom('test_arrays')
            .selectAll()
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.tags).to.deep.equal(['javascript', 'typescript', 'database'])
          expect(result!.scores).to.deep.equal([85, 92, 78, 96])
          expect(result!.coordinates).to.deep.equal([40.7128, -74.0060])
        }))

        it('should support UUID data type', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with UUID column
          await kysely.schema
            .createTable('test_uuid')
            .ifNotExists()
            .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo('gen_random_uuid()'))
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Insert data (UUID will be auto-generated)
          await kysely
            .insertInto('test_uuid')
            .values({ name: 'Test User' })
            .execute()

          const result = await kysely
            .selectFrom('test_uuid')
            .selectAll()
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.name).to.equal('Test User')
          expect(result!.id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        }))
      })
    }
  })

  describe('Advanced SQL Features', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support Common Table Expressions (CTEs)', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test tables
          await kysely.schema
            .createTable('employees')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('manager_id', 'integer')
            .addColumn('salary', 'decimal(10,2)')
            .execute()

          // Insert test data
          await kysely
            .insertInto('employees')
            .values([
              { name: 'CEO', manager_id: null, salary: 200000 },
              { name: 'VP Engineering', manager_id: 1, salary: 150000 },
              { name: 'VP Marketing', manager_id: 1, salary: 140000 },
              { name: 'Senior Engineer', manager_id: 2, salary: 120000 },
              { name: 'Marketing Manager', manager_id: 3, salary: 100000 }
            ])
            .execute()

          // Use CTE to find hierarchy
          const result = await kysely
            .with('employee_hierarchy', (db) =>
              db
                .selectFrom('employees')
                .select(['id', 'name', 'manager_id', 'salary'])
                .where('manager_id', 'is', null)
                .unionAll(
                  db
                    .selectFrom(['employees as e', 'employee_hierarchy as eh'])
                    .select(['e.id', 'e.name', 'e.manager_id', 'e.salary'])
                    .whereRef('e.manager_id', '=', 'eh.id')
                )
            )
            .selectFrom('employee_hierarchy')
            .selectAll()
            .execute()

          expect(result).to.have.length(5)
        }))

        it('should support window functions', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('sales')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('product', 'varchar(100)', (col) => col.notNull())
            .addColumn('amount', 'decimal(10,2)', (col) => col.notNull())
            .addColumn('sale_date', 'date', (col) => col.notNull())
            .execute()

          // Insert test data
          await kysely
            .insertInto('sales')
            .values([
              { product: 'Laptop', amount: 1200.00, sale_date: '2023-01-15' },
              { product: 'Mouse', amount: 25.00, sale_date: '2023-01-15' },
              { product: 'Keyboard', amount: 75.00, sale_date: '2023-01-16' },
              { product: 'Laptop', amount: 1100.00, sale_date: '2023-01-16' },
              { product: 'Monitor', amount: 300.00, sale_date: '2023-01-17' }
            ])
            .execute()

          // Use window functions
          const result = await kysely
            .selectFrom('sales')
            .select([
              'product',
              'amount',
              'sale_date',
              kysely.fn.rank().over(
                kysely.window().partitionBy('product').orderBy('amount', 'desc')
              ).as('rank_by_product'),
              kysely.fn.sum('amount').over(
                kysely.window().partitionBy('sale_date')
              ).as('daily_total')
            ])
            .execute()

          expect(result).to.have.length(5)
          
          // Check that ranking worked
          const laptopSales = result.filter(r => r.product === 'Laptop')
          expect(laptopSales).to.have.length(2)
          expect(laptopSales[0].rank_by_product).to.equal(1) // Higher amount should rank first
          expect(laptopSales[1].rank_by_product).to.equal(2)
        }))

        it('should support lateral joins', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test tables
          await kysely.schema
            .createTable('departments')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          await kysely.schema
            .createTable('employees')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('department_id', 'integer', (col) => col.references('departments.id'))
            .addColumn('salary', 'decimal(10,2)')
            .execute()

          // Insert test data
          await kysely
            .insertInto('departments')
            .values([
              { name: 'Engineering' },
              { name: 'Marketing' }
            ])
            .execute()

          await kysely
            .insertInto('employees')
            .values([
              { name: 'Alice', department_id: 1, salary: 100000 },
              { name: 'Bob', department_id: 1, salary: 120000 },
              { name: 'Charlie', department_id: 2, salary: 90000 },
              { name: 'Diana', department_id: 2, salary: 110000 }
            ])
            .execute()

          // Use lateral join to find top employee in each department
          const result = await kysely
            .selectFrom('departments as d')
            .leftJoinLateral(
              (eb) =>
                eb
                  .selectFrom('employees as e')
                  .select(['e.name', 'e.salary'])
                  .whereRef('e.department_id', '=', 'd.id')
                  .orderBy('e.salary', 'desc')
                  .limit(1),
              'top_employee'
            )
            .select([
              'd.name as department_name',
              'top_employee.name as top_employee_name',
              'top_employee.salary as top_salary'
            ])
            .execute()

          expect(result).to.have.length(2)
          
          const engineeringDept = result.find(r => r.department_name === 'Engineering')
          expect(engineeringDept).to.exist
          expect(engineeringDept!.top_employee_name).to.equal('Bob')
          expect(engineeringDept!.top_salary).to.equal('120000.00')
        }))
      })
    }
  })

  describe('PostgreSQL Functions and Operators', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support JSONB operators', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with JSONB
          await kysely.schema
            .createTable('test_jsonb_ops')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('data', 'jsonb')
            .execute()

          // Insert test data
          await kysely
            .insertInto('test_jsonb_ops')
            .values([
              { data: { name: 'John', age: 30, city: 'New York' } },
              { data: { name: 'Jane', age: 25, city: 'Boston' } },
              { data: { name: 'Bob', age: 35, city: 'New York' } }
            ])
            .execute()

          // Test JSONB operators
          const result1 = await kysely
            .selectFrom('test_jsonb_ops')
            .select(['id', 'data'])
            .where('data->city', '=', 'New York')
            .execute()

          expect(result1).to.have.length(2)

          const result2 = await kysely
            .selectFrom('test_jsonb_ops')
            .select(['id', 'data'])
            .where('data->>age', '>', '25')
            .execute()

          expect(result2).to.have.length(2)

          const result3 = await kysely
            .selectFrom('test_jsonb_ops')
            .select(['id', 'data'])
            .where('data ?', 'name')
            .execute()

          expect(result3).to.have.length(3)
        }))

        it('should support array operators', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with arrays
          await kysely.schema
            .createTable('test_array_ops')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('tags', 'text[]')
            .execute()

          // Insert test data
          await kysely
            .insertInto('test_array_ops')
            .values([
              { tags: ['javascript', 'typescript', 'nodejs'] },
              { tags: ['python', 'django', 'postgresql'] },
              { tags: ['javascript', 'react', 'web'] }
            ])
            .execute()

          // Test array operators
          const result1 = await kysely
            .selectFrom('test_array_ops')
            .selectAll()
            .where('tags', '@>', ['javascript'])
            .execute()

          expect(result1).to.have.length(2)

          const result2 = await kysely
            .selectFrom('test_array_ops')
            .selectAll()
            .where('tags', '<@', ['javascript', 'typescript', 'nodejs', 'python'])
            .execute()

          expect(result2).to.have.length(2)

          const result3 = await kysely
            .selectFrom('test_array_ops')
            .selectAll()
            .where('tags', '&&', ['python', 'java'])
            .execute()

          expect(result3).to.have.length(1)
        }))

        it('should support full-text search', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with full-text search
          await kysely.schema
            .createTable('articles')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('title', 'varchar(200)', (col) => col.notNull())
            .addColumn('content', 'text', (col) => col.notNull())
            .addColumn('search_vector', 'tsvector')
            .execute()

          // Insert test data
          await kysely
            .insertInto('articles')
            .values([
              { 
                title: 'Introduction to PostgreSQL', 
                content: 'PostgreSQL is a powerful open source database system',
                search_vector: kysely.raw('to_tsvector(?)', ['Introduction to PostgreSQL PostgreSQL is a powerful open source database system'])
              },
              { 
                title: 'Advanced SQL Techniques', 
                content: 'Learn advanced SQL features like window functions and CTEs',
                search_vector: kysely.raw('to_tsvector(?)', ['Advanced SQL Techniques Learn advanced SQL features like window functions and CTEs'])
              }
            ])
            .execute()

          // Create GIN index for full-text search
          await kysely.schema
            .createIndex('idx_articles_search')
            .on('articles')
            .using('gin')
            .column('search_vector')
            .execute()

          // Test full-text search
          const result = await kysely
            .selectFrom('articles')
            .select(['title', 'content'])
            .where('search_vector', '@@', kysely.raw('plainto_tsquery(?)', ['PostgreSQL database']))
            .execute()

          expect(result).to.have.length(1)
          expect(result[0].title).to.equal('Introduction to PostgreSQL')
        }))
      })
    }
  })

  describe('Schema and Namespace Features', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support multiple schemas', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create custom schema
          await kysely.schema
            .createSchema('test_schema')
            .ifNotExists()
            .execute()

          // Create table in custom schema
          await kysely.schema
            .createTable('test_schema.customers')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
            .execute()

          // Insert data into schema table
          await kysely
            .insertInto('test_schema.customers')
            .values({ name: 'John Doe', email: 'john@example.com' })
            .execute()

          // Query from schema table
          const result = await kysely
            .selectFrom('test_schema.customers')
            .selectAll()
            .execute()

          expect(result).to.have.length(1)
          expect(result[0].name).to.equal('John Doe')

          // Clean up schema
          await kysely.schema
            .dropSchema('test_schema')
            .ifExists()
            .cascade()
            .execute()
        }))

        it('should support custom types and domains', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create custom type
          await kysely.raw('CREATE TYPE mood AS ENUM (\'sad\', \'ok\', \'happy\')').execute()

          // Create custom domain
          await kysely.raw('CREATE DOMAIN positive_int AS INTEGER CHECK (VALUE > 0)').execute()

          // Create table using custom types
          await kysely.schema
            .createTable('test_custom_types')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('current_mood', 'mood')
            .addColumn('score', 'positive_int')
            .execute()

          // Insert data using custom types
          await kysely
            .insertInto('test_custom_types')
            .values([
              { name: 'Alice', current_mood: 'happy', score: 95 },
              { name: 'Bob', current_mood: 'ok', score: 75 },
              { name: 'Charlie', current_mood: 'sad', score: 45 }
            ])
            .execute()

          // Query using custom types
          const result = await kysely
            .selectFrom('test_custom_types')
            .selectAll()
            .where('current_mood', '=', 'happy')
            .execute()

          expect(result).to.have.length(1)
          expect(result[0].name).to.equal('Alice')
          expect(result[0].current_mood).to.equal('happy')

          // Test domain constraint
          await expect(
            kysely
              .insertInto('test_custom_types')
              .values({ name: 'Invalid', current_mood: 'ok', score: -10 })
              .execute()
          ).to.be.rejected

          // Clean up custom types
          await kysely.schema
            .dropTable('test_custom_types')
            .ifExists()
            .execute()

          await kysely.raw('DROP DOMAIN positive_int').execute()
          await kysely.raw('DROP TYPE mood').execute()
        }))
      })
    }
  })

  describe('Advanced Indexing Features', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support partial indexes', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table
          await kysely.schema
            .createTable('orders')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('customer_id', 'integer', (col) => col.notNull())
            .addColumn('amount', 'decimal(10,2)', (col) => col.notNull())
            .addColumn('status', 'varchar(20)', (col) => col.notNull())
            .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
            .execute()

          // Insert test data
          await kysely
            .insertInto('orders')
            .values([
              { customer_id: 1, amount: 100.00, status: 'completed' },
              { customer_id: 2, amount: 250.00, status: 'pending' },
              { customer_id: 1, amount: 75.00, status: 'completed' },
              { customer_id: 3, amount: 300.00, status: 'cancelled' },
              { customer_id: 2, amount: 150.00, status: 'completed' }
            ])
            .execute()

          // Create partial index on completed orders only
          await kysely.schema
            .createIndex('idx_completed_orders_customer')
            .on('orders')
            .column('customer_id')
            .where('status', '=', 'completed')
            .execute()

          // Query should use partial index
          const result = await kysely
            .selectFrom('orders')
            .selectAll()
            .where('status', '=', 'completed')
            .where('customer_id', '=', 1)
            .execute()

          expect(result).to.have.length(2)
        }))

        it('should support expression indexes', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('price', 'decimal(10,2)', (col) => col.notNull())
            .execute()

          // Insert test data
          await kysely
            .insertInto('products')
            .values([
              { name: 'Laptop', price: 1200.00 },
              { name: 'Mouse', price: 25.00 },
              { name: 'Keyboard', price: 75.00 },
              { name: 'Monitor', price: 300.00 }
            ])
            .execute()

          // Create expression index on upper case name
          await kysely.schema
            .createIndex('idx_products_name_upper')
            .on('products')
            .expression('UPPER(name)')
            .execute()

          // Query using expression index
          const result = await kysely
            .selectFrom('products')
            .selectAll()
            .where('name', 'ilike', 'laptop')
            .execute()

          expect(result).to.have.length(1)
          expect(result[0].name).to.equal('Laptop')
        }))

        it('should support composite indexes with different sort orders', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table
          await kysely.schema
            .createTable('events')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('event_type', 'varchar(50)', (col) => col.notNull())
            .addColumn('timestamp', 'timestamp', (col) => col.notNull())
            .addColumn('priority', 'integer', (col) => col.notNull())
            .execute()

          // Insert test data
          const now = new Date()
          await kysely
            .insertInto('events')
            .values([
              { event_type: 'login', timestamp: new Date(now.getTime() - 3600000), priority: 1 },
              { event_type: 'error', timestamp: new Date(now.getTime() - 1800000), priority: 3 },
              { event_type: 'login', timestamp: new Date(now.getTime() - 900000), priority: 1 },
              { event_type: 'warning', timestamp: new Date(now.getTime() - 450000), priority: 2 }
            ])
            .execute()

          // Create composite index with different sort orders
          await kysely.schema
            .createIndex('idx_events_type_priority_desc')
            .on('events')
            .column('event_type')
            .column('priority', 'desc')
            .execute()

          // Query using composite index
          const result = await kysely
            .selectFrom('events')
            .selectAll()
            .where('event_type', '=', 'login')
            .orderBy('priority', 'desc')
            .execute()

          expect(result).to.have.length(2)
          expect(result[0].priority).to.equal(1) // Should be ordered by priority desc
          expect(result[1].priority).to.equal(1)
        }))
      })
    }
  })

  describe('PostgreSQL Extensions', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support UUID extension', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Enable UUID extension
          await kysely.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"').execute()

          // Create table using UUID functions
          await kysely.schema
            .createTable('test_uuid_ext')
            .ifNotExists()
            .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(kysely.raw('uuid_generate_v4()')))
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Insert data (UUID will be auto-generated)
          await kysely
            .insertInto('test_uuid_ext')
            .values({ name: 'Test User' })
            .execute()

          const result = await kysely
            .selectFrom('test_uuid_ext')
            .selectAll()
            .executeTakeFirst()

          expect(result).to.exist
          expect(result!.name).to.equal('Test User')
          expect(result!.id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        }))

        it('should support hstore extension', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Enable hstore extension
          await kysely.raw('CREATE EXTENSION IF NOT EXISTS hstore').execute()

          // Create table with hstore column
          await kysely.schema
            .createTable('test_hstore')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('properties', 'hstore')
            .execute()

          // Insert data with hstore
          await kysely
            .insertInto('test_hstore')
            .values({ 
              properties: kysely.raw('hstore(?, ?)', ['color', 'red']) 
            })
            .execute()

          // Query using hstore operators
          const result = await kysely
            .selectFrom('test_hstore')
            .selectAll()
            .where('properties->color', '=', 'red')
            .execute()

          expect(result).to.have.length(1)
          expect(result[0].properties).to.include('color => red')
        }))
      })
    }
  })
})
