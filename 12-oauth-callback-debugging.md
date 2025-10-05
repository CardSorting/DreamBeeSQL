# NOORMME OAuth Callback Debugging Session

## Overview

This document covers the debugging session for resolving OAuth callback errors in the DreamBeesArt application using NOORMME as the database adapter for NextAuth.js.

## Initial Problem

**Error**: Users were experiencing OAuth callback failures with the error:
```
http://localhost:3000/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fgenerate&error=Callback
```

## Root Cause Analysis

### 1. NextAuth Strategy Mismatch
**Issue**: Application was using JWT session strategy with a database adapter
```typescript
// ❌ Problematic configuration
session: {
  strategy: 'jwt' as const,
  maxAge: 30 * 24 * 60 * 60,
},
adapter: NoormmeAdapter(),
```

**Problem**: JWT strategy doesn't automatically call adapter methods like `createUser` and `linkAccount`, causing foreign key constraint violations.

**Solution**: Changed to database session strategy
```typescript
// ✅ Fixed configuration
session: {
  strategy: 'database' as const,
  maxAge: 30 * 24 * 60 * 60,
},
adapter: NoormmeAdapter(),
```

### 2. NOORMME Initialization Issues

**Issue**: NOORMME was failing to initialize with SQLite pragma syntax errors
```
SQLite column discovery failed: SqliteError: near "pragma_table_info": syntax error
SQLite foreign key discovery failed: SqliteError: near "pragma_foreign_key_list": syntax error
TypeError: Cannot read properties of undefined (reading 'endsWith')
```

**Root Causes**:
1. **Empty Database**: NOORMME was trying to discover schema on an empty database
2. **Complex Configuration**: Advanced NOORMME settings were causing conflicts
3. **Corrupted Database Files**: Existing database files had issues

### 3. Database Schema Missing

**Issue**: Required NextAuth tables didn't exist in the database
- `users` table missing
- `accounts` table missing  
- `sessions` table missing
- `verification_tokens` table missing

## Solutions Implemented

### 1. Database Schema Creation

**Step 1**: Removed corrupted database files
```bash
rm -f data/dreambeesart.db data/dreambeesart.db-shm data/dreambeesart.db-wal
```

**Step 2**: Created database schema using migration files
```bash
sqlite3 data/dreambeesart.db < src/lib/migrations/files/001_initial_schema.sql
```

**Step 3**: Verified schema creation
```bash
sqlite3 data/dreambeesart.db ".tables"
# Output: accounts, permissions, user_preferences, ai_models, role_permissions, user_roles, users, sessions, verification_tokens, generation_history, api_keys, roles
```

### 2. NOORMME Configuration Simplification

**Before**: Complex configuration with automation and optimization settings
```typescript
const database = new NOORMME({
  dialect: 'sqlite',
  connection: {
    host: '',
    port: 0,
    username: '',
    password: '',
    database: getDatabasePath()
  },
  automation: {
    enableAutoOptimization: true,
    enableIndexRecommendations: true,
    enableQueryAnalysis: true,
    enableMigrationGeneration: true
  },
  performance: {
    maxBatchSize: 1000
  },
  optimization: {
    enableWALMode: true,
    enableForeignKeys: true,
    cacheSize: -64000,
    synchronous: 'NORMAL',
    tempStore: 'MEMORY'
  }
});
```

**After**: Simplified configuration
```typescript
const database = new NOORMME({
  dialect: 'sqlite',
  connection: {
    host: '',
    port: 0,
    username: '',
    password: '',
    database: getDatabasePath()
  }
});
```

### 3. Adapter Error Handling Improvements

**Enhanced linkAccount function** with better error handling:
```typescript
async linkAccount(account: AdapterAccount) {
  try {
    await ensureDatabaseInitialized();
    
    // Verify that the user exists before linking account
    const userExists = await kysely
      .selectFrom('users')
      .select('id')
      .where('id', '=', account.userId)
      .executeTakeFirst();
    
    if (!userExists) {
      console.error('linkAccount: User does not exist, this indicates a NextAuth flow issue', { userId: account.userId });
      console.error('This usually means createUser was not called before linkAccount');
      throw new Error(`User with ID ${account.userId} does not exist. NextAuth should create the user before linking account.`);
    }
    
    // ... rest of implementation
  } catch (error) {
    console.error('linkAccount error:', error);
    console.error('linkAccount error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      account: {
        userId: account.userId,
        provider: account.provider,
        providerAccountId: account.providerAccountId
      }
    });
    throw error;
  }
}
```

**Enhanced createUser function** with detailed logging:
```typescript
async createUser(user: Omit<AdapterUser, 'id'>) {
  try {
    await ensureDatabaseInitialized();
    
    console.log('🔄 Creating user in database', { email: user.email, name: user.name });
    
    const userId = crypto.randomUUID();
    const userData = {
      id: userId,
      name: user.name,
      email: user.email,
      email_verified: user.emailVerified ? user.emailVerified.toISOString() : null,
      image: user.image,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const createdUser = await userRepo.create(userData) as Record<string, unknown>;
    console.log('✅ User created successfully', { userId: createdUser.id, email: createdUser.email });

    return {
      id: createdUser.id as string,
      name: createdUser.name as string | null,
      email: createdUser.email as string,
      emailVerified: createdUser.email_verified ? new Date(createdUser.email_verified as string) : null,
      image: createdUser.image as string | null,
    };
  } catch (error) {
    console.error('createUser error:', error);
    console.error('createUser error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      user: {
        email: user.email,
        name: user.name
      }
    });
    
    // Fallback to JWT-only mode
    console.warn('Falling back to JWT-only mode for user creation');
    return {
      id: crypto.randomUUID(),
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
    };
  }
}
```

## Current Status

### ✅ Completed
- Fixed NextAuth strategy configuration (JWT → Database)
- Created proper database schema with all required tables
- Simplified NOORMME configuration to avoid pragma errors
- Enhanced error handling and logging in adapter functions
- Enabled debug logging for OAuth flow

### ⚠️ Remaining Issues
- NOORMME still fails to initialize with SQLite pragma errors
- Database falls back to JWT-only mode
- OAuth callback still fails with `error=OAuthCallback`

### 🔍 Current Error Pattern
```
1. OAuth flow starts successfully
2. NOORMME initialization fails with pragma errors
3. Database falls back to JWT-only mode
4. createUser is never called (database not available)
5. linkAccount fails because user doesn't exist
6. OAuth callback returns error=OAuthCallback
```

## Key Learnings

### 1. NextAuth Strategy Requirements
- **JWT Strategy**: Stores session data in JWT tokens, minimal database usage
- **Database Strategy**: Requires working database adapter, calls adapter methods for user/account/session management
- **Mixing Strategies**: Using database adapter with JWT strategy causes flow issues

### 2. NOORMME Limitations
- **Schema Discovery**: NOORMME requires existing schema to discover, fails on empty databases
- **SQLite Compatibility**: Some NOORMME features may not be fully compatible with SQLite pragma statements
- **Configuration Complexity**: Advanced NOORMME configurations can cause initialization failures

### 3. OAuth Flow Dependencies
- **User Creation**: Must happen before account linking
- **Foreign Key Constraints**: Database schema enforces referential integrity
- **Error Handling**: Proper error logging is essential for debugging OAuth issues

## Next Steps

### Option 1: Fix NOORMME Initialization
- Investigate NOORMME SQLite pragma compatibility issues
- Try different NOORMME configuration options
- Consider updating NOORMME version

### Option 2: Switch to Kysely Adapter
- Use direct Kysely connection instead of NOORMME
- Implement Kysely-based NextAuth adapter
- More reliable for SQLite operations

### Option 3: Alternative Database Setup
- Use different database (PostgreSQL, MySQL)
- Implement proper migration system
- Ensure schema is created before NOORMME initialization

## Files Modified

1. **`src/lib/auth.ts`**
   - Changed session strategy from 'jwt' to 'database'
   - Updated session callback for database strategy
   - Removed JWT-specific imports

2. **`src/lib/db/noormme.ts`**
   - Simplified NOORMME configuration
   - Removed complex automation and optimization settings
   - Fixed TypeScript connection configuration

3. **`src/lib/auth/noormme-adapter.ts`**
   - Enhanced error handling in linkAccount function
   - Added user existence verification
   - Improved logging for debugging

4. **Database Schema**
   - Created initial schema via migration files
   - Added all required NextAuth tables
   - Established proper foreign key relationships

## Debug Logs Analysis

### Successful OAuth Start
```
[next-auth][debug][GET_AUTHORIZATION_URL] {
  url: 'https://github.com/login/oauth/authorize?client_id=...',
  provider: { id: 'github', name: 'GitHub', ... }
}
```

### NOORMME Initialization Failure
```
[NOORMME ERROR] Database error: SqliteError: near "pragma_table_info": syntax error
[NOORMME ERROR] Failed to initialize NOORMME: TypeError: Cannot read properties of undefined (reading 'endsWith')
```

### OAuth Callback Failure
```
[next-auth][error][adapter_error_linkAccount] User with ID ... does not exist
[next-auth][error][OAUTH_CALLBACK_HANDLER_ERROR] User with ID ... does not exist
```

## Conclusion

The OAuth callback issue stems from NOORMME's inability to initialize properly with SQLite, causing the database adapter to fall back to JWT-only mode. While the NextAuth configuration has been corrected and the database schema exists, NOORMME's schema discovery mechanism is incompatible with the current SQLite setup.

The next step should be to either resolve NOORMME's SQLite compatibility issues or switch to a more reliable database adapter like Kysely for the OAuth flow.
