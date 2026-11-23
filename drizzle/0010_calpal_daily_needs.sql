ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "last_petted_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "fed_slots_today" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "pet_count_today" integer DEFAULT 0 NOT NULL;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "needs_reset_date" date;
