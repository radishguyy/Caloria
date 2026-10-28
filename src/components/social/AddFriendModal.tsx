"use client";

import { useState } from "react";
import { X, Search, UserPlus, Check, AlertCircle, Copy, Users } from "lucide-react";
import { useSocialStore } from "@/stores/social-store";
import { cn } from "@/lib/utils";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const {
    partyCode,
    sendFriendRequestByUsername,
    joinPartyByCode,
    simulateIncomingRequest,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<"search" | "code">("search");
  const [usernameInput, setUsernameInput] = useState("");
  const [partyCodeInput, setPartyCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await sendFriendRequestByUsername(usernameInput);
      if (res.success) {
        setStatusMsg({ type: "success", text: res.message });
        setUsernameInput("");
        setTimeout(() => {
          onClose();
          setStatusMsg(null);
        }, 1500);
      } else {
        setStatusMsg({ type: "error", text: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyCodeInput.trim()) return;

    const ok = joinPartyByCode(partyCodeInput);
    if (ok) {
      setStatusMsg({
        type: "success",
        text: `Berhasil bergabung ke Squad ${partyCodeInput.trim().toUpperCase()}!`,
      });
      setPartyCodeInput("");
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1500);
    } else {
      setStatusMsg({
        type: "error",
        text: "Kode Party tidak valid.",
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="review-card w-full max-w-md bg-surface p-6 rounded-card border border-border-default shadow-lg space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-divider pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-navigation bg-accent-orange/15 text-accent-orange">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary font-heading">
                Tambah Teman & Squad
              </h2>
              <p className="text-xs text-text-muted font-sans">
                Ajak teman akrabmu saling jaga streak di Caloria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-tabs: Username Search vs Join by Party Code */}
        <div className="flex items-center gap-2 border-b border-border-divider pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("search");
              setStatusMsg(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-navigation text-xs font-bold transition-all",
              activeTab === "search"
                ? "bg-[#FCF8E3] text-text-primary border border-accent-orange/30 font-bold"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Cari Username / Tag
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("code");
              setStatusMsg(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-navigation text-xs font-bold transition-all",
              activeTab === "code"
                ? "bg-[#FCF8E3] text-text-primary border border-accent-orange/30 font-bold"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Kode Co-op Squad
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={cn(
              "p-3 rounded-navigation text-xs flex items-center gap-2 font-sans",
              statusMsg.type === "success"
                ? "bg-accent-green-light/40 border border-accent-green/30 text-text-primary"
                : "bg-red-50 border border-red-200 text-red-700"
            )}
          >
            {statusMsg.type === "success" ? (
              <Check className="h-4 w-4 text-accent-green shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Search by Username */}
        {activeTab === "search" && (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="friend-username"
                className="text-xs font-bold text-text-primary font-heading"
              >
                Username atau Caloria Tag
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="friend-username"
                  type="text"
                  placeholder="Contoh: @nuriman atau nuriman"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-navigation border border-border-default bg-surface focus:outline-none focus:ring-2 focus:ring-accent-orange/40 font-sans"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-text-muted font-sans">
                Undangan akan dikirimkan dan menunggu persetujuan temanmu.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {/* Quick Demo Simulator button */}
              <button
                type="button"
                onClick={() => {
                  simulateIncomingRequest("Randi Putra", "randi_fit");
                  setStatusMsg({
                    type: "success",
                    text: "Simulasi: @randi_fit mengirimkan permintaan pertemanan ke kamu!",
                  });
                }}
                className="text-[11px] text-text-muted underline hover:text-text-primary font-sans"
              >
                ⚡ Tes Undangan Masuk
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !usernameInput.trim()}
                className="button-primary px-4 py-2 text-xs font-bold font-sans cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "#FF9233", color: "#FFFFFF" }}
              >
                {isSubmitting ? "Mengirim..." : "Kirim Undangan"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Join Squad by Code & Share My Code */}
        {activeTab === "code" && (
          <div className="space-y-4">
            {/* My Party Code Box */}
            <div className="p-3.5 rounded-navigation bg-surface-subtle border border-border-divider space-y-1.5">
              <span className="text-[11px] font-semibold text-text-muted font-sans">
                Kode Squad Milikmu
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-extrabold tracking-wider text-text-primary">
                  {partyCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-navigation text-xs font-bold bg-surface border border-border-default hover:bg-surface-subtle transition-colors text-text-primary font-sans"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-accent-green" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? "Disalin" : "Salin"}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleJoinSquad} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="party-code-input"
                  className="text-xs font-bold text-text-primary font-heading"
                >
                  Gabung ke Squad Teman
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    id="party-code-input"
                    type="text"
                    placeholder="Contoh: CAL-8829"
                    value={partyCodeInput}
                    onChange={(e) => setPartyCodeInput(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono uppercase rounded-navigation border border-border-default bg-surface focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!partyCodeInput.trim()}
                  className="button-primary px-4 py-2 text-xs font-bold font-sans cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "#5B8E55", color: "#FFFFFF" }}
                >
                  Gabung Squad
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

