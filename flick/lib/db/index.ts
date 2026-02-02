import { drizzle } from 'drizzle-orm/neon-http';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import * as schema from './schema';

// Lazy-load the database connection to avoid build-time errors
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sql: NeonQueryFunction<false, false> | null = null;

function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
    _db = drizzle(_sql, { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the db
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    const database = getDb();
    const value = database[prop as keyof typeof database];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
