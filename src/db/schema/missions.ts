import {
  pgTable,
  uuid,
  numeric,
  boolean,
  date,
  integer,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

// Daily Mission Evaluations Table
export const userMissionEvaluations = pgTable(
  "user_mission_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    evaluationDate: date("evaluation_date").notNull(),
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
    isMacroCompliant: boolean("is_macro_compliant").default(false).notNull(),
    isCalorieTargetMet: boolean("is_calorie_target_met")
      .default(false)
      .notNull(),
    passedDay: boolean("passed_day").default(false).notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    coinsEarned: integer("coins_earned").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_mission_evaluations_user_id_date_unique").on(
      table.userId,
      table.evaluationDate
    ),
    index("user_mission_evaluations_user_date_idx").on(
      table.userId,
      table.evaluationDate
    ),
  ]
);

export type UserMissionEvaluation = typeof userMissionEvaluations.$inferSelect;
export type NewUserMissionEvaluation =
  typeof userMissionEvaluations.$inferInsert;

