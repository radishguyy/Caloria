import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Friend,
  FriendRequest,
  FriendRecommendation,
  PokeNotification,
} from "@/types";
import { useNotificationStore } from "@/store/use-notification-store";
import { useAuthStore } from "@/store/use-auth-store";

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
  sendFriendRequest: (
    targetUserId: string,
  ) => Promise<{ success: boolean; message: string }>;
  sendFriendRequestByUsername: (
    username: string,
  ) => Promise<{ success: boolean; message: string }>;
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
  setStreak: (days: number) => void;
}

export const DEFAULT_INITIAL_FRIENDS: Friend[] = [
  {
    id: "friend-afza",
    userId: "user-afza",
    username: "afza_fit",
    fullName: "Afza Fitriani",
    avatarColor: "bg-teal-500",
    petName: "Mochi",
    petSpecies: "bloomie",
    petLevel: 5,
    petStage: "Juvenile",
    goalType: "diet",
    caloriesLoggedToday: 850,
    calorieTarget: 1900,
    mealsLoggedToday: 1,
    dailyGoalMet: false,
    streakDays: 7,
    lastActiveText: "10 menit yang lalu",
    lastPokedAt: null,
    status: "accepted",
  },
  {
    id: "friend-budi",
    userId: "user-budi",
    username: "budi_santoso",
    fullName: "Budi Santoso",
    avatarColor: "bg-blue-500",
    petName: "Rocky",
    petSpecies: "boulder",
    petLevel: 6,
    petStage: "Adult",
    goalType: "bulking",
    caloriesLoggedToday: 2400,
    calorieTarget: 2600,
    mealsLoggedToday: 3,
    dailyGoalMet: true,
    streakDays: 14,
    lastActiveText: "1 jam yang lalu",
    lastPokedAt: null,
    status: "accepted",
  },
];

export const DEFAULT_INITIAL_RECOMMENDATIONS: FriendRecommendation[] = [
  {
    id: "rec-user-1",
    username: "dimas_runs",
    fullName: "Dimas Anggara",
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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

function getAuthHeaders(): HeadersInit {
  const currentUserId = useAuthStore.getState().user?.id;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (currentUserId) {
    headers["x-user-id"] = currentUserId;
  }
  return headers;
}

export const useSocialStore = create<SocialStoreState>()(
  persist(
    (set, get) => ({
      friends: DEFAULT_INITIAL_FRIENDS,
      pendingRequests: [],
      recommendations: DEFAULT_INITIAL_RECOMMENDATIONS,
      isLoading: false,
      error: null,

      partyName: "Squad Pejuang Sehat",
      partyCode: "CAL-8829",
      coopStreakDays: 7,
      highestCoopStreak: 14,
      pokeHistory: [],
      activePokeToast: null,

      fetchSocialData: async () => {
        try {
          set({ isLoading: true, error: null });
          const headers = getAuthHeaders();

          const [friendsRes, recsRes] = await Promise.all([
            fetch("/api/friends", { headers }).catch(() => null),
            fetch("/api/friends/recommendations", { headers }).catch(
              () => null,
            ),
          ]);

          if (friendsRes && friendsRes.ok) {
            const data = await friendsRes.json();
            if (data.success) {
              const combinedRequests: FriendRequest[] = [
                ...(data.pendingRequests?.incoming || []),
                ...(data.pendingRequests?.outgoing || []),
              ];
              const loadedFriends =
                Array.isArray(data.friends) && data.friends.length > 0
                  ? data.friends
                  : DEFAULT_INITIAL_FRIENDS;
              set({
                friends: loadedFriends,
                pendingRequests: combinedRequests,
              });
            }
          }

          if (recsRes && recsRes.ok) {
            const data = await recsRes.json();
            if (data.success && Array.isArray(data.recommendations)) {
              const loadedRecs =
                data.recommendations.length > 0
                  ? data.recommendations.slice(0, 3)
                  : DEFAULT_INITIAL_RECOMMENDATIONS;
              set({
                recommendations: loadedRecs,
              });
            }
          }
        } catch (err: any) {
          console.warn("[SocialStore] fetchSocialData error:", err?.message);
        } finally {
          set({ isLoading: false });
        }
      },

      sendFriendRequest: async (targetUserId: string) => {
        try {
          const headers = getAuthHeaders();
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers,
            body: JSON.stringify({ targetUserId }),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success) {
            // Refresh real data from DB
            await get().fetchSocialData();
            return {
              success: true,
              message:
                data.message || "Permintaan pertemanan berhasil dikirim!",
            };
          } else if (targetUserId.startsWith("rec-user-")) {
            return {
              success: true,
              message: "Permintaan pertemanan berhasil dikirim!",
            };
          } else {
            return {
              success: false,
              message: data.message || "Gagal mengirim permintaan pertemanan.",
            };
          }
        } catch (err: any) {
          return {
            success: false,
            message: err?.message || "Gagal mengirim permintaan.",
          };
        }
      },

      sendFriendRequestByUsername: async (username: string) => {
        const clean = username.trim().replace(/^@/, "");
        if (!clean) {
          return {
            success: false,
            message: "Masukkan username atau Caloria Tag yang valid!",
          };
        }

        const currentUsername = useAuthStore.getState().user?.username;
        if (
          currentUsername &&
          clean.toLowerCase() === currentUsername.toLowerCase()
        ) {
          return {
            success: false,
            message: "Kamu tidak bisa menambahkan akun sendiri sebagai teman.",
          };
        }

        // Prevent duplicate friend or pending request
        const isAlreadyFriend = get().friends.some(
          (f) => f.username.toLowerCase() === clean.toLowerCase(),
        );
        if (isAlreadyFriend) {
          return {
            success: false,
            message: `@${clean} sudah ada di daftar teman kamu!`,
          };
        }

        const isAlreadyPending = get().pendingRequests.some(
          (r) =>
            r.sender?.username?.toLowerCase() === clean.toLowerCase() ||
            r.receiver?.username?.toLowerCase() === clean.toLowerCase(),
        );
        if (isAlreadyPending) {
          return {
            success: false,
            message: `Permintaan ke @${clean} sudah dikirim dan sedang menunggu respon.`,
          };
        }

        try {
          const headers = getAuthHeaders();
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers,
            body: JSON.stringify({ username: clean }),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success) {
            await get().fetchSocialData();
            return {
              success: true,
              message:
                data.message || `Undangan berhasil dikirim ke @${clean}!`,
            };
          } else {
            return {
              success: false,
              message: data.message || "Gagal mengirim undangan.",
            };
          }
        } catch (err: any) {
          return {
            success: false,
            message: err?.message || "Gagal mengirim undangan.",
          };
        }
      },

      acceptFriendRequest: async (requestId: string) => {
        try {
          const headers = getAuthHeaders();
          const res = await fetch("/api/friends/respond", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ requestId, action: "accept" }),
          });

          if (res.ok) {
            await get().fetchSocialData();
          }
        } catch (err) {
          console.error("[SocialStore] acceptFriendRequest error:", err);
        }
      },

      declineFriendRequest: async (requestId: string) => {
        try {
          const headers = getAuthHeaders();
          const res = await fetch("/api/friends/respond", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ requestId, action: "decline" }),
          });

          if (res.ok) {
            await get().fetchSocialData();
          }
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
        const friend = get().friends.find(
          (f) => f.id === friendId || f.userId === friendId,
        );
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
            f.id === friendId || f.userId === friendId
              ? { ...f, lastPokedAt: nowStr }
              : f,
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
          (f) => f.username.toLowerCase() === clean.toLowerCase(),
        );
        if (exists) return false;

        // Trigger real invite via server
        get().sendFriendRequestByUsername(clean);
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
              : f,
          );
          const allMet = updatedFriends.every((f) => f.dailyGoalMet);
          return {
            friends: updatedFriends,
            coopStreakDays: allMet
              ? state.coopStreakDays + 1
              : state.coopStreakDays,
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
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (
          !persistedState ||
          !Array.isArray(persistedState.friends) ||
          persistedState.friends.length === 0
        ) {
          return {
            ...persistedState,
            friends: DEFAULT_INITIAL_FRIENDS,
            pendingRequests: persistedState?.pendingRequests || [],
            recommendations: persistedState?.recommendations || [],
          };
        }
        return persistedState;
      },
    },
  ),
);
