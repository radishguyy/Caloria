import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

// 1. Accessories Master Catalog
export const accessories = pgTable("accessories", {
  id: text("id").primaryKey(), // e.g. 'head-chef-hat'
  name: varchar("name", { length: 100 }).notNull(),
  slot: varchar("slot", { length: 50 }).notNull(), // 'head' | 'glasses' | 'body' | 'held' | 'skin' | 'room'
  priceCoins: integer("price_coins").default(0).notNull(),
  assetKey: text("asset_key").notNull(),
  rarity: varchar("rarity", { length: 50 }).default("common").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 2. User Owned Accessories Ledger
export const userAccessories = pgTable(
  "user_accessories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    accessoryId: text("accessory_id")
      .references(() => accessories.id, { onDelete: "cascade" })
      .notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_accessories_user_id_accessory_id_unique").on(
      table.userId,
      table.accessoryId
    ),
    index("user_accessories_user_id_idx").on(table.userId),
  ]
);

// 3. User Active Loadouts
export const userLoadouts = pgTable("user_loadouts", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  headId: text("head_id").default("head-none"),
  glassesId: text("glasses_id").default("glasses-none"),
  bodyId: text("body_id").default("body-none"),
  heldId: text("held_id").default("held-none"),
  skinId: text("skin_id").default("skin-default"),
  roomId: text("room_id").default("room-default"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Accessory = typeof accessories.$inferSelect;
export type NewAccessory = typeof accessories.$inferInsert;
export type UserAccessory = typeof userAccessories.$inferSelect;
export type NewUserAccessory = typeof userAccessories.$inferInsert;
export type UserLoadout = typeof userLoadouts.$inferSelect;
export type NewUserLoadout = typeof userLoadouts.$inferInsert;

// Re-export plazaItems & userWardrobe for backward-compatibility
export { plazaItems, userWardrobe } from "./pets-plaza";

