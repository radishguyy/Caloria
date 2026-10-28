import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { badgeCategoryEnum, notificationTypeEnum } from "./enums";
import { profiles } from "./profiles";

// 13. Badges Table (Master Achievements)
export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  category: badgeCategoryEnum("category").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  thresholdValue: integer("threshold_value").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 14. User Badges Table (Unlocked Achievements)
export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    badgeId: uuid("badge_id")
      .references(() => badges.id, { onDelete: "cascade" })
      .notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_badges_user_id_badge_id_unique").on(
      table.userId,
      table.badgeId
    ),
    index("user_badges_user_id_idx").on(table.userId),
  ]
);

export { pushSubscriptions } from "./push-subscriptions";

// 17. Coin Transaction Ledger (for idempotent reward claims)
export const coinTransactions = pgTable(
  "coin_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(),
    reward_type: varchar("reward_type", { length: 50 }).notNull(),
    reward_id: varchar("reward_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("coin_transactions_user_id_type_id_unique").on(
      table.userId,
      table.reward_type,
      table.reward_id
    ),
    index("coin_transactions_user_id_idx").on(table.userId),
  ]
);

export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type NewCoinTransaction = typeof coinTransactions.$inferInsert;

// 18. Notifications Table (In-App Notification Center)
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 150 }).notNull(),
    body: text("body").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_user_unread_idx").on(table.userId, table.isRead),
  ]
);

