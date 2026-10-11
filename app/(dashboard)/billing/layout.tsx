import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tagihan",
  description: "Tagihan langganan toko LarisK",
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
