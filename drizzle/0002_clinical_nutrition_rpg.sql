ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "weight_kg" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "age" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "goal_path" text DEFAULT 'lose_weight' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "current_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "current_week" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "streak_consecutive_logs" integer DEFAULT 0 NOT NULL;

