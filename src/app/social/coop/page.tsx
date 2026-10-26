"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame,
  UserPlus,
  Send,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  X,
  Share2,
} from "lucide-react";
import { useSocialStore } from "@/store/use-social-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { cn } from "@/lib/utils";

export default function SocialCoopPage() {
  const {
    partyName,
    partyCode,
    coopStreakDays,
    friends,
    pokeHistory,
    activePokeToast,
    pokeFriend,
    addFriendByUsername,
    joinPartyByCode,
    simulateFriendLog,
    clearPokeToast,
  } = useSocialStore();

  const { addNotification } = useNotificationStore();

  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPartyCode, setNewPartyCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pendingFriends = friends.filter((f) => !f.dailyGoalMet);
  const allMet = friends.length > 0 && pendingFriends.length === 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `https://caloria.app/join-party?code=${partyCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTriggerPoke = (friendId: string) => {
    const poke = pokeFriend(friendId);
    if (poke) {
      addNotification({
        type: "poke",
        title: "Senggolan Terkirim!",
        message: poke.message,
        actionUrl: "/social/coop",
      });
    }
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const ok = addFriendByUsername(newUsername);
    if (ok) {
      setStatusMsg({
        type: "success",
        text: `Berhasil menambahkan @${newUsername.trim()} ke daftar teman!`,
      });
      setNewUsername("");
      setTimeout(() => {
        setAddFriendModalOpen(false);
        setStatusMsg(null);
      }, 1500);
    } else {
      setStatusMsg({
        type: "error",
        text: `@${newUsername.trim()} sudah ada di daftar teman kamu.`,
      });
    }
  };

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyCode.trim()) return;

    const ok = joinPartyByCode(newPartyCode);
    if (ok) {
      setStatusMsg({
        type: "success",
        text: `Berhasil bergabung ke Squad ${newPartyCode.trim().toUpperCase()}!`,
      });
      setNewPartyCode("");
      setTimeout(() => {
        setAddFriendModalOpen(false);
        setStatusMsg(null);
      }, 1500);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="btn-icon h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Shared Co-op Streak & Teman
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 ml-8 sm:ml-0">
            Jaga streak bersama teman, pantau catatan makan mereka, dan senggol yang belum mencatat sebelum malam tiba.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddFriendModalOpen(true)}
            className="btn-cta min-h-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Tambah Teman / Party</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Co-op Streak vs Communities */}
      <div className="flex items-center gap-2 border-b border-warm-border pb-1">
        <Link
          href="/social/coop"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-orange text-ink"
        >
          Co-op Streak & Teman ({friends.length})
        </Link>
        <Link
          href="/social/communities"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-brand-green-light hover:text-brand-green-ink"
        >
          Komunitas Misi Gizi
        </Link>
      </div>

      {/* Active Poke Toast Banner */}
      {activePokeToast && (
        <div className="p-4 rounded-2xl border bg-highlight border-warm-border text-ink flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Send className="h-5 w-5 text-brown animate-bounce" />
            <div>
              <p className="text-xs font-bold">Senggolan Pengingat Terkirim!</p>
              <p className="text-xs opacity-90">{activePokeToast.message}</p>
            </div>
          </div>
          <button
            onClick={clearPokeToast}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-warm-border-strong/30 hover:bg-warm-border-strong/50 transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. Hero Shared Co-op Streak Card */}
      <section className="rounded-3xl border border-warm-border bg-gradient-to-tr from-brand-green/15 via-highlight/40 to-surface p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-green to-brand-green-light text-surface-raised shadow-lg shadow-brand-green/25">
              <Flame className="h-9 w-9 fill-current animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-green-light text-brand-green-ink border border-warm-border">
                Shared Co-op Streak Squad
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-ink">
                {coopStreakDays} Hari Tanpa Putus!
              </h2>
              <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap">
                <span>Party: <strong className="text-ink">{partyName}</strong></span>
                <span>•</span>
                <span>Kode: <strong className="font-mono text-ink">{partyCode}</strong></span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-brown hover:text-brand-green-dark"
                  title="Salin Kode Party"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Party Condition Status Pill */}
          <div className="sm:text-right">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border",
                allMet
                  ? "bg-brand-green-light text-brand-green-ink border-warm-border"
                  : "border-warm-border bg-highlight text-brown"
              )}
            >
              {allMet ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  <span>Streak Hari Ini Aman (+1)</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-brown" />
                  <span>{pendingFriends.length} Teman Perlu Disenggol</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-ink-muted mt-1 max-w-xs sm:ml-auto">
              Aturan: Angka streak bertambah apabila semua anggota minimal mencatat 1x makan sebelum pukul 23:59.
            </p>
          </div>
        </div>
      </section>

      {/* Friends Status Cards & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Friends List & SENGGOL Action */}
        <div className="lg:col-span-8 space-y-3.5">
          <h3 className="text-sm font-bold text-ink flex items-center justify-between">
            <span>Status Teman di Party Hari Ini</span>
            <span className="text-xs text-ink-muted font-normal">
              {friends.filter((f) => f.dailyGoalMet).length} dari {friends.length} selesai
            </span>
          </h3>

          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="rounded-3xl border border-warm-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-surface-raised font-extrabold text-base shadow-xs",
                      friend.avatarColor
                    )}
                  >
                    {friend.fullName.charAt(0)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-ink">
                        {friend.fullName}
                      </h4>
                      <span className="text-xs text-ink-muted">
                        @{friend.username}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-highlight border border-warm-border">
                        Pet Lv.{friend.petLevel} ({friend.petName})
                      </span>
                    </div>

                    <p className="text-xs text-ink-muted">
                      {friend.lastActiveText}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] pt-1">
                      <span className="text-ink font-semibold">
                        {friend.caloriesLoggedToday} / {friend.calorieTarget} kcal
                      </span>
                      <span className="text-ink-muted">
                        ({friend.mealsLoggedToday} waktu makan)
                      </span>
                    </div>
                  </div>
                </div>

                {/* SENGGOL TEMAN Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {friend.dailyGoalMet ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-warm-border bg-brand-green-light px-3 py-1.5 text-xs font-semibold text-brand-green-ink">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Sudah Makan</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTriggerPoke(friend.id)}
                      className="btn-cta min-h-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Senggol Teman 👋</span>
                    </button>
                  )}

                  {/* Demo helper */}
                  {!friend.dailyGoalMet && (
                    <button
                      onClick={() => simulateFriendLog(friend.id)}
                      className="rounded-full border border-warm-border px-2 py-1 text-[10px] text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
                      title="Simulasi teman mencatat makanan untuk testing streak"
                    >
                      Demo: Selesai
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Activity Feed & Invites */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-warm-border bg-card p-5 space-y-3 shadow-card">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-brand-green" />
              <span>Riwayat Senggolan Squad</span>
            </h3>

            <div className="divide-y divide-warm-border/70 text-xs max-h-[300px] overflow-y-auto pr-1">
              {pokeHistory.length === 0 ? (
                <p className="py-6 text-center text-ink-muted text-[11px]">
                  Belum ada riwayat senggolan hari ini.
                </p>
              ) : (
                pokeHistory.map((item) => (
                  <div key={item.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-ink-muted">
                      <span className="font-semibold text-ink">
                        {item.fromUser} &rarr; {item.toUser}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Invite Link Card */}
          <div className="rounded-3xl border border-warm-border bg-surface-sunken/70 p-5 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Share2 className="h-4 w-4 text-brand-green" />
              <span>Bagikan Link Party:</span>
            </div>
            <p className="text-ink-muted text-[11px] leading-relaxed">
              Undang temanmu untuk bergabung ke squad {partyName} dengan link cepat:
            </p>
            <button
              onClick={handleCopyInviteLink}
              className="btn-ghost w-full py-2.5 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-brand-green" />
                  <span>Link Undangan Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Link Undangan Squad</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* [Modal] Tambah Teman (Pencarian Username, Kode ID, Salin Link) */}
      {addFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-warm-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-warm-border">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-green" />
                <h3 className="text-base font-bold text-ink">
                  Tambah Teman / Gabung Party
                </h3>
              </div>
              <button
                onClick={() => setAddFriendModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {statusMsg && (
              <div
                className={cn(
                  "p-3 rounded-xl text-xs font-semibold",
                  statusMsg.type === "success"
                    ? "border border-warm-border bg-brand-green-light text-brand-green-ink"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                )}
              >
                {statusMsg.text}
              </div>
            )}

            {/* Option A: Add Friend by Username */}
            <form onSubmit={handleAddFriend} className="space-y-2">
              <label className="text-xs font-bold text-ink">
                1. Tambah Teman via Username Caloria:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="misal: budi_runner"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="field flex-1 px-3 py-2 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="btn-cta min-h-0 shrink-0 px-4 py-2 text-xs"
                >
                  Tambah
                </button>
              </div>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-ink-muted">atau</span>
              </div>
            </div>

            {/* Option B: Join Party by Code */}
            <form onSubmit={handleJoinParty} className="space-y-2">
              <label className="text-xs font-bold text-ink">
                2. Gabung Co-op Squad via Kode Party:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="misal: CAL-8829"
                  value={newPartyCode}
                  onChange={(e) => setNewPartyCode(e.target.value)}
                  className="field flex-1 px-3 py-2 font-mono text-xs uppercase outline-none"
                />
                <button
                  type="submit"
                  className="btn-ghost min-h-0 shrink-0 px-4 py-2 text-xs"
                >
                  Gabung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

