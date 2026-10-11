import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paket Harga",
  description: "Harga langganan yang dibayar toko tiap bulan",
};

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return children;
}
