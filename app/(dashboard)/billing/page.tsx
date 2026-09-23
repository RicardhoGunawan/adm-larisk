"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Wallet, CheckCircle, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRupiah, getInvoiceBadge } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { apiFetch, getStoredToken } from "@/lib/api";

export default function BillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "20");
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const res = await apiFetch<{ data: Invoice[]; meta: { total: number; last_page: number } }>(`/admin/invoices?${params.toString()}`);
      setInvoices(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setInvoices([]);
      setTotal(0);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  }, [page, q, status, router]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchInvoices, q]);

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid").reduce((a, b) => a + b.amount_idr, 0);
    const pending = invoices.filter((i) => ["open", "pending"].includes(i.status)).reduce((a, b) => a + b.amount_idr, 0);
    return { paid, pending, count: invoices.length };
  }, [invoices]);

  return (
    <div className="min-w-0">
      <Header title="Transaksi Tagihan" subtitle="Monitor invoice & pembayaran langganan" />
      <div className="space-y-4 p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Total Invoice</p>
              <Wallet className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{loading ? "—" : totals.count}</p>
            <p className="mt-1 text-xs text-zinc-600">Total DB: {total}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sudah Lunas</p>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{loading ? "—" : formatRupiah(totals.paid)}</p>
            <p className="mt-1 text-xs text-zinc-600">Hal ini</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-800">{loading ? "—" : formatRupiah(totals.pending)}</p>
            <p className="mt-1 text-xs text-zinc-600">Open + Pending</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input placeholder="Cari ID invoice / bisnis..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
              </div>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="h-9 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="all">Semua status</option>
                <option value="open">Belum Bayar</option>
                <option value="pending">Pending</option>
                <option value="paid">Lunas</option>
                <option value="expired">Expired</option>
                <option value="failed">Gagal</option>
              </select>
            </div>
            <p className="text-xs font-medium text-zinc-600 whitespace-nowrap">
              {loading ? "Memuat..." : `${total} invoice`} • Hal {page}/{lastPage}
            </p>
          </div>
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-red-800">Gagal memuat invoice</p>
              <p className="text-xs text-red-700 break-words mt-1">{error}</p>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left">
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Invoice</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Bisnis</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Jumlah</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Jatuh Tempo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const badge = getInvoiceBadge(inv.status);
                  return (
                    <tr key={inv.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900 whitespace-nowrap">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-xs font-medium text-zinc-700 max-w-[180px] truncate">{inv.business_name}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{formatRupiah(inv.amount_idr)}</td>
                      <td className="px-4 py-3">
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">Tidak ada invoice ditemukan.</p>
                      <p className="text-xs text-zinc-500 mt-1">Ubah filter atau buat tagihan baru via billing.</p>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">
                      Memuat data invoice...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 bg-zinc-50">
            <p className="text-xs font-medium text-zinc-700">Total {total} invoice • Hal {page}/{lastPage}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
