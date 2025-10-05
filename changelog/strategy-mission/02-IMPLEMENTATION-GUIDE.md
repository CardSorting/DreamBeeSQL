# NOORMME Implementation Guide

## What You're Building

**NOORMME** = Batteries-included framework for Next.js with zero-config SQLite, auth, admin, RBAC, and background jobs.

```bash
# One command creates a fully-featured app
npx create-noormme-app my-app
cd my-app
npm run dev

# You now have:
# ✅ SQLite database (configured)
# ✅ NextAuth (working)
# ✅ Admin panel (/admin)
# ✅ RBAC (roles & permissions)
# ✅ Background jobs (Queuebase)
```

## The Stack:

✅ **Database:** Zero-config SQLite (with auto-discovery)
✅ **Auth:** NextAuth pre-configured (never rewrite again)
✅ **Admin:** Auto-generated admin panel (Django admin vibes)
✅ **RBAC:** Built-in role-based access control
✅ **Queue:** Background jobs & task management (Queuebase)
✅ **Framework:** Next.js App Router
✅ **Language:** TypeScript
✅ **Philosophy:** "Just works"

---

## Technology Stack

### Core Dependencies
1. **Kysely** - Type-safe query builder (we use it directly, no wrapper)
2. **better-sqlite3** - SQLite driver for Node.js
3. **NextAuth** - Authentication (pre-configured)
4. **Queuebase** - Background jobs and task management
5. **TypeScript** - Full type safety

### Framework Stack
1. **Next.js 13+** - App Router (required)
2. **React Server Components** - For admin UI
3. **Server Actions** - For CRUD operations
4. **SQLite + WAL** - Database with optimal config
5. **TailwindCSS** - Zero-config utility-first CSS framework
6. **PostCSS** - CSS processing with TailwindCSS integration

---

## Architecture Overview

### Layer 1: CLI & Setup
**What it does:**
- Scaffolds Next.js project
- Auto-configures SQLite with WAL mode
- Sets up NextAuth with default providers
- Creates auth schemas (User, Session, Account)
- Generates admin panel routes
- Configures RBAC (Role, Permission models)
- Sets up Queuebase for background jobs

**Key files created:**
```
my-app/
├── src/
│   ├── server/                    # Server-only code
│   │   ├── actions/              # Server Actions
│   │   │   ├── auth-actions.ts   # Authentication actions
│   │   │   ├── user-actions.ts   # User management actions
│   │   │   └── admin-actions.ts  # Admin panel actions
│   │   ├── db/                   # Database layer
│   │   │   ├── index.ts          # Kysely instance, auto-configured
│   │   │   ├── queries/          # Server-only queries
│   │   │   └── types.ts          # Database types
│   │   ├── services/             # Business logic
│   │   │   ├── auth-service.ts   # Authentication service
│   │   │   ├── rbac-service.ts   # RBAC service
│   │   │   └── queue-service.ts  # Background job service
│   │   └── utils/                # Server utilities
│   │       ├── auth.ts           # Auth helpers
│   │       ├── rbac.ts           # RBAC helpers
│   │       └── queue.ts          # Queue utilities
│   ├── client/                   # Client-only code
│   │   ├── components/           # Interactive components
│   │   │   ├── ui/               # Base UI components
│   │   │   ├── forms/            # Form components
│   │   │   └── admin/            # Admin-specific components
│   │   ├── hooks/                # Client-side hooks
│   │   │   ├── use-auth.ts       # Authentication hook
│   │   │   └── use-admin.ts      # Admin utilities hook
│   │   └── utils/                # Client utilities
│   │       └── client-utils.ts   # Browser-specific utils
│   ├── shared/                   # Shared code
│   │   ├── components/           # Server/Client compatible
│   │   │   ├── layout/           # Layout components
│   │   │   └── ui/               # Shared UI components
│   │   ├── types/                # Shared TypeScript types
│   │   │   ├── auth.ts           # Auth types
│   │   │   ├── user.ts           # User types
│   │   │   └── api.ts            # API types
│   │   └── constants/            # Shared constants
│   │       ├── routes.ts         # Route definitions
│   │       └── permissions.ts    # Permission constants
│   └── app/                      # Next.js App Router
│       ├── admin/                # Auto-generated admin panel
│       │   ├── layout.tsx        # Server Component layout
│       │   ├── page.tsx          # Server Component dashboard
│       │   └── [resource]/       # Dynamic admin routes
│       ├── api/auth/             # NextAuth routes
│       ├── globals.css           # TailwindCSS imports
│       └── layout.tsx            # Root layout (Server Component)
├── tailwind.config.js            # Auto-configured TailwindCSS
├── postcss.config.js             # PostCSS configuration
└── noormme.config.ts             # Framework configuration
```

### Layer 2: Modern Database Architecture (Server-Only)
**What it does:**
- Provides configured Kysely instance (server-only)
- Auto-generates TypeScript types
- Connection pooling for serverless
- WAL mode for performance
- Strict server/client separation

**NOT building:** ORM abstraction layer
**Using:** Kysely's native API with modern architecture

```typescript
// src/server/db/index.ts (auto-generated, server-only)
import 'server-only';
import { Kysely } from 'kysely';
import { SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import type { Database as DB } from './types';

let db: Kysely<DB> | null = null;

export function getDatabase(): Kysely<DB> {
  if (!db) {
    db = new Kysely<DB>({
      dialect: new SqliteDialect({
        database: new Database('./database/app.db', {
          verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
        }),
      }),
    });

    // Enable WAL mode for performance
    db.executeSync("PRAGMA journal_mode = WAL");
    db.executeSync("PRAGMA synchronous = NORMAL");
    db.executeSync("PRAGMA foreign_keys = ON");
    db.executeSync("PRAGMA cache_size = -64000"); // 64MB cache
    db.executeSync("PRAGMA temp_store = MEMORY");
  }
  
  return db;
}

// Server-only database utilities
export async function withDatabase<T>(
  callback: (db: Kysely<DB>) => Promise<T>
): Promise<T> {
  const db = getDatabase();
  return await callback(db);
}

// Auto-generated types from database schema
// src/server/db/types.ts (auto-generated)
export interface Database {
  users: UserTable;
  sessions: SessionTable;
  accounts: AccountTable;
  roles: RoleTable;
  permissions: PermissionTable;
  role_permissions: RolePermissionTable;
  user_roles: UserRoleTable;
}

interface UserTable {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ... other table interfaces
```

### Layer 3: Modern Authentication (Auth.js v5 + Server Architecture)
**What it does:**
- Pre-configured Auth.js v5 setup with server/client separation
- SQLite adapter (using Kysely, server-only)
- User/Session/Account tables
- OAuth providers ready
- Modern middleware integration
- Server Actions for authentication

**Auto-generated (Modern Auth.js v5 with Server Architecture):**
```typescript
// src/server/services/auth-service.ts (server-only)
import 'server-only';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { KyselyAdapter } from '@noormme/auth-adapter';
import { getDatabase } from '../db';
import type { Session, User } from '../../shared/types/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: KyselyAdapter(getDatabase()),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }): Promise<Session> {
      if (session?.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'database',
  },
});

// Server-only authentication utilities
export async function getServerSession(): Promise<Session | null> {
  return await auth();
}

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

// src/server/actions/auth-actions.ts (Server Actions)
'use server';

import { signIn, signOut } from '../services/auth-service';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signInAction(provider: string) {
  await signIn(provider, { redirectTo: '/admin' });
}

export async function signOutAction() {
  await signOut();
  revalidatePath('/');
  redirect('/');
}

// src/shared/types/auth.ts (shared types)
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  expires: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}
```

### Layer 4: Modern Admin Panel (Server/Client Architecture + TailwindCSS)
**What it does:**
- Auto-generated CRUD UI with strict server/client separation
- Authentication-protected with modern middleware
- Responsive design with pre-configured TailwindCSS
- Role-based access control with Server Actions
- Zero-config styling with utility-first CSS
- Progressive enhancement patterns

**Modern Architecture with Server/Client Separation:**
```
src/app/admin/
├── layout.tsx              # Server Component layout
├── page.tsx                # Server Component dashboard
├── users/
│   ├── page.tsx            # Server Component (data fetching)
│   ├── [id]/
│   │   ├── page.tsx        # Server Component (view)
│   │   └── edit/
│   │       └── page.tsx    # Server Component wrapper
│   └── actions.ts          # Server Actions (mutations)
├── roles/
│   ├── page.tsx            # Server Component (data fetching)
│   └── actions.ts          # Server Actions (mutations)
└── globals.css             # TailwindCSS imports + custom admin styles

src/server/
├── actions/
│   ├── user-actions.ts     # Server Actions for user operations
│   └── admin-actions.ts    # Server Actions for admin operations
└── services/
    ├── admin-service.ts    # Server-only admin business logic
    └── user-service.ts     # Server-only user business logic

src/client/components/
├── admin/
│   ├── UserEditForm.tsx    # Client Component (interactive form)
│   ├── DataTable.tsx       # Client Component (table interactions)
│   ├── DeleteButton.tsx    # Client Component (confirmation dialog)
│   └── SearchInput.tsx     # Client Component (search functionality)
└── ui/
    ├── Button.tsx          # Client Component (button interactions)
    ├── Modal.tsx           # Client Component (modal behavior)
    └── FormField.tsx       # Client Component (form field logic)

src/shared/components/
├── layout/
│   ├── AdminLayout.tsx     # Server/Client compatible layout
│   └── Navigation.tsx      # Server Component navigation
└── ui/
    ├── Badge.tsx           # Server/Client compatible badge
    └── LoadingSpinner.tsx  # Server/Client compatible spinner
```

**Auto-generated TailwindCSS Configuration:**
```javascript
// tailwind.config.js (auto-generated)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // NOORMME brand colors
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Admin panel specific colors
        admin: {
          sidebar: '#1f2937',
          header: '#374151',
          content: '#f9fafb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

**Auto-generated Global CSS:**
```css
/* app/globals.css (auto-generated) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* NOORMME Admin Panel Custom Styles */
@layer components {
  .admin-sidebar {
    @apply bg-admin-sidebar text-white min-h-screen w-64 fixed left-0 top-0;
  }
  
  .admin-header {
    @apply bg-admin-header text-white p-4 ml-64;
  }
  
  .admin-content {
    @apply bg-admin-content min-h-screen ml-64 p-6;
  }
  
  .data-table {
    @apply bg-white shadow-sm rounded-lg overflow-hidden;
  }
  
  .data-table th {
    @apply bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }
  
  .data-table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .form-input {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
}
```

**Modern Component Patterns with Server/Client Separation:**

```typescript
// src/app/admin/users/page.tsx (Server Component - Data Fetching)
import { getServerSession } from '@/src/server/services/auth-service';
import { withDatabase } from '@/src/server/db';
import { UserDataTable } from '@/src/client/components/admin/UserDataTable';
import { AdminLayout } from '@/src/shared/components/layout/AdminLayout';
import type { User } from '@/src/shared/types/user';

export default async function UsersPage() {
  // Server-side authentication check
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  // Server-side data fetching
  const users = await withDatabase(async (db) => {
    return await db
      .selectFrom('users')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();
  });

  return (
    <AdminLayout title="Users" session={session}>
      <div className="admin-content">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <a 
            href="/admin/users/new" 
            className="btn-primary"
          >
            Add User
          </a>
        </div>
        
        {/* Client Component for interactivity */}
        <UserDataTable users={users} />
      </div>
    </AdminLayout>
  );
}

// src/client/components/admin/UserDataTable.tsx (Client Component - Interactivity)
'use client';

import { useState } from 'react';
import { deleteUserAction } from '@/src/server/actions/user-actions';
import type { User } from '@/src/shared/types/user';

interface UserDataTableProps {
  users: User[];
}

export function UserDataTable({ users }: UserDataTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    setIsDeleting(userId);
    try {
      await deleteUserAction(userId);
      // The page will revalidate automatically via Server Actions
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="data-table">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.name || 'No name'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <a
                    href={`/admin/users/${user.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={isDeleting === user.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {isDeleting === user.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// src/server/actions/user-actions.ts (Server Actions)
'use server';

import { withDatabase } from '../db';
import { requireAuth } from '../services/auth-service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteUserAction(userId: string) {
  // Server-side authentication and authorization
  const session = await requireAuth();
  
  // Server-side business logic
  await withDatabase(async (db) => {
    await db
      .deleteFrom('users')
      .where('id', '=', userId)
      .execute();
  });
  
  // Revalidate the page to show updated data
  revalidatePath('/admin/users');
}

export async function createUserAction(formData: FormData) {
  const session = await requireAuth();
  
  const userData = {
    email: formData.get('email') as string,
    name: formData.get('name') as string,
  };
  
  await withDatabase(async (db) => {
    await db
      .insertInto('users')
      .values({
        id: crypto.randomUUID(),
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  });
  
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
```

### Layer 5: Modern RBAC System (Server Actions + Type Safety)
**What it does:**
- Role and Permission models (auto-created)
- Modern middleware for route protection with Edge Runtime
- Type-safe Server Actions for authorization
- Admin UI for management with client/server separation
- Progressive enhancement patterns

**Modern RBAC Implementation:**
```typescript
// src/server/services/rbac-service.ts (Server-only)
import 'server-only';
import { withDatabase } from '../db';
import { getServerSession } from './auth-service';
import type { Session } from '../../shared/types/auth';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export async function getUserRoles(userId: string): Promise<Role[]> {
  return await withDatabase(async (db) => {
    const roles = await db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .leftJoin('role_permissions', 'role_permissions.role_id', 'roles.id')
      .leftJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('user_roles.user_id', '=', userId)
      .selectAll(['roles', 'permissions'])
      .execute();

    // Group permissions by role
    const roleMap = new Map<string, Role>();
    
    for (const row of roles) {
      if (!roleMap.has(row.roles.id)) {
        roleMap.set(row.roles.id, {
          id: row.roles.id,
          name: row.roles.name,
          description: row.roles.description,
          permissions: [],
        });
      }
      
      if (row.permissions) {
        const role = roleMap.get(row.roles.id)!;
        if (!role.permissions.find(p => p.id === row.permissions.id)) {
          role.permissions.push({
            id: row.permissions.id,
            name: row.permissions.name,
            resource: row.permissions.resource,
            action: row.permissions.action,
          });
        }
      }
    }
    
    return Array.from(roleMap.values());
  });
}

export async function requireRole(roleName: string): Promise<Session> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const userRoles = await getUserRoles(session.user.id);
  const hasRole = userRoles.some(role => role.name === roleName);
  
  if (!hasRole) {
    throw new Error(`Role '${roleName}' required`);
  }
  
  return session;
}

export async function requirePermission(resource: string, action: string): Promise<Session> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const userRoles = await getUserRoles(session.user.id);
  const hasPermission = userRoles.some(role =>
    role.permissions.some(permission =>
      permission.resource === resource && permission.action === action
    )
  );
  
  if (!hasPermission) {
    throw new Error(`Permission '${action}' on '${resource}' required`);
  }
  
  return session;
}

// src/server/actions/admin-actions.ts (Server Actions with RBAC)
'use server';

import { requireRole, requirePermission } from '../services/rbac-service';
import { withDatabase } from '../db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createRoleAction(formData: FormData) {
  await requireRole('admin');
  
  const roleData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  };
  
  await withDatabase(async (db) => {
    await db
      .insertInto('roles')
      .values({
        id: crypto.randomUUID(),
        ...roleData,
        createdAt: new Date(),
      })
      .execute();
  });
  
  revalidatePath('/admin/roles');
  redirect('/admin/roles');
}

export async function assignRoleToUserAction(userId: string, roleId: string) {
  await requirePermission('users', 'manage');
  
  await withDatabase(async (db) => {
    await db
      .insertInto('user_roles')
      .values({ user_id: userId, role_id: roleId })
      .execute();
  });
  
  revalidatePath('/admin/users');
}

// src/shared/types/rbac.ts (Shared types)
export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface UserRole {
  user_id: string;
  role_id: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

// src/app/admin/roles/page.tsx (Server Component with RBAC)
import { requireRole } from '@/src/server/services/rbac-service';
import { withDatabase } from '@/src/server/db';
import { RoleDataTable } from '@/src/client/components/admin/RoleDataTable';
import { AdminLayout } from '@/src/shared/components/layout/AdminLayout';

export default async function RolesPage() {
  // Server-side RBAC check
  const session = await requireRole('admin');
  
  // Server-side data fetching
  const roles = await withDatabase(async (db) => {
    return await db
      .selectFrom('roles')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();
  });

  return (
    <AdminLayout title="Roles" session={session}>
      <div className="admin-content">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <a href="/admin/roles/new" className="btn-primary">
            Add Role
          </a>
        </div>
        
        <RoleDataTable roles={roles} />
      </div>
    </AdminLayout>
  );
}

// src/client/hooks/use-auth.ts (Client-side auth hook)
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return {
    session,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };
}

export function useRequireAuth() {
  const { session, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return { session: null, isLoading: true, isAuthenticated: false };
  }
  
  if (!isAuthenticated) {
    return { session: null, isLoading: false, isAuthenticated: false };
  }
  
  return { session, isLoading: false, isAuthenticated: true };
}
```

**Modern Middleware with Edge Runtime:**
```typescript
// middleware.ts (Edge Runtime - Modern Next.js 15+)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/src/server/services/auth-service';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const session = await auth();
      
      if (!session?.user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Add user info to headers for server components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', session.user.id);
      requestHeaders.set('x-user-email', session.user.email);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/protected/:path*',
  ],
};

// src/server/utils/auth.ts (Server-only auth utilities)
import 'server-only';
import { headers } from 'next/headers';
import { getServerSession } from '../services/auth-service';

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const headersList = headers();
  const userId = headersList.get('x-user-id');
  return userId;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
```

**TypeScript Patterns for Server/Client Separation:**
```typescript
// src/shared/types/api.ts (Shared API types)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// src/shared/types/user.ts (Shared user types)
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
}

// src/server/types/database.ts (Server-only database types)
import 'server-only';
import type { Database } from '../db/types';

// Re-export with server-only marker
export type { Database };

// Server-only query result types
export type UserWithRoles = Database['users'] & {
  roles: Database['roles'][];
};

export type RoleWithPermissions = Database['roles'] & {
  permissions: Database['permissions'][];
};

// src/client/types/hooks.ts (Client-only hook types)
'use client';

export interface UseAuthReturn {
  session: any; // Will be properly typed with NextAuth
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface UseRequireAuthReturn extends UseAuthReturn {
  // Additional client-specific properties
}

// src/shared/utils/validation.ts (Shared validation utilities)
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

export const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type UserInput = z.infer<typeof userSchema>;
export type RoleInput = z.infer<typeof roleSchema>;

// src/server/utils/validation.ts (Server-only validation)
import 'server-only';
import { userSchema, roleSchema } from '../../shared/utils/validation';

export async function validateUserInput(data: unknown) {
  return await userSchema.parseAsync(data);
}

export async function validateRoleInput(data: unknown) {
  return await roleSchema.parseAsync(data);
}

// src/client/utils/client-validation.ts (Client-only validation)
'use client';

import { userSchema, roleSchema } from '../../shared/utils/validation';

export function validateUserInputClient(data: unknown) {
  return userSchema.safeParse(data);
}

export function validateRoleInputClient(data: unknown) {
  return roleSchema.safeParse(data);
}
```

**Auto-generated models:**
```typescript
// Auto-created tables:
CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id TEXT REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

### Layer 6: Queue & Task Management (Queuebase)
**What it does:**
- Zero-config background job processing
- Auto-generated task definitions
- Admin panel integration for monitoring
- Type-safe task handlers
- Scheduled jobs and retries

**Auto-generated queue setup:**
```typescript
// lib/queue.ts (auto-generated)
import { Queuebase } from '@queuebase/sdk';

export const queue = new Queuebase({
  apiKey: process.env.QUEUEBASE_API_KEY,
  projectId: process.env.QUEUEBASE_PROJECT_ID,
});

// lib/tasks.ts (auto-generated)
export const tasks = {
  // Auth-related tasks
  sendWelcomeEmail: queue.task('send-welcome-email'),
  sendPasswordReset: queue.task('send-password-reset'),
  
  // Data processing tasks
  processUserUpload: queue.task('process-user-upload'),
  generateUserReport: queue.task('generate-user-report'),
  
  // Maintenance tasks
  cleanupExpiredSessions: queue.task('cleanup-expired-sessions'),
  backupDatabase: queue.task('backup-database'),
};

// lib/task-handlers.ts (auto-generated)
import { db } from './db';

export async function handleSendWelcomeEmail(payload: { userId: string }) {
  const user = await db
    .selectFrom('users')
    .where('id', '=', payload.userId)
    .selectAll()
    .executeTakeFirstOrThrow();
    
  // Send email logic here
  console.log(`Sending welcome email to ${user.email}`);
}

export async function handleProcessUserUpload(payload: { userId: string, fileUrl: string }) {
  // File processing logic here
  console.log(`Processing upload for user ${payload.userId}`);
}

export async function handleCleanupExpiredSessions() {
  const deleted = await db
    .deleteFrom('sessions')
    .where('expires', '<', new Date())
    .execute();
    
  console.log(`Cleaned up ${deleted.length} expired sessions`);
}
```

---

## Implementation Roadmap

### Phase 1: Project Generator (Week 1) ⚡

**Goal:** One command creates working app

**Tasks:**
1. Build `create-noormme-app` CLI
2. Scaffold Next.js project with templates
3. Auto-configure SQLite (WAL, pragmas, optimal settings)
4. Generate auth schemas
5. Set up NextAuth with adapter
6. Create initial migration

**Success:** User has working app in 2 minutes

### Phase 2: Modern Admin Panel (Week 2-3) ⚡

**Goal:** Auto-generated admin interface using modern Next.js patterns

**Features:**
- Server Components for data fetching
- Client Components for interactivity
- Server Actions for mutations
- Table list view (all tables from DB)
- CRUD operations per table
- Relationship handling
- Search and filters
- Bulk actions
- Export to CSV
- Progressive enhancement

**Modern Implementation:**
```typescript
// app/admin/users/page.tsx (Server Component)
import { DataTable } from '@/components/DataTable';
import { getCachedUsers } from '@/lib/db-utils';

export default async function UsersPage() {
  const users = await getCachedUsers();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <DataTable 
        data={users}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'createdAt', label: 'Created' },
        ]}
      />
    </div>
  );
}

// app/admin/users/actions.ts (Server Actions)
'use server';

import { requireRole } from '@/lib/rbac';
import { withDatabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteUser(id: string) {
  await requireRole('admin');
  
  await withDatabase(async (db) => {
    await db
      .deleteFrom('users')
      .where('id', '=', id)
      .execute();
  });
  
  revalidatePath('/admin/users');
}
```

**Inspiration:** Django admin, but React with modern patterns

### Phase 3: Modern RBAC System (Week 4) 📋

**Goal:** Built-in permission system with modern Next.js patterns

**Features:**
- Role definitions with database storage
- Permission checks with Server Actions
- Modern middleware with Edge Runtime
- Route protection with redirects
- Component-level protection
- Progressive enhancement

**Modern Implementation:**
```typescript
// lib/rbac.ts (Modern patterns)
import { auth } from './auth';
import { withDatabase } from './db';
import { redirect } from 'next/navigation';

export async function requireRole(role: string) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const hasRole = await withDatabase(async (db) => {
    return await db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', '=', session.user.id)
      .where('roles.name', '=', role)
      .executeTakeFirst();
  });

  if (!hasRole) {
    redirect('/unauthorized');
  }
  
  return session;
}

// middleware.ts (Edge Runtime)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Phase 4: Modern Auth Integration (Week 5) 📋

**Goal:** Auth.js v5 fully configured and working with modern patterns

**Features:**
- Pre-configured for SQLite with Kysely adapter
- Email/password authentication
- OAuth provider support (GitHub, Google, etc.)
- Modern session management
- User registration flow with Server Actions
- Progressive enhancement

### Phase 5: Queue & Task Management (Week 6) ⚡

**Goal:** Background jobs with Queuebase integration

**Features:**
- Zero-config task queue setup
- Auto-generated task definitions
- Admin panel integration for monitoring
- Type-safe task handlers
- Scheduled jobs and retries
- CLI commands for task management

**Modern Implementation:**
```typescript
// Auto-generated task management in admin panel
// app/admin/tasks/page.tsx (Server Component)
import { DataTable } from '@/components/DataTable';
import { getCachedTasks } from '@/lib/task-utils';

export default async function TasksPage() {
  const tasks = await getCachedTasks();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Background Tasks</h1>
      <DataTable 
        data={tasks}
        columns={[
          { key: 'name', label: 'Task Name' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Created' },
          { key: 'attempts', label: 'Attempts' },
        ]}
      />
    </div>
  );
}

// Task usage in Server Actions
// app/admin/users/actions.ts
'use server';

import { requireRole } from '@/lib/rbac';
import { withDatabase } from '@/lib/db';
import { tasks } from '@/lib/tasks';
import { revalidatePath } from 'next/cache';

export async function createUser(userData: UserData) {
  await requireRole('admin');
  
  const user = await withDatabase(async (db) => {
    return await db
      .insertInto('users')
      .values(userData)
      .returningAll()
      .executeTakeFirstOrThrow();
  });
  
  // Queue welcome email
  await tasks.sendWelcomeEmail.enqueue({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  
  revalidatePath('/admin/users');
  return user;
}
```

**Modern Implementation:**
```typescript
// app/login/page.tsx (Server Component)
import { SignInForm } from '@/components/SignInForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <SignInForm />
      </div>
    </div>
  );
}

// components/SignInForm.tsx (Client Component with Server Actions)
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        callbackUrl: '/admin',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="mt-8 space-y-6">
      <div>
        <input
          name="email"
          type="email"
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Email address"
        />
      </div>
      <div>
        <input
          name="password"
          type="password"
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Password"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

**Files to create:**
```
packages/
├── create-noormme-app/
│   ├── index.ts              # CLI entry
│   ├── templates/
│   │   ├── base/             # Next.js base
│   │   ├── lib/
│   │   │   ├── db.ts.template
│   │   │   ├── auth.ts.template
│   │   │   └── rbac.ts.template
│   │   ├── app/
│   │   │   └── api/auth/
│   │   └── migrations/
│   │       └── 001_initial.sql
│   └── utils/
│       ├── scaffold.ts
│       └── database.ts
```

**Key implementation:**
```typescript
// packages/create-noormme-app/index.ts
import { Command } from 'commander';
import { scaffold } from './utils/scaffold';

const program = new Command();

program
  .name('create-noormme-app')
  .argument('<project-name>')
  .action(async (projectName) => {
    console.log(`Creating NOORMME app: ${projectName}`);

    // 1. Scaffold Next.js project
    await scaffold.createNextApp(projectName);

    // 2. Install dependencies
    await scaffold.installDependencies([
      'kysely',
      'better-sqlite3',
      'next-auth',
      '@noormme/nextauth-adapter',
      '@queuebase/sdk',
      // TailwindCSS and styling dependencies
      'tailwindcss',
      'postcss',
      'autoprefixer',
      '@tailwindcss/forms',
      '@tailwindcss/typography',
      // Modern architecture dependencies
      'server-only',
      'client-only',
      'zod',
      '@types/better-sqlite3',
    ]);

    // 3. Create modern folder structure
    await scaffold.createModernStructure(projectName);

    // 4. Copy templates with server/client separation
    await scaffold.copyTemplates(projectName);

    // 5. Configure TailwindCSS
    await scaffold.configureTailwindCSS(projectName);

    // 6. Initialize database
    await scaffold.initializeDatabase(projectName);

    // 7. Run initial migration
    await scaffold.runMigration(projectName, '001_initial.sql');

    // 8. Generate TypeScript configuration
    await scaffold.generateTypeScriptConfig(projectName);

    console.log('✅ Done! Run: cd', projectName, '&& npm run dev');
  });

program.parse();
```

**Database initialization:**
```typescript
// utils/database.ts
export async function initializeDatabase(projectPath: string) {
  const dbPath = path.join(projectPath, 'database', 'app.db');

  // Create database directory
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  // Initialize SQLite with optimal settings
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Optimize for performance
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 30000000000'); // 30GB mmap

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  db.close();
}

// TailwindCSS configuration
export async function configureTailwindCSS(projectPath: string) {
  // Create tailwind.config.js
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        admin: {
          sidebar: '#1f2937',
          header: '#374151',
          content: '#f9fafb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}`;

  await fs.writeFile(
    path.join(projectPath, 'tailwind.config.js'),
    tailwindConfig
  );

  // Create postcss.config.js
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  await fs.writeFile(
    path.join(projectPath, 'postcss.config.js'),
    postcssConfig
  );

  // Create enhanced globals.css with admin panel styles
  const globalsCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* NOORMME Admin Panel Custom Styles */
@layer components {
  .admin-sidebar {
    @apply bg-admin-sidebar text-white min-h-screen w-64 fixed left-0 top-0;
  }
  
  .admin-header {
    @apply bg-admin-header text-white p-4 ml-64;
  }
  
  .admin-content {
    @apply bg-admin-content min-h-screen ml-64 p-6;
  }
  
  .data-table {
    @apply bg-white shadow-sm rounded-lg overflow-hidden;
  }
  
  .data-table th {
    @apply bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }
  
  .data-table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .form-input {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
}`;

  await fs.writeFile(
    path.join(projectPath, 'app', 'globals.css'),
    globalsCSS
  );
}

// Modern folder structure creation
export async function createModernStructure(projectPath: string) {
  const directories = [
    'src/server/actions',
    'src/server/db/queries',
    'src/server/services',
    'src/server/utils',
    'src/client/components/ui',
    'src/client/components/admin',
    'src/client/hooks',
    'src/client/utils',
    'src/shared/components/layout',
    'src/shared/components/ui',
    'src/shared/types',
    'src/shared/utils',
    'src/shared/constants',
    'src/app/admin',
    'src/app/api/auth',
    'database',
  ];

  for (const dir of directories) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }

  // Create .gitkeep files for empty directories
  const gitkeepFiles = [
    'src/server/actions/.gitkeep',
    'src/server/db/queries/.gitkeep',
    'src/client/components/ui/.gitkeep',
    'src/shared/components/ui/.gitkeep',
  ];

  for (const gitkeep of gitkeepFiles) {
    await fs.writeFile(path.join(projectPath, gitkeep), '');
  }
}

// TypeScript configuration generation
export async function generateTypeScriptConfig(projectPath: string) {
  // Create tsconfig.json with modern settings
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'es6'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next',
        },
      ],
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
        '@/server/*': ['./src/server/*'],
        '@/client/*': ['./src/client/*'],
        '@/shared/*': ['./src/shared/*'],
      },
    },
    include: [
      'next-env.d.ts',
      '**/*.ts',
      '**/*.tsx',
      '.next/types/**/*.ts',
    ],
    exclude: ['node_modules'],
  };

  await fs.writeFile(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create path mapping file for better imports
  const pathMapping = `// Auto-generated path mappings for NOORMME
// This file helps with import resolution in the modern architecture

export const paths = {
  server: {
    actions: '@/server/actions',
    db: '@/server/db',
    services: '@/server/services',
    utils: '@/server/utils',
  },
  client: {
    components: '@/client/components',
    hooks: '@/client/hooks',
    utils: '@/client/utils',
  },
  shared: {
    components: '@/shared/components',
    types: '@/shared/types',
    utils: '@/shared/utils',
    constants: '@/shared/constants',
  },
} as const;

export type Paths = typeof paths;
`;

  await fs.writeFile(
    path.join(projectPath, 'src', 'paths.ts'),
    pathMapping
  );
}
```

## Configuration API

**noormme.config.ts**
```typescript
import { defineConfig } from 'noormme'

export default defineConfig({
  // Database (optional, defaults work)
  database: {
    path: './prisma/dev.db',
    migrations: './migrations'
  },
  
  // Auth (optional, add OAuth if wanted)
  auth: {
    providers: {
      // google: { ... }
      // github: { ... }
    },
    pages: {
      signIn: '/login',  // Customize if wanted
    }
  },
  
  // Admin (optional, customize if wanted)
  admin: {
    path: '/admin',
    title: 'My App Admin',
    exclude: ['sessions', 'tokens']  // Hide tables
  },
  
  // RBAC (optional, extend if wanted)
  rbac: {
    roles: {
      // Custom roles
    }
  },
  
  // Queue (optional, customize if wanted)
  queue: {
    provider: 'queuebase',
    apiKey: process.env.QUEUEBASE_API_KEY,
    projectId: process.env.QUEUEBASE_PROJECT_ID,
    
    // Auto-configured tasks
    tasks: {
      'send-welcome-email': {
        retries: 3,
        timeout: 30000,
        description: 'Send welcome email to new users'
      },
      'process-upload': {
        retries: 5,
        timeout: 60000,
        description: 'Process user file uploads'
      },
      'cleanup-sessions': {
        schedule: '0 2 * * *',
        description: 'Clean up expired sessions daily'
      },
    },
  }
})
```

**Philosophy:** Everything works with zero config, customize if you want.

**File structure:**
```
packages/
├── noormme-admin/
│   ├── components/
│   │   ├── DataTable.tsx      # Generic table
│   │   ├── Form.tsx           # Generic form
│   │   ├── Navigation.tsx     # Sidebar
│   │   └── Field/
│   │       ├── TextField.tsx
│   │       ├── SelectField.tsx
│   │       └── DateField.tsx
│   ├── generators/
│   │   ├── page-generator.ts   # Generate CRUD pages
│   │   └── action-generator.ts # Generate Server Actions
│   └── templates/
│       ├── list-page.tsx.template
│       ├── detail-page.tsx.template
│       └── form-page.tsx.template
```

**DataTable component:**
```typescript
// packages/noormme-admin/components/DataTable.tsx
'use client';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  onEdit,
  onDelete
}: DataTableProps<T>) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(item[col.key])
                  : String(item[col.key])}
              </td>
            ))}
            <td>
              {onEdit && (
                <button onClick={() => onEdit(item)}>Edit</button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(item)}>Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Page generator:**
```typescript
// packages/noormme-admin/generators/page-generator.ts
export function generateListPage(model: ModelSchema) {
  return `
import { db } from '@/lib/db';
import { DataTable } from '@noormme/admin/components/DataTable';

export default async function ${model.name}ListPage() {
  const items = await db
    .selectFrom('${model.tableName}')
    .selectAll()
    .execute();

  return (
    <div>
      <h1>${model.displayName}</h1>
      <DataTable
        data={items}
        columns={[
          ${model.fields.map(f => `{ key: '${f.name}', label: '${f.label}' }`).join(',\n          ')}
        ]}
      />
    </div>
  );
}
  `.trim();
}
```

### Phase 3: RBAC Implementation 📋

**Goal:** Role-based access control out-of-box

**Tasks:**
1. Create Role and Permission models
2. Build middleware for route protection
3. Create helpers for Server Actions
4. Add admin UI for role management

**RBAC helpers:**
```typescript
// lib/rbac.ts (auto-generated)
import { auth } from './auth';
import { db } from './db';

export async function requireRole(roleName: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasRole = await db
    .selectFrom('user_roles')
    .innerJoin('roles', 'roles.id', 'user_roles.role_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('roles.name', '=', roleName)
    .selectAll()
    .executeTakeFirst();

  if (!hasRole) {
    throw new Error(`Forbidden: Requires ${roleName} role`);
  }
}

export async function requirePermission(
  resource: string,
  action: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await db
    .selectFrom('user_roles')
    .innerJoin('role_permissions', 'role_permissions.role_id', 'user_roles.role_id')
    .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
    .where('user_roles.user_id', '=', session.user.id)
    .where('permissions.resource', '=', resource)
    .where('permissions.action', '=', action)
    .selectAll()
    .executeTakeFirst();

  if (!hasPermission) {
    throw new Error(`Forbidden: Requires ${action} on ${resource}`);
  }
}
```

**Usage in Server Actions:**
```typescript
'use server';

import { requireRole } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function deleteUser(id: string) {
  await requireRole('admin');

  return db
    .deleteFrom('users')
    .where('id', '=', id)
    .execute();
}
```

### Phase 4: Schema Management 📋

**Goal:** Zero-boilerplate schema definition and migrations

**Tasks:**
1. Create schema DSL (TypeScript-based)
2. Auto-generate migrations from schema changes
3. Migration runner (dev auto-applies, prod generates files)
4. Type generation from schemas

**Schema DSL:**
```typescript
// schemas/user.ts
import { schema } from '@noormme/core';

export const User = schema.table('users', {
  id: schema.text().primaryKey(),
  email: schema.text().unique().notNull(),
  name: schema.text(),
  emailVerified: schema.datetime(),
  image: schema.text(),
  createdAt: schema.datetime().default('CURRENT_TIMESTAMP'),
  updatedAt: schema.datetime().default('CURRENT_TIMESTAMP'),
});

// Auto-generates migration:
// migrations/002_add_users.sql
```

**Migration generator:**
```typescript
// packages/noormme-core/schema/migrator.ts
export async function generateMigration(
  schema: SchemaDefinition,
  currentDb: Kysely<any>
) {
  // 1. Introspect current database
  const currentSchema = await introspect(currentDb);

  // 2. Diff with new schema
  const changes = diff(currentSchema, schema);

  // 3. Generate SQL migration
  const sql = changes.map(change => {
    if (change.type === 'add_table') {
      return `CREATE TABLE ${change.table} (${change.columns.join(', ')});`;
    }
    if (change.type === 'add_column') {
      return `ALTER TABLE ${change.table} ADD COLUMN ${change.column};`;
    }
    // ... other change types
  }).join('\n');

  // 4. Save migration file
  const timestamp = Date.now();
  await fs.writeFile(
    `migrations/${timestamp}_auto.sql`,
    sql
  );
}
```

### Phase 5: CLI Tools 📋

**Goal:** Developer experience tools

**Tasks:**
1. `noormme dev` - dev server with hot reload
2. `noormme db:migrate` - run migrations
3. `noormme db:seed` - seed database
4. `noormme generate:model` - scaffold model
5. `noormme generate:task` - scaffold background task
6. `noormme queue:dashboard` - view task dashboard
7. `noormme queue:retry` - retry failed tasks

**CLI implementation:**
```typescript
// packages/noormme-cli/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .command('dev')
  .description('Start dev server with auto-migration')
  .action(async () => {
    // Run migrations
    await runMigrations();

    // Start Next.js dev
    spawn('next', ['dev'], { stdio: 'inherit' });
  });

program
  .command('db:migrate')
  .description('Run database migrations')
  .action(async () => {
    await runMigrations();
  });

program
  .command('generate:model <name>')
  .description('Generate a new model')
  .action(async (name) => {
    await generateModel(name);
  });

program
  .command('generate:task <name>')
  .description('Generate a new background task')
  .action(async (name) => {
    await generateTask(name);
  });

program
  .command('queue:dashboard')
  .description('View task dashboard')
  .action(async () => {
    await openTaskDashboard();
  });

program
  .command('queue:retry')
  .description('Retry failed tasks')
  .option('--all', 'Retry all failed tasks')
  .action(async (options) => {
    await retryFailedTasks(options.all);
  });

program.parse();
```

---

## Critical Implementation Details

### 1. Zero Config Philosophy

**Key principle:** Everything works immediately, customization optional

```typescript
// Default config (noormme.config.ts)
export default {
  database: {
    path: './database/app.db',
    wal: true,
    pool: {
      min: 1,
      max: 10,
    },
  },
  admin: {
    enabled: true,
    path: '/admin',
    title: 'Admin Panel',
  },
  auth: {
    providers: ['github'], // Pre-configured
  },
  rbac: {
    enabled: true,
    defaultRole: 'user',
  },
};
```

### 2. Type Safety Throughout

**Strategy:** Generate types from schemas, use Kysely's inference

```typescript
// Auto-generated: types/db.ts
export interface DB {
  users: UserTable;
  sessions: SessionTable;
  accounts: AccountTable;
  roles: RoleTable;
  permissions: PermissionTable;
  role_permissions: RolePermissionTable;
  user_roles: UserRoleTable;
}

// Usage (fully typed):
const users = await db
  .selectFrom('users')
  .where('email', '=', 'test@example.com')
  .selectAll()
  .execute(); // Type: UserTable[]
```

### 3. Admin Panel Architecture

**Component hierarchy:**
```
AdminLayout (auth check, navigation)
├── Dashboard (overview)
├── ModelList (generic table view)
│   └── DataTable (reusable)
├── ModelDetail (view/edit)
│   └── Form (reusable)
├── TaskManagement (background jobs)
│   ├── TaskList (queue status)
│   ├── TaskDetail (execution logs)
│   └── TaskActions (retry, cancel)
└── ModelDelete (confirmation)
```

### 4. NextAuth Adapter

**Kysely-based adapter:**
```typescript
// packages/noormme-nextauth-adapter/index.ts
import { Adapter } from 'next-auth/adapters';
import { Kysely } from 'kysely';

export function KyselyAdapter(db: Kysely<any>): Adapter {
  return {
    async createUser(data) {
      const user = await db
        .insertInto('users')
        .values({
          id: crypto.randomUUID(),
          ...data,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return user;
    },

    async getUser(id) {
      return await db
        .selectFrom('users')
        .where('id', '=', id)
        .selectAll()
        .executeTakeFirst() ?? null;
    },

    // ... other adapter methods
  };
}
```

---

## File Structure (Full Framework)

```
noormme/
├── packages/
│   ├── create-noormme-app/      # CLI for scaffolding
│   │   ├── templates/
│   │   └── index.ts
│   │
│   ├── noormme-core/            # Core utilities
│   │   ├── schema/              # Schema DSL
│   │   ├── migrations/          # Migration tools
│   │   └── generators/          # Code generation
│   │
│   ├── noormme-admin/           # Admin panel
│   │   ├── components/          # UI components
│   │   └── generators/          # Page generation
│   │
│   ├── noormme-cli/             # CLI tools
│   │   └── commands/
│   │
│   └── noormme-nextauth-adapter/ # NextAuth adapter
│       └── index.ts
│
└── examples/
    └── basic-app/               # Example generated app
```

---

## Testing Strategy

### 1. CLI Tests
```typescript
describe('create-noormme-app', () => {
  it('should scaffold project', async () => {
    await createApp('test-app');

    expect(fs.existsSync('test-app/lib/db.ts')).toBe(true);
    expect(fs.existsSync('test-app/app/admin')).toBe(true);
  });
});
```

### 2. Admin Generation Tests
```typescript
describe('Admin Generator', () => {
  it('should generate list page', () => {
    const code = generateListPage({
      name: 'User',
      tableName: 'users',
      fields: [{ name: 'email', label: 'Email' }],
    });

    expect(code).toContain('selectFrom');
    expect(code).toContain('DataTable');
  });
});
```

### 3. RBAC Tests
```typescript
describe('RBAC', () => {
  it('should enforce role requirement', async () => {
    await expect(
      requireRole('admin')
    ).rejects.toThrow('Forbidden');
  });
});
```

### 4. Queue & Task Tests
```typescript
describe('Queue System', () => {
  it('should enqueue welcome email task', async () => {
    const result = await tasks.sendWelcomeEmail.enqueue({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
    
    expect(result.id).toBeDefined();
    expect(result.status).toBe('pending');
  });
  
  it('should handle task execution', async () => {
    const payload = { userId: 'user-123' };
    await expect(
      handleSendWelcomeEmail(payload)
    ).resolves.not.toThrow();
  });
});
```

---

## Performance Considerations

### 1. SQLite Optimization
- WAL mode enabled by default
- Optimized pragmas (cache, mmap)
- Connection pooling for serverless

### 2. Admin Panel
- RSC for server-side rendering
- Pagination for large tables
- Lazy loading for relationships

### 3. Type Generation
- Cache generated types
- Only regenerate on schema changes
- Use incremental build

### 4. Queue & Task Management
- Background job processing with Queuebase
- Task retry logic and error handling
- Admin panel integration for monitoring
- Type-safe task definitions and handlers

---

## Success Criteria

**Technical:**
- npx create-noormme-app generates working app
- User can log in immediately
- Admin panel shows all tables
- CRUD operations work
- RBAC protects routes
- Background jobs work out-of-box
- All batteries included

**Developer Experience:**
- Working app in < 5 minutes
- Never write auth setup again
- Never build admin CRUD again
- Never implement RBAC again
- Never set up background jobs again
- Just build features

## Comparison:
- Django: Batteries included, but Python
- NOORMME: Batteries included, but Next.js 🔥

## Non-Goals
What We're NOT:
- ❌ Multi-database (SQLite only, that's the point)
- ❌ Headless CMS (we're a framework)
- ❌ Low-code builder (we're for developers)
- ❌ Everything to everyone (we're focused)

## Timeline
**Month 1:**
- Week 1: CLI/generator
- Week 2-3: Admin panel
- Week 4: RBAC system

**Month 2:**
- Week 1: Auth integration
- Week 2-3: Documentation
- Week 4: Example apps

**Month 3:**
- Polish
- Testing
- Launch

---

## Resources

- [Kysely Documentation](https://kysely.dev/)
- [NextAuth Documentation](https://authjs.dev/)
- [SQLite Optimization](https://www.sqlite.org/pragma.html)
- [Next.js App Router](https://nextjs.org/docs/app)
