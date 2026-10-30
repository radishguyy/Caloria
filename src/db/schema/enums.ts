import { pgEnum, pgSchema, uuid, text } from "drizzle-orm/pg-core";

// Reference to Supabase's internal `auth.users` table
const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
});

// 1. Goal Type Enum
export const goalTypeEnum = pgEnum("goal_type_enum", [
  "diet",
  "bulking",
  "maintenance",
]);

// 2. Activity Level Enum
export const activityLevelEnum = pgEnum("activity_level_enum", [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
]);

// 3. Meal Time Enum
export const mealTimeEnum = pgEnum("meal_time_enum", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

// 4. Item Category Enum (Plaza / Wardrobe)
export const itemCategoryEnum = pgEnum("item_category_enum", [
  "hat",
  "outfit",
  "glasses",
  "accessory",
  "skin",
  "room_decoration",
]);

// 5. Friendship Status Enum is defined in ./friendships.ts

// 6. Badge Category Enum
export const badgeCategoryEnum = pgEnum("badge_category_enum", [
  "consistency",
  "nutrition",
  "social",
]);

// 7. Notification Type Enum
export const notificationTypeEnum = pgEnum("notification_type_enum", [
  "meal_reminder",
  "nutrition_evaluation",
  "streak_warning",
  "poke_nudge",
  "friend_request",
  "achievement_unlocked",
]);

