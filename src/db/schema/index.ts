// Re-export all enums, tables, and relations
export * from "./enums";
export * from "./users";
export * from "./profiles";
export * from "./pets";
export * from "./meals";
export * from "./cosmetics";
export * from "./friendships";
export * from "./missions";
export * from "./social";
export * from "./gamification";
export * from "./push-subscriptions";
export * from "./recaps";
export * from "./relations";

import { profiles, weightLogs } from "./profiles";
import { pets } from "./pets";
import { foods, mealLogs, foodLogs, dailyNutritionSummaries } from "./meals";
import { accessories, userAccessories, userLoadouts, plazaItems, userWardrobe } from "./cosmetics";
import { friendships, coopParties, coopMembers, coopGroups } from "./friendships";
import { pokeLogs } from "./social";
import { userMissionEvaluations } from "./missions";
import {
  badges,
  userBadges,
  pushSubscriptions,
  notifications,
  coinTransactions,
} from "./gamification";
import { recaps } from "./recaps";

// ==========================================
// Inferred TypeScript Types ($inferSelect & $inferInsert)
// ==========================================

// 1. User & Physical Profile
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;

// 2. Pet State
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;

// 3. Nutrition & Food Diary
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;

export type MealLog = typeof mealLogs.$inferSelect;
export type NewMealLog = typeof mealLogs.$inferInsert;

export type FoodLog = typeof foodLogs.$inferSelect;
export type NewFoodLog = typeof foodLogs.$inferInsert;

export type DailyNutritionSummaryRecord =
  typeof dailyNutritionSummaries.$inferSelect;
export type NewDailyNutritionSummaryRecord =
  typeof dailyNutritionSummaries.$inferInsert;

// 4. Wardrobe & Equipped Loadouts
export type Accessory = typeof accessories.$inferSelect;
export type NewAccessory = typeof accessories.$inferInsert;

export type UserAccessory = typeof userAccessories.$inferSelect;
export type NewUserAccessory = typeof userAccessories.$inferInsert;

export type UserLoadout = typeof userLoadouts.$inferSelect;
export type NewUserLoadout = typeof userLoadouts.$inferInsert;

export type PlazaItem = typeof plazaItems.$inferSelect;
export type NewPlazaItem = typeof plazaItems.$inferInsert;

export type UserWardrobeItem = typeof userWardrobe.$inferSelect;
export type NewUserWardrobeItem = typeof userWardrobe.$inferInsert;

// 5. Friendships & Co-op Accountability
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

export type CoopParty = typeof coopParties.$inferSelect;
export type NewCoopParty = typeof coopParties.$inferInsert;

export type CoopGroup = typeof coopGroups.$inferSelect;
export type NewCoopGroup = typeof coopGroups.$inferInsert;

export type CoopMember = typeof coopMembers.$inferSelect;
export type NewCoopMember = typeof coopMembers.$inferInsert;

export type PokeLog = typeof pokeLogs.$inferSelect;
export type NewPokeLog = typeof pokeLogs.$inferInsert;

// 6. Missions
export type UserMissionEvaluation = typeof userMissionEvaluations.$inferSelect;
export type NewUserMissionEvaluation =
  typeof userMissionEvaluations.$inferInsert;

// 7. Gamification & Notifications
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type NotificationRecord = typeof notifications.$inferSelect;
export type NewNotificationRecord = typeof notifications.$inferInsert;

export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type NewCoinTransaction = typeof coinTransactions.$inferInsert;

// 8. Caloria Wrapped Story Recaps
export type Recap = typeof recaps.$inferSelect;
export type NewRecap = typeof recaps.$inferInsert;
