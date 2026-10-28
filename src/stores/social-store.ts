import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Friend,
  FriendRequest,
  FriendRecommendation,
  PokeNotification,
} from "@/types";
import { useNotificationStore } from "@/store/use-notification-store";

export interface SocialStoreState {
  // Friends & Invitations
  friends: Friend[];
  pendingRequests: FriendRequest[];
  recommendations: FriendRecommendation[];
  isLoading: boolean;
  error: string | null;

  // Co-op & Squad
  partyName: string;
  partyCode: string;
  coopStreakDays: number;
  highestCoopStreak: number;
  pokeHistory: PokeNotification[];
  activePokeToast: PokeNotification | null;

  // Actions
  fetchSocialData: () => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<{ success: boolean; message: string }>;
  sendFriendRequestByUsername: (username: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  dismissRecommendation: (userId: string) => void;

  // Co-op actions
  pokeFriend: (friendId: string) => PokeNotification | null;
  addFriendByUsername: (username: string) => boolean;
  joinPartyByCode: (code: string) => boolean;
  simulateFriendLog: (friendId: string) => void;
  clearPokeToast: () => void;
  simulateIncomingRequest: (name: string, username: string) => void;
}

const INITIAL_FRIENDS: Friend[] = [
  {
    id: "friendship-afza",
    userId: "user-afza",
    username: "afza_design",
    fullName: "Afza Pratama",
    avatarColor: "bg-indigo-500",
    petName: "Leafy",
    petSpecies: "bloomie",
    petLevel: 5,
    petStage: "Juvenile",
    goalType: "bulking",
    caloriesLoggedToday: 1850,
    calorieTarget: 2400,
    mealsLoggedToday: 3,
    dailyGoalMet: true,
    streakDays: 7,
    lastActiveText: "Baru saja mencatat makan siang",
    lastPokedAt: null,
    status: "accepted",
  },
  {
    id: "friendship-nadia",
    userId: "user-nadia",
    username: "nadia_fit",
    fullName: "Nadia Putri",
    avatarColor: "bg-rose-500",
    petName: "Bubbles",
    petSpecies: "droplet",
    petLevel: 4,
    petStage: "Hatchling",
    goalType: "diet",
    caloriesLoggedToday: 420,
    calorieTarget: 1650,
    mealsLoggedToday: 1,
    dailyGoalMet: false,
    streakDays: 4,
    lastActiveText: "Belum mencatat makan siang & malam",
    lastPokedAt: null,
    status: "accepted",
  },
  {
    id: "friendship-rizky",
    userId: "user-rizky",
    username: "rizky_gym",
    fullName: "Rizky Ramadhan",
    avatarColor: "bg-emerald-500",
    petName: "Blaze",
    petSpecies: "flameling",
    petLevel: 6,
    petStage: "Juvenile",
    goalType: "maintenance",
    caloriesLoggedToday: 0,
    calorieTarget: 2100,
    mealsLoggedToday: 0,
    dailyGoalMet: false,
    streakDays: 12,
    lastActiveText: "Belum mencatat makanan hari ini!",
    lastPokedAt: null,
    status: "accepted",
  },
];

const INITIAL_REQUESTS: FriendRequest[] = [
  {
    id: "req-incoming-1",
    senderId: "user-budi",
    receiverId: "current-user",
    status: "pending",
    direction: "incoming",
    sender: {
      id: "user-budi",
      username: "budi_health",
      fullName: "Budi Santoso",
      avatarColor: "bg-teal-500",
      petName: "Sprout",
      petSpecies: "bloomie",
      petLevel: 3,
      petStage: "Hatchling",
    },
    createdAt: "2 jam yang lalu",
  },
  {
    id: "req-outgoing-1",
    senderId: "current-user",
    receiverId: "user-maya",
    status: "pending",
    direction: "outgoing",
    sender: {
      id: "current-user",
      username: "iman_dev",
      fullName: "Iman Nur",
    },
    receiver: {
      id: "user-maya",
      username: "mayasalsa",
      fullName: "Maya Salsabila",
    },
    createdAt: "Kemarin",
  },
];

const INITIAL_RECOMMENDATIONS: FriendRecommendation[] = [
  {
    id: "rec-user-1",
    username: "dimas_runs",
    fullName: "Dimas Anggara",
    petName: "Leafy",
    petSpecies: "bloomie",
    petLevel: 4,
    petStage: "Hatchling",
    mutualTag: "🔥 5-day streak",
    calorieTarget: 2200,
    streakDays: 5,
    goalType: "maintenance",
  },
  {
    id: "rec-user-2",
    username: "siti_balance",
    fullName: "Siti Rahma",
    petName: "Aqua",
    petSpecies: "droplet",
    petLevel: 5,
    petStage: "Juvenile",
    mutualTag: "🎯 Target Seimbang",
    calorieTarget: 1800,
    streakDays: 9,
    goalType: "diet",
  },
  {
    id: "rec-user-3",
    username: "kevin_lift",
    fullName: "Kevin Wijaya",
    petName: "Pyro",
    petSpecies: "flameling",
    petLevel: 6,
    petStage: "Juvenile",
    mutualTag: "💪 Fokus Protein",
    calorieTarget: 2600,
    streakDays: 12,
    goalType: "bulking",
  },
];

export const useSocialStore = create<SocialStoreState>()(
  persist(
    (set, get) => ({
      friends: INITIAL_FRIENDS,
      pendingRequests: INITIAL_REQUESTS,
      recommendations: INITIAL_RECOMMENDATIONS.slice(0, 3),
      isLoading: false,
      error: null,

      partyName: "Squad Pejuang Sehat",
      partyCode: "CAL-8829",
      coopStreakDays: 7,
      highestCoopStreak: 14,
      pokeHistory: [
        {
          id: "poke-init-1",
          fromUser: "afza_design",
          toUser: "Kamu",
          message:
            "Afza menyenggolmu: Jangan lupa penuhi target protein hari ini agar Co-op Streak 7 hari kita aman!",
          timestamp: "2 jam lalu",
        },
      ],
      activePokeToast: null,

      fetchSocialData: async () => {
        try {
          set({ isLoading: true, error: null });
          const [friendsRes, recsRes] = await Promise.all([
            fetch("/api/friends").catch(() => null),
            fetch("/api/friends/recommendations").catch(() => null),
          ]);

          if (friendsRes && friendsRes.ok) {
            const data = await friendsRes.json();
            if (data.success) {
              const combinedRequests: FriendRequest[] = [
                ...(data.pendingRequests?.incoming || []),
                ...(data.pendingRequests?.outgoing || []),
              ];
              set({
                friends: data.friends?.length ? data.friends : get().friends,
                pendingRequests: combinedRequests.length
                  ? combinedRequests
                  : get().pendingRequests,
              });
            }
          }

          if (recsRes && recsRes.ok) {
            const data = await recsRes.json();
            if (data.success && Array.isArray(data.recommendations)) {
              set({
                recommendations: data.recommendations.slice(0, 3),
              });
            }
          }
        } catch (err: any) {
          console.warn("[SocialStore] fetchSocialData offline fallback:", err?.message);
        } finally {
          set({ isLoading: false });
        }
      },

      sendFriendRequest: async (targetUserId: string) => {
        try {
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId }),
          }).catch(() => null);

          // Optimistic local state update
          const rec = get().recommendations.find((r) => r.id === targetUserId);
          const newReq: FriendRequest = {
            id: `req-out-${Date.now()}`,
            senderId: "current-user",
            receiverId: targetUserId,
            status: "pending",
            direction: "outgoing",
            sender: {
              id: "current-user",
              username: "iman_dev",
              fullName: "Iman Nur",
            },
            receiver: {
              id: targetUserId,
              username: rec?.username || "caloria_user",
              fullName: rec?.fullName || "Teman Caloria",
              avatarUrl: rec?.avatarUrl,
            },
            createdAt: "Baru saja",
          };

          set((state) => ({
            pendingRequests: [newReq, ...state.pendingRequests],
            recommendations: state.recommendations.filter((r) => r.id !== targetUserId),
          }));

          return { success: true, message: "Permintaan pertemanan berhasil dikirim!" };
        } catch (err: any) {
          return { success: false, message: err?.message || "Gagal mengirim permintaan." };
        }
      },

      sendFriendRequestByUsername: async (username: string) => {
        const clean = username.trim().replace(/^@/, "");
        if (!clean) {
          return { success: false, message: "Masukkan username atau Caloria Tag yang valid!" };
        }

        // Prevent self-friending
        if (clean.toLowerCase() === "iman_dev" || clean.toLowerCase() === "nuriman") {
          return { success: false, message: "Kamu tidak bisa menambahkan akun sendiri sebagai teman." };
        }

        // Prevent duplicate friend or pending request
        const isAlreadyFriend = get().friends.some(
          (f) => f.username.toLowerCase() === clean.toLowerCase()
        );
        if (isAlreadyFriend) {
          return { success: false, message: `@${clean} sudah ada di daftar teman kamu!` };
        }

        const isAlreadyPending = get().pendingRequests.some(
          (r) =>
            r.sender?.username?.toLowerCase() === clean.toLowerCase() ||
            r.receiver?.username?.toLowerCase() === clean.toLowerCase()
        );
        if (isAlreadyPending) {
          return { success: false, message: `Permintaan ke @${clean} sudah dikirim dan sedang menunggu respon.` };
        }

        try {
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: clean }),
          }).catch(() => null);

          // Optimistic local update
          const newReq: FriendRequest = {
            id: `req-out-${Date.now()}`,
            senderId: "current-user",
            receiverId: `user-${clean.toLowerCase()}`,
            status: "pending",
            direction: "outgoing",
            sender: {
              id: "current-user",
              username: "iman_dev",
              fullName: "Iman Nur",
            },
            receiver: {
              id: `user-${clean.toLowerCase()}`,
              username: clean,
              fullName: clean.charAt(0).toUpperCase() + clean.slice(1),
            },
            createdAt: "Baru saja",
          };

          set((state) => ({
            pendingRequests: [newReq, ...state.pendingRequests],
            recommendations: state.recommendations.filter(
              (r) => r.username.toLowerCase() !== clean.toLowerCase()
            ),
          }));

          return { success: true, message: `Undangan berhasil dikirim ke @${clean}!` };
        } catch (err: any) {
          return { success: false, message: err?.message || "Gagal mengirim undangan." };
        }
      },

      acceptFriendRequest: async (requestId: string) => {
        const req = get().pendingRequests.find((r) => r.id === requestId);
        if (!req) return;

        try {
          await fetch("/api/friends/respond", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, action: "accept" }),
          }).catch(() => null);

          const newFriend: Friend = {
            id: req.id,
            userId: req.sender.id,
            username: req.sender.username,
            fullName: req.sender.fullName,
            avatarUrl: req.sender.avatarUrl,
            avatarColor: req.sender.avatarColor || "bg-teal-500",
            petName: req.sender.petName || "Buddy",
            petSpecies: req.sender.petSpecies || "bloomie",
            petLevel: req.sender.petLevel || 3,
            petStage: (req.sender.petStage as any) || "Hatchling",
            goalType: "diet",
            caloriesLoggedToday: 0,
            calorieTarget: 2000,
            mealsLoggedToday: 0,
            dailyGoalMet: false,
            streakDays: 1,
            lastActiveText: "Baru saja menjadi teman",
            lastPokedAt: null,
            status: "accepted",
          };

          set((state) => ({
            friends: [newFriend, ...state.friends],
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
          }));
        } catch (err) {
          console.error("[SocialStore] acceptFriendRequest error:", err);
        }
      },

      declineFriendRequest: async (requestId: string) => {
        try {
          await fetch("/api/friends/respond", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, action: "decline" }),
          }).catch(() => null);

          set((state) => ({
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
          }));
        } catch (err) {
          console.error("[SocialStore] declineFriendRequest error:", err);
        }
      },

      dismissRecommendation: (userId: string) => {
        set((state) => ({
          recommendations: state.recommendations.filter((r) => r.id !== userId),
        }));
      },

      // Co-op & Friend interactions
      pokeFriend: (friendId: string) => {
        const friend = get().friends.find((f) => f.id === friendId || f.userId === friendId);
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
            f.id === friendId || f.userId === friendId ? { ...f, lastPokedAt: nowStr } : f
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

        const newFriend: Friend = {
          id: `friend-${Date.now()}`,
          userId: `user-${clean.toLowerCase()}`,
          username: clean.toLowerCase().replace(/\s+/g, "_"),
          fullName: clean.charAt(0).toUpperCase() + clean.slice(1),
          avatarColor: "bg-amber-500",
          petName: "Sparky",
          petSpecies: "flameling",
          petLevel: 2,
          petStage: "Hatchling",
          goalType: "diet",
          caloriesLoggedToday: 650,
          calorieTarget: 1800,
          mealsLoggedToday: 1,
          dailyGoalMet: false,
          streakDays: 1,
          lastActiveText: "Baru bergabung ke Co-op Party",
          lastPokedAt: null,
          status: "accepted",
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
            f.id === friendId || f.userId === friendId
              ? {
                  ...f,
                  caloriesLoggedToday: (f.calorieTarget || 2000) - 120,
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

      simulateIncomingRequest: (name: string, username: string) => {
        const clean = username.trim().replace(/^@/, "");
        const newReq: FriendRequest = {
          id: `req-sim-${Date.now()}`,
          senderId: `user-${clean}`,
          receiverId: "current-user",
          status: "pending",
          direction: "incoming",
          sender: {
            id: `user-${clean}`,
            username: clean,
            fullName: name,
            avatarColor: "bg-emerald-500",
            petName: "Nori",
            petSpecies: "droplet",
            petLevel: 4,
            petStage: "Juvenile",
          },
          createdAt: "Baru saja",
        };

        set((state) => ({
          pendingRequests: [newReq, ...state.pendingRequests],
        }));

        // In-app notification sync
        useNotificationStore.getState().addNotification({
          type: "friend_request",
          title: "Permintaan Pertemanan Baru! 🤝",
          message: `${name} mengajakmu berteman di Caloria.`,
          actionUrl: "/social",
        });
      },
    }),
    {
      name: "caloria-social-storage",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2 || !persistedState) {
          return {
            ...persistedState,
            friends: persistedState?.friends || INITIAL_FRIENDS,
            pendingRequests: persistedState?.pendingRequests || INITIAL_REQUESTS,
            recommendations:
              persistedState?.recommendations || INITIAL_RECOMMENDATIONS.slice(0, 3),
          };
        }
        return persistedState;
      },
    }
  )
);

