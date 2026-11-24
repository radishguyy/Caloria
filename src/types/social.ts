import type { GoalProgramType } from "./index";
import type { PetSpeciesId } from "@/lib/constants";

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Friend {
  id: string; // Friendship relation ID or user ID
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  petName?: string;
  petSpecies?: PetSpeciesId | string;
  petLevel?: number;
  petStage?: "Hatchling" | "Juvenile" | "Adult" | string;
  goalType?: GoalProgramType | string;
  caloriesLoggedToday?: number;
  calorieTarget?: number;
  mealsLoggedToday?: number;
  dailyGoalMet?: boolean;
  streakDays?: number;
  lastActiveText?: string;
  lastPokedAt?: string | null;
  status?: FriendshipStatus;
}

export type FriendRequestDirection = "incoming" | "outgoing";

export interface FriendRequest {
  id: string; // Friendship ID
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  direction: FriendRequestDirection;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
    avatarColor?: string;
    petName?: string;
    petSpecies?: PetSpeciesId | string;
    petLevel?: number;
    petStage?: string;
  };
  receiver?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface FriendRecommendation {
  id: string; // User ID
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  petName: string;
  petSpecies: PetSpeciesId | string;
  petLevel: number;
  petStage: string; // e.g. "Lv. 3 Hatchling", "Lv. 5 Juvenile"
  mutualTag: string; // e.g. "🔥 5-day streak", "🎯 Target Seimbang"
  calorieTarget: number;
  streakDays: number;
  goalType: string;
}
