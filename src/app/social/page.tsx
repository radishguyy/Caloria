"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Send,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Inbox,
} from "lucide-react";
import { useSocialStore } from "@/stores/social-store";
import { FriendRecommendations } from "@/components/social/FriendRecommendations";
import { FriendRequestList } from "@/components/social/FriendRequestList";
import { FriendList } from "@/components/social/FriendList";
import { AddFriendModal } from "@/components/social/AddFriendModal";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAutoTour } from "@/components/tour/useAutoTour";
import { cn } from "@/lib/utils";

export default function SocialHubPage() {
  const isHydrated = useHydrated();
  useAutoTour("social", { enabled: isHydrated });
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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Kembali ke Dashboard"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-navigation border border-border-default hover:bg-accent-green-light text-neutral-10 hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
            Social
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            data-tour="social-add-friend"
            onClick={() => setAddFriendModalOpen(true)}
            className="min-h-12 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-button bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-sm sm:text-base font-extrabold font-sans cursor-pointer transition-colors"
          >
            <span>+ Tambah Teman</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs */}
      <nav aria-label="Social navigation" className="flex items-center gap-2 border-b border-border-divider pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("coop")}
          className={cn(
            "nav-item min-h-11 flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-bold font-sans transition-colors cursor-pointer",
            activeTab === "coop"
              ? "is-selected bg-[#FCF8E3] text-text-primary border-b-2 border-accent-orange font-extrabold"
              : "text-neutral-10 hover:text-text-primary"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Teman</span>
          {isHydrated && (
            <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-surface-subtle text-neutral-10 text-xs font-bold border border-border-default">
              {friends.length}
            </span>
          )}
        </button>

        <button
          type="button"
          data-tour="social-requests-tab"
          onClick={() => setActiveTab("requests")}
          className={cn(
            "nav-item min-h-11 flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-bold font-sans transition-colors cursor-pointer relative",
            activeTab === "requests"
              ? "is-selected bg-[#FCF8E3] text-text-primary border-b-2 border-accent-orange font-extrabold"
              : "text-neutral-10 hover:text-text-primary"
          )}
        >
          <Inbox className="h-4 w-4" />
          <span>Undangan</span>
          {isHydrated && incomingRequests.length > 0 && (
            <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-accent-orange text-text-inverse text-xs font-black">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </nav>

      {/* 3. Active Poke Toast Banner */}
      {activePokeToast && (
        <div className="p-4 border border-accent-green/30 bg-surface text-text-primary flex items-center justify-between gap-3 animate-in fade-in duration-300 rounded-card">
          <div className="flex items-center gap-2.5">
            <Send className="h-5 w-5 text-accent-green shrink-0" />
            <div>
              <p className="text-sm font-extrabold font-heading">Senggolan Pengingat Terkirim!</p>
              <p className="text-sm text-neutral-10 font-sans">{activePokeToast.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearPokeToast}
            className="min-h-10 text-sm font-bold px-4 py-1.5 rounded-navigation bg-surface border border-border-default hover:bg-accent-green-light transition-colors font-sans cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB 1: CO-OP STREAK & ACTIVE FRIENDS */}
      {activeTab === "coop" && (
        <div className="space-y-6">
          {/* Shared Streak Card (white background, no Co-op Streak Squad label, no nudge count, larger green buttons) */}
          <section
            data-tour="social-coop-card"
            className="border border-border-divider p-6 sm:p-7 relative overflow-hidden bg-surface rounded-card shadow-xs"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-button bg-accent-orange text-text-inverse">
                  <Flame className="h-9 w-9 fill-text-inverse" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-heading">
                    {coopStreakDays} Hari Tanpa Putus!
                  </h2>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-neutral-10 flex-wrap font-sans">
                    <span>Squad: <strong className="text-text-primary">{partyName}</strong></span>
                    <span>•</span>
                    <span>Kode: <strong className="font-mono text-text-primary">{partyCode}</strong></span>
                  </div>
                </div>
              </div>

              {/* Enlarged flat green Salin Kode & Undang Teman buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="min-h-12 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-button text-sm sm:text-base font-extrabold bg-accent-green-light hover:bg-[#a9ce46] transition-colors text-[#244710] font-sans cursor-pointer"
                >
                  {copiedCode ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  <span>{copiedCode ? "Kode Disalin" : "Salin Kode"}</span>
                </button>

                <button
                  type="button"
                  data-tour="social-party-code"
                  onClick={handleCopyInviteLink}
                  className="min-h-12 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-button text-sm sm:text-base font-extrabold bg-accent-green-light hover:bg-[#a9ce46] transition-colors text-[#244710] font-sans cursor-pointer"
                >
                  {copiedLink ? <Check className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  <span>{copiedLink ? "Link Disalin" : "Undang Teman"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Rekomendasi Teman Section */}
          <FriendRecommendations />

          {/* Friends List Component */}
          <div data-tour="social-poke">
            <FriendList onOpenAddModal={() => setAddFriendModalOpen(true)} />
          </div>

          {/* Activity Log / Senggolan History */}
          <section className="rounded-card bg-surface p-5 sm:p-6 border border-border-divider shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-divider">
              <h3 className="text-base sm:text-lg font-extrabold text-text-primary font-heading">
                Riwayat Senggolan Squad
              </h3>
              <span className="text-sm font-medium text-neutral-10 font-sans">10 aktivitas terakhir</span>
            </div>

            {pokeHistory.length === 0 ? (
              <p className="text-sm text-neutral-10 py-2 font-sans">Belum ada riwayat senggolan hari ini.</p>
            ) : (
              <div className="space-y-2.5">
                {pokeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 text-sm text-neutral-10 p-3 rounded-navigation bg-surface-subtle font-sans"
                  >
                    <Send className="h-4 w-4 text-accent-orange shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold">{item.message}</p>
                      <span className="text-sm text-neutral-10">{item.timestamp}</span>
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
          <FriendRequestList onAcceptSuccess={() => {}} />
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
