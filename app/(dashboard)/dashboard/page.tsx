"use client";

import { useEffect, useState } from "react";
import { Users, Store, BadgeCheck, Wallet, ArrowRight, Receipt, TrendingUp, TrendingDown, Coins, Percent, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatsCard } from "@/components/StatsCard";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { DashboardStats, Invoice } from "@/lib/types";
import { apiFetch, getStoredToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, invRes] = await Promise.all([
          apiFetch<{ data: DashboardStats }>(`/admin/stats`),
          apiFetch<{ data: Invoice[]; meta?: unknown }>(`/admin/invoices?per_page=8`),
        ]);
        if (!cancelled) {
          setStats(statsRes.data);
          setInvoices((invRes.data as Invoice[]) ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-w-0">
        <Header title="Dashboard Overview" subtitle="Memuat data..." />
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="h-3 w-24 bg-zinc-200 rounded" />
                <div className="h-7 w-20 bg-zinc-200 rounded mt-4" />
                <div className="h-3 w-32 bg-zinc-100 rounded mt-2" />
              </Card>
            ))}
          </div>
          <Card className="p-10 text-center text-sm text-zinc-600">Memuat dashboard...</Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-0">
        <Header title="Dashboard Overview" subtitle="Gagal memuat data" />
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-800">Gagal memuat dashboard</p>
            <p className="mt-1 text-sm text-red-700 break-words">{error}</p>
            <p className="mt-3 text-xs text-red-600">Silakan coba muat ulang halaman atau login kembali.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxRev6m = Math.max(1, ...stats.revenue_6m.map((r) => r.revenue));
  const maxHour = Math.max(1, ...stats.activity_hourly.map((h) => h.count));

  return (
    <div className="min-w-0">
      <Header title="Dashboard Overview" subtitle="Ringkasan performa platform LarisK" />

      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          <StatsCard icon={<Users className="h-4 w-4 text-zinc-600" />} label="Total User" value={stats.total_users.toLocaleString("id-ID")} sub={`${stats.new_users_7d} baru dalam 7 hari`} />
          <StatsCard icon={<Store className="h-4 w-4 text-zinc-600" />} label="Total Bisnis / Toko" value={stats.total_businesses.toLocaleString("id-ID")} sub={`${stats.total_outlets} outlet terdaftar`} />
          <StatsCard icon={<BadgeCheck className="h-4 w-4 text-zinc-600" />} label="Langganan Aktif" value={stats.active_subscriptions.toLocaleString("id-ID")} sub={`${stats.trialing_subscriptions} trial • ${stats.expired_subscriptions} expired`} />
          <StatsCard icon={<Wallet className="h-4 w-4 text-zinc-600" />} label="Pendapatan Bulan Ini" value={formatRupiah(stats.revenue_month)} sub={`Total: ${formatRupiah(stats.revenue_total)} • ${stats.pending_invoices} pending`} />
        </div>

        {/* No.1 Revenue & Subscription Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4 text-zinc-500" /> Pendapatan</CardTitle>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.growth_percent >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {stats.growth_percent >= 0 ? <><TrendingUp className="h-3 w-3 inline mr-1" />+{stats.growth_percent}%</> : <><TrendingDown className="h-3 w-3 inline mr-1" />{stats.growth_percent}%</>} vs bulan lalu
              </span>
            </CardHeader>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-zinc-900 text-white p-4">
                <p className="text-xs text-zinc-300">Bulan Ini</p>
                <p className="text-lg font-bold mt-1">{formatRupiah(stats.mrr)}</p>
                <p className="text-xs text-zinc-400 mt-1">Pendapatan rutin</p>
              </div>
              <div className="rounded-xl bg-zinc-50 border p-4">
                <p className="text-xs text-zinc-500">Perkiraan Setahun</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">{formatRupiah(stats.arr)}</p>
                <p className="text-xs text-zinc-500 mt-1">Bulan ini × 12</p>
              </div>
              <div className="rounded-xl bg-zinc-50 border p-4">
                <p className="text-xs text-zinc-500">Bulan lalu</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">{formatRupiah(stats.revenue_last_month || 0)}</p>
                <p className="text-xs text-zinc-500 mt-1">Growth {stats.growth_percent}%</p>
              </div>
            </div>
            {/* 6m bar */}
            <div className="flex items-end gap-2 h-24 px-1">
              {stats.revenue_6m.map((r) => (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-zinc-900 hover:bg-zinc-800 transition-colors" style={{ height: `${(r.revenue / maxRev6m) * 80 + 8}px` }} title={`${r.month}: ${formatRupiah(r.revenue)}`} />
                  <span className="text-xs font-medium text-zinc-500">{r.month_short}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2">Pendapatan 6 bulan terakhir</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Percent className="h-4 w-4 text-zinc-500" /> Subscription Health</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs font-medium text-emerald-800">Trial Conversion</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.trial_conversion}%</p>
                <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, stats.trial_conversion)}%` }} />
                </div>
                <p className="text-xs text-emerald-700 mt-1">Active / (Active+Expired)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-700">Churn Rate</p>
                  <p className="text-lg font-bold text-red-800">{stats.churn_rate}%</p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-700">ARPU</p>
                  <p className="text-sm font-bold text-blue-800">{formatRupiah(stats.arpu)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900 text-white p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-300 flex items-center gap-1"><Coins className="h-3 w-3" /> LTV Estimasi</p>
                  <p className="text-lg font-bold mt-1">{formatRupiah(stats.ltv)}</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tren Trial vs Berlangganan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-zinc-500" /> Tren Pendaftaran — Trial vs Berlangganan (6 Bulan)</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Trial</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Berlangganan</span>
            </div>
          </CardHeader>
          {(() => {
            const max = Math.max(1, ...stats.subscription_trend.map((d) => Math.max(d.trial, d.active)));
            return (
              <div className="flex items-end gap-3 h-36 px-1">
                {stats.subscription_trend.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="flex gap-1 items-end w-full justify-center h-28">
                      <div className="flex-1 max-w-8 rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-colors" style={{ height: `${(d.trial / max) * 96 + 6}px` }} title={`${d.month_short} Trial: ${d.trial}`} />
                      <div className="flex-1 max-w-8 rounded-t-lg bg-emerald-600 hover:bg-emerald-700 transition-colors" style={{ height: `${(d.active / max) * 96 + 6}px` }} title={`${d.month_short} Active: ${d.active}`} />
                    </div>
                    <span className="text-xs font-medium text-zinc-500">{d.month_short}</span>
                    <span className="text-xs font-mono text-zinc-600">{d.trial}/{d.active}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="flex justify-between text-xs text-zinc-500 mt-3 px-1">
            <span>Tiap bar kiri Trial (biru), kanan Berlangganan (hijau) per bulan</span>
            <span>Total trial {stats.trialing_subscriptions} • Active {stats.active_subscriptions}</span>
          </div>
        </Card>

        {/* No.2 Top Toko */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-zinc-500" /> Top Toko by Transaksi</CardTitle>
            <a href="/stores" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">Lihat semua →</a>
          </CardHeader>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-left text-xs text-zinc-500">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Toko</th>
                  <th className="pb-2 font-medium">Transaksi</th>
                  <th className="pb-2 font-medium">Penjualan</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_stores.map((s, i) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-3 text-xs font-medium text-zinc-500">#{i + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-500">{s.business_type} • {s.outlets_count} outlet • {s.users_count} user</p>
                    </td>
                    <td className="py-3 font-semibold">{s.transactions_count}</td>
                    <td className="py-3 font-medium">{formatRupiah(s.total_sales)}</td>
                    <td className="py-3">
                      <Badge className={s.subscription_status === "active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : s.subscription_status === "trialing" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-red-100 text-red-800 border-red-200"}>{s.subscription_status}</Badge>
                    </td>
                  </tr>
                ))}
                {stats.top_stores.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-zinc-500">Belum ada transaksi.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Hari Ini — Per Jam</CardTitle>
            <span className="text-xs text-zinc-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short" })}</span>
          </CardHeader>
          <div className="flex items-end gap-1 h-28 px-1">
            {stats.activity_hourly.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-zinc-900 rounded-t" style={{ height: `${(h.count / maxHour) * 80 + 4}px`, opacity: h.count ? 1 : 0.1 }} title={`${h.label}: ${h.count} transaksi`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>00:00</span><span>12:00</span><span>23:00</span>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-2">{stats.activity_hourly.reduce((a, b) => a + b.count, 0)} transaksi hari ini</p>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4 text-zinc-500" /> Invoice Terbaru</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="hidden sm:inline text-xs text-zinc-500">{invoices.length} invoice</span>
              <a href="/billing" className="ml-auto sm:ml-0 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800">
                Kelola tagihan <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardHeader>

          <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
            <div className="min-w-[640px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                    <th className="pb-3 pr-4">Invoice</th>
                    <th className="pb-3 pr-4">Bisnis</th>
                    <th className="pb-3 pr-4">Jumlah</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Jatuh Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-zinc-100 last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-zinc-900 whitespace-nowrap">{inv.invoice_number}</td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-zinc-700">{inv.business_name}</td>
                      <td className="py-3 pr-4 font-semibold text-zinc-900 whitespace-nowrap">{formatRupiah(inv.amount_idr)}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : inv.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : inv.status === "open"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-zinc-600">
                        Belum ada invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-zinc-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-zinc-900">{inv.invoice_number}</p>
                    <p className="truncate text-sm font-medium text-zinc-900 mt-1">{inv.business_name}</p>
                    <p className="text-xs text-zinc-600 mt-1">Jatuh tempo {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-900">{formatRupiah(inv.amount_idr)}</p>
                    <div className="mt-1 flex justify-end">
                      <Badge
                        className={
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : inv.status === "pending"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <p className="py-8 text-center text-sm text-zinc-600">Belum ada invoice.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: number; tone: "emerald" | "blue" | "red" | "amber" }) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    blue: "bg-blue-50 text-blue-800 border border-blue-200",
    red: "bg-red-50 text-red-800 border border-red-200",
    amber: "bg-amber-50 text-amber-800 border border-amber-200",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${map[tone]}`}>
      <span className="text-sm font-medium truncate pr-3">{label}</span>
      <span className="text-sm font-bold shrink-0">{value}</span>
    </div>
  );
}
