import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { itemCategoryEnum } from "./enums";
import { profiles } from "./profiles";

// 3. Plaza Items Table (Wardrobe & Cosmetic Shop)
export const plazaItems = pgTable(
  "plaza_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    category: itemCategoryEnum("category").notNull(),
    description: text("description"),
    priceCoins: integer("price_coins").default(0).notNull(),
    assetUrl: text("asset_url").notNull(),
    isEventItem: boolean("is_event_item").default(false).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("plaza_items_category_idx").on(table.category)]
);

// 4. User Wardrobe Table (Owned Items Inventory)
export const userWardrobe = pgTable(
  "user_wardrobe",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    itemId: uuid("item_id")
      .references(() => plazaItems.id, { onDelete: "cascade" })
      .notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_wardrobe_user_id_item_id_unique").on(
      table.userId,
      table.itemId
    ),
    index("user_wardrobe_user_id_idx").on(table.userId),
  ]
);

// Re-export pets table from ./pets
export { pets, type Pet, type NewPet } from "./pets";
