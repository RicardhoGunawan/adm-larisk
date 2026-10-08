import { LayoutDashboard, Store, Users, ReceiptText, Megaphone, Package } from "lucide-react";

export const NAV = [  { href: "/dashboard", label: "Ringkasan", desc: "Uang & kondisi toko", icon: LayoutDashboard },
  { href: "/stores", label: "Toko", desc: "Daftar semua toko", icon: Store },
  { href: "/billing", label: "Tagihan", desc: "Bayar & belum bayar", icon: ReceiptText },
  { href: "/users", label: "Pengguna", desc: "Pemilik & kasir", icon: Users },
  { href: "/notifications", label: "Pengumuman", desc: "Kirim info ke toko", icon: Megaphone },
  { href: "/plans", label: "Paket Harga", desc: "Atur harga langganan", icon: Package },
] as const;
