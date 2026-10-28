import { relations } from "drizzle-orm";
import { profiles, weightLogs } from "./profiles";
import { plazaItems, userWardrobe, pets } from "./pets-plaza";
import { foods, foodLogs, dailyNutritionSummaries } from "./nutrition";
import { friendships, coopGroups, coopMembers, pokeLogs } from "./social";
import {
  badges,
  userBadges,
  pushSubscriptions,
  notifications,
} from "./gamification";

// 1. Profiles Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  pet: one(pets, {
    fields: [profiles.id],
    references: [pets.userId],
  }),
  weightLogs: many(weightLogs),
  foodLogs: many(foodLogs),
  dailySummaries: many(dailyNutritionSummaries),
  userWardrobe: many(userWardrobe),
  userBadges: many(userBadges),
  coopMembers: many(coopMembers),
  createdCoopGroups: many(coopGroups),
  sentFriendRequests: many(friendships, { relationName: "friend_sender" }),
  receivedFriendRequests: many(friendships, { relationName: "friend_receiver" }),
  sentPokes: many(pokeLogs, { relationName: "poke_sender" }),
  receivedPokes: many(pokeLogs, { relationName: "poke_receiver" }),
  pushSubscriptions: many(pushSubscriptions),
  notifications: many(notifications),
}));

// 2. Weight Logs Relations
export const weightLogsRelations = relations(weightLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [weightLogs.userId],
    references: [profiles.id],
  }),
}));

// 3. Plaza Items Relations
export const plazaItemsRelations = relations(plazaItems, ({ many }) => ({
  userWardrobe: many(userWardrobe),
}));

// 4. User Wardrobe Relations
export const userWardrobeRelations = relations(userWardrobe, ({ one }) => ({
  user: one(profiles, {
    fields: [userWardrobe.userId],
    references: [profiles.id],
  }),
  item: one(plazaItems, {
    fields: [userWardrobe.itemId],
    references: [plazaItems.id],
  }),
}));

// 5. Pets Relations
export const petsRelations = relations(pets, ({ one }) => ({
  user: one(profiles, {
    fields: [pets.userId],
    references: [profiles.id],
  }),
  equippedHat: one(plazaItems, {
    fields: [pets.equippedHatId],
    references: [plazaItems.id],
    relationName: "equipped_hat",
  }),
  equippedOutfit: one(plazaItems, {
    fields: [pets.equippedOutfitId],
    references: [plazaItems.id],
    relationName: "equipped_outfit",
  }),
  equippedGlasses: one(plazaItems, {
    fields: [pets.equippedGlassesId],
    references: [plazaItems.id],
    relationName: "equipped_glasses",
  }),
  equippedAccessory: one(plazaItems, {
    fields: [pets.equippedAccessoryId],
    references: [plazaItems.id],
    relationName: "equipped_accessory",
  }),
  equippedRoom: one(plazaItems, {
    fields: [pets.equippedRoomId],
    references: [plazaItems.id],
    relationName: "equipped_room",
  }),
}));

// 6. Foods Relations
export const foodsRelations = relations(foods, ({ many }) => ({
  foodLogs: many(foodLogs),
}));

// 7. Food Logs Relations
export const foodLogsRelations = relations(foodLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [foodLogs.userId],
    references: [profiles.id],
  }),
  food: one(foods, {
    fields: [foodLogs.foodId],
    references: [foods.id],
  }),
}));

// 8. Daily Nutrition Summaries Relations
export const dailyNutritionSummariesRelations = relations(
  dailyNutritionSummaries,
  ({ one }) => ({
    user: one(profiles, {
      fields: [dailyNutritionSummaries.userId],
      references: [profiles.id],
    }),
  })
);

// 9. Friendships Relations
export const friendshipsRelations = relations(friendships, ({ one }) => ({
  sender: one(profiles, {
    fields: [friendships.senderId],
    references: [profiles.id],
    relationName: "friend_sender",
  }),
  receiver: one(profiles, {
    fields: [friendships.receiverId],
    references: [profiles.id],
    relationName: "friend_receiver",
  }),
}));

// 10. Co-op Groups Relations
export const coopGroupsRelations = relations(coopGroups, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [coopGroups.createdBy],
    references: [profiles.id],
  }),
  coopMembers: many(coopMembers),
  pokeLogs: many(pokeLogs),
}));

// 11. Co-op Members Relations
export const coopMembersRelations = relations(coopMembers, ({ one }) => ({
  group: one(coopGroups, {
    fields: [coopMembers.groupId],
    references: [coopGroups.id],
  }),
  user: one(profiles, {
    fields: [coopMembers.userId],
    references: [profiles.id],
  }),
}));

// 12. Poke Logs Relations
export const pokeLogsRelations = relations(pokeLogs, ({ one }) => ({
  sender: one(profiles, {
    fields: [pokeLogs.senderId],
    references: [profiles.id],
    relationName: "poke_sender",
  }),
  receiver: one(profiles, {
    fields: [pokeLogs.receiverId],
    references: [profiles.id],
    relationName: "poke_receiver",
  }),
  group: one(coopGroups, {
    fields: [pokeLogs.groupId],
    references: [coopGroups.id],
  }),
}));

// 13. Badges Relations
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

// 14. User Badges Relations
export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(profiles, {
    fields: [userBadges.userId],
    references: [profiles.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// 15. Push Subscriptions Relations
export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(profiles, {
      fields: [pushSubscriptions.userId],
      references: [profiles.id],
    }),
  })
);

// 16. Notifications Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
}));

