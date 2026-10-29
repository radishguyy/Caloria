"use client";

/**
 * QuestBoard is refactored into:
 * 1. Dedicated full-page route: `src/app/quests/page.tsx` (/quests)
 * 2. Minimal summary widget: `src/components/shared/QuestWidget.tsx` (<QuestWidget />)
 *
 * This export is retained as an alias for backward compatibility.
 */
import { QuestWidget } from "@/components/shared/QuestWidget";

export { QuestWidget as QuestBoard };
export default QuestWidget;
