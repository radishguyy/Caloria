import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  text,
  integer,
  date,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "declined",
  "blocked",
]);

// 1. Friendships Table
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderId: uuid("sender_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: uuid("receiver_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    status: friendshipStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("friendships_sender_id_idx").on(table.senderId),
    index("friendships_receiver_id_idx").on(table.receiverId),
  ]
);

// 2. Co-op Parties Table
export const coopParties = pgTable(
  "coop_parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    streakCount: integer("streak_count").default(0).notNull(),
    lastStreakDate: date("last_streak_date"),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("coop_parties_created_by_idx").on(table.createdBy)]
);

// 3. Co-op Members Table
export const coopMembers = pgTable(
  "coop_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => coopParties.id, { onDelete: "cascade" })
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

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type CoopParty = typeof coopParties.$inferSelect;
export type NewCoopParty = typeof coopParties.$inferInsert;
export type CoopMember = typeof coopMembers.$inferSelect;
export type NewCoopMember = typeof coopMembers.$inferInsert;

// Keep coopGroups as alias for backward compatibility
export const coopGroups = coopParties;
