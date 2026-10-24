import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { mealTimeEnum } from "./enums";
import { profiles } from "./profiles";

// 6. Foods Table (Nutrition Catalog)
export const foods = pgTable(
  "foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    servingSizeDefault: numeric("serving_size_default", {
      precision: 6,
      scale: 2,
    })
      .default("100.0")
      .notNull(),
    servingUnit: varchar("serving_unit", { length: 50 })
      .default("gram")
      .notNull(),
    caloriesKcal: numeric("calories_kcal", {
      precision: 7,
      scale: 2,
    }).notNull(),
    proteinG: numeric("protein_g", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    carbsG: numeric("carbs_g", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    fatG: numeric("fat_g", { precision: 6, scale: 2 }).default("0").notNull(),
    fiberG: numeric("fiber_g", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    sugarG: numeric("sugar_g", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    isVerified: boolean("is_verified").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("foods_name_idx").on(table.name)]
);

// 7. Food Logs Table (User Food Diary Entries)
export const foodLogs = pgTable(
  "food_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    foodId: uuid("food_id").references(() => foods.id, {
      onDelete: "set null",
    }),
    customFoodName: varchar("custom_food_name", { length: 255 }),
    mealTime: mealTimeEnum("meal_time").notNull(),
    logDate: date("log_date")
      .default(sql`CURRENT_DATE`)
      .notNull(),
    servingQuantity: numeric("serving_quantity", { precision: 6, scale: 2 })
      .default("1.0")
      .notNull(),
    calculatedCalories: numeric("calculated_calories", {
      precision: 7,
      scale: 2,
    }).notNull(),
    calculatedProtein: numeric("calculated_protein", {
      precision: 6,
      scale: 2,
    })
      .default("0")
      .notNull(),
    calculatedCarbs: numeric("calculated_carbs", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    calculatedFat: numeric("calculated_fat", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    calculatedFiber: numeric("calculated_fiber", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    calculatedSugar: numeric("calculated_sugar", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    baseXpEarned: integer("base_xp_earned").default(10).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("food_logs_user_date_idx").on(table.userId, table.logDate),
    index("food_logs_food_id_idx").on(table.foodId),
  ]
);

// 8. Daily Nutrition Summaries Table
export const dailyNutritionSummaries = pgTable(
  "daily_nutrition_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    summaryDate: date("summary_date").notNull(),
    totalCalories: numeric("total_calories", { precision: 7, scale: 2 })
      .default("0")
      .notNull(),
    totalProtein: numeric("total_protein", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    totalCarbs: numeric("total_carbs", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    totalFat: numeric("total_fat", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    targetCalories: integer("target_calories").notNull(),
    targetProtein: numeric("target_protein", {
      precision: 6,
      scale: 2,
    }).notNull(),
    targetCarbs: numeric("target_carbs", {
      precision: 6,
      scale: 2,
    }).notNull(),
    targetFat: numeric("target_fat", { precision: 6, scale: 2 }).notNull(),
    isMacroBalanced: boolean("is_macro_balanced").default(false).notNull(),
    isCalorieTargetMet: boolean("is_calorie_target_met")
      .default(false)
      .notNull(),
    isDayClosed: boolean("is_day_closed").default(false).notNull(),
    baseXpTotal: integer("base_xp_total").default(0).notNull(),
    multiplierXpBonus: integer("multiplier_xp_bonus").default(0).notNull(),
    jackpotXpBonus: integer("jackpot_xp_bonus").default(0).notNull(),
    coinsRewarded: integer("coins_rewarded").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("daily_nutrition_summaries_user_id_summary_date_unique").on(
      table.userId,
      table.summaryDate
    ),
    index("daily_nutrition_summaries_user_date_idx").on(
      table.userId,
      table.summaryDate
    ),
  ]
);

