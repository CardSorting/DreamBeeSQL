# NOORMME CLI Documentation

The NOORMME CLI provides powerful commands to initialize, inspect, and generate code for your database projects.

## Installation

```bash
npm install -g noorm
# or use with npx
npx noormme --help
```

## Commands

### `noormme init`

Initialize NOORMME in your project with interactive setup.

```bash
npx noormme init
```

#### Options

- `-d, --dialect <dialect>` - Database dialect (postgresql, mysql, sqlite, mssql)
- `-c, --connection <connection>` - Database connection string
- `-o, --output <output>` - Output directory for generated files (default: lib)
- `-f, --force` - Overwrite existing files

#### Examples

```bash
# Interactive setup
npx noormme init

# PostgreSQL with specific connection
npx noormme init -d postgresql -c "postgresql://user:pass@localhost:5432/mydb"

# SQLite with custom output directory
npx noormme init -d sqlite -c "./database.sqlite" -o src/db

# Force overwrite existing files
npx noormme init --force
```

#### Generated Files

- `lib/db.ts` - Main database connection and configuration
- `.env.example` - Environment variable template
- `.env` - Environment variables (if doesn't exist)
- `NOORMME_README.md` - Usage guide and examples
- Updates `package.json` with helpful scripts

### `noormme inspect`

Inspect your database schema with detailed information about tables, columns, and relationships.

```bash
npx noormme inspect [table]
```

#### Options

- `-c, --connection <connection>` - Database connection string
- `-a, --all` - Show all tables (default)
- `-r, --relationships` - Show relationships

#### Examples

```bash
# Show all tables
npx noormme inspect

# Inspect specific table
npx noormme inspect users

# Show all tables with relationships
npx noormme inspect --relationships

# Use custom connection string
npx noormme inspect -c "postgresql://localhost/mydb"
```

#### Output Format

The inspect command shows:
- Table structure with columns, types, and constraints
- Primary keys and foreign keys
- Indexes and their properties
- Relationships between tables
- Usage examples for each table

### `noormme generate`

Generate TypeScript types and interfaces from your database schema.

```bash
npx noormme generate
```

#### Options

- `-c, --connection <connection>` - Database connection string
- `-o, --output <output>` - Output file path (default: ./types/database.d.ts)
- `-f, --format <format>` - Output format: typescript or json (default: typescript)

#### Examples

```bash
# Generate types to default location
npx noormme generate

# Custom output file
npx noormme generate -o ./src/types/db.d.ts

# Generate JSON schema instead
npx noormme generate -f json -o ./schema.json

# Use custom connection
npx noormme generate -c "mysql://localhost/mydb"
```

#### Generated Types

The generate command creates:
- Table interfaces for each database table
- Insert types (with optional fields for defaults/auto-increment)
- Update types (with optional fields except primary keys)
- Repository interfaces with all available methods
- Database interface combining all tables

## Environment Variables

The CLI respects these environment variables:

- `DATABASE_URL` - Default database connection string
- `NODE_ENV` - Environment mode (development/production)

## Configuration Files

### `.env` File

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database"
LOG_LEVEL=info
CACHE_TTL=300000
```

### Package.json Scripts

The init command adds these helpful scripts:

```json
{
  "scripts": {
    "db:inspect": "noormme inspect",
    "db:generate-types": "noormme generate"
  }
}
```

## Error Handling

The CLI provides detailed error messages with suggestions:

```bash
❌ Table 'user' not found
Available tables: users, posts, comments

❌ Failed to connect to database
Suggestion: Check your connection string and ensure the database is running
```

## Examples

### Complete Project Setup

```bash
# 1. Initialize NOORMME
npx noormme init -d postgresql

# 2. Inspect your schema
npx noormme inspect

# 3. Generate TypeScript types
npx noormme generate

# 4. Use in your code
import { db } from './lib/db'
import type { UsersTable } from './types/database'

await db.initialize()
const userRepo = db.getRepository<UsersTable>('users')
```

### Development Workflow

```bash
# Watch for schema changes and regenerate types
npm run db:generate-types

# Inspect specific table after making changes
npm run db:inspect users

# Check relationships
npx noormme inspect --relationships
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting:

1. Verify your database is running
2. Check your connection string format
3. Ensure your database user has proper permissions
4. Test connection manually first

### Permission Errors

If the CLI can't write files:

1. Check directory permissions
2. Use `--force` flag to overwrite existing files
3. Try running with different output directory

### Type Generation Issues

If type generation fails:

1. Ensure your database has proper schema
2. Check that all tables have primary keys
3. Verify foreign key relationships are properly defined

## Advanced Usage

### Custom Type Mappings

The generate command supports custom type mappings through configuration:

```typescript
// In your schema discovery config
{
  introspection: {
    customTypeMappings: {
      'my_custom_type': 'string',
      'json_field': 'Record<string, any>'
    }
  }
}
```

### Batch Operations

You can chain multiple CLI commands:

```bash
npx noormme init && npx noormme generate && npx noormme inspect
```

### CI/CD Integration

Use the CLI in your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Generate database types
  run: npx noormme generate --output ./generated/types.d.ts
```