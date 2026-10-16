import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Profiles Table (extending Supabase auth.users)
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(), // maps to auth.users.id
    email: varchar("email", { length: 255 }),
    username: varchar("username", { length: 50 }).unique(),
    fullName: varchar("full_name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    calorieTarget: integer("calorie_target").default(2000).notNull(),
    proteinTarget: integer("protein_target").default(125).notNull(), // grams
    carbsTarget: integer("carbs_target").default(250).notNull(), // grams
    fatTarget: integer("fat_target").default(55).notNull(), // grams
    waterTargetMl: integer("water_target_ml").default(2500).notNull(),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("username_idx").on(table.username),
  ]
);

// 2. Virtual Pets Table
export const pets = pgTable(
  "pets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    name: varchar("name", { length: 50 }).notNull(),
    species: varchar("species", { length: 30 }).default("flameling").notNull(),
    stage: integer("stage").default(1).notNull(), // 1: Egg, 2: Hatchling, 3: Juvenile, 4: Adult, 5: Mythic
    level: integer("level").default(1).notNull(),
    exp: integer("exp").default(0).notNull(),
    hunger: integer("hunger").default(80).notNull(), // 0 - 100
    happiness: integer("happiness").default(80).notNull(), // 0 - 100
    health: integer("health").default(100).notNull(), // 0 - 100
    status: varchar("status", { length: 20 }).default("idle").notNull(), // idle, eating, happy, sleeping
    lastFedAt: timestamp("last_fed_at", { withTimezone: true }).defaultNow().notNull(),
    lastInteractedAt: timestamp("last_interacted_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pet_user_id_idx").on(table.userId),
  ]
);

// 3. Food Logs Table
export const foodLogs = pgTable(
  "food_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    mealType: varchar("meal_type", { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
    calories: integer("calories").notNull(),
    proteinG: real("protein_g").default(0).notNull(),
    carbsG: real("carbs_g").default(0).notNull(),
    fatG: real("fat_g").default(0).notNull(),
    servingSize: real("serving_size").default(1).notNull(),
    servingUnit: varchar("serving_unit", { length: 50 }).default("porsi").notNull(),
    loggedDate: varchar("logged_date", { length: 10 }).notNull(), // YYYY-MM-DD
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("food_user_date_idx").on(table.userId, table.loggedDate),
    index("food_date_idx").on(table.loggedDate),
  ]
);

// 4. User Streaks Table
export const userStreaks = pgTable(
  "user_streaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    currentStreak: integer("current_streak").default(0).notNull(),
    highestStreak: integer("highest_streak").default(0).notNull(),
    lastLoggedDate: varchar("last_logged_date", { length: 10 }),
    streakFreezeCount: integer("streak_freeze_count").default(2).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("streak_user_id_idx").on(table.userId),
  ]
);

// 5. Co-op Parties Table
export const coopParties = pgTable(
  "coop_parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 8 }).unique().notNull(),
    creatorId: uuid("creator_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    currentStreak: integer("current_streak").default(0).notNull(),
    highestStreak: integer("highest_streak").default(0).notNull(),
    lastEvaluatedDate: varchar("last_evaluated_date", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("coop_code_idx").on(table.code),
  ]
);

// 6. Co-op Members Table
export const coopMembers = pgTable(
  "coop_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partyId: uuid("party_id")
      .references(() => coopParties.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 20 }).default("member").notNull(), // leader, member
    dailyGoalMet: boolean("daily_goal_met").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("member_party_idx").on(table.partyId),
    index("member_user_idx").on(table.userId),
  ]
);

// Drizzle Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  pet: one(pets, {
    fields: [profiles.id],
    references: [pets.userId],
  }),
  streak: one(userStreaks, {
    fields: [profiles.id],
    references: [userStreaks.userId],
  }),
  foodLogs: many(foodLogs),
  coopMemberships: many(coopMembers),
}));

export const petsRelations = relations(pets, ({ one }) => ({
  profile: one(profiles, {
    fields: [pets.userId],
    references: [profiles.id],
  }),
}));

export const foodLogsRelations = relations(foodLogs, ({ one }) => ({
  profile: one(profiles, {
    fields: [foodLogs.userId],
    references: [profiles.id],
  }),
}));

export const coopPartiesRelations = relations(coopParties, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [coopParties.creatorId],
    references: [profiles.id],
  }),
  members: many(coopMembers),
}));

export const coopMembersRelations = relations(coopMembers, ({ one }) => ({
  party: one(coopParties, {
    fields: [coopMembers.partyId],
    references: [coopParties.id],
  }),
  profile: one(profiles, {
    fields: [coopMembers.userId],
    references: [profiles.id],
  }),
}));
