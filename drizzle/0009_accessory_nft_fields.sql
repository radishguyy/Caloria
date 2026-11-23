ALTER TABLE "plaza_items" ADD COLUMN IF NOT EXISTS "token_id_1155" integer;
CREATE UNIQUE INDEX IF NOT EXISTS "plaza_items_token_id_1155_unique" ON "plaza_items" ("token_id_1155");
ALTER TABLE "user_wardrobe" ADD COLUMN IF NOT EXISTS "is_minted_on_chain" boolean DEFAULT false NOT NULL;
ALTER TABLE "user_wardrobe" ADD COLUMN IF NOT EXISTS "mint_tx_hash" varchar(66);
ALTER TABLE "user_wardrobe" ADD COLUMN IF NOT EXISTS "minted_at" timestamp with time zone;
