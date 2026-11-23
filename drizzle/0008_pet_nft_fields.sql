ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "nft_token_id" integer;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "nft_contract_address" varchar(42);
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "nft_chain_id" integer;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "mint_tx_hash" varchar(66);
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "mint_status" text DEFAULT 'unminted' NOT NULL;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "minted_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "pets_nft_token_id_unique" ON "pets" ("nft_token_id");
