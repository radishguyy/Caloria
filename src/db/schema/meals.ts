import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "./profiles";

// Master Catalog of Foods
export const foods = pgTable(
  "foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    servingSize: numeric("serving_size", { precision: 6, scale: 2 }).default("100.0").notNull(),
    servingSizeDefault: numeric("serving_size_default", { precision: 6, scale: 2 }).default("100.0").notNull(),
    servingUnit: varchar("serving_unit", { length: 50 }).default("gram").notNull(),
    calories: numeric("calories", { precision: 7, scale: 2 }).default("0").notNull(),
    caloriesKcal: numeric("calories_kcal", { precision: 7, scale: 2 }).default("0").notNull(),
    protein: numeric("protein", { precision: 6, scale: 2 }).default("0").notNull(),
    proteinG: numeric("protein_g", { precision: 6, scale: 2 }).default("0").notNull(),
    carbs: numeric("carbs", { precision: 6, scale: 2 }).default("0").notNull(),
    carbsG: numeric("carbs_g", { precision: 6, scale: 2 }).default("0").notNull(),
    fat: numeric("fat", { precision: 6, scale: 2 }).default("0").notNull(),
    fatG: numeric("fat_g", { precision: 6, scale: 2 }).default("0").notNull(),
    fiber: numeric("fiber", { precision: 6, scale: 2 }).default("0").notNull(),
    fiberG: numeric("fiber_g", { precision: 6, scale: 2 }).default("0").notNull(),
    sugar: numeric("sugar", { precision: 6, scale: 2 }).default("0").notNull(),
    sugarG: numeric("sugar_g", { precision: 6, scale: 2 }).default("0").notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    isVerified: boolean("is_verified").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("foods_name_idx").on(table.name)]
);

// Dynamic Meal Records
export const mealLogs = pgTable(
  "meal_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    foodId: uuid("food_id").references(() => foods.id, {
      onDelete: "set null",
    }),
    loggedDate: date("logged_date")
      .default(sql`CURRENT_DATE`)
      .notNull(),
    mealType: text("meal_type").notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    servings: numeric("servings", { precision: 6, scale: 2 }).default("1.0").notNull(),
    calculatedCalories: numeric("calculated_calories", {
      precision: 7,
      scale: 2,
    }).notNull(),
    calculatedProtein: numeric("calculated_protein", {
      precision: 6,
      scale: 2,
    }).default("0").notNull(),
    calculatedCarbs: numeric("calculated_carbs", {
      precision: 6,
      scale: 2,
    }).default("0").notNull(),
    calculatedFat: numeric("calculated_fat", {
      precision: 6,
      scale: 2,
    }).default("0").notNull(),
    customFoodName: varchar("custom_food_name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("meal_logs_user_date_idx").on(table.userId, table.loggedDate),
    index("meal_logs_food_id_idx").on(table.foodId),
  ]
);

export type FoodItem = typeof foods.$inferSelect;
export type NewFoodItem = typeof foods.$inferInsert;
export type MealLog = typeof mealLogs.$inferSelect;
export type NewMealLog = typeof mealLogs.$inferInsert;

// Re-export foodLogs and dailyNutritionSummaries from nutrition.ts
export { foodLogs, dailyNutritionSummaries } from "./nutrition";

