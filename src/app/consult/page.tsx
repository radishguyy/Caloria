"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Send,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  Loader2,
  X,
  History,
  Inbox,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserConsultRoomAction,
  createNewConsultRoomAction,
  sendUserConsultMessageAction,
  escalateToConsultantAction,
  switchRoomBackToAIAction,
  closeConsultationRoomAction,
  type ConsultationRoomDTO,
  type ConsultationMessageDTO,
  type ConsultationPetInfo,
} from "@/app/actions/consultation";
import { CharacterSvg } from "@/components/pet/character-svg";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuthStore } from "@/store/use-auth-store";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useFoodStore } from "@/store/use-food-store";
import { getTodayKey } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Evaluasi kalori & protein aku hari ini dong",
  "Rekomendasi makan malam tinggi protein di bawah 500 kkal",
  "Kenapa berat badanku stagnan padahal sudah defisit?",
  "Tips supaya nggak gampang lapar saat defisit kalori",
];

const DISMISSED_HANDOFF_STORAGE_KEY = "caloria-dismissed-handoff-ids";

function readDismissedHandoffIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = sessionStorage.getItem(DISMISSED_HANDOFF_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDayLabel(iso: string) {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Hari ini";
    if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function FormattedMessageText({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) {
          return <div key={i} className="h-1" />;
        }
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={i} className="text-xs sm:text-sm">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={j} className="font-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (
                part.startsWith("*") &&
                part.endsWith("*") &&
                part.length > 2
              ) {
                return (
                  <em key={j} className="italic">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function ConsultPage() {
  const hydrated = useHydrated();
  const { user: authUser } = useAuthStore();
  const petStore = usePetStore();
  const { equipped } = useCosmeticsStore();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [followUpTyping, setFollowUpTyping] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [petInfo, setPetInfo] = useState<ConsultationPetInfo | null>(null);
  const [rooms, setRooms] = useState<ConsultationRoomDTO[]>([]);
  const [room, setRoom] = useState<ConsultationRoomDTO | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageDTO[]>([]);
  const [inputText, setInputText] = useState("");
  const [dismissedHandoffMsgIds, setDismissedHandoffMsgIds] = useState<
    string[]
  >(readDismissedHandoffIds);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const suppressRealtimeRef = useRef(false);
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissHandoffMessage = useCallback((msgId: string) => {
    setDismissedHandoffMsgIds((prev) => {
      if (prev.includes(msgId)) return prev;
      const next = [...prev, msgId];
      try {
        sessionStorage.setItem(
          DISMISSED_HANDOFF_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        // Ignore storage write failures
      }
      return next;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  const loadRoom = useCallback(
    async (silent = false, targetRoomId?: string) => {
      if (silent && suppressRealtimeRef.current) return;
      if (!silent) setLoading(true);
      try {
        const res = await getUserConsultRoomAction(targetRoomId);
        if (res.petInfo) setPetInfo(res.petInfo);
        setRooms(res.rooms);
        setRoom(res.room);
        setMessages(res.messages);
      } catch (err) {
        console.error("[ConsultPage] loadRoom error:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  const handleSelectRoom = async (roomId: string) => {
    setHistoryOpen(false);
    await loadRoom(false, roomId);
  };

  const handleCreateNewChat = async () => {
    if (creatingRoom) return;
    setCreatingRoom(true);
    try {
      const res = await createNewConsultRoomAction();
      if (res.success && res.room) {
        setHistoryOpen(false);
        await loadRoom(false, res.room.id);
      } else {
        toast.error(res.error || "Gagal membuat chat baru.");
      }
    } finally {
      setCreatingRoom(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Real-time updates on the single consultation room
  useEffect(() => {
    if (!room?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`consult-room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_messages",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          loadRoom(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_rooms",
          filter: `id=eq.${room.id}`,
        },
        () => {
          loadRoom(true);
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      if (
        room.status === "waiting_consultant" ||
        room.status === "active_consultant"
      ) {
        loadRoom(true);
      }
    }, 6000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [room?.id, room?.status, loadRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, sending, followUpTyping, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    };
  }, []);

  // Lock outer page scroll so only the chat messages container scrolls
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const latestAiMessage = [...messages]
    .reverse()
    .find((m) => m.senderRole === "ai");

  const showHandoffSuggestion = Boolean(
    hydrated &&
    !loading &&
    room?.status === "ai" &&
    latestAiMessage?.suggestHandoff &&
    !dismissedHandoffMsgIds.includes(latestAiMessage.id),
  );

  useEffect(() => {
    if (!showHandoffSuggestion || !latestAiMessage?.id) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissHandoffMessage(latestAiMessage.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showHandoffSuggestion, latestAiMessage?.id, dismissHandoffMessage]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim();
    if (!textToSend || sending || !room) return;

    if (latestAiMessage?.suggestHandoff) {
      dismissHandoffMessage(latestAiMessage.id);
    }

    if (!customText) setInputText("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ConsultationMessageDTO = {
      id: tempId,
      roomId: room.id,
      senderRole: "user",
      senderId: authUser?.id || null,
      senderName: authUser?.fullName || authUser?.username || "Kamu",
      content: textToSend,
      suggestHandoff: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const res = await sendUserConsultMessageAction({
        roomId: room.id,
        content: textToSend,
      });

      if (res.success) {
        if (res.followUpMessage) {
          suppressRealtimeRef.current = true;
        }
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          const next = [...withoutTemp];
          if (res.userMessage) next.push(res.userMessage);
          if (res.aiMessage) next.push(res.aiMessage);
          return next;
        });
        if (res.room) {
          setRoom(res.room);
        }
        scrollToBottom();

        // If CalPal logged a food item to the user's diary, sync client store & trigger Sonner toast
        if (res.loggedFood) {
          const lf = res.loggedFood;
          const mealLabels: Record<string, string> = {
            breakfast: "Sarapan",
            lunch: "Makan Siang",
            dinner: "Makan Malam",
            snack: "Camilan",
          };
          useFoodStore.getState().addLog({
            name: lf.foodName,
            mealType: lf.mealTime,
            loggedDate: getTodayKey(),
            servingSize: 1,
            servingUnit: "porsi",
            calories: lf.caloriesKcal,
            proteinG: lf.proteinG,
            carbsG: lf.carbsG,
            fatG: lf.fatG,
            fiberG: 0,
            sugarG: 0,
          });
          toast.success(`${lf.foodName} dicatat ke Food Diary!`, {
            description: `${mealLabels[lf.mealTime] || lf.mealTime} • +${lf.caloriesKcal} kkal (P: ${lf.proteinG}g, K: ${lf.carbsG}g, L: ${lf.fatG}g) • +${lf.xpEarned} XP`,
          });
        }

        // If CalPal wants to remind the user to log food, show typing indicator for ~1.5s then reveal 2nd bubble
        if (res.followUpMessage) {
          const delayedMsg = res.followUpMessage;
          setFollowUpTyping(true);
          const delayMs = 1400 + Math.floor(Math.random() * 500);
          followUpTimerRef.current = setTimeout(() => {
            setFollowUpTyping(false);
            setMessages((prev) =>
              prev.some((m) => m.id === delayedMsg.id)
                ? prev
                : [...prev, delayedMsg],
            );
            suppressRealtimeRef.current = false;
            scrollToBottom();
          }, delayMs);
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(res.error || "Gagal mengirim pesan.");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  const handleEscalateToConsultant = async () => {
    if (!room || escalating) return;
    setEscalating(true);
    try {
      const res = await escalateToConsultantAction(room.id);
      if (res.success) {
        if (latestAiMessage?.id) {
          dismissHandoffMessage(latestAiMessage.id);
        }
        await loadRoom(true);
        toast.success("Chat berhasil diteruskan ke Konsultan Gizi!");
      } else {
        toast.error(res.error || "Gagal menyambungkan ke konsultan gizi.");
      }
    } finally {
      setEscalating(false);
    }
  };

  const handleSwitchBackToAI = async () => {
    if (!room) return;
    const res = await switchRoomBackToAIAction(room.id);
    if (res.success) {
      await loadRoom(true);
      toast.success("Kembali ke mode Caloria AI.");
    }
  };

  const handleCloseSession = async () => {
    if (!room) return;
    const res = await closeConsultationRoomAction(room.id);
    if (res.success) {
      await loadRoom(true);
      toast.success("Sesi konsultasi selesai.");
    }
  };

  const isConsultantUser =
    hydrated &&
    (authUser?.role === "nutritionist" || authUser?.role === "admin");

  const consultantDisplayName =
    room?.consultant?.fullName ||
    room?.consultant?.username ||
    "Konsultan Gizi";

  const activePetName = petInfo?.name || petStore.name || "CalPal";
  const activeCharacterId =
    petInfo?.characterId || (petStore.species as any) || "flameling";
  const activeColors =
    petInfo?.customColors && Object.keys(petInfo.customColors).length > 0
      ? petInfo.customColors
      : petStore.customColors;

  return (
    <div className="fixed inset-x-0 top-16 bottom-[66px] lg:bottom-0 z-20 flex flex-col bg-canvas overflow-hidden">
      {/* 1. Sticky Unified Chat Header */}
      <header className="shrink-0 border-b border-border-divider bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-3 px-4 py-3 sm:px-6">
          {/* Left: Back + Avatar + Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/dashboard"
              aria-label="Kembali ke Dashboard"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-default bg-surface hover:bg-accent-green-light text-ink-muted hover:text-ink transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>

            {room?.status === "ai" ? (
              <div className="h-11 w-11 rounded-2xl bg-[#FCF8E3] border border-accent-green/40 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                <CharacterSvg
                  characterId={activeCharacterId}
                  colors={activeColors}
                  earsVariant={petStore.earsVariant}
                  tailVariant={petStore.tailVariant}
                  faceVariant={petStore.faceVariant}
                  equipped={equipped}
                  showRoomBackdrop={false}
                  size="sm"
                />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 text-[#1e293b] bg-accent-orange">
                <Stethoscope className="h-5 w-5" aria-hidden="true" />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-text-primary font-heading truncate">
                {room?.status === "ai" && activePetName}
                {room?.status === "waiting_consultant" &&
                  "Menunggu Konsultan Gizi"}
                {room?.status === "active_consultant" && consultantDisplayName}
                {room?.status === "closed" && "Sesi Konsultasi Selesai"}
                {!room && "Konsultasi Gizi"}
              </h1>
            </div>
          </div>

          {/* Right: Handoff / Mode Actions + Inbox Konsultan + History */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {room?.status === "ai" && (
              <button
                type="button"
                onClick={handleEscalateToConsultant}
                disabled={escalating}
                className="inline-flex min-h-11 items-center gap-1.5 px-3 sm:px-3.5 rounded-2xl text-xs font-bold bg-accent-orange text-[#1e293b] hover:opacity-90 transition-opacity cursor-pointer font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e293b]"
              >
                {escalating ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  Lanjut ke Konsultan Gizi
                </span>
                <span className="sm:hidden">Konsultan</span>
              </button>
            )}

            {(room?.status === "waiting_consultant" ||
              room?.status === "active_consultant") && (
              <button
                type="button"
                onClick={handleSwitchBackToAI}
                className="inline-flex min-h-11 items-center gap-1 px-2.5 sm:px-3 rounded-2xl text-xs font-bold bg-surface border border-border-default hover:bg-accent-green-light text-ink transition-colors cursor-pointer font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
              >
                <Sparkles
                  className="h-3.5 w-3.5 text-[#4f7a2a]"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Kembali ke AI</span>
                <span className="sm:hidden">AI</span>
              </button>
            )}

            {room?.status === "active_consultant" && (
              <button
                type="button"
                onClick={handleCloseSession}
                className="inline-flex min-h-11 items-center gap-1 px-2.5 sm:px-3 rounded-2xl text-xs font-bold bg-surface border border-border-default hover:bg-brand-green-light text-ink transition-colors cursor-pointer font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Selesai</span>
              </button>
            )}

            {isConsultantUser && (
              <Link
                href="/consultant/inbox"
                aria-label="Buka Inbox Konsultan"
                title="Inbox Konsultan"
                className="inline-flex min-h-11 items-center gap-1.5 px-2.5 sm:px-3.5 rounded-2xl text-xs font-bold bg-brand-green-light text-[#1e293b] hover:bg-brand-green transition-colors font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
              >
                <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Inbox Konsultan</span>
                <span className="sm:hidden">Inbox</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title="Riwayat chat"
              aria-label="Riwayat chat"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-default bg-surface hover:bg-accent-green-light text-ink-muted hover:text-ink transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
            >
              <History className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Chat Viewport Container (with floating Ahli Gizi modal on top) */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <AnimatePresence>
          {showHandoffSuggestion && latestAiMessage && (
            <motion.div
              role="dialog"
              aria-label="Saran konsultasi dengan Ahli Gizi"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-4 sm:px-6"
            >
              <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border-2 border-accent-orange bg-[#FCF8E3] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-accent-orange/20 text-[#9a4a12] flex items-center justify-center shrink-0 mt-0.5">
                    <Stethoscope className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#1e293b]">
                      Ingin konsultasi lebih lanjut dengan Ahli Gizi?
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#486284] mt-0.5">
                      Sambungkan ruang chat ini langsung ke Konsultan Gizi
                      Caloria.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={handleEscalateToConsultant}
                    disabled={escalating}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-accent-orange px-3.5 text-xs font-bold text-[#1e293b] hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e293b]"
                  >
                    {escalating ? (
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>Lanjut ke Konsultan Gizi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissHandoffMessage(latestAiMessage.id)}
                    aria-label="Tutup saran ahli gizi"
                    title="Tutup"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface border border-border-default text-[#486284] hover:text-[#1e293b] hover:bg-brand-green-light transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Chat Messages Area (ONLY this area scrolls) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
                <Loader2 className="h-7 w-7 animate-spin text-accent-green" />
                <p className="text-xs font-bold font-sans">
                  Memuat ruang konsultasi...
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const currentDay = formatDayLabel(msg.createdAt);
                const prevDay = prevMsg
                  ? formatDayLabel(prevMsg.createdAt)
                  : null;
                const showDateDivider = currentDay && currentDay !== prevDay;

                if (msg.senderRole === "system") {
                  return (
                    <div key={msg.id} className="space-y-2">
                      {showDateDivider && (
                        <div className="flex justify-center py-1">
                          <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-surface text-text-muted border border-border-divider font-sans">
                            {currentDay}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-center my-2">
                        <div className="max-w-lg px-4 py-2.5 rounded-2xl bg-[#FCF8E3] border border-accent-orange/40 text-center text-xs text-text-primary font-sans">
                          <FormattedMessageText content={msg.content} />
                        </div>
                      </div>
                    </div>
                  );
                }

                const isUser = msg.senderRole === "user";
                const isConsultantMsg = msg.senderRole === "consultant";

                return (
                  <div key={msg.id} className="space-y-3">
                    {showDateDivider && (
                      <div className="flex justify-center py-1">
                        <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-surface text-text-muted border border-border-divider font-sans">
                          {currentDay}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "flex flex-col gap-1",
                        isUser ? "items-end" : "items-start",
                      )}
                    >
                      {/* Keep small label ONLY for human consultant messages */}
                      {isConsultantMsg && (
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold font-sans bg-accent-orange text-[#1e293b]">
                            <Stethoscope className="h-3 w-3" />
                            <span>
                              Konsultan Gizi •{" "}
                              {msg.senderName || consultantDisplayName}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 font-sans",
                          isUser
                            ? "bg-[#4f7a2a] text-white rounded-tr-xs"
                            : isConsultantMsg
                              ? "bg-[#FCF8E3] text-foreground border-2 border-accent-orange rounded-tl-xs"
                              : "bg-surface text-foreground border border-border-divider rounded-tl-xs",
                        )}
                      >
                        <FormattedMessageText content={msg.content} />
                      </div>

                      {/* Subtle timestamp below bubble */}
                      <span className="text-[10px] text-text-muted px-1 font-sans">
                        {formatTime(msg.createdAt)}
                      </span>
                    </motion.div>
                  </div>
                );
              })
            )}

            {(sending || followUpTyping) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-end gap-2.5 pt-1"
              >
                {room?.status === "ai" ? (
                  <>
                    {/* Mini bouncy CalPal Avatar */}
                    <div className="relative shrink-0">
                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                          rotate: [-4, 4, -4],
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="h-10 w-10 rounded-2xl bg-[#FCF8E3] border border-accent-green/40 flex items-center justify-center overflow-hidden p-0.5"
                      >
                        <CharacterSvg
                          characterId={activeCharacterId}
                          colors={activeColors}
                          earsVariant={petStore.earsVariant}
                          tailVariant={petStore.tailVariant}
                          faceVariant={petStore.faceVariant}
                          equipped={equipped}
                          showRoomBackdrop={false}
                          size="sm"
                        />
                      </motion.div>
                      <motion.span
                        animate={{
                          scale: [0.8, 1.2, 0.8],
                          opacity: [0.5, 1, 0.5],
                          rotate: [0, 15, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-1.5 -right-1 text-accent-orange pointer-events-none"
                      >
                        <Sparkles className="h-3.5 w-3.5 fill-accent-yellow" />
                      </motion.span>
                    </div>

                    {/* Cute Typing Speech Bubble with 3 Bouncing Caloria Dots */}
                    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl rounded-bl-xs bg-[#FAF8F5] border border-accent-green/35">
                      <span className="text-xs font-bold text-text-primary font-sans">
                        {activePetName} lagi ngetik
                      </span>
                      <div
                        className="flex items-center gap-1"
                        aria-hidden="true"
                      >
                        {[
                          { color: "bg-accent-green", delay: 0 },
                          { color: "bg-accent-orange", delay: 0.16 },
                          { color: "bg-accent-green-light", delay: 0.32 },
                        ].map((dot, idx) => (
                          <motion.span
                            key={idx}
                            animate={{
                              y: [0, -6, 0],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 0.65,
                              repeat: Infinity,
                              delay: dot.delay,
                              ease: "easeInOut",
                            }}
                            className={cn("h-2 w-2 rounded-full", dot.color)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-surface border border-border-divider text-xs text-text-muted font-sans">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-orange" />
                    <span>Mengirim pesan ke Konsultan Gizi...</span>
                  </div>
                )}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Quick Prompts + Chat Input Bar */}
      <footer className="shrink-0 border-t border-border-divider bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl">
          {room?.status === "ai" && showQuickPrompts && (
            <div className="px-4 sm:px-6 pt-2.5 pb-1 flex items-center gap-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
                <span className="text-[11px] font-bold text-text-muted shrink-0 font-sans">
                  Tanya Cepat:
                </span>
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={sending}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1 rounded-pill text-[11px] font-bold bg-surface border border-border-default hover:bg-accent-green-light text-ink transition-colors whitespace-nowrap shrink-0 cursor-pointer font-sans"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowQuickPrompts(false)}
                aria-label="Sembunyikan Tanya Cepat"
                title="Sembunyikan Tanya Cepat"
                className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-brand-green-light/40 transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="px-4 py-3 sm:px-6 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              placeholder={
                room?.status === "ai"
                  ? `Ngobrol atau tanya gizi ke ${activePetName}...`
                  : "Tulis pesan untuk Konsultan Gizi..."
              }
              className="input-field flex-1 px-4 py-2.5 min-h-11 text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              aria-label="Kirim pesan"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl bg-brand-green-light px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1e293b] transition-colors hover:bg-brand-green disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7a2a]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      </footer>

      {/* 4. Minimal Slide-Over History Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-72 sm:w-80 bg-surface border-l border-border-divider h-full flex flex-col"
            >
              <div className="p-4 border-b border-border-divider flex items-center justify-between">
                <span className="text-sm font-extrabold text-text-primary font-heading">
                  Riwayat Chat
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  aria-label="Tutup riwayat chat"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-ink-muted hover:text-ink hover:bg-brand-green-light/40 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-3 border-b border-border-divider">
                <button
                  type="button"
                  onClick={handleCreateNewChat}
                  disabled={creatingRoom}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-brand-green-light py-2.5 text-xs font-bold text-[#1e293b] transition-colors hover:bg-brand-green disabled:opacity-60 cursor-pointer"
                >
                  {creatingRoom ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Chat Baru</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {rooms.map((item) => {
                  const isActive = item.id === room?.id;
                  const dotColor =
                    item.status === "waiting_consultant" ||
                    item.status === "active_consultant"
                      ? "bg-accent-orange"
                      : item.status === "closed"
                        ? "bg-text-muted"
                        : "bg-accent-green";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectRoom(item.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-2xl border transition-colors cursor-pointer space-y-1",
                        isActive
                          ? "bg-[#FCF8E3] border-accent-orange/50"
                          : "bg-surface border-transparent hover:bg-brand-green-light/25",
                      )}
                    >
                      <p className="text-xs font-bold text-text-primary truncate font-sans">
                        {item.topic}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-text-muted font-sans">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", dotColor)}
                          />
                          <span>
                            {item.status === "ai" && activePetName}
                            {item.status === "waiting_consultant" && "Menunggu"}
                            {item.status === "active_consultant" && "Konsultan"}
                            {item.status === "closed" && "Selesai"}
                          </span>
                        </span>
                        <span>{formatDayLabel(item.lastMessageAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
