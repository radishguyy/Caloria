import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { NotificationDrawer } from "@/components/shared/notification-drawer";
import { SessionProvider } from "@/components/shared/session-provider";
import { Toaster } from "sonner";

const openRunde = localFont({
  src: [
    { path: "./fonts/OpenRunde-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenRunde-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/OpenRunde-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-open-runde",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const secuela = localFont({
  src: [
    { path: "./fonts/Secuela-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Secuela-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Secuela-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Secuela-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-secuela",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

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
    <html
      lang="id"
      className={`h-full antialiased ${openRunde.variable} ${secuela.variable}`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <SessionProvider>
          <Navbar />
          <main className="flex-1 pb-24 lg:pb-12">{children}</main>
          <BottomNav />
          <NotificationDrawer />
          <Toaster
            position="bottom-right"
            richColors
            theme="light"
            closeButton
            toastOptions={{
              className: "font-sans !rounded-2xl !border-2 !border-[#1E293B]/10 !shadow-md",
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
