ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "wallet_address" varchar(42);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "wallet_chain_id" integer;
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_wallet_address_unique" ON "profiles" ("wallet_address");
