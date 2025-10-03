import { describe, it, before, after, beforeEach } from 'mocha'
import { expect } from 'chai'
import { withTestDatabase } from './setup/test-helpers.js'
import { getEnabledDatabases } from './setup/test-config.js'

/**
 * PostgreSQL Database Introspection Tests
 * 
 * This test suite focuses specifically on PostgreSQL database introspection
 * features and their compatibility with NOORMME.
 * 
 * Key Features Being Tested:
 * 1. Schema discovery and metadata retrieval
 * 2. Table structure introspection
 * 3. Column information and data types
 * 4. Index and constraint discovery
 * 5. Foreign key relationship discovery
 * 6. Custom types and domains
 */

describe('PostgreSQL Database Introspection', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (!enabledDatabases.includes('postgresql')) {
    console.warn('PostgreSQL not enabled for testing')
    return
  }

  describe('Schema Discovery', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should discover database schemas', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create custom schema
          await kysely.schema
            .createSchema('test_schema')
            .ifNotExists()
            .execute()

          // Create another custom schema
          await kysely.schema
            .createSchema('app_schema')
            .ifNotExists()
            .execute()

          // Query available schemas
          const schemas = await kysely
            .selectFrom('information_schema.schemata')
            .select('schema_name')
            .where('schema_name', 'not in', ['information_schema', 'pg_catalog', 'pg_toast'])
            .orderBy('schema_name')
            .execute()

          const schemaNames = schemas.map(s => s.schema_name)
          expect(schemaNames).to.include('app_schema')
          expect(schemaNames).to.include('public')
          expect(schemaNames).to.include('test_schema')

          // Clean up
          await kysely.schema
            .dropSchema('test_schema')
            .ifExists()
            .cascade()
            .execute()

          await kysely.schema
            .dropSchema('app_schema')
            .ifExists()
            .cascade()
            .execute()
        }))

        it('should query table information from information_schema', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test tables
          await kysely.schema
            .createTable('test_table1')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          await kysely.schema
            .createTable('test_table2')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('description', 'text')
            .execute()

          // Query table information
          const tables = await kysely
            .selectFrom('information_schema.tables')
            .select(['table_name', 'table_schema', 'table_type'])
            .where('table_schema', '=', 'public')
            .where('table_type', '=', 'BASE TABLE')
            .orderBy('table_name')
            .execute()

          const tableNames = tables.map(t => t.table_name)
          expect(tableNames).to.include('test_table1')
          expect(tableNames).to.include('test_table2')
        }))
      })
    }
  })

  describe('Column Information Discovery', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should discover column information and data types', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with various column types
          await kysely.schema
            .createTable('test_columns')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('email', 'varchar(255)', (col) => col.unique())
            .addColumn('age', 'integer')
            .addColumn('salary', 'decimal(10,2)', (col) => col.defaultTo(0))
            .addColumn('is_active', 'boolean', (col) => col.defaultTo(true))
            .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
            .addColumn('data', 'jsonb')
            .addColumn('tags', 'text[]')
            .execute()

          // Query column information
          const columns = await kysely
            .selectFrom('information_schema.columns')
            .select([
              'column_name',
              'data_type',
              'is_nullable',
              'column_default',
              'character_maximum_length',
              'numeric_precision',
              'numeric_scale'
            ])
            .where('table_schema', '=', 'public')
            .where('table_name', '=', 'test_columns')
            .orderBy('ordinal_position')
            .execute()

          expect(columns).to.have.length(9)

          // Check specific columns
          const idColumn = columns.find(c => c.column_name === 'id')
          expect(idColumn).to.exist
          expect(idColumn!.data_type).to.equal('integer')
          expect(idColumn!.is_nullable).to.equal('NO')

          const nameColumn = columns.find(c => c.column_name === 'name')
          expect(nameColumn).to.exist
          expect(nameColumn!.data_type).to.equal('character varying')
          expect(nameColumn!.character_maximum_length).to.equal(100)

          const salaryColumn = columns.find(c => c.column_name === 'salary')
          expect(salaryColumn).to.exist
          expect(salaryColumn!.data_type).to.equal('numeric')
          expect(salaryColumn!.numeric_precision).to.equal(10)
          expect(salaryColumn!.numeric_scale).to.equal(2)

          const jsonbColumn = columns.find(c => c.column_name === 'data')
          expect(jsonbColumn).to.exist
          expect(jsonbColumn!.data_type).to.equal('jsonb')
        }))

        it('should discover auto-incrementing columns', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with SERIAL columns
          await kysely.schema
            .createTable('test_auto_increment')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('big_id', 'bigserial')
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Query for auto-incrementing columns using pg_get_serial_sequence
          const autoIncrementColumns = await kysely
            .selectFrom('pg_catalog.pg_attribute as a')
            .innerJoin('pg_catalog.pg_class as c', 'a.attrelid', 'c.oid')
            .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
            .select([
              'a.attname as column_name',
              kysely.raw('pg_get_serial_sequence(quote_ident(ns.nspname) || \'.\' || quote_ident(c.relname), a.attname)').as('sequence_name')
            ])
            .where('c.relname', '=', 'test_auto_increment')
            .where('ns.nspname', '=', 'public')
            .where('a.attnum', '>', 0)
            .where('a.attisdropped', '=', false)
            .execute()

          expect(autoIncrementColumns).to.have.length(2)
          
          const idColumn = autoIncrementColumns.find(c => c.column_name === 'id')
          expect(idColumn).to.exist
          expect(idColumn!.sequence_name).to.not.be.null

          const bigIdColumn = autoIncrementColumns.find(c => c.column_name === 'big_id')
          expect(bigIdColumn).to.exist
          expect(bigIdColumn!.sequence_name).to.not.be.null
        }))
      })
    }
  })

  describe('Index Discovery', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should discover table indexes', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with various indexes
          await kysely.schema
            .createTable('test_indexes')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('email', 'varchar(255)', (col) => col.unique())
            .addColumn('status', 'varchar(20)', (col) => col.notNull())
            .execute()

          // Create additional indexes
          await kysely.schema
            .createIndex('idx_test_indexes_name')
            .on('test_indexes')
            .column('name')
            .execute()

          await kysely.schema
            .createIndex('idx_test_indexes_status_partial')
            .on('test_indexes')
            .column('status')
            .where('status', '=', 'active')
            .execute()

          // Query index information
          const indexes = await kysely
            .selectFrom('pg_catalog.pg_indexes')
            .select(['indexname', 'tablename', 'indexdef'])
            .where('schemaname', '=', 'public')
            .where('tablename', '=', 'test_indexes')
            .execute()

          expect(indexes.length).to.be.greaterThan(0)

          const indexNames = indexes.map(i => i.indexname)
          expect(indexNames).to.include('idx_test_indexes_name')
          expect(indexNames).to.include('idx_test_indexes_status_partial')
          expect(indexNames).to.include('test_indexes_email_key') // Unique constraint index
          expect(indexNames).to.include('test_indexes_pkey') // Primary key index
        }))

        it('should discover index columns and properties', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with composite index
          await kysely.schema
            .createTable('test_composite_index')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('category', 'varchar(50)', (col) => col.notNull())
            .addColumn('priority', 'integer', (col) => col.notNull())
            .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
            .execute()

          // Create composite index with different sort orders
          await kysely.schema
            .createIndex('idx_category_priority_desc')
            .on('test_composite_index')
            .column('category')
            .column('priority', 'desc')
            .execute()

          // Query detailed index information
          const indexDetails = await kysely
            .selectFrom('pg_catalog.pg_index as i')
            .innerJoin('pg_catalog.pg_class as c', 'i.indexrelid', 'c.oid')
            .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
            .innerJoin('pg_catalog.pg_class as t', 'i.indrelid', 't.oid')
            .select([
              'c.relname as index_name',
              't.relname as table_name',
              'i.indisunique as is_unique',
              'i.indisprimary as is_primary',
              'i.indkey as column_positions'
            ])
            .where('ns.nspname', '=', 'public')
            .where('t.relname', '=', 'test_composite_index')
            .execute()

          expect(indexDetails.length).to.be.greaterThan(0)

          const compositeIndex = indexDetails.find(idx => idx.index_name === 'idx_category_priority_desc')
          expect(compositeIndex).to.exist
          expect(compositeIndex!.is_unique).to.be.false
          expect(compositeIndex!.is_primary).to.be.false
        }))
      })
    }
  })

  describe('Constraint Discovery', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should discover foreign key constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create parent table
          await kysely.schema
            .createTable('categories')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Create child table with foreign key
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('category_id', 'integer', (col) => col.references('categories.id').onDelete('cascade'))
            .execute()

          // Query foreign key information
          const foreignKeys = await kysely
            .selectFrom('information_schema.table_constraints as tc')
            .innerJoin('information_schema.key_column_usage as kcu', 'tc.constraint_name', 'kcu.constraint_name')
            .innerJoin('information_schema.constraint_column_usage as ccu', 'tc.constraint_name', 'ccu.constraint_name')
            .select([
              'tc.constraint_name',
              'tc.table_name',
              'kcu.column_name',
              'ccu.table_name as foreign_table_name',
              'ccu.column_name as foreign_column_name',
              'tc.constraint_type'
            ])
            .where('tc.constraint_type', '=', 'FOREIGN KEY')
            .where('tc.table_schema', '=', 'public')
            .execute()

          expect(foreignKeys.length).to.be.greaterThan(0)

          const productFk = foreignKeys.find(fk => fk.table_name === 'products')
          expect(productFk).to.exist
          expect(productFk!.column_name).to.equal('category_id')
          expect(productFk!.foreign_table_name).to.equal('categories')
          expect(productFk!.foreign_column_name).to.equal('id')
        }))

        it('should discover check constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with check constraints
          await kysely.schema
            .createTable('test_checks')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('age', 'integer', (col) => col.notNull())
            .addColumn('salary', 'decimal(10,2)', (col) => col.notNull())
            .addCheckConstraint('test_checks_age_valid', 'age >= 18 AND age <= 65')
            .addCheckConstraint('test_checks_salary_positive', 'salary > 0')
            .execute()

          // Query check constraint information
          const checkConstraints = await kysely
            .selectFrom('information_schema.table_constraints')
            .select(['constraint_name', 'table_name', 'check_clause'])
            .where('constraint_type', '=', 'CHECK')
            .where('table_schema', '=', 'public')
            .where('table_name', '=', 'test_checks')
            .execute()

          expect(checkConstraints).to.have.length(2)

          const ageCheck = checkConstraints.find(c => c.constraint_name === 'test_checks_age_valid')
          expect(ageCheck).to.exist

          const salaryCheck = checkConstraints.find(c => c.constraint_name === 'test_checks_salary_positive')
          expect(salaryCheck).to.exist
        }))

        it('should discover unique constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with unique constraints
          await kysely.schema
            .createTable('test_unique')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('username', 'varchar(50)', (col) => col.notNull().unique())
            .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
            .addColumn('department', 'varchar(50)', (col) => col.notNull())
            .addColumn('employee_id', 'varchar(20)', (col) => col.notNull())
            .addUniqueConstraint('test_unique_dept_emp', ['department', 'employee_id'])
            .execute()

          // Query unique constraint information
          const uniqueConstraints = await kysely
            .selectFrom('information_schema.table_constraints')
            .select(['constraint_name', 'table_name', 'constraint_type'])
            .where('constraint_type', '=', 'UNIQUE')
            .where('table_schema', '=', 'public')
            .where('table_name', '=', 'test_unique')
            .execute()

          expect(uniqueConstraints).to.have.length(3) // username, email, and composite

          const constraintNames = uniqueConstraints.map(c => c.constraint_name)
          expect(constraintNames).to.include('test_unique_username_key')
          expect(constraintNames).to.include('test_unique_email_key')
          expect(constraintNames).to.include('test_unique_dept_emp')
        }))
      })
    }
  })

  describe('Custom Types and Domains', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should discover custom enum types', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create custom enum type
          await kysely.raw('CREATE TYPE order_status AS ENUM (\'pending\', \'processing\', \'shipped\', \'delivered\', \'cancelled\')').execute()

          // Create table using the custom type
          await kysely.schema
            .createTable('orders')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('order_number', 'varchar(20)', (col) => col.notNull())
            .addColumn('status', 'order_status', (col) => col.notNull())
            .execute()

          // Query custom type information
          const customTypes = await kysely
            .selectFrom('pg_catalog.pg_type as t')
            .innerJoin('pg_catalog.pg_namespace as ns', 't.typnamespace', 'ns.oid')
            .select([
              't.typname as type_name',
              't.typtype as type_type',
              'ns.nspname as schema_name'
            ])
            .where('ns.nspname', '=', 'public')
            .where('t.typname', '=', 'order_status')
            .execute()

          expect(customTypes).to.have.length(1)
          expect(customTypes[0].type_name).to.equal('order_status')
          expect(customTypes[0].type_type).to.equal('e') // enum type

          // Query enum values
          const enumValues = await kysely
            .selectFrom('pg_catalog.pg_enum')
            .select(['enumlabel'])
            .orderBy('enumsortorder')
            .execute()

          expect(enumValues).to.have.length(5)
          const values = enumValues.map(v => v.enumlabel)
          expect(values).to.deep.equal(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])

          // Clean up
          await kysely.schema
            .dropTable('orders')
            .ifExists()
            .execute()

          await kysely.raw('DROP TYPE order_status').execute()
        }))

        it('should discover custom domains', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create custom domain
          await kysely.raw('CREATE DOMAIN positive_integer AS INTEGER CHECK (VALUE > 0)').execute()

          // Create table using the custom domain
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('quantity', 'positive_integer', (col) => col.notNull())
            .execute()

          // Query custom domain information
          const customDomains = await kysely
            .selectFrom('pg_catalog.pg_type as t')
            .innerJoin('pg_catalog.pg_namespace as ns', 't.typnamespace', 'ns.oid')
            .select([
              't.typname as domain_name',
              't.typtype as type_type',
              'ns.nspname as schema_name'
            ])
            .where('ns.nspname', '=', 'public')
            .where('t.typname', '=', 'positive_integer')
            .execute()

          expect(customDomains).to.have.length(1)
          expect(customDomains[0].domain_name).to.equal('positive_integer')
          expect(customDomains[0].type_type).to.equal('d') // domain type

          // Test domain constraint
          await expect(
            kysely
              .insertInto('products')
              .values({ name: 'Invalid Product', quantity: -5 })
              .execute()
          ).to.be.rejected

          // Valid insert should work
          await kysely
            .insertInto('products')
            .values({ name: 'Valid Product', quantity: 10 })
            .execute()

          // Clean up
          await kysely.schema
            .dropTable('products')
            .ifExists()
            .execute()

          await kysely.raw('DROP DOMAIN positive_integer').execute()
        }))
      })
    }
  })

  describe('System Catalog Queries', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should query PostgreSQL system catalogs', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('system_test')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('data', 'text')
            .execute()

          // Query table information from pg_class
          const tableInfo = await kysely
            .selectFrom('pg_catalog.pg_class as c')
            .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
            .select([
              'c.relname as table_name',
              'c.relkind as table_type',
              'ns.nspname as schema_name',
              'c.reltuples as estimated_rows',
              'c.relpages as estimated_pages'
            ])
            .where('ns.nspname', '=', 'public')
            .where('c.relname', '=', 'system_test')
            .where('c.relkind', '=', 'r') // regular table
            .execute()

          expect(tableInfo).to.have.length(1)
          expect(tableInfo[0].table_name).to.equal('system_test')
          expect(tableInfo[0].table_type).to.equal('r')
          expect(tableInfo[0].schema_name).to.equal('public')
        }))

        it('should query column information from pg_attribute', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create test table
          await kysely.schema
            .createTable('attribute_test')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('description', 'text')
            .execute()

          // Query column information from pg_attribute
          const columnInfo = await kysely
            .selectFrom('pg_catalog.pg_attribute as a')
            .innerJoin('pg_catalog.pg_class as c', 'a.attrelid', 'c.oid')
            .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
            .innerJoin('pg_catalog.pg_type as t', 'a.atttypid', 't.oid')
            .select([
              'a.attname as column_name',
              'a.attnum as column_number',
              't.typname as data_type',
              'a.attnotnull as is_not_null',
              'a.atthasdef as has_default',
              'a.attisdropped as is_dropped'
            ])
            .where('ns.nspname', '=', 'public')
            .where('c.relname', '=', 'attribute_test')
            .where('a.attnum', '>', 0) // Exclude system columns
            .where('a.attisdropped', '=', false)
            .orderBy('a.attnum')
            .execute()

          expect(columnInfo).to.have.length(3)

          const idColumn = columnInfo.find(c => c.column_name === 'id')
          expect(idColumn).to.exist
          expect(idColumn!.data_type).to.equal('int4')
          expect(idColumn!.is_not_null).to.be.true

          const nameColumn = columnInfo.find(c => c.column_name === 'name')
          expect(nameColumn).to.exist
          expect(nameColumn!.data_type).to.equal('varchar')
          expect(nameColumn!.is_not_null).to.be.true

          const descColumn = columnInfo.find(c => c.column_name === 'description')
          expect(descColumn).to.exist
          expect(descColumn!.data_type).to.equal('text')
          expect(descColumn!.is_not_null).to.be.false
        }))
      })
    }
  })

  describe('Performance and Optimization', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should efficiently query metadata with proper indexing', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create multiple tables to test performance
          for (let i = 1; i <= 5; i++) {
            await kysely.schema
              .createTable(`perf_test_${i}`)
              .ifNotExists()
              .addColumn('id', 'serial', (col) => col.primaryKey())
              .addColumn('data', 'text')
              .execute()
          }

          const startTime = Date.now()

          // Query all tables using information_schema (should be efficient)
          const tables = await kysely
            .selectFrom('information_schema.tables')
            .select(['table_name', 'table_type'])
            .where('table_schema', '=', 'public')
            .where('table_type', '=', 'BASE TABLE')
            .where('table_name', 'like', 'perf_test_%')
            .execute()

          const endTime = Date.now()
          const duration = endTime - startTime

          expect(tables).to.have.length(5)
          expect(duration).to.be.lessThan(1000) // Should complete within 1 second

          console.log(`Metadata query completed in ${duration}ms for ${tables.length} tables`)
        }))

        it('should handle large result sets efficiently', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create a table with many columns
          let createTableQuery = 'CREATE TABLE large_table (id SERIAL PRIMARY KEY'
          for (let i = 1; i <= 50; i++) {
            createTableQuery += `, col_${i} VARCHAR(100)`
          }
          createTableQuery += ')'

          await kysely.raw(createTableQuery).execute()

          const startTime = Date.now()

          // Query column information
          const columns = await kysely
            .selectFrom('information_schema.columns')
            .select(['column_name', 'data_type', 'is_nullable'])
            .where('table_schema', '=', 'public')
            .where('table_name', '=', 'large_table')
            .orderBy('ordinal_position')
            .execute()

          const endTime = Date.now()
          const duration = endTime - startTime

          expect(columns).to.have.length(51) // id + 50 columns
          expect(duration).to.be.lessThan(2000) // Should complete within 2 seconds

          console.log(`Column metadata query completed in ${duration}ms for ${columns.length} columns`)
        }))
      })
    }
  })
})
