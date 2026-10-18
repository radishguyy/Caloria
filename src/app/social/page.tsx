"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Flame,
  UserPlus,
  Send,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Info,
  HelpCircle,
} from "lucide-react";
import { useSocialStore } from "@/store/use-social-store";
import { cn } from "@/lib/utils";

export default function SocialPage() {
  const {
    partyName,
    partyCode,
    coopStreakDays,
    highestCoopStreak,
    friends,
    pokeHistory,
    activePokeToast,
    pokeFriend,
    addFriendByUsername,
    joinPartyByCode,
    simulateFriendLog,
    clearPokeToast,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<"party" | "friends">("party");
  const [newUsername, setNewUsername] = useState("");
  const [newPartyCode, setNewPartyCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pendingFriends = friends.filter((f) => !f.dailyGoalMet);
  const allMet = friends.length > 0 && pendingFriends.length === 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const ok = addFriendByUsername(newUsername);
    if (ok) {
      setFeedbackMsg({
        type: "success",
        text: `Berhasil menambahkan @${newUsername.trim()} sebagai teman!`,
      });
      setNewUsername("");
    } else {
      setFeedbackMsg({
        type: "error",
        text: `@${newUsername.trim()} sudah ada di daftar teman.`,
      });
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyCode.trim()) return;
    const ok = joinPartyByCode(newPartyCode);
    if (ok) {
      setFeedbackMsg({
        type: "success",
        text: `Berhasil bergabung ke Party Squad ${newPartyCode.trim().toUpperCase()}!`,
      });
      setNewPartyCode("");
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Social Hub & Co-op Streak
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Jaga streak bersama teman, pantau catatan makanan mereka, dan senggol yang belum mencatat sebelum malam tiba.
          </p>
        </div>

        {/* Copy Party Code Button */}
        <button
          onClick={handleCopyCode}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-card hover:bg-muted text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <span className="text-muted-foreground">Kode Party:</span>
          <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
            {partyCode}
          </span>
          {copiedCode ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Active Poke Toast Banner */}
      {activePokeToast && (
        <div className="p-4 rounded-2xl border bg-orange-500/10 border-orange-500/30 text-orange-950 dark:text-orange-100 flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Send className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-bounce" />
            <div>
              <p className="text-xs font-bold">Senggolan Terkirim!</p>
              <p className="text-xs opacity-90">{activePokeToast.message}</p>
            </div>
          </div>
          <button
            onClick={clearPokeToast}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. Hero Shared Co-op Streak Card */}
      <section className="rounded-3xl border bg-gradient-to-tr from-orange-500/15 via-amber-500/5 to-card p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
              <Flame className="h-9 w-9 fill-white animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                Shared Co-op Streak
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                {coopStreakDays} Hari Tanpa Putus!
              </h2>
              <p className="text-xs text-muted-foreground">
                Party: <strong className="text-foreground">{partyName}</strong> • Rekor Tertinggi: {highestCoopStreak} Hari
              </p>
            </div>
          </div>

          {/* Party Condition Status Pill */}
          <div className="sm:text-right">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border",
                allMet
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              )}
            >
              {allMet ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Streak Hari Ini Aman (+1)</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{pendingFriends.length} Teman Perlu Disenggol</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs sm:ml-auto">
              Aturan: Angka streak harian bertambah apabila semua anggota mencatat makanan sebelum jam 23:59.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("party")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors",
            activeTab === "party"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Status Co-op Party ({friends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("friends")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors",
            activeTab === "friends"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Tambah Teman & Party</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={cn(
            "p-3 rounded-xl text-xs font-semibold",
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          )}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Tab Content: Co-op Party & Friends Status */}
      {activeTab === "party" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Member Status Cards (Left Column) */}
          <div className="lg:col-span-8 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
              <span>Status Anggota Party Hari Ini</span>
              <span className="text-xs text-muted-foreground font-normal">
                {friends.filter((f) => f.dailyGoalMet).length} dari {friends.length} selesai
              </span>
            </h3>

            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Friend Avatar */}
                    <div
                      className={cn(
                        "h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs",
                        friend.avatarColor
                      )}
                    >
                      {friend.fullName.charAt(0)}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">
                          {friend.fullName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          @{friend.username}
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-muted border">
                          Pet Lv.{friend.petLevel} ({friend.petName})
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {friend.lastActiveText}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] pt-1">
                        <span className="text-foreground font-semibold">
                          {friend.caloriesLoggedToday} / {friend.calorieTarget} kcal
                        </span>
                        <span className="text-muted-foreground">
                          ({friend.mealsLoggedToday} kali makan)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Status or Senggol Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {friend.dailyGoalMet ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Sudah Makan</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => pokeFriend(friend.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Senggol 👋</span>
                      </button>
                    )}

                    {/* Quick Demo Helper: simulate this friend logging meals */}
                    {!friend.dailyGoalMet && (
                      <button
                        onClick={() => simulateFriendLog(friend.id)}
                        className="text-[10px] px-2 py-1 rounded-lg border hover:bg-muted text-muted-foreground"
                        title="Simulasi teman mencatat makanan untuk testing"
                      >
                        Demo: Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity / Poke Feed (Right Column) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border bg-card p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-orange-500" />
                <span>Riwayat Senggolan & Notifikasi</span>
              </h3>

              <div className="divide-y divide-border text-xs max-h-[350px] overflow-y-auto">
                {pokeHistory.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-[11px]">
                    Belum ada riwayat senggolan.
                  </p>
                ) : (
                  pokeHistory.map((item) => (
                    <div key={item.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {item.fromUser} &rarr; {item.toUser}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Co-op Streak Rules Helper Box */}
            <div className="rounded-2xl border bg-muted/30 p-4 text-xs space-y-2">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-500" />
                Aturan Co-op Streak:
              </h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Membangun kebiasaan sehat jauh lebih mudah bersama teman! Streak kelompok Anda bertambah setiap hari jika semua anggota minimal mencatat 1x makan dan memenuhi &gt;70% target harian sebelum tengah malam.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Add Friend & Join Party */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Friend Card */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-bold text-foreground">Tambah Teman Baru</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Cari dan undang teman dengan username Caloria mereka untuk mengikat streak bersama.
            </p>

            <form onSubmit={handleAddFriend} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Username Teman
                </label>
                <input
                  type="text"
                  placeholder="misal: budi_runner atau @sarah"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-transform active:scale-95"
              >
                + Tambah Teman
              </button>
            </form>
          </div>

          {/* Join Party Card */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-bold text-foreground">Gabung Co-op Party</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Masukkan 8 digit Kode Party dari temanmu untuk bergabung ke squad mereka.
            </p>

            <form onSubmit={handleJoinParty} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Kode Party Unik
                </label>
                <input
                  type="text"
                  placeholder="misal: CAL-8829"
                  value={newPartyCode}
                  onChange={(e) => setNewPartyCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs uppercase font-mono outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold transition-colors"
              >
                Gabung ke Party Ini
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

