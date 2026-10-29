import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

// Pet State (Virtual Pet & Dynamic User Avatar)
export const pets = pgTable(
  "pets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .unique()
      .notNull(),
    name: varchar("name", { length: 50 }).default("Pyro").notNull(),
    species: varchar("species", { length: 50 }).default("flameling").notNull(),
    characterId: text("character_id").default("flameling").notNull(),
    stage: text("stage").default("hatchling").notNull(),
    level: integer("level").default(1).notNull(),
    exp: integer("exp").default(0).notNull(),
    currentXp: integer("current_xp").default(0).notNull(),
    nextLevelXp: integer("next_level_xp").default(100).notNull(),
    hunger: integer("hunger").default(100).notNull(),
    happiness: integer("happiness").default(100).notNull(),
    coins: integer("coins").default(0).notNull(),
    lastFedAt: timestamp("last_fed_at", { withTimezone: true }).defaultNow().notNull(),
    moodStatus: text("mood_status").default("happy").notNull(), // 'happy' | 'neutral' | 'complaining'
    customColors: jsonb("custom_colors").$type<Record<string, string>>().default({}),
    equippedHatId: uuid("equipped_hat_id"),
    equippedOutfitId: uuid("equipped_outfit_id"),
    equippedGlassesId: uuid("equipped_glasses_id"),
    equippedAccessoryId: uuid("equipped_accessory_id"),
    equippedRoomId: uuid("equipped_room_id"),
    skinColor: varchar("skin_color", { length: 50 }).default("default").notNull(),
    renderedAvatarIconUrl: text("rendered_avatar_icon_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("pets_user_id_idx").on(table.userId)]
);

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;

