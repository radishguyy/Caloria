import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";

export const metadata: Metadata = {
  title: "Caloria — Nourish Your Body, Level Up Your Pet",
  description:
    "Aplikasi pencatat nutrisi harian dengan gamifikasi Virtual Pet dan Co-op Streak.",
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
      </body>
    </html>
  );
}
