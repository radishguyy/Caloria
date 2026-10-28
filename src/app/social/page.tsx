"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  UserPlus,
  Send,
  Bell,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Inbox,
  Sparkles,
} from "lucide-react";
import { useSocialStore } from "@/stores/social-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { FriendRecommendations } from "@/components/social/FriendRecommendations";
import { FriendRequestList } from "@/components/social/FriendRequestList";
import { FriendList } from "@/components/social/FriendList";
import { AddFriendModal } from "@/components/social/AddFriendModal";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export default function SocialHubPage() {
  const isHydrated = useHydrated();
  const {
    partyName,
    partyCode,
    coopStreakDays,
    friends,
    pendingRequests,
    pokeHistory,
    activePokeToast,
    fetchSocialData,
    clearPokeToast,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<"coop" | "requests">("coop");
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  const incomingRequests = pendingRequests.filter(
    (r) => r.direction === "incoming" && r.status === "pending"
  );
  const pendingFriends = friends.filter((f) => !f.dailyGoalMet);
  const allMet = friends.length > 0 && pendingFriends.length === 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `https://caloria.app/social?party=${partyCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Social Hub & Co-op Streak
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 ml-8 sm:ml-0 font-sans">
            Jaga streak bersama teman, pantau catatan makan mereka, dan senggol yang belum mencatat sebelum malam tiba.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAddFriendModalOpen(true)}
            className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-sans cursor-pointer"
            style={{ backgroundColor: "#FF9233", color: "#FFFFFF" }}
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Tambah Teman</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs (Cleaned of Communities residue) */}
      <nav aria-label="Social navigation" className="flex items-center gap-2 border-b border-border-divider pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("coop")}
          className={cn(
            "nav-item flex items-center gap-2 px-4 py-2 text-xs font-bold font-sans transition-all cursor-pointer",
            activeTab === "coop"
              ? "is-selected bg-[#FCF8E3] text-text-primary border-b-2 border-accent-orange font-bold"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Teman & Co-op</span>
          {isHydrated && (
            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-surface-subtle text-text-muted text-[10px] font-bold border border-border-default">
              {friends.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={cn(
            "nav-item flex items-center gap-2 px-4 py-2 text-xs font-bold font-sans transition-all cursor-pointer relative",
            activeTab === "requests"
              ? "is-selected bg-[#FCF8E3] text-text-primary border-b-2 border-accent-orange font-bold"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          <Inbox className="h-4 w-4" />
          <span>Undangan</span>
          {isHydrated && incomingRequests.length > 0 && (
            <span className="flex h-4 min-w-4 px-1.5 items-center justify-center rounded-full bg-accent-orange text-text-inverse text-[10px] font-black animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </nav>

      {/* 3. Active Poke Toast Banner */}
      {activePokeToast && (
        <div className="review-card p-4 border border-accent-green/30 bg-[#FAF8F5] text-text-primary flex items-center justify-between gap-3 animate-in fade-in duration-300 rounded-card shadow-xs">
          <div className="flex items-center gap-2.5">
            <Send className="h-5 w-5 text-accent-green animate-bounce shrink-0" />
            <div>
              <p className="text-xs font-bold font-heading">Senggolan Pengingat Terkirim!</p>
              <p className="text-xs text-text-muted font-sans">{activePokeToast.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearPokeToast}
            className="text-xs font-bold px-3 py-1 rounded-navigation bg-surface border border-border-default hover:bg-accent-green-light transition-colors font-sans cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB 1: CO-OP STREAK & ACTIVE FRIENDS */}
      {activeTab === "coop" && (
        <div className="space-y-6">
          {/* Shared Co-op Streak Hero Card */}
          <section className="hero-card border border-accent-green/25 p-6 sm:p-8 relative overflow-hidden bg-[#FAF8F5] rounded-card shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-button bg-accent-orange text-text-inverse shadow-xs">
                  <Flame className="h-9 w-9 fill-text-inverse animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-[#FCF8E3] text-text-primary border border-accent-orange/30 font-sans">
                    Co-op Streak Squad
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-text-primary font-heading">
                    {coopStreakDays} Hari Tanpa Putus!
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap font-sans">
                    <span>Squad: <strong className="text-text-primary">{partyName}</strong></span>
                    <span>•</span>
                    <span>Kode: <strong className="font-mono text-text-primary">{partyCode}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status pill & copy buttons */}
              <div className="flex flex-col items-start sm:items-end gap-2.5">
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-navigation text-xs font-bold flex items-center gap-1.5 font-sans",
                    allMet
                      ? "bg-accent-green-light/40 text-accent-green border border-accent-green/30"
                      : "bg-[#FCF8E3] text-accent-orange border border-accent-orange/30"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {allMet
                      ? "Semua Teman Sudah Log Makanan!"
                      : `${pendingFriends.length} Teman Perlu Disenggol`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-navigation text-xs font-bold bg-surface border border-border-default hover:bg-surface-subtle transition-colors text-text-primary font-sans cursor-pointer"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-accent-green" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Kode Disalin" : "Salin Kode"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-navigation text-xs font-bold bg-surface border border-border-default hover:bg-surface-subtle transition-colors text-text-primary font-sans cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-accent-green" /> : <Users className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Link Disalin" : "Undang Teman"}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Rekomendasi Teman Section (Max 3 accounts with 1-click CTA) */}
          <FriendRecommendations />

          {/* Friends List Component */}
          <FriendList onOpenAddModal={() => setAddFriendModalOpen(true)} />

          {/* Activity Log / Senggolan History */}
          <section className="rounded-card bg-surface p-5 sm:p-6 border border-border-divider shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-divider">
              <h3 className="text-sm font-bold text-text-primary font-heading">
                Riwayat Senggolan Squad
              </h3>
              <span className="text-[11px] text-text-muted font-sans">10 aktivitas terakhir</span>
            </div>

            {pokeHistory.length === 0 ? (
              <p className="text-xs text-text-muted py-2 font-sans">Belum ada riwayat senggolan hari ini.</p>
            ) : (
              <div className="space-y-2.5">
                {pokeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 text-xs text-text-muted p-2.5 rounded-navigation bg-surface-subtle font-sans"
                  >
                    <Send className="h-3.5 w-3.5 text-accent-orange shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-text-primary">{item.message}</p>
                      <span className="text-[10px] text-text-muted">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: INVITATIONS & RECOMMENDATIONS */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Incoming & Outgoing Friend Requests */}
          <FriendRequestList
            onAcceptSuccess={() => {
              // Optionally switch to coop view or keep in requests
            }}
          />

          {/* Also show Friend Recommendations in requests tab for quick discovery */}
          <FriendRecommendations />
        </div>
      )}

      {/* Add Friend & Join Squad Modal */}
      <AddFriendModal
        isOpen={addFriendModalOpen}
        onClose={() => setAddFriendModalOpen(false)}
      />
    </div>
  );
}
