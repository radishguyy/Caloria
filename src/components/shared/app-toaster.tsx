"use client";

import { Toaster } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReminderStackStore } from "@/store/use-reminder-stack-store";

const BASE_OFFSET = 16;
const STACK_GAP = 12;

/**
 * Sonner toaster that sits above the dashboard's bottom-right reminder cards.
 * Desktop only: on mobile the reminders are centered, so the corner stays free.
 */
export function AppToaster() {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const desktopHeight = useReminderStackStore((state) => state.desktopHeight);
  const bottomOffset =
    isDesktop && desktopHeight > 0 ? desktopHeight + BASE_OFFSET + STACK_GAP : BASE_OFFSET;

  return (
    <Toaster
      position="bottom-right"
      richColors
      theme="light"
      closeButton
      visibleToasts={1}
      offset={{ bottom: bottomOffset }}
      toastOptions={{
        className: "font-sans !rounded-2xl !border-2 !border-[#1E293B]/10 !shadow-md",
      }}
    />
  );
}
