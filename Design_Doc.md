# Flick — Design Plan (Vercel Edition)

## What It Is

A social app where your movie taste is your profile. You swipe on movies casually, your "want to watch" list is visible to friends, and the app silently finds overlap. When movie night comes, matches are already waiting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Vercel                                     │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     Your Git Repository                         │   │
│   │                                                                 │   │
│   │   ┌─────────────┐     ┌─────────────────────────────────────┐   │   │
│   │   │   /app      │     │         /app/api                    │   │   │
│   │   │   (React)   │     │     (Serverless Functions)          │   │   │
│   │   │             │     │                                     │   │   │
│   │   │  - Pages    │     │  /api/auth/[...nextauth]  → Auth    │   │   │
│   │   │  - Components     │  /api/movies/*            → TMDB    │   │   │
│   │   │  - Hooks    │     │  /api/swipes/*            → Swipes  │   │   │
│   │   │             │     │  /api/friends/*           → Social  │   │   │
│   │   └─────────────┘     └──────────────┬──────────────────────┘   │   │
│   │                                      │                          │   │
│   └──────────────────────────────────────┼──────────────────────────┘   │
│                                          │                              │
│                                          ▼                              │
│                              ┌───────────────────┐                      │
│                              │   Neon Postgres   │                      │
│                              │   (via Vercel     │                      │
│                              │    Marketplace)   │                      │
│                              └───────────────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   flick.vercel.app  │
                         │         or          │
                         │ flick.yourdomain.com|
                         └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 14 (App Router) | Vercel's native framework, best DX |
| UI | React + Tailwind CSS | Fast styling, great defaults |
| Swipe gestures | react-tinder-card | Proven swipe UX |
| Database | Neon Postgres (Vercel Marketplace) | One-click setup, serverless-native, connection pooling |
| ORM | Drizzle | Type-safe, lightweight, great for serverless |
| Auth | Auth.js v5 | Built for Next.js, handles OAuth cleanly |
| Movie data | TMDB API | Free, comprehensive, poster images |
| Real-time | Pusher or Ably | Serverless-friendly real-time (optional) |
| Deployment | Vercel | Git push = deploy |

---

## Project Structure

```
flick/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing / login page
│   ├── globals.css                # Tailwind imports
│   │
│   ├── (auth)/                    # Auth-required routes (grouped)
│   │   ├── swipe/
│   │   │   └── page.tsx           # Main swipe interface
│   │   ├── feed/
│   │   │   └── page.tsx           # Social feed
│   │   ├── friends/
│   │   │   ├── page.tsx           # Friend list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Friend profile + matches
│   │   ├── groups/
│   │   │   ├── page.tsx           # Group list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Group view + matches
│   │   ├── tonight/
│   │   │   └── page.tsx           # Quick picker
│   │   └── profile/
│   │       └── page.tsx           # Your queue, history, settings
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts       # Auth.js handler
│       ├── movies/
│       │   ├── discover/
│       │   │   └── route.ts       # GET: swipeable movies
│       │   ├── search/
│       │   │   └── route.ts       # GET: search movies
│       │   └── [tmdbId]/
│       │       └── route.ts       # GET: movie details
│       ├── swipes/
│       │   ├── route.ts           # POST: record swipe, GET: my queue
│       │   └── mine/
│       │       └── route.ts       # GET: my want-to-watch list
│       ├── friends/
│       │   ├── route.ts           # GET: list, POST: request
│       │   ├── [friendshipId]/
│       │   │   ├── accept/
│       │   │   │   └── route.ts   # POST: accept request
│       │   │   └── decline/
│       │   │       └── route.ts   # POST: decline request
│       │   └── [userId]/
│       │       └── matches/
│       │           └── route.ts   # GET: matches with friend
│       ├── groups/
│       │   ├── route.ts           # GET: my groups, POST: create
│       │   └── [groupId]/
│       │       ├── route.ts       # GET: group details
│       │       ├── matches/
│       │       │   └── route.ts   # GET: group matches
│       │       └── members/
│       │           └── route.ts   # POST: add member
│       ├── feed/
│       │   └── route.ts           # GET: friend activity
│       └── watches/
│           └── route.ts           # GET: history, POST: log watch
│
├── components/
│   ├── SwipeCard.tsx              # Individual movie card for swiping
│   ├── SwipeDeck.tsx              # Container managing the card stack
│   ├── MovieCard.tsx              # Movie display (non-swipe contexts)
│   ├── FeedItem.tsx               # Single feed entry
│   ├── FriendList.tsx             # List of friends with match counts
│   ├── MatchList.tsx              # Movies you both want to watch
│   ├── Navbar.tsx                 # Navigation
│   └── Providers.tsx              # Session + query providers wrapper
│
├── lib/
│   ├── db/
│   │   ├── index.ts               # Drizzle client + connection
│   │   ├── schema.ts              # All table definitions (including Auth.js tables)
│   │   └── migrations/            # Generated migration files
│   ├── auth.ts                    # Auth.js configuration (with adapter)
│   ├── auth.config.ts             # Auth.js config (edge-safe, no DB)
│   ├── tmdb.ts                    # TMDB API wrapper with caching
│   └── utils.ts                   # Shared utilities
│
├── hooks/
│   ├── useSwipe.ts                # Swipe logic + API calls
│   ├── useFriends.ts              # Friend data fetching
│   └── useMatches.ts              # Match calculations
│
├── drizzle.config.ts              # Drizzle ORM configuration
├── middleware.ts                  # Auth middleware (edge-safe)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── .env.local                     # Local environment variables (git-ignored)
├── .env.example                   # Template for required env vars
├── .gitignore
└── README.md
```

---

## Database Schema (Drizzle)

Drizzle is a TypeScript ORM that generates SQL migrations and provides type-safe queries. The schema below includes both the Auth.js adapter tables (required for the database session strategy) and the app-specific tables.

When you run `drizzle-kit generate`, it creates migration files. When you run `drizzle-kit push`, it applies them to your database.

```typescript
// lib/db/schema.ts

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  integer,
  primaryKey,
  uniqueIndex,
  index,
  boolean
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// ============================================================================
// AUTH.JS ADAPTER TABLES
// ============================================================================
// These tables are REQUIRED for the Drizzle adapter to work with Auth.js.
// The schema follows the official Auth.js Drizzle adapter specification.
// See: https://authjs.dev/getting-started/adapters/drizzle

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  // App-specific fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).$type<AdapterAccountType>().notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// ============================================================================
// FRIENDSHIPS
// ============================================================================
// 
// We store friendships with a canonical ordering constraint: user_a < user_b.
// This prevents duplicate rows like (Alice, Bob) and (Bob, Alice).
// The `requestedBy` field tracks who initiated the request.
//
// In application code, when creating a friendship, always sort the IDs:
//   const [userA, userB] = [id1, id2].sort();
//   await db.insert(friendships).values({ userA, userB, requestedBy: id1 });

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userA: uuid('user_a').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userB: uuid('user_b').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  requestedBy: uuid('requested_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on the pair
  uniquePair: uniqueIndex('friendships_pair_idx').on(table.userA, table.userB),
  // Index for looking up friendships by either user
  userAIdx: index('friendships_user_a_idx').on(table.userA, table.status),
  userBIdx: index('friendships_user_b_idx').on(table.userB, table.status),
  // CHECK constraint ensuring canonical ordering (userA < userB)
  // Note: Drizzle doesn't have native check() in all versions, 
  // so we add this in the migration SQL directly
}));

// ============================================================================
// SWIPES
// ============================================================================
//
// Each user can only have one swipe per movie (unique on user_id + tmdb_id).
// The `context` field is informational metadata (e.g., "tonight", "mood:horror").
// If a user re-swipes a movie, we upsert (update the existing row).

export const swipes = pgTable('swipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tmdbId: integer('tmdb_id').notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // 'right' or 'left'
  context: varchar('context', { length: 50 }).default('browse'),
  swipedAt: timestamp('swiped_at').defaultNow().notNull(),
}, (table) => ({
  // One swipe per user per movie
  uniqueUserMovie: uniqueIndex('swipes_user_movie_idx').on(table.userId, table.tmdbId),
  // Fast lookup of user's right swipes (their "want to watch" list)
  userRightIdx: index('swipes_user_right_idx').on(table.userId).where(sql`direction = 'right'`),
}));

// ============================================================================
// GROUPS
// ============================================================================

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.groupId, table.userId] }),
}));

// ============================================================================
// WATCHES (history of what you actually watched)
// ============================================================================

export const watches = pgTable('watches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tmdbId: integer('tmdb_id').notNull(),
  watchedAt: timestamp('watched_at').defaultNow().notNull(),
  reaction: varchar('reaction', { length: 50 }), // 'loved', 'good', 'meh', 'hated'
  note: text('note'),
});

// Junction table for who you watched with (replaces UUID[] array)
export const watchCompanions = pgTable('watch_companions', {
  watchId: uuid('watch_id').notNull().references(() => watches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.watchId, table.userId] }),
}));

// ============================================================================
// MOVIES CACHE
// ============================================================================
//
// We cache TMDB responses to avoid hitting their API repeatedly.
// The `cachedAt` timestamp lets us refresh stale data.

export const moviesCache = pgTable('movies_cache', {
  tmdbId: integer('tmdb_id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  posterPath: varchar('poster_path', { length: 255 }),
  overview: text('overview'),
  releaseYear: integer('release_year'),
  genres: integer('genres').array(),
  runtime: integer('runtime'),
  cachedAt: timestamp('cached_at').defaultNow().notNull(),
});

// ============================================================================
// RELATIONS (for Drizzle's relational queries)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  swipes: many(swipes),
  watches: many(watches),
  groupMemberships: many(groupMembers),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const swipesRelations = relations(swipes, ({ one }) => ({
  user: one(users, { fields: [swipes.userId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ many, one }) => ({
  members: many(groupMembers),
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));
```

### Migration for CHECK Constraint

Drizzle doesn't always handle CHECK constraints natively, so after generating your first migration, add this SQL to ensure the canonical ordering:

```sql
-- Add to migration file or run manually
ALTER TABLE friendships 
ADD CONSTRAINT friendships_canonical_order 
CHECK (user_a < user_b);
```

---

## Database Connection

Neon provides two connection URLs: a **pooled** URL for runtime queries (handles serverless connection limits gracefully) and a **non-pooled/direct** URL for migrations and schema changes. This distinction is critical for serverless deployments.

```typescript
// lib/db/index.ts

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Use the pooled connection string for runtime queries
// Neon's HTTP driver is ideal for serverless (no persistent connections)
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

// For use in API routes
export type Database = typeof db;
```

```typescript
// drizzle.config.ts

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // IMPORTANT: Use the non-pooled/direct URL for migrations
    // Migrations need direct access to run DDL statements
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
```

---

## Authentication (Auth.js v5)

Auth.js v5 handles Google OAuth with minimal configuration. We split the configuration into two files:

1. **`auth.config.ts`** — Edge-safe configuration (no database imports), used by middleware
2. **`auth.ts`** — Full configuration with database adapter, used by API routes

This split is necessary because Vercel's middleware runs in the Edge runtime, which doesn't support traditional database drivers that require TCP sockets. By keeping the middleware config database-free, we avoid runtime errors.

```typescript
// lib/auth.config.ts
// Edge-safe config (no database imports) - used by middleware

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: '/', // Redirect to home page for sign in
  },
  callbacks: {
    // This runs in middleware - keep it simple, no DB calls
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = 
        nextUrl.pathname.startsWith('/swipe') ||
        nextUrl.pathname.startsWith('/feed') ||
        nextUrl.pathname.startsWith('/friends') ||
        nextUrl.pathname.startsWith('/groups') ||
        nextUrl.pathname.startsWith('/profile');
      
      if (isProtected && !isLoggedIn) {
        return false; // Redirect to signIn page
      }
      return true;
    },
  },
};
```

```typescript
// lib/auth.ts
// Full config with database adapter - used by API routes

import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { authConfig } from './auth.config';
import { 
  users, 
  accounts, 
  sessions, 
  verificationTokens 
} from './db/schema';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    // Pass the schema tables explicitly to the adapter
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'database', // Use database sessions (requires adapter tables)
  },
  callbacks: {
    ...authConfig.callbacks,
    // Include user ID in the session for easy access in API routes
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
});
```

```typescript
// app/api/auth/[...nextauth]/route.ts

import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

```typescript
// middleware.ts
// Uses edge-safe config only - no database imports

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all protected routes
  matcher: [
    '/swipe/:path*', 
    '/feed/:path*', 
    '/friends/:path*', 
    '/groups/:path*', 
    '/profile/:path*'
  ],
};
```

---

## Example API Routes

### Recording a Swipe (Upsert)

```typescript
// app/api/swipes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tmdbId, direction, context = 'browse' } = await request.json();

  if (!tmdbId || !['right', 'left'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Upsert: insert or update if exists
  await db
    .insert(swipes)
    .values({
      userId: session.user.id,
      tmdbId,
      direction,
      context,
    })
    .onConflictDoUpdate({
      target: [swipes.userId, swipes.tmdbId],
      set: {
        direction,
        context,
        swipedAt: new Date(),
      },
    });

  return NextResponse.json({ success: true });
}

// GET: return user's "want to watch" list (right swipes only)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mySwipes = await db.query.swipes.findMany({
    where: and(
      eq(swipes.userId, session.user.id),
      eq(swipes.direction, 'right')
    ),
    orderBy: (swipes, { desc }) => [desc(swipes.swipedAt)],
  });

  return NextResponse.json(mySwipes);
}
```

### Finding Matches with a Friend (Type-Safe)

```typescript
// app/api/friends/[userId]/matches/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes, moviesCache } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const friendId = params.userId;
  const myId = session.user.id;

  // Step 1: Get friend's right-swiped movie IDs
  const friendSwipes = await db
    .select({ tmdbId: swipes.tmdbId })
    .from(swipes)
    .where(and(eq(swipes.userId, friendId), eq(swipes.direction, 'right')));

  const friendMovieIds = friendSwipes.map((s) => s.tmdbId);

  if (friendMovieIds.length === 0) {
    return NextResponse.json([]);
  }

  // Step 2: Find my right swipes that overlap with friend's
  // Using inArray for type-safe comparison instead of raw SQL
  const matches = await db
    .select({
      tmdbId: swipes.tmdbId,
      title: moviesCache.title,
      posterPath: moviesCache.posterPath,
      overview: moviesCache.overview,
    })
    .from(swipes)
    .leftJoin(moviesCache, eq(swipes.tmdbId, moviesCache.tmdbId))
    .where(
      and(
        eq(swipes.userId, myId),
        eq(swipes.direction, 'right'),
        inArray(swipes.tmdbId, friendMovieIds)
      )
    );

  return NextResponse.json(matches);
}
```

### Creating a Friendship (Canonical Ordering)

```typescript
// app/api/friends/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships, users } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, email } = await request.json();
  let targetUserId = userId;

  // If email provided instead of userId, look up the user
  if (email && !userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    targetUserId = user.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId or email required' }, { status: 400 });
  }

  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });
  }

  // Canonical ordering: smaller UUID goes in userA
  const [userA, userB] = [session.user.id, targetUserId].sort();

  // Check if friendship already exists
  const existing = await db.query.friendships.findFirst({
    where: and(eq(friendships.userA, userA), eq(friendships.userB, userB)),
  });

  if (existing) {
    return NextResponse.json({ error: 'Friendship already exists', status: existing.status }, { status: 409 });
  }

  // Create the friendship request
  const [friendship] = await db
    .insert(friendships)
    .values({
      userA,
      userB,
      requestedBy: session.user.id,
      status: 'pending',
    })
    .returning();

  return NextResponse.json(friendship);
}
```

---

## Environment Variables

Create a `.env.example` file in your repo (committed) and a `.env.local` file locally (git-ignored):

```env
# .env.example - commit this to show required variables

# Database (provided by Neon via Vercel Marketplace)
# The pooled URL is for runtime queries (serverless-friendly)
DATABASE_URL=

# The unpooled/direct URL is for migrations (needs direct connection)
DATABASE_URL_UNPOOLED=

# Auth (Google OAuth) - Auth.js v5 uses AUTH_ prefix
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Auth.js v5 configuration
AUTH_SECRET=
# AUTH_TRUST_HOST is auto-set by Vercel, no need to configure manually
# AUTH_URL is also auto-detected in most cases

# TMDB
TMDB_API_KEY=

# Real-time (optional)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

**Note on variable names:** Auth.js v5 recommends using the `AUTH_` prefix for configuration variables. The `NEXTAUTH_` prefix from v4 still works but is considered legacy. Neon provides both pooled and unpooled URLs—use the pooled one for your app and the unpooled one for migrations.

---

## Git Repository Setup

### Initial Setup

```bash
# Create the project
npx create-next-app@latest flick --typescript --tailwind --eslint --app --src-dir=false

cd flick

# Install dependencies
npm install drizzle-orm @neondatabase/serverless next-auth@beta @auth/drizzle-adapter
npm install -D drizzle-kit

# Install UI dependencies
npm install react-tinder-card @tanstack/react-query

# Initialize git (create-next-app may have done this)
git init

# Create initial commit
git add .
git commit -m "Initial Next.js setup"
```

### Create the Schema

Create the files from the project structure above, then:

```bash
# Generate migrations from your schema
npx drizzle-kit generate

# Review the generated SQL in lib/db/migrations/

git add .
git commit -m "Add database schema and API routes"
```

### Connect to GitHub

```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/flick.git
git branch -M main
git push -u origin main
```

---

## Vercel Deployment

### First-Time Setup

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `flick` repository
4. Vercel auto-detects Next.js—accept the defaults
5. Before deploying, add your environment variables:
   - Click "Environment Variables"
   - Add `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `TMDB_API_KEY`
6. Click "Deploy"

### Add Neon Postgres via Marketplace

1. In your Vercel project dashboard, go to "Storage"
2. Click "Browse Storage" → search for "Neon"
3. Click "Neon Serverless Postgres" → "Add Integration"
4. Follow the prompts to create a new Neon project or connect an existing one
5. Neon automatically adds the `DATABASE_URL` and `DATABASE_URL_UNPOOLED` environment variables
6. Redeploy to pick up the new variables

### Configure Google OAuth

In the [Google Cloud Console](https://console.cloud.google.com/):

1. Create a new project (or use existing)
2. Go to "APIs & Services" → "OAuth consent screen"
   - Configure your consent screen (External or Internal)
   - Add scopes: `email`, `profile`, `openid`
3. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
4. Application type: "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://flick.vercel.app/api/auth/callback/google` (production)
   - `https://your-custom-domain.com/api/auth/callback/google` (if using custom domain)
6. Copy the Client ID and Secret to Vercel's environment variables as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

### Run Migrations

You have two options for running migrations:

**Option A: Via Vercel CLI (recommended for production)**
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables locally
vercel env pull .env.local

# Run migrations against production database (uses DATABASE_URL_UNPOOLED)
npx drizzle-kit push
```

**Option B: Add migration scripts to package.json**
```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Continuous Deployment

Once set up, your workflow becomes:

```bash
# Make changes locally
git add .
git commit -m "Add friend request feature"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Builds your app
# 3. Runs any build-time checks
# 4. Deploys to production
# 5. Your changes are live in ~60 seconds
```

### Preview Deployments

Every pull request gets its own preview URL automatically:

```bash
git checkout -b feature/tonight-mode
# ... make changes ...
git push origin feature/tonight-mode
# Open PR on GitHub

# Vercel creates: https://flick-git-feature-tonight-mode-yourname.vercel.app
# Test your changes there before merging
```

---

## Development Workflow

### Running Locally

```bash
# Pull production env vars (optional, or use .env.local)
vercel env pull .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

### Database Changes

```bash
# 1. Modify schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review the SQL in lib/db/migrations/

# 4. Push to database
npm run db:push

# 5. Commit changes
git add .
git commit -m "Add reaction field to watches"
git push
```

### Drizzle Studio (Database GUI)

```bash
npm run db:studio
# Opens a local GUI at https://local.drizzle.studio
```

---

## Real-Time Notifications (Optional)

Serverless functions can't maintain WebSocket connections, so for real-time features (instant match notifications, presence), you have options:

### Option 1: Pusher (Simplest)

```bash
npm install pusher pusher-js
```

```typescript
// lib/pusher.ts (server-side)
import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// In your swipe API route, after recording a swipe:
// Check if this creates a new match, and if so:
await pusher.trigger(`user-${friendId}`, 'new-match', {
  movieId: tmdbId,
  withUser: session.user.id,
});
```

```typescript
// components/Providers.tsx (client-side)
'use client';

import PusherJS from 'pusher-js';
import { useEffect } from 'react';

export function RealtimeProvider({ userId, children }) {
  useEffect(() => {
    const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${userId}`);
    channel.bind('new-match', (data) => {
      // Show notification, update UI, etc.
      console.log('New match!', data);
    });

    return () => pusher.unsubscribe(`user-${userId}`);
  }, [userId]);

  return children;
}
```

### Option 2: Polling (No External Service)

For simpler needs, poll the API every 30 seconds:

```typescript
// hooks/useMatches.ts
import { useQuery } from '@tanstack/react-query';

export function useMatchNotifications() {
  return useQuery({
    queryKey: ['match-notifications'],
    queryFn: () => fetch('/api/notifications/matches').then(r => r.json()),
    refetchInterval: 30000, // Poll every 30 seconds
  });
}
```
