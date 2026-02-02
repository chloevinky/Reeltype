import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Use the non-pooled/direct URL for migrations
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
