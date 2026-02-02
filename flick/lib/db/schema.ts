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
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// USERS (with username + pin authentication for personal use)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  pin: varchar('pin', { length: 255 }).notNull(), // Hashed 4-6 digit PIN
  name: varchar('name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// SESSIONS (for Auth.js database sessions)
// ============================================================================

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// ============================================================================
// FRIENDSHIPS
// ============================================================================
// 
// Stored with canonical ordering constraint: user_a < user_b.
// This prevents duplicate rows like (Alice, Bob) and (Bob, Alice).

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userA: uuid('user_a').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userB: uuid('user_b').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  requestedBy: uuid('requested_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniquePair: uniqueIndex('friendships_pair_idx').on(table.userA, table.userB),
  userAIdx: index('friendships_user_a_idx').on(table.userA, table.status),
  userBIdx: index('friendships_user_b_idx').on(table.userB, table.status),
}));

// ============================================================================
// SWIPES
// ============================================================================

export const swipes = pgTable('swipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tmdbId: integer('tmdb_id').notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // 'right' or 'left'
  context: varchar('context', { length: 50 }).default('browse'),
  swipedAt: timestamp('swiped_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserMovie: uniqueIndex('swipes_user_movie_idx').on(table.userId, table.tmdbId),
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

// Junction table for who you watched with
export const watchCompanions = pgTable('watch_companions', {
  watchId: uuid('watch_id').notNull().references(() => watches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.watchId, table.userId] }),
}));

// ============================================================================
// MOVIES CACHE
// ============================================================================

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
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  swipes: many(swipes),
  watches: many(watches),
  groupMemberships: many(groupMembers),
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
