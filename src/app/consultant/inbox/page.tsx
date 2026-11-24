"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Stethoscope,
  Inbox,
  Clock,
  CheckCircle2,
  Send,
  User,
  Bot,
  Flame,
  Target,
  Utensils,
  RefreshCw,
  UserCheck,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getConsultantInboxDataAction,
  claimConsultationRoomAction,
  sendConsultantReplyAction,
  closeConsultationRoomAction,
  type ConsultationRoomDTO,
  type ConsultationMessageDTO,
} from "@/app/actions/consultation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ConsultantInboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoomParam = searchParams.get("room") || undefined;

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "waiting_consultant" | "active_consultant" | "closed"
  >("waiting_consultant");

  const [counts, setCounts] = useState({
    waiting_consultant: 0,
    active_consultant: 0,
    closed: 0,
  });

  const [rooms, setRooms] = useState<ConsultationRoomDTO[]>([]);
  const [activeRoom, setActiveRoom] = useState<ConsultationRoomDTO | null>(
    null
  );
  const [messages, setMessages] = useState<ConsultationMessageDTO[]>([]);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  const loadInbox = useCallback(
    async (roomId?: string, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getConsultantInboxDataAction(roomId);
        if (!res.authorized) {
          setAuthorized(false);
          router.replace("/consult");
          return;
        }
        setAuthorized(true);
        setCounts(res.counts);
        setRooms(res.rooms);
        setActiveRoom(res.activeRoom);
        setMessages(res.messages);

        // Auto-select tab that has items on initial load if waiting is empty
        if (!silent && !roomId) {
          if (
            res.counts.waiting_consultant === 0 &&
            res.counts.active_consultant > 0
          ) {
            setActiveTab("active_consultant");
          }
        }
      } catch (err) {
        console.error("[ConsultantInboxPage] loadInbox error:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadInbox(initialRoomParam);
  }, [initialRoomParam, loadInbox]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("consultant-inbox-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_rooms",
        },
        () => {
          loadInbox(activeRoom?.id, true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_messages",
        },
        () => {
          loadInbox(activeRoom?.id, true);
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      loadInbox(activeRoom?.id, true);
    }, 6000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [activeRoom?.id, loadInbox]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSelectRoom = async (room: ConsultationRoomDTO) => {
    setActiveRoom(room);
    await loadInbox(room.id);
  };

  const handleClaimRoom = async () => {
    if (!activeRoom || claiming) return;
    setClaiming(true);
    try {
      const res = await claimConsultationRoomAction(activeRoom.id);
      if (res.success) {
        toast.success("Chat berhasil diambil! Status kini Aktif.");
        setActiveTab("active_consultant");
        await loadInbox(activeRoom.id, true);
      } else {
        toast.error(res.error || "Gagal menerima chat.");
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = replyText.trim();
    if (!textToSend || !activeRoom || sending) return;

    setReplyText("");
    setSending(true);

    try {
      const res = await sendConsultantReplyAction({
        roomId: activeRoom.id,
        content: textToSend,
      });

      if (res.success) {
        setActiveTab("active_consultant");
        await loadInbox(activeRoom.id, true);
        scrollToBottom();
        toast.success("Balasan terkirim!");
      } else {
        toast.error(res.error || "Gagal mengirim balasan.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!activeRoom) return;
    const res = await closeConsultationRoomAction(activeRoom.id);
    if (res.success) {
      toast.success("Konsultasi ditandai selesai.");
      setActiveTab("closed");
      await loadInbox(activeRoom.id, true);
    } else {
      toast.error(res.error || "Gagal menutup sesi.");
    }
  };

  if (!authorized) {
    return null;
  }

  const filteredRooms = rooms.filter((r) => r.status === activeTab);
  const snap = activeRoom?.nutritionSnapshot;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 pb-24 lg:pb-12 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Inbox Konsultan Gizi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 ml-9 font-sans">
            Kelola antrean konsultasi dari user, tinjau ringkasan AI & diary
            makanan mereka, dan berikan saran gizi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadInbox(activeRoom?.id)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-navigation text-xs font-bold bg-surface border border-border-default hover:bg-accent-green-light text-text-primary transition-colors cursor-pointer font-sans self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* 2. Three Queue Tabs: Menunggu (waiting_consultant), Aktif (active_consultant), Selesai (closed) */}
      <nav
        aria-label="Tab antrean konsultan"
        className="flex items-center gap-2 border-b border-border-divider pb-2"
      >
        <button
          type="button"
          onClick={() => setActiveTab("waiting_consultant")}
          className={cn(
            "nav-item flex items-center gap-2 px-4 py-2 text-xs font-bold font-sans transition-all cursor-pointer",
            activeTab === "waiting_consultant"
              ? "is-selected"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          <Clock className="h-4 w-4" />
          <span>Menunggu</span>
          {counts.waiting_consultant > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-surface text-text-primary text-[10px] font-black animate-pulse">
              {counts.waiting_consultant}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-surface-subtle text-text-muted text-[10px] font-bold">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("active_consultant")}
          className={cn(
            "nav-item flex items-center gap-2 px-4 py-2 text-xs font-bold font-sans transition-all cursor-pointer",
            activeTab === "active_consultant"
              ? "is-selected"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          <UserCheck className="h-4 w-4" />
          <span>Aktif</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface text-text-primary text-[10px] font-extrabold">
            {counts.active_consultant}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("closed")}
          className={cn(
            "nav-item flex items-center gap-2 px-4 py-2 text-xs font-bold font-sans transition-all cursor-pointer",
            activeTab === "closed"
              ? "is-selected"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Selesai</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface text-text-muted text-[10px] font-extrabold">
            {counts.closed}
          </span>
        </button>
      </nav>

      {/* 3. Two-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <aside className="lg:col-span-4 surface-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-divider">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-primary font-heading">
              {activeTab === "waiting_consultant" && "Daftar Chat Menunggu"}
              {activeTab === "active_consultant" && "Chat Sedang Ditangani"}
              {activeTab === "closed" && "Arsip Konsultasi Selesai"}
            </h2>
            <span className="text-[11px] text-text-muted font-sans">
              {filteredRooms.length} chat
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-accent-green" />
              <span className="text-xs font-sans">Memuat antrean...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2">
              <Inbox className="h-8 w-8 text-text-muted mx-auto opacity-60" />
              <p className="text-xs font-bold text-text-primary font-heading">
                Tidak ada chat di tab ini
              </p>
              <p className="text-[11px] text-text-muted font-sans">
                {activeTab === "waiting_consultant" &&
                  "Belum ada permintaan konsultasi baru yang menunggu."}
                {activeTab === "active_consultant" &&
                  "Ambil chat dari tab Menunggu untuk mulai membalas user."}
                {activeTab === "closed" &&
                  "Belum ada riwayat konsultasi yang diselesaikan."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredRooms.map((room) => {
                const isSelected = room.id === activeRoom?.id;
                const patientName =
                  room.patient?.fullName ||
                  room.patient?.username ||
                  "User Caloria";
                const patientUsername = room.patient?.username || "user";

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleSelectRoom(room)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-navigation border transition-all cursor-pointer space-y-2",
                      isSelected
                        ? "bg-[#FCF8E3] border-accent-orange shadow-xs"
                        : "bg-surface-subtle border-border-divider hover:bg-accent-green-light/25"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-text-primary truncate font-heading">
                          {patientName}
                        </p>
                        <p className="text-[11px] font-bold text-accent-green font-sans">
                          @{patientUsername}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-pill text-[10px] font-bold shrink-0 font-sans",
                          room.status === "waiting_consultant" &&
                            "bg-accent-orange text-text-inverse",
                          room.status === "active_consultant" &&
                            "bg-accent-green text-text-inverse",
                          room.status === "closed" &&
                            "bg-border-default text-text-muted"
                        )}
                      >
                        {room.status === "waiting_consultant" && "Menunggu"}
                        {room.status === "active_consultant" && "Aktif"}
                        {room.status === "closed" && "Selesai"}
                      </span>
                    </div>

                    {room.lastMessagePreview && (
                      <p className="text-[11px] text-text-muted line-clamp-2 font-sans">
                        {room.lastMessagePreview}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border-divider/60 font-sans">
                      <span>{room.messageCount || 0} pesan</span>
                      <span>{formatDateTime(room.lastMessageAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Detail: AI Summary + Chat History + Reply Box */}
        <section className="lg:col-span-8 space-y-4">
          {!activeRoom ? (
            <div className="surface-card p-12 text-center space-y-3 shadow-xs">
              <Stethoscope className="h-10 w-10 text-accent-green mx-auto" />
              <h3 className="text-base font-extrabold text-text-primary font-heading">
                Pilih Chat User di Panel Kiri
              </h3>
              <p className="text-xs text-text-muted max-w-md mx-auto font-sans">
                Klik salah satu chat untuk melihat AI Summary, data kalori/diary
                user, beserta riwayat percakapan mereka dengan AI.
              </p>
            </div>
          ) : (
            <>
              {/* Top Card: AI Summary + User Nutrition Data + Claim Action */}
              <div className="hero-card p-5 border border-accent-orange/40 bg-[#FAF8F5] space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-divider">
                  <div>
                    <h2 className="text-lg font-extrabold text-text-primary font-heading">
                      {activeRoom.patient?.fullName ||
                        snap?.fullName ||
                        activeRoom.patient?.username ||
                        "User Caloria"}{" "}
                      <span className="text-sm font-bold text-text-muted font-sans">
                        (@{activeRoom.patient?.username || snap?.username})
                      </span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeRoom.status === "waiting_consultant" && (
                      <button
                        type="button"
                        onClick={handleClaimRoom}
                        disabled={claiming}
                        className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer"
                      >
                        {claiming ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        <span>Ambil / Terima Chat</span>
                      </button>
                    )}

                    {activeRoom.status !== "closed" && (
                      <button
                        type="button"
                        onClick={handleCloseRoom}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-navigation text-xs font-bold bg-surface border border-border-default hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer font-sans"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Tandai Selesai</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* User Calorie & Diary Snapshot */}
                {snap && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-navigation bg-surface border border-border-divider">
                      <span className="text-[10px] text-text-muted flex items-center gap-1 font-sans">
                        <Flame className="h-3 w-3 text-accent-orange" />
                        Kalori Hari Ini
                      </span>
                      <p className="text-xs font-extrabold text-text-primary mt-0.5 font-heading">
                        {snap.todayCaloriesKcal} / {snap.targetCaloriesKcal} kkal
                      </p>
                    </div>

                    <div className="p-2.5 rounded-navigation bg-surface border border-border-divider">
                      <span className="text-[10px] text-text-muted flex items-center gap-1 font-sans">
                        <Target className="h-3 w-3 text-accent-green" />
                        Makro (P / C / F)
                      </span>
                      <p className="text-xs font-extrabold text-text-primary mt-0.5 font-heading">
                        {snap.todayProteinG}g / {snap.todayCarbsG}g /{" "}
                        {snap.todayFatG}g
                      </p>
                    </div>

                    <div className="p-2.5 rounded-navigation bg-surface border border-border-divider">
                      <span className="text-[10px] text-text-muted font-sans">
                        Berat & Tren
                      </span>
                      <p className="text-xs font-extrabold text-text-primary mt-0.5 font-heading">
                        {snap.currentWeightKg ?? "-"} kg →{" "}
                        {snap.targetWeightKg ?? "-"} kg
                        {snap.weightTrend?.changeKg
                          ? ` (${snap.weightTrend.changeKg > 0 ? `+${snap.weightTrend.changeKg}` : snap.weightTrend.changeKg}kg)`
                          : ""}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-navigation bg-surface border border-border-divider">
                      <span className="text-[10px] text-text-muted flex items-center gap-1 font-sans">
                        <Utensils className="h-3 w-3 text-accent-green" />
                        Rata-rata 7 Hari
                      </span>
                      <p className="text-[11px] font-bold text-text-primary mt-0.5 truncate font-sans">
                        {snap.weeklyTrend && snap.weeklyTrend.loggedDaysCount > 0
                          ? `${snap.weeklyTrend.avgCaloriesKcal} kkal • P: ${snap.weeklyTrend.avgProteinG}g`
                          : snap.recentFoods.length > 0
                            ? snap.recentFoods.slice(0, 3).join(", ")
                            : "Belum log makanan"}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {activeRoom.aiSummary && (
                  <div className="p-3.5 rounded-navigation bg-[#FCF8E3] border border-accent-orange/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-text-primary font-heading">
                      <FileText className="h-4 w-4 text-accent-orange" />
                      <span>AI Summary (Ringkasan Keluhan & Data Gizi)</span>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-line leading-relaxed font-sans">
                      {activeRoom.aiSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Chat History + Consultant Reply Input */}
              <div className="surface-card flex flex-col min-h-[460px] max-h-[600px] shadow-xs overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-canvas">
                  {messages.map((msg) => {
                    if (msg.senderRole === "system") {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="max-w-lg px-4 py-2 rounded-2xl bg-[#FCF8E3] border border-accent-orange/40 text-center text-xs text-text-primary font-sans">
                            {msg.content.replace(/\*\*/g, "")}
                          </div>
                        </div>
                      );
                    }

                    const isConsultantMsg = msg.senderRole === "consultant";
                    const isPatientMsg = msg.senderRole === "user";

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-1",
                          isConsultantMsg ? "items-end" : "items-start"
                        )}
                      >
                        <div className="flex items-center gap-1.5 px-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold font-sans",
                              isConsultantMsg
                                ? "bg-accent-orange text-text-inverse"
                                : isPatientMsg
                                  ? "bg-accent-green text-text-inverse"
                                  : "bg-surface-subtle text-text-muted border border-border-default"
                            )}
                          >
                            {isConsultantMsg && (
                              <>
                                <Stethoscope className="h-3 w-3" />
                                <span>
                                  Konsultan ({msg.senderName || "Kamu"})
                                </span>
                              </>
                            )}
                            {isPatientMsg && (
                              <>
                                <User className="h-3 w-3" />
                                <span>
                                  User (
                                  {msg.senderName ||
                                    `@${activeRoom.patient?.username}`}
                                  )
                                </span>
                              </>
                            )}
                            {msg.senderRole === "ai" && (
                              <>
                                <Bot className="h-3 w-3" />
                                <span>Caloria AI</span>
                              </>
                            )}
                          </span>
                          <span className="text-[10px] text-text-muted font-sans">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-2xs font-sans",
                            isConsultantMsg
                              ? "bg-accent-orange text-text-inverse rounded-tr-xs"
                              : isPatientMsg
                                ? "bg-[#FAF8F5] text-foreground border-2 border-accent-green rounded-tl-xs"
                                : "bg-surface-subtle text-text-muted border border-border-divider rounded-tl-xs"
                          )}
                        >
                          {msg.content.replace(/\*\*/g, "")}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3.5 sm:p-4 bg-surface border-t border-border-divider flex items-end gap-2.5"
                >
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sending}
                    placeholder="Tulis balasan konsultasi gizi untuk user ini..."
                    className="input-field flex-1 px-4 py-2.5 text-xs sm:text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="button-primary inline-flex items-center gap-1.5 px-5 py-3 text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Kirim Balasan</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ConsultantInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent-green" />
        </div>
      }
    >
      <ConsultantInboxContent />
    </Suspense>
  );
}
