import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LarisK Admin — Super Admin Panel",
  description: "Dashboard admin untuk mengelola user, toko/bisnis, tagihan, dan notifikasi LarisK POS",
};

import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ colorScheme: "light" }}>
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
