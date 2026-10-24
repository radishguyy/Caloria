CREATE TYPE "public"."activity_level_enum" AS ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active');--> statement-breakpoint
CREATE TYPE "public"."badge_category_enum" AS ENUM('consistency', 'nutrition', 'social');--> statement-breakpoint
CREATE TYPE "public"."friendship_status_enum" AS ENUM('pending', 'accepted', 'declined', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."goal_type_enum" AS ENUM('diet', 'bulking', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."item_category_enum" AS ENUM('hat', 'outfit', 'glasses', 'accessory', 'skin', 'room_decoration');--> statement-breakpoint
CREATE TYPE "public"."meal_time_enum" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."notification_type_enum" AS ENUM('meal_reminder', 'nutrition_evaluation', 'streak_warning', 'poke_nudge', 'friend_request', 'achievement_unlocked');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"full_name" varchar(100),
	"avatar_url" text,
	"goal" "goal_type_enum" DEFAULT 'maintenance' NOT NULL,
	"gender" varchar(20),
	"birth_date" date,
	"height_cm" numeric(5, 2),
	"initial_weight_kg" numeric(5, 2),
	"current_weight_kg" numeric(5, 2),
	"target_weight_kg" numeric(5, 2),
	"activity_level" "activity_level_enum" DEFAULT 'sedentary' NOT NULL,
	"bmi_score" numeric(4, 2),
	"tdee_kcal" integer,
	"target_calories_kcal" integer,
	"target_protein_g" numeric(6, 2),
	"target_carbs_g" numeric(6, 2),
	"target_fat_g" numeric(6, 2),
	"projected_days" integer,
	"caloria_coins" integer DEFAULT 0 NOT NULL,
	"current_streak_days" integer DEFAULT 0 NOT NULL,
	"longest_streak_days" integer DEFAULT 0 NOT NULL,
	"is_onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"logged_date" date DEFAULT CURRENT_DATE NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weight_logs_user_id_logged_date_unique" UNIQUE("user_id","logged_date")
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"species" varchar(50) DEFAULT 'egg_starter' NOT NULL,
	"stage" integer DEFAULT 1 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_xp" integer DEFAULT 0 NOT NULL,
	"next_level_xp" integer DEFAULT 100 NOT NULL,
	"equipped_hat_id" uuid,
	"equipped_outfit_id" uuid,
	"equipped_glasses_id" uuid,
	"equipped_accessory_id" uuid,
	"equipped_room_id" uuid,
	"skin_color" varchar(50) DEFAULT 'default' NOT NULL,
	"rendered_avatar_icon_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "plaza_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "item_category_enum" NOT NULL,
	"description" text,
	"price_coins" integer DEFAULT 0 NOT NULL,
	"asset_url" text NOT NULL,
	"is_event_item" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_wardrobe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_wardrobe_user_id_item_id_unique" UNIQUE("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "daily_nutrition_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"summary_date" date NOT NULL,
	"total_calories" numeric(7, 2) DEFAULT '0' NOT NULL,
	"total_protein" numeric(6, 2) DEFAULT '0' NOT NULL,
	"total_carbs" numeric(6, 2) DEFAULT '0' NOT NULL,
	"total_fat" numeric(6, 2) DEFAULT '0' NOT NULL,
	"target_calories" integer NOT NULL,
	"target_protein" numeric(6, 2) NOT NULL,
	"target_carbs" numeric(6, 2) NOT NULL,
	"target_fat" numeric(6, 2) NOT NULL,
	"is_macro_balanced" boolean DEFAULT false NOT NULL,
	"is_calorie_target_met" boolean DEFAULT false NOT NULL,
	"is_day_closed" boolean DEFAULT false NOT NULL,
	"base_xp_total" integer DEFAULT 0 NOT NULL,
	"multiplier_xp_bonus" integer DEFAULT 0 NOT NULL,
	"jackpot_xp_bonus" integer DEFAULT 0 NOT NULL,
	"coins_rewarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_nutrition_summaries_user_id_summary_date_unique" UNIQUE("user_id","summary_date")
);
--> statement-breakpoint
CREATE TABLE "food_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_id" uuid,
	"custom_food_name" varchar(255),
	"meal_time" "meal_time_enum" NOT NULL,
	"log_date" date DEFAULT CURRENT_DATE NOT NULL,
	"serving_quantity" numeric(6, 2) DEFAULT '1.0' NOT NULL,
	"calculated_calories" numeric(7, 2) NOT NULL,
	"calculated_protein" numeric(6, 2) DEFAULT '0' NOT NULL,
	"calculated_carbs" numeric(6, 2) DEFAULT '0' NOT NULL,
	"calculated_fat" numeric(6, 2) DEFAULT '0' NOT NULL,
	"calculated_fiber" numeric(6, 2) DEFAULT '0' NOT NULL,
	"calculated_sugar" numeric(6, 2) DEFAULT '0' NOT NULL,
	"base_xp_earned" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(100),
	"serving_size_default" numeric(6, 2) DEFAULT '100.0' NOT NULL,
	"serving_unit" varchar(50) DEFAULT 'gram' NOT NULL,
	"calories_kcal" numeric(7, 2) NOT NULL,
	"protein_g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"carbs_g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"fat_g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"fiber_g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"sugar_g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coop_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"last_streak_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coop_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"has_completed_today" boolean DEFAULT false NOT NULL,
	CONSTRAINT "coop_members_group_id_user_id_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "friendship_status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_requester_id_addressee_id_unique" UNIQUE("requester_id","addressee_id")
);
--> statement-breakpoint
CREATE TABLE "poke_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"group_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" varchar(100) NOT NULL,
	"category" "badge_category_enum" NOT NULL,
	"description" text,
	"icon_url" text,
	"threshold_value" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type_enum" NOT NULL,
	"title" varchar(150) NOT NULL,
	"body" text NOT NULL,
	"payload" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_user_id_badge_id_unique" UNIQUE("user_id","badge_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_equipped_hat_id_plaza_items_id_fk" FOREIGN KEY ("equipped_hat_id") REFERENCES "public"."plaza_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_equipped_outfit_id_plaza_items_id_fk" FOREIGN KEY ("equipped_outfit_id") REFERENCES "public"."plaza_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_equipped_glasses_id_plaza_items_id_fk" FOREIGN KEY ("equipped_glasses_id") REFERENCES "public"."plaza_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_equipped_accessory_id_plaza_items_id_fk" FOREIGN KEY ("equipped_accessory_id") REFERENCES "public"."plaza_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_equipped_room_id_plaza_items_id_fk" FOREIGN KEY ("equipped_room_id") REFERENCES "public"."plaza_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wardrobe" ADD CONSTRAINT "user_wardrobe_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wardrobe" ADD CONSTRAINT "user_wardrobe_item_id_plaza_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."plaza_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_nutrition_summaries" ADD CONSTRAINT "daily_nutrition_summaries_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_groups" ADD CONSTRAINT "coop_groups_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_members" ADD CONSTRAINT "coop_members_group_id_coop_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coop_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_members" ADD CONSTRAINT "coop_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_profiles_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poke_logs" ADD CONSTRAINT "poke_logs_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poke_logs" ADD CONSTRAINT "poke_logs_receiver_id_profiles_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poke_logs" ADD CONSTRAINT "poke_logs_group_id_coop_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coop_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weight_logs_user_id_idx" ON "weight_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pets_user_id_idx" ON "pets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plaza_items_category_idx" ON "plaza_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "user_wardrobe_user_id_idx" ON "user_wardrobe" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_nutrition_summaries_user_date_idx" ON "daily_nutrition_summaries" USING btree ("user_id","summary_date");--> statement-breakpoint
CREATE INDEX "food_logs_user_date_idx" ON "food_logs" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "food_logs_food_id_idx" ON "food_logs" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "coop_groups_created_by_idx" ON "coop_groups" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "coop_members_group_id_idx" ON "coop_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "coop_members_user_id_idx" ON "coop_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friendships_requester_id_idx" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendships_addressee_id_idx" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "poke_logs_sender_id_idx" ON "poke_logs" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "poke_logs_receiver_id_idx" ON "poke_logs" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_badges_user_id_idx" ON "user_badges" USING btree ("user_id");