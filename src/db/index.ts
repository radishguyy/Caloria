import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: DrizzleDb | undefined;
};

const SUPABASE_POOLER_URL =
  "postgresql://postgres.wdjkbjwdpqaoqikkflpc:kacangkacangan123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

function resolveConnectionString(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (!envUrl) {
    return SUPABASE_POOLER_URL;
  }
  // If Vercel has the IPv6-only direct host (db.<ref>.supabase.co) or an invalid
  // pooler username configured, automatically use the IPv4 Supavisor Transaction Pooler.
  if (
    envUrl.includes("db.wdjkbjwdpqaoqikkflpc.supabase.co") ||
    !envUrl.includes("pooler.supabase.com") ||
    !envUrl.includes("postgres.wdjkbjwdpqaoqikkflpc")
  ) {
    return SUPABASE_POOLER_URL;
  }
  return envUrl;
}

function getClient() {
  if (!globalForDb.conn) {
    const connectionString = resolveConnectionString();

    // Supabase free tier connection pooling best practice:
    // prepare: false is mandatory when using Supabase Transaction Pooler (Supavisor on port 6543).
    globalForDb.conn = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 5 : 10,
      prepare: false, // Required for Supabase Transaction Pooler
      connect_timeout: 8,
      ssl: { rejectUnauthorized: false },
    });
  }

  return globalForDb.conn;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    if (!globalForDb.db) {
      const client = getClient();
      globalForDb.db = drizzle(client, { schema });
    }
    return (globalForDb.db as any)[prop];
  },
});

export type Database = typeof db;
