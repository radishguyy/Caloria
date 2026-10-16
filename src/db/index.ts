import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/caloria";

// Supabase free tier connection pooling best practice:
// Set max connection to 1 for serverless/edge environments to prevent connection exhaustion.
// prepare: false is mandatory when using Supabase Transaction Pooler (Supavisor on port 6543).
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const client =
  globalForDb.conn ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    prepare: false, // Required for Supabase Transaction Pooler
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;
