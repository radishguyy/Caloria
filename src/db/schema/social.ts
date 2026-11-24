import {
  pgTable,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { coopParties } from "./friendships";

// Re-export friendships and coop groups from friendships.ts
export { friendships, coopParties, coopMembers, coopGroups } from "./friendships";

// Poke Logs Table (Nudges)
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
    groupId: uuid("group_id").references(() => coopParties.id, {
      onDelete: "set null",
    }),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("poke_logs_sender_id_idx").on(table.senderId),
    index("poke_logs_receiver_id_idx").on(table.receiverId),
  ]
);

export type PokeLog = typeof pokeLogs.$inferSelect;
export type NewPokeLog = typeof pokeLogs.$inferInsert;
