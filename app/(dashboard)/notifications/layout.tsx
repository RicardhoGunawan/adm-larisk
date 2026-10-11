import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Pengumuman yang dikirim ke toko",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
