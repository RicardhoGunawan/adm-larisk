import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengguna",
  description: "Kelola pemilik toko dan kasir LarisK",
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
