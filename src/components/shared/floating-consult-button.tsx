"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope } from "lucide-react";

const FLOATING_CONSULT_ROUTE_PREFIXES = [
  "/dashboard",
  "/diary",
  "/pet",
  "/pet-customization",
  "/profile",
  "/quests",
  "/settings",
  "/social",
];

export function FloatingConsultButton() {
  const pathname = usePathname();

  const shouldShow = Boolean(
    pathname &&
    FLOATING_CONSULT_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <Link
      href="/consult"
      aria-label="Buka Konsultasi Gizi"
      title="Konsultasi Gizi"
      className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 items-center gap-2.5 whitespace-nowrap rounded-lg bg-brand-green-light px-6 text-base font-bold text-brand-green-ink transition-colors duration-200 ease-out hover:bg-brand-green hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink active:scale-95 motion-reduce:transition-none lg:bottom-6 lg:right-6"
    >
      <Stethoscope className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>Konsultasi</span>
    </Link>
  );
}
