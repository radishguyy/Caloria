CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'declined', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."recap_type" AS ENUM('weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "weekly_recaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"evaluation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"grade" varchar(10) NOT NULL,
	"content_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_recaps_user_week_unique" UNIQUE("user_id","week_number")
);
--> statement-breakpoint
CREATE TABLE "recaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "recap_type" DEFAULT 'weekly' NOT NULL,
	"cycle_number" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"unlock_date" timestamp NOT NULL,
	"is_viewed" boolean DEFAULT false NOT NULL,
	"slides_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_requester_id_addressee_id_unique";--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_requester_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_addressee_id_profiles_id_fk";
--> statement-breakpoint
DROP INDEX "friendships_requester_id_idx";--> statement-breakpoint
DROP INDEX "friendships_addressee_id_idx";--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "status" SET DATA TYPE "public"."friendship_status" USING "status"::text::"public"."friendship_status";--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "goal_path" text DEFAULT 'lose_weight' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "current_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "current_week" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "streak_consecutive_logs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "weight_kg" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "friendships" ADD COLUMN "sender_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "friendships" ADD COLUMN "receiver_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_recaps" ADD CONSTRAINT "weekly_recaps_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recaps" ADD CONSTRAINT "recaps_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weekly_recaps_user_id_idx" ON "weekly_recaps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recaps_user_id_idx" ON "recaps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recaps_user_type_cycle_idx" ON "recaps" USING btree ("user_id","type","cycle_number");--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_profiles_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" DROP COLUMN "requester_id";--> statement-breakpoint
ALTER TABLE "friendships" DROP COLUMN "addressee_id";--> statement-breakpoint
DROP TYPE "public"."friendship_status_enum";