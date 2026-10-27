import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SocialFriendMember, PokeNotification } from "@/types";

interface SocialStoreState {
  partyName: string;
  partyCode: string;
  coopStreakDays: number;
  highestCoopStreak: number;
  friends: SocialFriendMember[];
  pokeHistory: PokeNotification[];
  activePokeToast: PokeNotification | null;

  // Actions
  pokeFriend: (friendId: string) => PokeNotification | null;
  addFriendByUsername: (username: string) => boolean;
  joinPartyByCode: (code: string) => boolean;
  simulateFriendLog: (friendId: string) => void;
  clearPokeToast: () => void;
  /** Overwrite the streak from the server-side profile row (used by SessionProvider). */
  setStreak: (days: number) => void;
}

export const useSocialStore = create<SocialStoreState>()(
  persist(
    (set, get) => ({
      partyName: "Squad Pejuang Sehat",
      partyCode: "CAL-8829",
      coopStreakDays: 7,
      highestCoopStreak: 14,
      friends: [
        {
          id: "friend-afza",
          username: "afza_design",
          fullName: "Afza Pratama",
          avatarColor: "bg-brand-green",
          petName: "Leafy",
          petSpecies: "bloomie",
          petLevel: 5,
          goalType: "bulking",
          caloriesLoggedToday: 1850,
          calorieTarget: 2400,
          mealsLoggedToday: 3,
          dailyGoalMet: true,
          lastActiveText: "Baru saja mencatat makan siang",
          lastPokedAt: null,
        },
        {
          id: "friend-nadia",
          username: "nadia_fit",
          fullName: "Nadia Putri",
          avatarColor: "bg-brown",
          petName: "Bubbles",
          petSpecies: "droplet",
          petLevel: 4,
          goalType: "diet",
          caloriesLoggedToday: 420,
          calorieTarget: 1650,
          mealsLoggedToday: 1,
          dailyGoalMet: false,
          lastActiveText: "Belum mencatat makan siang & malam",
          lastPokedAt: null,
        },
        {
          id: "friend-rizky",
          username: "rizky_gym",
          fullName: "Rizky Ramadhan",
          avatarColor: "bg-brand-green-dark",
          petName: "Blaze",
          petSpecies: "flameling",
          petLevel: 6,
          goalType: "maintenance",
          caloriesLoggedToday: 0,
          calorieTarget: 2100,
          mealsLoggedToday: 0,
          dailyGoalMet: false,
          lastActiveText: "Belum mencatat makanan hari ini!",
          lastPokedAt: null,
        },
      ],
      pokeHistory: [
        {
          id: "poke-init-1",
          fromUser: "afza_design",
          toUser: "Kamu",
          message: "Afza menyenggolmu: Jangan lupa penuhi target protein hari ini agar Co-op Streak 7 hari kita aman!",
          timestamp: "2 jam lalu",
        },
      ],
      activePokeToast: null,

      pokeFriend: (friendId: string) => {
        const friend = get().friends.find((f) => f.id === friendId);
        if (!friend) return null;

        const nowStr = "Baru saja";
        const newPoke: PokeNotification = {
          id: `poke-${Date.now()}`,
          fromUser: "Kamu",
          toUser: friend.fullName,
          message: `Kamu menyenggol ${friend.fullName} (@${friend.username}) untuk segera mencatat makanan hari ini!`,
          timestamp: nowStr,
        };

        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === friendId ? { ...f, lastPokedAt: nowStr } : f
          ),
          pokeHistory: [newPoke, ...state.pokeHistory.slice(0, 9)],
          activePokeToast: newPoke,
        }));

        return newPoke;
      },

      addFriendByUsername: (username: string) => {
        const clean = username.trim().replace(/^@/, "");
        if (!clean) return false;

        const exists = get().friends.some(
          (f) => f.username.toLowerCase() === clean.toLowerCase()
        );
        if (exists) return false;

        const newFriend: SocialFriendMember = {
          id: `friend-${Date.now()}`,
          username: clean.toLowerCase().replace(/\s+/g, "_"),
          fullName: clean.charAt(0).toUpperCase() + clean.slice(1),
          avatarColor: "bg-brand-green",
          petName: "Sparky",
          petSpecies: "flameling",
          petLevel: 2,
          goalType: "diet",
          caloriesLoggedToday: 650,
          calorieTarget: 1800,
          mealsLoggedToday: 1,
          dailyGoalMet: false,
          lastActiveText: "Baru bergabung ke Co-op Party",
          lastPokedAt: null,
        };

        set((state) => ({
          friends: [...state.friends, newFriend],
        }));
        return true;
      },

      joinPartyByCode: (code: string) => {
        const clean = code.trim().toUpperCase();
        if (!clean) return false;
        set({
          partyCode: clean,
          partyName: `Squad ${clean}`,
        });
        return true;
      },

      simulateFriendLog: (friendId: string) => {
        set((state) => {
          const updatedFriends = state.friends.map((f) =>
            f.id === friendId
              ? {
                  ...f,
                  caloriesLoggedToday: f.calorieTarget - 120,
                  mealsLoggedToday: 3,
                  dailyGoalMet: true,
                  lastActiveText: "Baru saja menyelesaikan misi gizi harian!",
                }
              : f
          );
          const allMet = updatedFriends.every((f) => f.dailyGoalMet);
          return {
            friends: updatedFriends,
            coopStreakDays: allMet ? state.coopStreakDays + 1 : state.coopStreakDays,
            highestCoopStreak: allMet
              ? Math.max(state.highestCoopStreak, state.coopStreakDays + 1)
              : state.highestCoopStreak,
          };
        });
      },

      clearPokeToast: () => set({ activePokeToast: null }),
      setStreak: (days: number) =>
        set((state) => ({
          coopStreakDays: days,
          highestCoopStreak: Math.max(state.highestCoopStreak, days),
        })),
    }),
    {
      name: "caloria-social-storage",
    }
  )
);

