ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "last_fed_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "mood_status" text DEFAULT 'happy' NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_login_claim_date" date;
