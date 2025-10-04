# Repository Pattern with Noormme

The repository pattern in Noormme provides a clean, type-safe interface for database operations. This guide shows how to use repositories effectively in production applications.

## Basic Repository Usage

### Getting a Repository

```typescript
import { getRepository } from './db/noormme';

// Get repository for any table
const userRepo = getRepository('users');
const roleRepo = getRepository('roles');
const permissionRepo = getRepository('permissions');
```

### CRUD Operations

#### Create

```typescript
// Create a new user
const userData = {
  id: crypto.randomUUID(),
  name: 'John Doe',
  email: 'john@example.com',
  email_verified: new Date().toISOString(),
  image: 'https://example.com/avatar.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const createdUser = await userRepo.create(userData);
```

#### Read

```typescript
// Find by ID
const user = await userRepo.findById('123');

// Find all with options
const users = await userRepo.findAll({ 
  limit: 10, 
  offset: 0 
});

// Find all users
const allUsers = await userRepo.findAll();
```

#### Update

```typescript
// Update user data
const updateData = {
  name: 'Jane Doe',
  updated_at: new Date().toISOString(),
};

const updatedUser = await userRepo.update('123', updateData);
```

#### Delete

```typescript
// Delete user (if supported by repository)
await userRepo.delete('123');
```

## Custom Finder Methods

Based on the production implementation, Noormme repositories support custom finder methods:

### Email-based Finders

```typescript
// Find users by email
const users = await userRepo.findManyByEmail('john@example.com');
const user = users && users.length > 0 ? users[0] : null;
```

### Name-based Finders

```typescript
// Find roles by name
const roles = await roleRepo.findManyByName('admin');
const role = roles && roles.length > 0 ? roles[0] : null;
```

### User ID-based Finders

```typescript
// Find user roles by user ID
const userRoles = await userRolesRepo.findManyByUserId('123');

// Find role permissions by role ID
const rolePermissions = await rolePermissionsRepo.findManyByRoleId('456');
```

## Real-World Examples

### User Management

```typescript
// src/lib/cached-db.ts
export class CachedDatabaseService {
  static async getUserById(userId: string): Promise<any | null> {
    const cacheKey = CacheUtils.userKey(userId, 'profile');
    const cached = await dbCache.get<any>('user-sessions', cacheKey);
    
    if (cached) return cached;

    const userRepo = getRepository('users');
    const user = await userRepo.findById(userId);
    
    if (user) {
      await dbCache.set('user-sessions', cacheKey, user);
    }
    
    return user || null;
  }

  static async getUserByEmail(email: string): Promise<any | null> {
    const cacheKey = `user:email:${email}`;
    const cached = await dbCache.get<any>('user-sessions', cacheKey);
    
    if (cached) return cached;

    const userRepo = getRepository('users');
    const users = await userRepo.findManyByEmail(email);
    const user = users && users.length > 0 ? users[0] : null;
    
    if (user) {
      await dbCache.set('user-sessions', cacheKey, user);
      // Also cache by user ID
      await dbCache.set('user-sessions', CacheUtils.userKey(user.id, 'profile'), user);
    }
    
    return user || null;
  }
}
```

### Role-Based Access Control

```typescript
// src/lib/rbac.ts
export async function assignRoleToUser(userId: string, roleName: string): Promise<void> {
  const rolesRepo = getRepository('roles');
  const userRolesRepo = getRepository('user_roles');
  
  const roles = await rolesRepo.findManyByName(roleName);
  if (!roles || roles.length === 0) {
    throw new Error(`Role '${roleName}' not found`);
  }
  
  const role = roles[0];
  
  // Check if user already has this role
  const existingUserRoles = await userRolesRepo.findManyByUserId(userId);
  const existingUserRole = existingUserRoles.find(ur => ur.role_id === role.id);
  
  if (!existingUserRole) {
    await userRolesRepo.create({
      id: randomUUID(),
      user_id: userId,
      role_id: role.id,
      created_at: new Date().toISOString(),
    });
  }
}

export async function createRole(name: string, description?: string, isSystem: boolean = false): Promise<string> {
  const id = randomUUID();
  const rolesRepo = getRepository('roles');
  
  await rolesRepo.create({ 
    id, 
    name, 
    description,
    is_system: isSystem,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  return id;
}
```

### Permission Management

```typescript
export async function createPermission(
  name: string,
  description?: string,
  isSystem: boolean = false
): Promise<string> {
  const id = randomUUID();
  const permissionsRepo = getRepository('permissions');
  
  await permissionsRepo.create({ 
    id, 
    name, 
    description,
    is_system: isSystem,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  return id;
}

export async function assignPermissionToRole(roleName: string, permissionName: string): Promise<void> {
  const rolesRepo = getRepository('roles');
  const permissionsRepo = getRepository('permissions');
  const rolePermissionsRepo = getRepository('role_permissions');
  
  const roles = await rolesRepo.findManyByName(roleName);
  const permissions = await permissionsRepo.findManyByName(permissionName);

  if (!roles || roles.length === 0) {
    throw new Error(`Role '${roleName}' not found`);
  }
  
  if (!permissions || permissions.length === 0) {
    throw new Error(`Permission '${permissionName}' not found`);
  }

  const role = roles[0];
  const permission = permissions[0];

  // Check if role already has this permission
  const existingRolePermissions = await rolePermissionsRepo.findManyByRoleId(role.id);
  const existing = existingRolePermissions.find(rp => rp.permission_id === permission.id);

  if (!existing) {
    await rolePermissionsRepo.create({
      id: randomUUID(),
      role_id: role.id,
      permission_id: permission.id,
      created_at: new Date().toISOString(),
    });
  }
}
```

## Repository Method Reference

### Standard Methods

- `findById(id: string)` - Find a single record by ID
- `findAll(options?: { limit?: number; offset?: number; where?: any })` - Find multiple records
- `create(data: any)` - Create a new record
- `update(id: string, data: any)` - Update an existing record
- `delete(id: string)` - Delete a record (if supported)

### Custom Finder Methods

- `findManyByEmail(email: string)` - Find records by email field
- `findManyByName(name: string)` - Find records by name field
- `findManyByUserId(userId: string)` - Find records by user ID
- `findManyByRoleId(roleId: string)` - Find records by role ID

## Best Practices

### 1. Use Type Safety

```typescript
// Define interfaces for your data
interface User {
  id: string;
  name: string;
  email: string;
  email_verified: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

// Use with repository
const userRepo = getRepository('users');
const user: User = await userRepo.findById('123');
```

### 2. Implement Caching

```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const user = await userRepo.findById(userId);
await cache.set(cacheKey, user);

return user;
```

### 3. Handle Errors Gracefully

```typescript
try {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error) {
  console.error('Error fetching user:', error);
  throw error;
}
```

### 4. Use Transactions for Complex Operations

```typescript
// Use Kysely for transactions
const kysely = getKysely();

await kysely.transaction().execute(async (trx) => {
  // Multiple operations in a transaction
  await trx.insertInto('users').values(userData).execute();
  await trx.insertInto('user_roles').values(roleData).execute();
});
```

## Next Steps

- [Kysely Integration](./03-kysely-integration.md) - Complex queries and joins
- [Production Features](./04-production-features.md) - Health checks, monitoring, optimization
- [Real-World Examples](./05-real-world-examples.md) - Authentication, RBAC, caching examples
