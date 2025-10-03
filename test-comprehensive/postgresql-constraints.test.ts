import { describe, it, before, after, beforeEach } from 'mocha'
import { expect } from 'chai'
import { withTestDatabase } from './setup/test-helpers.js'
import { getEnabledDatabases } from './setup/test-config.js'

/**
 * PostgreSQL Constraint Tests
 * 
 * This test suite focuses specifically on PostgreSQL constraint features
 * and their compatibility with NOORMME.
 * 
 * Key Features Being Tested:
 * 1. Foreign key constraints with various actions
 * 2. Check constraints and validation
 * 3. Unique constraints and partial unique indexes
 * 4. Exclusion constraints
 * 5. Constraint deferrability
 * 6. Complex constraint scenarios
 */

describe('PostgreSQL Constraint Features', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (!enabledDatabases.includes('postgresql')) {
    console.warn('PostgreSQL not enabled for testing')
    return
  }

  describe('Foreign Key Constraints', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support CASCADE delete with foreign keys', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create parent table
          await kysely.schema
            .createTable('categories')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull().unique())
            .execute()

          // Create child table with CASCADE delete
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('category_id', 'integer', (col) => col.references('categories.id').onDelete('cascade'))
            .execute()

          // Insert test data
          await kysely
            .insertInto('categories')
            .values([
              { name: 'Electronics' },
              { name: 'Books' }
            ])
            .execute()

          await kysely
            .insertInto('products')
            .values([
              { name: 'Laptop', category_id: 1 },
              { name: 'Mouse', category_id: 1 },
              { name: 'Programming Book', category_id: 2 }
            ])
            .execute()

          // Verify initial data
          let products = await kysely
            .selectFrom('products')
            .selectAll()
            .execute()

          expect(products).to.have.length(3)

          // Delete category (should cascade to products)
          await kysely
            .deleteFrom('categories')
            .where('id', '=', 1)
            .execute()

          // Verify cascade delete worked
          products = await kysely
            .selectFrom('products')
            .selectAll()
            .execute()

          expect(products).to.have.length(1)
          expect(products[0].name).to.equal('Programming Book')
          expect(products[0].category_id).to.equal(2)
        }))

        it('should support SET NULL with foreign keys', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create parent table
          await kysely.schema
            .createTable('departments')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Create child table with SET NULL
          await kysely.schema
            .createTable('employees')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('department_id', 'integer', (col) => col.references('departments.id').onDelete('set null'))
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
              { name: 'Alice', department_id: 1 },
              { name: 'Bob', department_id: 1 },
              { name: 'Charlie', department_id: 2 }
            ])
            .execute()

          // Delete department (should set department_id to NULL)
          await kysely
            .deleteFrom('departments')
            .where('id', '=', 1)
            .execute()

          // Verify SET NULL worked
          const employees = await kysely
            .selectFrom('employees')
            .selectAll()
            .orderBy('name')
            .execute()

          expect(employees).to.have.length(3)
          expect(employees[0].name).to.equal('Alice')
          expect(employees[0].department_id).to.be.null
          expect(employees[1].name).to.equal('Bob')
          expect(employees[1].department_id).to.be.null
          expect(employees[2].name).to.equal('Charlie')
          expect(employees[2].department_id).to.equal(2)
        }))

        it('should support RESTRICT with foreign keys', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create parent table
          await kysely.schema
            .createTable('users')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Create child table with RESTRICT (default)
          await kysely.schema
            .createTable('orders')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('user_id', 'integer', (col) => col.notNull().references('users.id').onDelete('restrict'))
            .addColumn('amount', 'decimal(10,2)', (col) => col.notNull())
            .execute()

          // Insert test data
          await kysely
            .insertInto('users')
            .values({ name: 'John Doe' })
            .execute()

          await kysely
            .insertInto('orders')
            .values({ user_id: 1, amount: 100.00 })
            .execute()

          // Try to delete user with existing orders (should fail)
          await expect(
            kysely
              .deleteFrom('users')
              .where('id', '=', 1)
              .execute()
          ).to.be.rejected

          // Verify user still exists
          const users = await kysely
            .selectFrom('users')
            .selectAll()
            .execute()

          expect(users).to.have.length(1)
        }))

        it('should support multi-column foreign keys', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create parent table with composite primary key
          await kysely.schema
            .createTable('companies')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('code', 'varchar(10)', (col) => col.notNull())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addUniqueConstraint('companies_code_key', ['code'])
            .execute()

          await kysely.schema
            .createTable('departments')
            .ifNotExists()
            .addColumn('company_code', 'varchar(10)', (col) => col.notNull().references('companies.code'))
            .addColumn('dept_code', 'varchar(10)', (col) => col.notNull())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addPrimaryKeyConstraint('departments_pkey', ['company_code', 'dept_code'])
            .execute()

          // Create child table with multi-column foreign key
          await kysely.schema
            .createTable('employees')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('company_code', 'varchar(10)', (col) => col.notNull())
            .addColumn('department_code', 'varchar(10)', (col) => col.notNull())
            .addForeignKeyConstraint(
              'employees_department_fkey',
              ['company_code', 'department_code'],
              'departments',
              ['company_code', 'dept_code']
            )
            .execute()

          // Insert test data
          await kysely
            .insertInto('companies')
            .values([
              { code: 'ACME', name: 'ACME Corp' },
              { code: 'TECH', name: 'Tech Solutions' }
            ])
            .execute()

          await kysely
            .insertInto('departments')
            .values([
              { company_code: 'ACME', dept_code: 'ENG', name: 'Engineering' },
              { company_code: 'ACME', dept_code: 'SALES', name: 'Sales' },
              { company_code: 'TECH', dept_code: 'ENG', name: 'Engineering' }
            ])
            .execute()

          await kysely
            .insertInto('employees')
            .values([
              { name: 'Alice', company_code: 'ACME', department_code: 'ENG' },
              { name: 'Bob', company_code: 'ACME', department_code: 'SALES' },
              { name: 'Charlie', company_code: 'TECH', department_code: 'ENG' }
            ])
            .execute()

          // Verify data integrity
          const employees = await kysely
            .selectFrom('employees')
            .innerJoin('departments', (join) =>
              join
                .onRef('employees.company_code', '=', 'departments.company_code')
                .onRef('employees.department_code', '=', 'departments.dept_code')
            )
            .select(['employees.name', 'departments.name as department_name'])
            .execute()

          expect(employees).to.have.length(3)
          expect(employees[0].department_name).to.equal('Engineering')
          expect(employees[1].department_name).to.equal('Sales')
          expect(employees[2].department_name).to.equal('Engineering')
        }))
      })
    }
  })

  describe('Check Constraints', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should enforce check constraints on insert', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with check constraints
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('price', 'decimal(10,2)', (col) => col.notNull())
            .addColumn('discount_percent', 'integer', (col) => col.defaultTo(0))
            .addCheckConstraint('products_price_positive', 'price > 0')
            .addCheckConstraint('products_discount_valid', 'discount_percent >= 0 AND discount_percent <= 100')
            .execute()

          // Valid insert should work
          await kysely
            .insertInto('products')
            .values({ name: 'Laptop', price: 1200.00, discount_percent: 10 })
            .execute()

          // Invalid inserts should fail
          await expect(
            kysely
              .insertInto('products')
              .values({ name: 'Invalid Price', price: -100.00 })
              .execute()
          ).to.be.rejected

          await expect(
            kysely
              .insertInto('products')
              .values({ name: 'Invalid Discount', price: 100.00, discount_percent: 150 })
              .execute()
          ).to.be.rejected

          // Verify only valid data was inserted
          const products = await kysely
            .selectFrom('products')
            .selectAll()
            .execute()

          expect(products).to.have.length(1)
          expect(products[0].name).to.equal('Laptop')
        }))

        it('should enforce check constraints on update', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with check constraint
          await kysely.schema
            .createTable('employees')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('age', 'integer', (col) => col.notNull())
            .addColumn('salary', 'decimal(10,2)', (col) => col.notNull())
            .addCheckConstraint('employees_age_valid', 'age >= 18 AND age <= 65')
            .addCheckConstraint('employees_salary_positive', 'salary > 0')
            .execute()

          // Insert valid data
          await kysely
            .insertInto('employees')
            .values({ name: 'John Doe', age: 30, salary: 50000.00 })
            .execute()

          // Valid update should work
          await kysely
            .updateTable('employees')
            .set({ age: 31, salary: 55000.00 })
            .where('id', '=', 1)
            .execute()

          // Invalid updates should fail
          await expect(
            kysely
              .updateTable('employees')
              .set({ age: 16 })
              .where('id', '=', 1)
              .execute()
          ).to.be.rejected

          await expect(
            kysely
              .updateTable('employees')
              .set({ salary: -1000.00 })
              .where('id', '=', 1)
              .execute()
          ).to.be.rejected

          // Verify valid update was applied
          const employee = await kysely
            .selectFrom('employees')
            .selectAll()
            .where('id', '=', 1)
            .executeTakeFirst()

          expect(employee!.age).to.equal(31)
          expect(employee!.salary).to.equal('55000.00')
        }))

        it('should support complex check constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with complex check constraint
          await kysely.schema
            .createTable('events')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('start_date', 'timestamp', (col) => col.notNull())
            .addColumn('end_date', 'timestamp', (col) => col.notNull())
            .addColumn('max_attendees', 'integer', (col) => col.notNull())
            .addColumn('current_attendees', 'integer', (col) => col.defaultTo(0))
            .addCheckConstraint('events_dates_valid', 'end_date > start_date')
            .addCheckConstraint('events_attendees_valid', 'current_attendees >= 0 AND current_attendees <= max_attendees')
            .addCheckConstraint('events_future_start', 'start_date > CURRENT_TIMESTAMP')
            .execute()

          // Valid insert should work
          const futureStart = new Date(Date.now() + 86400000) // Tomorrow
          const futureEnd = new Date(Date.now() + 172800000) // Day after tomorrow

          await kysely
            .insertInto('events')
            .values({
              name: 'Tech Conference',
              start_date: futureStart,
              end_date: futureEnd,
              max_attendees: 100,
              current_attendees: 25
            })
            .execute()

          // Invalid inserts should fail
          await expect(
            kysely
              .insertInto('events')
              .values({
                name: 'Invalid Event',
                start_date: futureEnd, // Start after end
                end_date: futureStart,
                max_attendees: 100,
                current_attendees: 0
              })
              .execute()
          ).to.be.rejected

          await expect(
            kysely
              .insertInto('events')
              .values({
                name: 'Past Event',
                start_date: new Date(Date.now() - 86400000), // Yesterday
                end_date: futureStart,
                max_attendees: 100,
                current_attendees: 0
              })
              .execute()
          ).to.be.rejected

          // Verify only valid data was inserted
          const events = await kysely
            .selectFrom('events')
            .selectAll()
            .execute()

          expect(events).to.have.length(1)
          expect(events[0].name).to.equal('Tech Conference')
        }))
      })
    }
  })

  describe('Unique Constraints', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should enforce unique constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with unique constraint
          await kysely.schema
            .createTable('users')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('username', 'varchar(50)', (col) => col.notNull().unique())
            .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
            .execute()

          // Valid insert should work
          await kysely
            .insertInto('users')
            .values({ username: 'alice', email: 'alice@example.com' })
            .execute()

          // Duplicate username should fail
          await expect(
            kysely
              .insertInto('users')
              .values({ username: 'alice', email: 'bob@example.com' })
              .execute()
          ).to.be.rejected

          // Duplicate email should fail
          await expect(
            kysely
              .insertInto('users')
              .values({ username: 'bob', email: 'alice@example.com' })
              .execute()
          ).to.be.rejected

          // Valid unique insert should work
          await kysely
            .insertInto('users')
            .values({ username: 'bob', email: 'bob@example.com' })
            .execute()

          // Verify data
          const users = await kysely
            .selectFrom('users')
            .selectAll()
            .execute()

          expect(users).to.have.length(2)
        }))

        it('should support partial unique indexes', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table
          await kysely.schema
            .createTable('orders')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('order_number', 'varchar(20)', (col) => col.notNull())
            .addColumn('status', 'varchar(20)', (col) => col.notNull())
            .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
            .execute()

          // Create partial unique index (only for active orders)
          await kysely.schema
            .createIndex('idx_orders_number_active')
            .on('orders')
            .column('order_number')
            .where('status', 'in', ['pending', 'processing'])
            .unique()
            .execute()

          // Insert data
          await kysely
            .insertInto('orders')
            .values([
              { order_number: 'ORD-001', status: 'pending' },
              { order_number: 'ORD-002', status: 'completed' },
              { order_number: 'ORD-003', status: 'processing' }
            ])
            .execute()

          // Duplicate active order number should fail
          await expect(
            kysely
              .insertInto('orders')
              .values({ order_number: 'ORD-001', status: 'pending' })
              .execute()
          ).to.be.rejected

          // Same order number with completed status should work (not covered by partial index)
          await kysely
            .insertInto('orders')
            .values({ order_number: 'ORD-002', status: 'cancelled' })
            .execute()

          // Verify data
          const orders = await kysely
            .selectFrom('orders')
            .selectAll()
            .execute()

          expect(orders).to.have.length(4)
        }))

        it('should support multi-column unique constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with multi-column unique constraint
          await kysely.schema
            .createTable('user_sessions')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('user_id', 'integer', (col) => col.notNull())
            .addColumn('session_token', 'varchar(100)', (col) => col.notNull())
            .addColumn('device_id', 'varchar(50)', (col) => col.notNull())
            .addUniqueConstraint('user_sessions_user_device_unique', ['user_id', 'device_id'])
            .execute()

          // Valid inserts should work
          await kysely
            .insertInto('user_sessions')
            .values([
              { user_id: 1, session_token: 'token1', device_id: 'device1' },
              { user_id: 1, session_token: 'token2', device_id: 'device2' },
              { user_id: 2, session_token: 'token3', device_id: 'device1' }
            ])
            .execute()

          // Duplicate user_id + device_id combination should fail
          await expect(
            kysely
              .insertInto('user_sessions')
              .values({ user_id: 1, session_token: 'token4', device_id: 'device1' })
              .execute()
          ).to.be.rejected

          // Verify data
          const sessions = await kysely
            .selectFrom('user_sessions')
            .selectAll()
            .execute()

          expect(sessions).to.have.length(3)
        }))
      })
    }
  })

  describe('Exclusion Constraints', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support exclusion constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create table with exclusion constraint
          await kysely.schema
            .createTable('reservations')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('resource_id', 'integer', (col) => col.notNull())
            .addColumn('start_time', 'timestamp', (col) => col.notNull())
            .addColumn('end_time', 'timestamp', (col) => col.notNull())
            .addColumn('user_id', 'integer', (col) => col.notNull())
            .execute()

          // Create exclusion constraint (no overlapping reservations for same resource)
          await kysely.raw(`
            ALTER TABLE reservations 
            ADD CONSTRAINT reservations_no_overlap 
            EXCLUDE USING gist (
              resource_id WITH =,
              tsrange(start_time, end_time) WITH &&
            )
          `).execute()

          // Insert valid reservation
          const start1 = new Date('2023-12-01 09:00:00')
          const end1 = new Date('2023-12-01 11:00:00')

          await kysely
            .insertInto('reservations')
            .values({
              resource_id: 1,
              start_time: start1,
              end_time: end1,
              user_id: 1
            })
            .execute()

          // Non-overlapping reservation should work
          const start2 = new Date('2023-12-01 14:00:00')
          const end2 = new Date('2023-12-01 16:00:00')

          await kysely
            .insertInto('reservations')
            .values({
              resource_id: 1,
              start_time: start2,
              end_time: end2,
              user_id: 2
            })
            .execute()

          // Overlapping reservation should fail
          const start3 = new Date('2023-12-01 10:00:00')
          const end3 = new Date('2023-12-01 12:00:00')

          await expect(
            kysely
              .insertInto('reservations')
              .values({
                resource_id: 1,
                start_time: start3,
                end_time: end3,
                user_id: 3
              })
              .execute()
          ).to.be.rejected

          // Verify data
          const reservations = await kysely
            .selectFrom('reservations')
            .selectAll()
            .execute()

          expect(reservations).to.have.length(2)
        }))
      })
    }
  })

  describe('Constraint Deferrability', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should support deferrable constraints', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create parent table
          await kysely.schema
            .createTable('categories')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .execute()

          // Create child table with deferrable constraint
          await kysely.schema
            .createTable('products')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('category_id', 'integer', (col) => col.references('categories.id').onDelete('restrict'))
            .execute()

          // Make the foreign key constraint deferrable
          await kysely.raw(`
            ALTER TABLE products 
            DROP CONSTRAINT products_category_id_fkey
          `).execute()

          await kysely.raw(`
            ALTER TABLE products 
            ADD CONSTRAINT products_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES categories(id) 
            DEFERRABLE INITIALLY DEFERRED
          `).execute()

          // Insert data in a transaction with deferred constraint checking
          await kysely.transaction().execute(async (trx) => {
            // This would normally fail due to foreign key constraint
            await trx
              .insertInto('products')
              .values({ name: 'Laptop', category_id: 1 })
              .execute()

            // Create the referenced category
            await trx
              .insertInto('categories')
              .values({ name: 'Electronics' })
              .execute()

            // Constraint is checked at commit time, so this should succeed
          })

          // Verify data was inserted
          const products = await kysely
            .selectFrom('products')
            .selectAll()
            .execute()

          expect(products).to.have.length(1)
          expect(products[0].name).to.equal('Laptop')
          expect(products[0].category_id).to.equal(1)
        }))
      })
    }
  })

  describe('Complex Constraint Scenarios', () => {
    for (const dialect of enabledDatabases) {
      if (dialect !== 'postgresql') continue
      
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle complex constraint interactions', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          const kysely = db.getKysely()

          // Create complex schema with multiple constraints
          await kysely.schema
            .createTable('companies')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('name', 'varchar(100)', (col) => col.notNull().unique())
            .addColumn('revenue', 'decimal(15,2)', (col) => col.notNull())
            .addCheckConstraint('companies_revenue_positive', 'revenue >= 0')
            .execute()

          await kysely.schema
            .createTable('employees')
            .ifNotExists()
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('company_id', 'integer', (col) => col.notNull().references('companies.id').onDelete('cascade'))
            .addColumn('name', 'varchar(100)', (col) => col.notNull())
            .addColumn('salary', 'decimal(10,2)', (col) => col.notNull())
            .addColumn('bonus', 'decimal(10,2)', (col) => col.defaultTo(0))
            .addColumn('hire_date', 'date', (col) => col.notNull())
            .addCheckConstraint('employees_salary_positive', 'salary > 0')
            .addCheckConstraint('employees_bonus_non_negative', 'bonus >= 0')
            .addCheckConstraint('employees_hire_future', 'hire_date <= CURRENT_DATE')
            .addCheckConstraint('employees_salary_bonus_total', 'salary + bonus <= 1000000')
            .execute()

          // Insert test data
          await kysely
            .insertInto('companies')
            .values([
              { name: 'ACME Corp', revenue: 1000000.00 },
              { name: 'Tech Solutions', revenue: 500000.00 }
            ])
            .execute()

          await kysely
            .insertInto('employees')
            .values([
              { company_id: 1, name: 'Alice', salary: 80000.00, bonus: 10000.00, hire_date: '2023-01-15' },
              { company_id: 1, name: 'Bob', salary: 75000.00, bonus: 5000.00, hire_date: '2023-02-01' },
              { company_id: 2, name: 'Charlie', salary: 90000.00, bonus: 0.00, hire_date: '2023-03-01' }
            ])
            .execute()

          // Test constraint violations
          await expect(
            kysely
              .insertInto('employees')
              .values({
                company_id: 1,
                name: 'Invalid',
                salary: -50000.00, // Negative salary
                hire_date: '2023-01-01'
              })
              .execute()
          ).to.be.rejected

          await expect(
            kysely
              .insertInto('employees')
              .values({
                company_id: 1,
                name: 'Invalid',
                salary: 500000.00,
                bonus: 600000.00, // Total exceeds limit
                hire_date: '2023-01-01'
              })
              .execute()
          ).to.be.rejected

          // Test cascade delete
          await kysely
            .deleteFrom('companies')
            .where('id', '=', 2)
            .execute()

          // Verify cascade delete worked
          const employees = await kysely
            .selectFrom('employees')
            .selectAll()
            .execute()

          expect(employees).to.have.length(2)
          expect(employees.every(emp => emp.company_id === 1)).to.be.true

          // Verify data integrity
          const companies = await kysely
            .selectFrom('companies')
            .selectAll()
            .execute()

          expect(companies).to.have.length(1)
          expect(companies[0].name).to.equal('ACME Corp')
        }))
      })
    }
  })
})
