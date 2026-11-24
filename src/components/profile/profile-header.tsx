"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Flower2, Trophy } from "lucide-react";
import { SegmentedToggle, SegmentedToggleOption } from "@/components/shared/segmented-toggle";

const PROFILE_TABS: SegmentedToggleOption[] = [
  { href: "/profile/overview", label: "Rekap", icon: Flower2 },
  { href: "/profile/achievements", label: "Pencapaian", icon: Trophy },
];

interface ProfileHeaderProps {
  title: string;
}

export function ProfileHeader({ title }: ProfileHeaderProps) {
  const pathname = usePathname();
  const showTabs = PROFILE_TABS.some(
    (tab) => pathname === tab.href || pathname?.startsWith(`${tab.href}/`)
  );
  const onOverview = pathname?.startsWith("/profile/overview") ?? false;
  const backHref = onOverview ? "/dashboard" : "/profile/overview";
  const backLabel = onOverview ? "Kembali ke dashboard" : "Kembali ke rekap profil";

  return (
    <header className="border-b border-border-divider pb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="shrink-0 rounded-xl border border-border-default p-1.5 text-text-muted transition-colors hover:bg-accent-green-light hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <h1 className="min-w-0 flex-1 text-xl font-extrabold leading-tight tracking-tight text-text-primary font-heading sm:text-2xl">
          {title}
        </h1>
        {showTabs && (
          <div className="ml-auto w-full min-[480px]:w-auto">
            <SegmentedToggle
              options={PROFILE_TABS}
              label="Bagian profil"
              className="w-full min-[480px]:w-auto"
              optionClassName="flex-1 justify-center min-[480px]:flex-none"
            />
          </div>
        )}
      </div>
    </header>
  );
}
