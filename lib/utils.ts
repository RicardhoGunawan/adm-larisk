export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getSubscriptionBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "active":
      return { label: "Aktif", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "trialing":
      return { label: "Trial", className: "bg-blue-100 text-blue-700 border-blue-200" };
    case "past_due":
      return { label: "Jatuh Tempo", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "expired":
      return { label: "Expired", className: "bg-red-100 text-red-700 border-red-200" };
    case "canceled":
      return { label: "Dibatalkan", className: "bg-zinc-100 text-zinc-600 border-zinc-200" };
    default:
      return { label: status, className: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  }
}

export function getInvoiceBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "paid":
      return { label: "Lunas", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "open":
      return { label: "Belum Bayar", className: "bg-orange-100 text-orange-700 border-orange-200" };
    case "expired":
      return { label: "Kedaluwarsa", className: "bg-red-100 text-red-700 border-red-200" };
    case "failed":
      return { label: "Gagal", className: "bg-red-100 text-red-700 border-red-200" };
    default:
      return { label: status, className: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  }
}
