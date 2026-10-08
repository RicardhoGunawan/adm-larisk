import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatTanggal(dateString?: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTanggalWaktu(dateString?: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Status langganan -> bahasa pemilik toko yang mudah dimengerti */
export function statusLangganan(status: string): { label: string; variant: "success" | "info" | "warning" | "danger" | "muted" } {
  switch (status) {
    case "active":
      return { label: "Aktif · Sudah bayar", variant: "success" };
    case "trialing":
      return { label: "Masa coba", variant: "info" };
    case "past_due":
      return { label: "Perlu bayar", variant: "warning" };
    case "expired":
      return { label: "Berakhir · Belum bayar", variant: "danger" };
    case "canceled":
      return { label: "Berhenti", variant: "muted" };
    default:
      return { label: status || "-", variant: "muted" };
  }
}

/** Status tagihan -> bahasa sederhana */
export function statusTagihan(status: string): { label: string; variant: "success" | "info" | "warning" | "danger" | "muted" } {
  switch (status) {
    case "paid":
      return { label: "Lunas", variant: "success" };
    case "pending":
      return { label: "Menunggu bayar", variant: "warning" };
    case "open":
      return { label: "Belum dibayar", variant: "warning" };
    case "expired":
      return { label: "Kedaluwarsa", variant: "danger" };
    case "failed":
      return { label: "Gagal", variant: "danger" };
    case "draft":
      return { label: "Draf", variant: "muted" };
    default:
      return { label: status || "-", variant: "muted" };
  }
}

// Kompatibilitas dengan kode lama
export const formatDate = formatTanggal;
export const formatDateTime = formatTanggalWaktu;
export function getSubscriptionBadge(status: string): { label: string; className: string } {
  const s = statusLangganan(status);
  const map = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    info: "bg-sky-100 text-sky-800 border-sky-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    muted: "bg-zinc-100 text-zinc-600 border-zinc-200",
  } as const;
  return { label: s.label, className: map[s.variant] };
}
export function getInvoiceBadge(status: string): { label: string; className: string } {
  const s = statusTagihan(status);
  const map = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    info: "bg-sky-100 text-sky-800 border-sky-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    muted: "bg-zinc-100 text-zinc-600 border-zinc-200",
  } as const;
  return { label: s.label, className: map[s.variant] };
}
