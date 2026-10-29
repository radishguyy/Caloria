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
  clearPokeToast: () => void;
  setStreak: (days: number) => void;
  setFriends: (friends: Friend[]) => void;
}

export const DEFAULT_INITIAL_FRIENDS: Friend[] = [];
export const DEFAULT_INITIAL_RECOMMENDATIONS: FriendRecommendation[] = [];

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

      partyName: "Squad Co-op",
      partyCode: "CAL-COOP",
      coopStreakDays: 0,
      highestCoopStreak: 0,
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
                recommendations: data.recommendations,
              });
            }
          }
        } catch (err: any) {
          set({
            error:
              err?.message ||
              "Gagal memuat data teman dan rekomendasi dari database.",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      sendFriendRequest: async (targetUserId: string) => {
        try {
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ targetUserId }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            return {
              success: false,
              message: data.message || "Gagal mengirim permintaan pertemanan.",
            };
          }

          get().dismissRecommendation(targetUserId);
          await get().fetchSocialData();

          return {
            success: true,
            message: data.message || "Permintaan pertemanan berhasil dikirim!",
          };
        } catch (err: any) {
          return {
            success: false,
            message:
              err?.message ||
              "Terjadi kesalahan saat mengirim permintaan pertemanan.",
          };
        }
      },

      sendFriendRequestByUsername: async (username: string) => {
        try {
          const res = await fetch("/api/friends/invite", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ username }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            return {
              success: false,
              message: data.message || "Gagal mengirim permintaan pertemanan.",
            };
          }

          await get().fetchSocialData();

          return {
            success: true,
            message: data.message || "Permintaan pertemanan berhasil dikirim!",
          };
        } catch (err: any) {
          return {
            success: false,
            message:
              err?.message ||
              "Terjadi kesalahan saat mengirim permintaan pertemanan.",
          };
        }
      },

      acceptFriendRequest: async (requestId: string) => {
        try {
          const res = await fetch("/api/friends/respond", {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ requestId, action: "accept" }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(
              data.message || "Gagal menerima permintaan pertemanan.",
            );
          }

          await get().fetchSocialData();

          useNotificationStore.getState().addNotification({
            type: "friend_request",
            title: "Pertemanan Diterima! 🤝",
            message: "Kamu dan temanmu kini dapat saling memantau kepatuhan gizi harian.",
            actionUrl: "/social",
          });
        } catch (err: any) {
          console.error("acceptFriendRequest error:", err);
        }
      },

      declineFriendRequest: async (requestId: string) => {
        try {
          const res = await fetch("/api/friends/respond", {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ requestId, action: "decline" }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(
              data.message || "Gagal menolak permintaan pertemanan.",
            );
          }

          await get().fetchSocialData();
        } catch (err: any) {
          console.error("declineFriendRequest error:", err);
        }
      },

      dismissRecommendation: (userId: string) => {
        set((state) => ({
          recommendations: state.recommendations.filter(
            (r) => r.id !== userId,
          ),
        }));
      },

      pokeFriend: (friendId: string) => {
        const friend = get().friends.find(
          (f) => f.id === friendId || f.userId === friendId,
        );
        if (!friend) return null;

        const nowIso = new Date().toISOString();
        const pokeNotif: PokeNotification = {
          id: `poke-${Date.now()}`,
          fromUser: useAuthStore.getState().user?.fullName || "Kamu",
          toUser: friend.fullName,
          timestamp: nowIso,
          message: `Kamu menyenggol ${friend.fullName} agar segera mencatat makanan! 🔥`,
        };

        set((state) => ({
          pokeHistory: [pokeNotif, ...state.pokeHistory],
          activePokeToast: pokeNotif,
          friends: state.friends.map((f) =>
            f.id === friendId || f.userId === friendId
              ? { ...f, lastPokedAt: nowIso }
              : f,
          ),
        }));

        useNotificationStore.getState().addNotification({
          type: "poke",
          title: "Senggolan Teman Terkirim! ⚔️",
          message: `Senggolan pengingat makan berhasil dikirimkan kepada ${friend.fullName}.`,
          actionUrl: "/social",
        });

        return pokeNotif;
      },

      addFriendByUsername: (username: string) => {
        const clean = username.trim().replace(/^@/, "");
        if (!clean) return false;
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

      clearPokeToast: () => set({ activePokeToast: null }),
      setStreak: (days: number) =>
        set((state) => ({
          coopStreakDays: days,
          highestCoopStreak: Math.max(state.highestCoopStreak, days),
        })),
      setFriends: (friends: Friend[]) => set({ friends }),
    }),
    {
      name: "caloria-social-storage",
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || version < 5) {
          return {
            friends: [],
            pendingRequests: [],
            recommendations: [],
            isLoading: false,
            error: null,
            partyName: "Squad Co-op",
            partyCode: "CAL-COOP",
            coopStreakDays: 0,
            highestCoopStreak: 0,
            pokeHistory: [],
            activePokeToast: null,
            ...persistedState,
          };
        }
        return persistedState;
      },
    },
  ),
);

export default useSocialStore;
