import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { NotificationDrawer } from "@/components/shared/notification-drawer";

export const metadata: Metadata = {
  title: "Caloria — Nourish Your Body, Level Up Your Pet",
  description:
    "Aplikasi web pencatat nutrisi gamifikasi dengan Virtual Pet, Daily Missions, dan Co-op Streak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Navbar />
        <main className="flex-1 pb-24 lg:pb-12">{children}</main>
        <BottomNav />
        <NotificationDrawer />
      </body>
    </html>
  );
}
