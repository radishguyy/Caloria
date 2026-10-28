import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, goalTypeEnum, activityLevelEnum } from "./enums";

// 1. Profiles Table (1-to-1 with Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 50 }).unique().notNull(),
  fullName: varchar("full_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  goal: goalTypeEnum("goal").default("maintenance").notNull(),
  goalPath: text("goal_path")
    .$type<"lose_weight" | "gain_muscle" | "maintain_weight">()
    .default("lose_weight")
    .notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  currentWeek: integer("current_week").default(1).notNull(),
  streakConsecutiveLogs: integer("streak_consecutive_logs").default(0).notNull(),
  gender: varchar("gender", { length: 20 }),
  birthDate: date("birth_date"),
  age: integer("age"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
  initialWeightKg: numeric("initial_weight_kg", { precision: 5, scale: 2 }),
  currentWeightKg: numeric("current_weight_kg", { precision: 5, scale: 2 }),
  targetWeightKg: numeric("target_weight_kg", { precision: 5, scale: 2 }),
  activityLevel: activityLevelEnum("activity_level")
    .default("sedentary")
    .notNull(),
  bmiScore: numeric("bmi_score", { precision: 4, scale: 2 }),
  tdeeKcal: integer("tdee_kcal"),
  targetCaloriesKcal: integer("target_calories_kcal"),
  targetProteinG: numeric("target_protein_g", { precision: 6, scale: 2 }),
  targetCarbsG: numeric("target_carbs_g", { precision: 6, scale: 2 }),
  targetFatG: numeric("target_fat_g", { precision: 6, scale: 2 }),
  projectedDays: integer("projected_days"),
  caloriaCoins: integer("caloria_coins").default(0).notNull(),
  currentStreakDays: integer("current_streak_days").default(0).notNull(),
  longestStreakDays: integer("longest_streak_days").default(0).notNull(),
  isOnboardingCompleted: boolean("is_onboarding_completed")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 2. Weight Logs Table
export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
    loggedDate: date("logged_date")
      .default(sql`CURRENT_DATE`)
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("weight_logs_user_id_logged_date_unique").on(
      table.userId,
      table.loggedDate
    ),
    index("weight_logs_user_id_idx").on(table.userId),
  ]
);

