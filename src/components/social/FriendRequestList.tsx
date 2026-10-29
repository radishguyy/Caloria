"use client";

import { useState } from "react";
import { Check, X, Inbox, Send, Clock, UserCheck } from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { FriendRequest } from "@/types";
import { useSocialStore } from "@/stores/social-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  toastFriendRequestAccepted,
  toastFriendRequestDeclined,
} from "@/lib/toast";
import { cn } from "@/lib/utils";

interface FriendRequestListProps {
  className?: string;
  onAcceptSuccess?: () => void;
}

export function FriendRequestList({ className, onAcceptSuccess }: FriendRequestListProps) {
  const isHydrated = useHydrated();
  const { pendingRequests, acceptFriendRequest, declineFriendRequest } = useSocialStore();
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className={cn("rounded-card bg-surface p-5 border border-border-divider", className)}>
        <div className="h-6 w-36 bg-surface-subtle animate-pulse rounded-navigation mb-4" />
        <div className="space-y-3">
          <div className="h-16 rounded-card bg-surface-subtle animate-pulse" />
          <div className="h-16 rounded-card bg-surface-subtle animate-pulse" />
        </div>
      </div>
    );
  }

  const incomingRequests = pendingRequests.filter(
    (req) => req.direction === "incoming" && req.status === "pending"
  );
  const outgoingRequests = pendingRequests.filter(
    (req) => req.direction === "outgoing" && req.status === "pending"
  );

  const handleAccept = async (requestId: string, username?: string) => {
    setProcessingId(requestId);
    try {
      await acceptFriendRequest(requestId);
      toastFriendRequestAccepted(username || "Teman");
      onAcceptSuccess?.();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await declineFriendRequest(requestId);
      toastFriendRequestDeclined();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section
      aria-label="Undangan Teman"
      className={cn(
        "rounded-card bg-surface p-5 sm:p-6 border border-border-default shadow-xs space-y-4",
        className
      )}
    >
      {/* Header with Sub-tabs for Incoming & Outgoing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-divider">
        <div>
          <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
            Undangan Teman
          </h2>
          <p className="text-xs text-text-muted font-sans">
            Kelola permintaan pertemanan masuk dan keluar
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-navigation bg-surface-subtle border border-border-divider self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-navigation text-xs font-bold transition-all",
              activeTab === "incoming"
                ? "bg-surface text-text-primary shadow-xs border border-border-divider/50"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Masuk</span>
            {incomingRequests.length > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-accent-orange text-text-inverse text-[10px] font-black">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-navigation text-xs font-bold transition-all",
              activeTab === "outgoing"
                ? "bg-surface text-text-primary shadow-xs border border-border-divider/50"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Terkirim</span>
            {outgoingRequests.length > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-surface-subtle text-text-muted text-[10px] font-bold border border-border-default">
                {outgoingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab: INCOMING REQUESTS */}
      {activeTab === "incoming" && (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-text-primary font-heading">
                Belum ada undangan pertemanan masuk
              </p>
              <p className="text-xs text-text-muted max-w-sm mx-auto font-sans">
                Saat pengguna lain mengajakmu berteman di Caloria, permintaannya akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-divider">
              {incomingRequests.map((req) => {
                const isBusy = processingId === req.id;
                const petSpecies = req.sender.petSpecies || "bloomie";
                const petLevel = req.sender.petLevel || 1;
                const petStage = req.sender.petStage || (petLevel >= 5 ? "Juvenile" : "Hatchling");

                return (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      {/* Sender Avatar */}
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-subtle border border-border-divider overflow-hidden">
                        <AvatarRenderer characterId={petSpecies} size="sm" className="h-10 w-10" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary font-sans">
                            {req.sender.fullName}
                          </h3>
                          <span className="text-xs text-text-muted font-sans">
                            @{req.sender.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-accent-green-light/40 text-text-primary border border-border-default/50 font-sans">
                            Pet Lv. {petLevel} {petStage}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-text-muted font-sans">
                            <Clock className="h-3 w-3" />
                            {req.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Terima & Tolak */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Tolak Action */}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecline(req.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-navigation text-xs font-semibold text-[#F43F5E] hover:text-[#E11D48] hover:bg-[#F43F5E]/10 border border-[#F43F5E]/30 transition-all active:scale-95 disabled:opacity-50 font-sans cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Tolak</span>
                      </button>

                      {/* Terima Action (styled with fresh green / button-primary) */}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAccept(req.id, req.sender.username)}
                        className="button-primary inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold font-sans cursor-pointer"
                        style={{
                          backgroundColor: "#5B8E55",
                          color: "#FFFFFF",
                        }}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Terima</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: OUTGOING REQUESTS */}
      {activeTab === "outgoing" && (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                <Send className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-text-primary font-heading">
                Tidak ada undangan terkirim yang pending
              </p>
              <p className="text-xs text-text-muted max-w-sm mx-auto font-sans">
                Gunakan pencarian username atau tombol Rekomendasi Teman untuk mengajak teman baru.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-divider">
              {outgoingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-yellow/50 text-text-primary font-bold text-sm border border-border-default">
                      {req.receiver?.fullName?.charAt(0) || "@"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary font-sans">
                        {req.receiver?.fullName || "Caloria User"}
                      </h3>
                      <p className="text-xs text-text-muted font-sans">
                        @{req.receiver?.username} • Terkirim {req.createdAt}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-[#FCF8E3] text-[11px] font-semibold text-text-primary border border-accent-orange/20 font-sans">
                    <Clock className="h-3 w-3 text-accent-orange" />
                    Menunggu Respon
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

