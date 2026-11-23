ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "streak_freezes" integer DEFAULT 1 NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_freeze_used_date" date;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "rest_passes" integer DEFAULT 1 NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_rest_day_date" date;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "broken_streak_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "broken_streak_at" timestamp with time zone;
