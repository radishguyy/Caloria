"use client";

import { useEffect, useState } from "react";
import { X, Search, Check, AlertCircle, Copy, Users } from "lucide-react";
import { useSocialStore } from "@/stores/social-store";
import { toastFriendRequestSent } from "@/lib/toast";
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

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await sendFriendRequestByUsername(usernameInput);
      if (res.success) {
        toastFriendRequestSent(usernameInput);
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tambah Teman & Squad"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Pure white background (removed review-card yellow override) */}
      <div className="w-full max-w-md bg-surface p-6 rounded-card border border-border-default shadow-2xl space-y-5">
        {/* Modal Header: no icon, no subtitle, enlarged title */}
        <div className="flex items-center justify-between gap-3 border-b border-border-divider pb-3.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary font-heading">
            Tambah Teman & Squad
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-neutral-10 hover:text-text-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-border-divider pb-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("search");
              setStatusMsg(null);
            }}
            className={cn(
              "min-h-11 px-4 py-2 rounded-navigation text-sm font-extrabold transition-colors",
              activeTab === "search"
                ? "bg-[#FCF8E3] text-text-primary border border-accent-orange/30"
                : "text-neutral-10 hover:text-text-primary"
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
              "min-h-11 px-4 py-2 rounded-navigation text-sm font-extrabold transition-colors",
              activeTab === "code"
                ? "bg-[#FCF8E3] text-text-primary border border-accent-orange/30"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            Kode Co-op Squad
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={cn(
              "p-3.5 rounded-navigation text-sm font-semibold flex items-center gap-2 font-sans",
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
            <div className="space-y-2">
              <label
                htmlFor="friend-username"
                className="block text-base sm:text-lg font-extrabold text-text-primary font-heading"
              >
                Username atau Caloria Tag
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <input
                  id="friend-username"
                  type="text"
                  placeholder="Contoh: @nuriman atau nuriman"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full min-h-12 pl-11 pr-3.5 py-3 text-base rounded-navigation border border-border-default bg-surface focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-sans"
                  autoFocus
                />
              </div>
              <p className="text-sm text-neutral-10 font-sans">
                Undangan akan dikirimkan dan menunggu persetujuan temanmu.
              </p>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !usernameInput.trim()}
                className="min-h-12 px-6 py-2.5 rounded-button bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-sm sm:text-base font-extrabold font-sans cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Undangan"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Join Squad by Code & Share My Code (consistent green flat buttons) */}
        {activeTab === "code" && (
          <div className="space-y-4">
            <div className="p-4 rounded-navigation bg-surface-subtle border border-border-divider space-y-2">
              <span className="text-sm font-bold text-neutral-10 font-sans">
                Kode Squad Milikmu
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-extrabold tracking-wider text-text-primary">
                  {partyCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="min-h-11 inline-flex items-center gap-1.5 px-4 py-2 rounded-button text-sm font-extrabold bg-accent-green-light hover:bg-[#a9ce46] transition-colors text-[#244710] font-sans cursor-pointer"
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedCode ? "Disalin" : "Salin"}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleJoinSquad} className="space-y-4 pt-1">
              <div className="space-y-2">
                <label
                  htmlFor="party-code-input"
                  className="block text-base sm:text-lg font-extrabold text-text-primary font-heading"
                >
                  Gabung ke Squad Teman
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <input
                    id="party-code-input"
                    type="text"
                    placeholder="Contoh: CAL-8829"
                    value={partyCodeInput}
                    onChange={(e) => setPartyCodeInput(e.target.value.toUpperCase())}
                    className="w-full min-h-12 pl-11 pr-3.5 py-3 text-base font-mono uppercase rounded-navigation border border-border-default bg-surface focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!partyCodeInput.trim()}
                  className="min-h-12 px-6 py-2.5 rounded-button bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-sm sm:text-base font-extrabold font-sans cursor-pointer transition-colors disabled:opacity-50"
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
