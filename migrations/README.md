# Migration Files

This directory contains SQL migration files for the DreamBeeSQL database schema.

## Migration File Naming Convention

Migration files should follow this naming pattern:
```
{timestamp}_{description}.sql
```

Where:
- `timestamp` is a 14-character timestamp in format `YYYYMMDDHHMMSS`
- `description` is a descriptive name for the migration

Examples:
- `20241201120000_initial_schema.sql`
- `20241201120100_add_user_table.sql`
- `20241201120200_add_indexes.sql`

## Migration Content

Each migration file should contain valid SQL statements. The migration system will:
1. Execute the SQL statements in a transaction
2. Track the migration as applied
3. Calculate and store a checksum for integrity verification

## Example Migration

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on created_at
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

## Best Practices

1. **Use IF NOT EXISTS** for CREATE TABLE statements to make migrations idempotent
2. **Use IF EXISTS** for DROP statements to avoid errors
3. **Include indexes** in the same migration as the table creation
4. **Use transactions** - the migration system automatically wraps each migration in a transaction
5. **Test migrations** on a copy of production data before applying
6. **Keep migrations small** and focused on a single schema change
7. **Document complex migrations** with comments

## Migration Execution

The migration system will:
- Execute migrations in alphabetical order
- Skip already applied migrations
- Verify migration integrity using checksums
- Provide detailed logging and error handling
- Support rollback operations (manual)

## Enterprise Features

This migration system includes enterprise-grade features:
- Circuit breaker pattern for failure handling
- Resource management and timeout protection
- Comprehensive logging and metrics
- Health checks and monitoring
- Retry logic with exponential backoff
- Transaction safety and rollback support
