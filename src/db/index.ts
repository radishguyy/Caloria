import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

function getClient() {
  if (!globalForDb.conn) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not configured. Please set the DATABASE_URL environment variable in your Vercel Project Settings."
      );
    }

    // Supabase free tier connection pooling best practice:
    // Set max connection to 1 for serverless/edge environments to prevent connection exhaustion.
    // prepare: false is mandatory when using Supabase Transaction Pooler (Supavisor on port 6543).
    globalForDb.conn = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      prepare: false, // Required for Supabase Transaction Pooler
      ssl: connectionString.includes("pooler.supabase.com") ? "require" : undefined,
    });
  }

  return globalForDb.conn;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!globalForDb.db) {
      const client = getClient();
      globalForDb.db = drizzle(client, { schema });
    }
    return (globalForDb.db as any)[prop];
  },
});

export type Database = typeof db;
