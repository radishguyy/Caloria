import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export type ConsultationRoomStatus =
  | "ai"
  | "waiting_consultant"
  | "active_consultant"
  | "closed";

export type ConsultationSenderRole = "user" | "ai" | "consultant" | "system";

export interface ConsultationNutritionSnapshot {
  username: string;
  fullName: string | null;
  age?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
  tdeeKcal?: number | null;
  goal: string;
  goalPath: string;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  heightCm: number | null;
  bmiScore: number | null;
  targetCaloriesKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  todayCaloriesKcal: number;
  todayProteinG: number;
  todayCarbsG: number;
  todayFatG: number;
  recentFoods: string[];
  streakDays: number;
  todayMealsBreakdown?: Array<{
    mealTime: string;
    foods: string[];
    caloriesKcal: number;
    proteinG: number;
  }>;
  weeklyTrend?: {
    loggedDaysCount: number;
    avgCaloriesKcal: number;
    avgProteinG: number;
    avgCarbsG: number;
    avgFatG: number;
    daysOnTarget: number;
    daysOverTarget: number;
  };
  weightTrend?: {
    initialWeightKg: number | null;
    latestWeightKg: number | null;
    changeKg: number | null;
    logsCount: number;
    recentEntries: Array<{ date: string; weightKg: number }>;
  };
}

// 1. Consultation Rooms Table
export const consultationRooms = pgTable(
  "consultation_rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    consultantId: uuid("consultant_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    topic: varchar("topic", { length: 160 })
      .default("Konsultasi Gizi & Nutrisi")
      .notNull(),
    status: text("status")
      .$type<ConsultationRoomStatus>()
      .default("ai")
      .notNull(),
    aiSummary: text("ai_summary"),
    nutritionSnapshot: jsonb("nutrition_snapshot").$type<ConsultationNutritionSnapshot>(),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("consultation_rooms_user_id_idx").on(table.userId),
    index("consultation_rooms_consultant_id_idx").on(table.consultantId),
    index("consultation_rooms_status_idx").on(table.status),
  ]
);

// 2. Consultation Messages Table
export const consultationMessages = pgTable(
  "consultation_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .references(() => consultationRooms.id, { onDelete: "cascade" })
      .notNull(),
    senderRole: text("sender_role")
      .$type<ConsultationSenderRole>()
      .notNull(),
    senderId: uuid("sender_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    senderName: varchar("sender_name", { length: 100 }),
    content: text("content").notNull(),
    suggestHandoff: boolean("suggest_handoff").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("consultation_messages_room_id_idx").on(table.roomId),
    index("consultation_messages_created_at_idx").on(table.createdAt),
  ]
);

export type ConsultationRoom = typeof consultationRooms.$inferSelect;
export type NewConsultationRoom = typeof consultationRooms.$inferInsert;
export type ConsultationMessage = typeof consultationMessages.$inferSelect;
export type NewConsultationMessage = typeof consultationMessages.$inferInsert;
