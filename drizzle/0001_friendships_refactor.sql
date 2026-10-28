DO $$ BEGIN
 CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'declined', 'blocked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_requester_id_profiles_id_fk";--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_addressee_id_profiles_id_fk";--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_requester_id_addressee_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "friendships_requester_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "friendships_addressee_id_idx";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'friendships' AND column_name = 'requester_id') THEN
    ALTER TABLE "friendships" RENAME COLUMN "requester_id" TO "sender_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'friendships' AND column_name = 'addressee_id') THEN
    ALTER TABLE "friendships" RENAME COLUMN "addressee_id" TO "receiver_id";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "status" SET DATA TYPE "public"."friendship_status" USING "status"::text::"public"."friendship_status";--> statement-breakpoint
ALTER TABLE "friendships" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_profiles_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friendships_sender_id_idx" ON "friendships" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friendships_receiver_id_idx" ON "friendships" ("receiver_id");
