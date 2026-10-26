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
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
              Shared Co-op Streak & Teman
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 ml-8 sm:ml-0">
            Jaga streak bersama teman, pantau catatan makan mereka, dan senggol yang belum mencatat sebelum malam tiba.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddFriendModalOpen(true)}
            className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Tambah Teman / Party</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Co-op Streak vs Communities */}
      <div className="flex items-center gap-2 border-b border-border-divider pb-2">
        <Link
          href="/social/coop"
          aria-current="page"
          className="nav-item is-selected px-4 py-2 text-xs font-bold"
        >
          Co-op Streak & Teman ({friends.length})
        </Link>
        <Link
          href="/social/communities"
          className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10"
        >
          Komunitas Misi Gizi
        </Link>
      </div>

      {/* Active Poke Toast Banner */}
      {activePokeToast && (
        <div className="review-card p-4 border border-accent-green/30 text-text-primary flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Send className="h-5 w-5 text-accent-green animate-bounce" />
            <div>
              <p className="text-xs font-bold">Senggolan Pengingat Terkirim!</p>
              <p className="text-xs text-neutral-10">{activePokeToast.message}</p>
            </div>
          </div>
          <button
            onClick={clearPokeToast}
            className="text-xs font-bold px-3 py-1 rounded-navigation bg-surface border border-border-default hover:bg-accent-green-light transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. Hero Shared Co-op Streak Card (Pale Yellow Surface) */}
      <section className="hero-card border border-accent-green/25 p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-button bg-accent-orange text-text-inverse shadow-xs">
              <Flame className="h-9 w-9 fill-text-inverse animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-surface text-text-primary border border-accent-green/30">
                Shared Co-op Streak Squad
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary font-heading">
                {coopStreakDays} Hari Tanpa Putus!
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-10 flex-wrap">
                <span>
                  Party: <strong className="text-text-primary">{partyName}</strong>
                </span>
                <span>•</span>
                <span>
                  Kode:{" "}
                  <strong className="font-mono text-text-primary">
                    {partyCode}
                  </strong>
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:text-text-primary text-neutral-10"
                  title="Salin Kode Party"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-accent-green" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Party Condition Status Pill */}
          <div className="sm:text-right">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-bold border",
                allMet
                  ? "bg-surface text-text-primary border-accent-green"
                  : "bg-surface text-accent-orange-dark border-accent-orange/40"
              )}
            >
              {allMet ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-accent-green" />
                  <span>Streak Hari Ini Aman (+1)</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-accent-orange" />
                  <span>{pendingFriends.length} Teman Perlu Disenggol</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-10 mt-1 max-w-xs sm:ml-auto">
              Aturan: Angka streak bertambah apabila semua anggota minimal mencatat 1x makan sebelum pukul 23:59.
            </p>
          </div>
        </div>
      </section>

      {/* Friends Status Cards & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Friends List & SENGGOL Action */}
        <div className="lg:col-span-8 space-y-3.5">
          <h3 className="text-sm font-bold text-text-primary flex items-center justify-between">
            <span>Status Teman di Party Hari Ini</span>
            <span className="text-xs text-text-muted font-normal">
              {friends.filter((f) => f.dailyGoalMet).length} dari {friends.length} selesai
            </span>
          </h3>

          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="rounded-card border border-border-divider bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-button flex items-center justify-center text-white font-extrabold text-base shadow-2xs",
                      friend.avatarColor
                    )}
                  >
                    {friend.fullName.charAt(0)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary">
                        {friend.fullName}
                      </h4>
                      <span className="text-xs text-text-muted">
                        @{friend.username}
                      </span>
                      <span className="px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-surface-subtle border border-border-divider text-text-primary">
                        Pet Lv.{friend.petLevel} ({friend.petName})
                      </span>
                    </div>

                    <p className="text-xs text-text-muted">
                      {friend.lastActiveText}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] pt-1">
                      <span className="text-text-primary font-bold">
                        {friend.caloriesLoggedToday} / {friend.calorieTarget} kcal
                      </span>
                      <span className="text-text-muted">
                        ({friend.mealsLoggedToday} waktu makan)
                      </span>
                    </div>
                  </div>
                </div>

                {/* SENGGOL TEMAN Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {friend.dailyGoalMet ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button bg-accent-green/15 text-text-primary border border-accent-green/30 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
                      <span>Sudah Makan</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTriggerPoke(friend.id)}
                      className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Senggol Teman 👋</span>
                    </button>
                  )}

                  {/* Demo helper */}
                  {!friend.dailyGoalMet && (
                    <button
                      onClick={() => simulateFriendLog(friend.id)}
                      className="text-[10px] px-2.5 py-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary font-semibold"
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
          <div className="rounded-card border border-border-divider bg-surface p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-accent-green" />
              <span>Riwayat Senggolan Squad</span>
            </h3>

            <div className="divide-y divide-border-divider/60 text-xs max-h-[300px] overflow-y-auto pr-1">
              {pokeHistory.length === 0 ? (
                <p className="py-6 text-center text-text-muted text-[11px]">
                  Belum ada riwayat senggolan hari ini.
                </p>
              ) : (
                pokeHistory.map((item) => (
                  <div key={item.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <span className="font-bold text-text-primary">
                        {item.fromUser} &rarr; {item.toUser}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-neutral-10">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Invite Link Card (Review Card Surface) */}
          <div className="review-card border border-accent-green/25 p-5 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-text-primary">
              <Share2 className="h-4 w-4 text-accent-green" />
              <span>Bagikan Link Party:</span>
            </div>
            <p className="text-neutral-10 text-[11px] leading-relaxed">
              Undang temanmu untuk bergabung ke squad {partyName} dengan link cepat:
            </p>
            <button
              onClick={handleCopyInviteLink}
              className="w-full py-2.5 rounded-button border border-border-default bg-surface hover:bg-accent-green-light text-text-primary font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent-green" />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border-divider bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border-divider">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent-green" />
                <h3 className="text-base font-bold text-text-primary">
                  Tambah Teman / Gabung Party
                </h3>
              </div>
              <button
                onClick={() => setAddFriendModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {statusMsg && (
              <div
                className={cn(
                  "p-3 rounded-input text-xs font-semibold",
                  statusMsg.type === "success"
                    ? "bg-accent-green/15 text-text-primary border border-accent-green/30"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                )}
              >
                {statusMsg.text}
              </div>
            )}

            {/* Option A: Add Friend by Username */}
            <form onSubmit={handleAddFriend} className="space-y-2">
              <label className="text-xs font-bold text-text-primary">
                1. Tambah Teman via Username Caloria:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="misal: budi_runner"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-field flex-1 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="button-primary px-4 py-2 text-xs shrink-0"
                >
                  Tambah
                </button>
              </div>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-divider" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-surface px-2 text-text-muted">atau</span>
              </div>
            </div>

            {/* Option B: Join Party by Code */}
            <form onSubmit={handleJoinParty} className="space-y-2">
              <label className="text-xs font-bold text-text-primary">
                2. Gabung Co-op Squad via Kode Party:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="misal: CAL-8829"
                  value={newPartyCode}
                  onChange={(e) => setNewPartyCode(e.target.value)}
                  className="input-field flex-1 px-3 py-2 text-xs font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-button border border-border-default bg-surface hover:bg-accent-green-light text-text-primary font-bold text-xs shrink-0"
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
