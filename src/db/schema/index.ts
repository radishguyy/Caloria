// Re-export all enums, tables, and relations
export * from "./enums";
export * from "./users";
export * from "./profiles";
export * from "./pets-plaza";
export * from "./nutrition";
export * from "./friendships";
export * from "./social";
export * from "./gamification";
export * from "./push-subscriptions";
export * from "./relations";

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

import { profiles, weightLogs } from "./profiles";
import { plazaItems, userWardrobe, pets } from "./pets-plaza";
import { foods, foodLogs, dailyNutritionSummaries } from "./nutrition";
import { friendships, coopGroups, coopMembers, pokeLogs } from "./social";
import {
  badges,
  userBadges,
  pushSubscriptions,
  notifications,
  coinTransactions,
} from "./gamification";

// ==========================================
// Inferred TypeScript Types ($inferSelect & $inferInsert)
// ==========================================

// 1. User & Physical Profile
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;

// 2. Pet & Plaza (Wardrobe Shop)
export type PlazaItem = typeof plazaItems.$inferSelect;
export type NewPlazaItem = typeof plazaItems.$inferInsert;

export type UserWardrobeItem = typeof userWardrobe.$inferSelect;
export type NewUserWardrobeItem = typeof userWardrobe.$inferInsert;

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;

// 3. Nutrition & Food Diary
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;

export type FoodLog = typeof foodLogs.$inferSelect;
export type NewFoodLog = typeof foodLogs.$inferInsert;

export type DailyNutritionSummaryRecord =
  typeof dailyNutritionSummaries.$inferSelect;
export type NewDailyNutritionSummaryRecord =
  typeof dailyNutritionSummaries.$inferInsert;

// 4. Social & Co-op Accountability
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

export type CoopGroup = typeof coopGroups.$inferSelect;
export type NewCoopGroup = typeof coopGroups.$inferInsert;

export type CoopMember = typeof coopMembers.$inferSelect;
export type NewCoopMember = typeof coopMembers.$inferInsert;

export type PokeLog = typeof pokeLogs.$inferSelect;
export type NewPokeLog = typeof pokeLogs.$inferInsert;

// 5. Gamification & Notifications
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

