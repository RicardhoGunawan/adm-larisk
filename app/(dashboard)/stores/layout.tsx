import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Toko",
  description: "Semua toko yang memakai LarisK",
};

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
