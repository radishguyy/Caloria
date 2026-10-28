import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

// 9. Friendships Table (re-exported from friendships.ts)
export { friendships } from "./friendships";

// 10. Co-op Groups Table
export const coopGroups = pgTable(
  "coop_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    streakCount: integer("streak_count").default(0).notNull(),
    lastStreakDate: date("last_streak_date"),
    createdBy: uuid("created_by")
      .references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("coop_groups_created_by_idx").on(table.createdBy)]
);

// 11. Co-op Members Table
export const coopMembers = pgTable(
  "coop_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => coopGroups.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    hasCompletedToday: boolean("has_completed_today").default(false).notNull(),
  },
  (table) => [
    unique("coop_members_group_id_user_id_unique").on(
      table.groupId,
      table.userId
    ),
    index("coop_members_group_id_idx").on(table.groupId),
    index("coop_members_user_id_idx").on(table.userId),
  ]
);

// 12. Poke Logs Table (Nudges)
export const pokeLogs = pgTable(
  "poke_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderId: uuid("sender_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: uuid("receiver_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    groupId: uuid("group_id").references(() => coopGroups.id, {
      onDelete: "set null",
    }),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("poke_logs_sender_id_idx").on(table.senderId),
    index("poke_logs_receiver_id_idx").on(table.receiverId),
  ]
);

