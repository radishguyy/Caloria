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
      friends: [],
      pendingRequests: [],
      recommendations: [],
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
            fetch("/api/friends/recommendations", { headers }).catch(() => null),
          ]);

          if (friendsRes && friendsRes.ok) {
            const data = await friendsRes.json();
            if (data.success) {
              const combinedRequests: FriendRequest[] = [
                ...(data.pendingRequests?.incoming || []),
                ...(data.pendingRequests?.outgoing || []),
              ];
              set({
                friends: Array.isArray(data.friends) ? data.friends : [],
                pendingRequests: combinedRequests,
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
              message: data.message || "Permintaan pertemanan berhasil dikirim!",
            };
          } else {
            return {
              success: false,
              message: data.message || "Gagal mengirim permintaan pertemanan.",
            };
          }
        } catch (err: any) {
          return { success: false, message: err?.message || "Gagal mengirim permintaan." };
        }
      },

      sendFriendRequestByUsername: async (username: string) => {
        const clean = username.trim().replace(/^@/, "");
        if (!clean) {
          return { success: false, message: "Masukkan username atau Caloria Tag yang valid!" };
        }

        const currentUsername = useAuthStore.getState().user?.username;
        if (currentUsername && clean.toLowerCase() === currentUsername.toLowerCase()) {
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
          const headers = getAuthHeaders();
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers,
            body: JSON.stringify({ username: clean }),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success) {
            await get().fetchSocialData();
            return { success: true, message: data.message || `Undangan berhasil dikirim ke @${clean}!` };
          } else {
            return { success: false, message: data.message || "Gagal mengirim undangan." };
          }
        } catch (err: any) {
          return { success: false, message: err?.message || "Gagal mengirim undangan." };
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
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3 || !persistedState) {
          return {
            ...persistedState,
            friends: [],
            pendingRequests: [],
            recommendations: [],
          };
        }
        return persistedState;
      },
    }
  )
);
