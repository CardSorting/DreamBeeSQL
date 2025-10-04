# Security Policy and Best Practices

## Overview

NOORMME (NO-ORM for Normies) takes security seriously. This document outlines the security measures implemented in the project and provides best practices for secure usage.

## Security Features

### 1. SQL Injection Prevention

NOORMME implements multiple layers of protection against SQL injection attacks:

#### Parameterized Queries (Built-in Protection)
- All user-provided values are automatically handled as parameterized queries by Kysely
- Values are never directly interpolated into SQL strings
- Database drivers handle proper escaping and type conversion

#### Dynamic Reference Validation (NEW)
For scenarios where table/column names come from user input, NOORMME now includes validation:

```typescript
// ✅ Safe: Built-in validation prevents SQL injection
import { sql } from 'kysely'

const userColumn = req.query.sortBy // User input
sql.ref(userColumn)  // Automatically validated for dangerous patterns

// ✅ Even safer: Use whitelisting
const allowedColumns = ['name', 'email', 'created_at']
if (!allowedColumns.includes(userColumn)) {
  throw new Error('Invalid column')
}
sql.ref(userColumn)
```

#### Validation Rules
The security validator checks for:
- SQL keywords (SELECT, UNION, DROP, etc.)
- SQL comment syntax (-- and /* */)
- Quote characters and escape sequences
- Null bytes and special characters
- Reserved SQLite keywords (PRAGMA, ATTACH, etc.)
- Invalid identifier formats

### 2. Path Traversal Protection

File operations in CLI commands are protected against path traversal attacks:

#### Validated Operations
- Database file paths
- Output directories for code generation
- Migration file locations

#### Protection Measures
```typescript
// ❌ Blocked: Path traversal
const dbPath = '../../../etc/passwd'  // Throws error

// ❌ Blocked: Absolute paths
const dbPath = '/etc/database.db'     // Throws error

// ✅ Allowed: Relative paths in current directory
const dbPath = './data/app.db'        // Valid
```

### 3. Input Validation

All user inputs are validated before processing:

#### Identifier Validation
- Table names: `validateTableReference()`
- Column names: `validateColumnReference()`
- Generic identifiers: `validateIdentifier()`

#### File Path Validation
- Database paths: `sanitizeDatabasePath()`
- Output directories: `validateOutputDirectory()`
- Migration names: `validateMigrationName()`

### 4. Rate Limiting

The `RateLimiter` class provides protection against brute-force and DoS attacks:

```typescript
import { RateLimiter } from 'noormme/util/security-validator'

const limiter = new RateLimiter(10, 60000) // 10 attempts per minute

try {
  limiter.checkLimit('user_login_' + userId)
  // Perform sensitive operation
} catch (error) {
  // Rate limit exceeded
}
```

## Best Practices

### 1. Using Dynamic References Safely

When using `db.dynamic.ref()` or `sql.ref()` with user input:

```typescript
// ❌ UNSAFE: Direct user input
async function unsafeQuery(userColumn: string) {
  return await db
    .selectFrom('users')
    .select(db.dynamic.ref(userColumn))
    .execute()
}

// ✅ SAFE: Whitelist validation
async function safeQuery(userColumn: string) {
  const allowedColumns = ['id', 'name', 'email', 'created_at']

  if (!allowedColumns.includes(userColumn)) {
    throw new Error('Invalid column name')
  }

  return await db
    .selectFrom('users')
    .select(db.dynamic.ref(userColumn))
    .execute()
}

// ✅ SAFER: Use TypeScript types for validation
type AllowedColumn = 'id' | 'name' | 'email' | 'created_at'

async function typedQuery(userColumn: AllowedColumn) {
  return await db
    .selectFrom('users')
    .select(db.dynamic.ref(userColumn))
    .execute()
}
```

### 2. Using sql.ref() Safely

```typescript
// ❌ UNSAFE: User-controlled identifiers
const orderBy = req.query.sort // Could be "1; DROP TABLE users--"
sql`SELECT * FROM users ORDER BY ${sql.ref(orderBy)}`

// ✅ SAFE: Whitelist approach
const allowedSortColumns = {
  'name': 'name',
  'email': 'email',
  'created': 'created_at'
}

const orderBy = allowedSortColumns[req.query.sort]
if (!orderBy) {
  throw new Error('Invalid sort column')
}

sql`SELECT * FROM users ORDER BY ${sql.ref(orderBy)}`
```

### 3. File Operations

```typescript
// ❌ UNSAFE: User-controlled paths
const dbPath = req.query.database  // Could be "../../../etc/passwd"
const db = new NOORMME({
  connection: { database: dbPath }
})

// ✅ SAFE: Validate and sanitize paths
import { sanitizeDatabasePath } from 'noormme/util/security-validator'

try {
  const dbPath = sanitizeDatabasePath(req.query.database)
  const db = new NOORMME({
    connection: { database: dbPath }
  })
} catch (error) {
  // Handle invalid path
}
```

### 4. CLI Command Security

When using CLI commands with user input:

```bash
# ❌ UNSAFE: Unvalidated input
npx noormme generate --output "$USER_INPUT"

# ✅ SAFE: Validate before use
npx noormme generate --output "./generated"
```

### 5. Environment Variables

Sensitive configuration should use environment variables:

```typescript
// .env file (never commit to git!)
DATABASE_PATH=./data/production.db
DATABASE_ENCRYPTION_KEY=your-secret-key

// .gitignore
.env
*.db
*.sqlite
```

## Security Checklist

When using NOORMME in production:

- [ ] All user inputs are validated against whitelists
- [ ] Dynamic column/table references use `db.dynamic.ref()` with validation
- [ ] File paths are validated and sanitized
- [ ] Environment variables are used for sensitive data
- [ ] Database files have appropriate file permissions (600 or 640)
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is implemented for authentication endpoints
- [ ] SQL queries are reviewed for injection vulnerabilities
- [ ] Dependencies are regularly updated for security patches
- [ ] Database backups are encrypted and stored securely

## Reporting Security Issues

If you discover a security vulnerability in NOORMME:

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: [security contact needed]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Updates

NOORMME follows these security practices:

- **Dependency Updates**: Regular updates to patch known vulnerabilities
- **Security Audits**: Periodic code reviews for security issues
- **Responsible Disclosure**: 90-day disclosure policy for reported vulnerabilities
- **Version Support**: Security patches for the latest major version

## Validation API Reference

### validateIdentifier(identifier: string, context?: string)
Validates generic identifiers (table names, column names, etc.)

**Checks:**
- String type and non-empty
- Length ≤ 255 characters
- No SQL keywords or injection patterns
- Format: alphanumeric, underscore, dots only
- No reserved SQLite keywords

### validateTableReference(tableRef: string)
Validates table references (table or schema.table)

**Additional checks:**
- Maximum 2 parts (schema.table)
- Each part validated as identifier

### validateColumnReference(columnRef: string)
Validates column references (column, table.column, or schema.table.column)

**Additional checks:**
- Maximum 3 parts (schema.table.column)
- Each part validated as identifier

### validateFilePath(filePath: string, allowedExtensions?: string[])
Validates file paths to prevent path traversal

**Checks:**
- No parent directory references (..)
- No absolute paths (/ or C:\)
- No null bytes or forbidden characters
- Optional extension validation

### sanitizeDatabasePath(dbPath: string): string
Validates and sanitizes database file paths

**Checks:**
- Valid file extension (.db, .sqlite, .sqlite3, .db3)
- Relative path only
- No path traversal

### validateOutputDirectory(dirPath: string)
Validates output directories for code generation

**Checks:**
- Relative path only
- No parent directory references
- Alphanumeric, underscores, hyphens, dots, slashes only

### validateMigrationName(name: string)
Validates migration names

**Checks:**
- Length ≤ 100 characters
- Alphanumeric, underscores, hyphens only

## Known Limitations

1. **Type Coercion**: TypeScript types don't prevent runtime injection - always validate at runtime
2. **Raw SQL**: `sql.raw()` and `sql.lit()` bypass validation - use only with trusted input
3. **File Permissions**: NOORMME doesn't set file permissions - configure your OS appropriately
4. **Encryption at Rest**: SQLite encryption requires extensions (SQLCipher) - not built-in

## Additional Resources

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [SQLite Security](https://www.sqlite.org/security.html)
- [Kysely Security](https://kysely.dev/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Version History

- **v1.1.0** (Current): Added comprehensive input validation and security documentation
- **v1.0.0**: Initial release with basic SQLite ORM functionality
