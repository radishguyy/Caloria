import { create } from "zustand";

interface ReminderStackState {
  /** Measured height (px) of the dashboard's bottom-right reminder cards on desktop. */
  desktopHeight: number;
  setDesktopHeight: (height: number) => void;
}

export const useReminderStackStore = create<ReminderStackState>((set) => ({
  desktopHeight: 0,
  setDesktopHeight: (desktopHeight) => set({ desktopHeight }),
}));
