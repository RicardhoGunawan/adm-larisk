"use client";

import Link from "next/link";
import {
  Wallet,
  PiggyBank,
  Store,
  ReceiptText,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TriangleAlert,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { DashboardStats, Invoice } from "@/lib/types";
import { useAdmin } from "@/lib/use-admin";

/* ---------- Grafik SVG mungil (tanpa library, tajam di layar besar) ---------- */

function Spark({ points, stroke = "#18181b" }: { points: number[]; stroke?: string }) {
  const W = 132;
  const H = 40;
  if (points.length < 2) return <div style={{ width: W, height: H }} />;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(1, max - min);
  const step = W / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(H - 4 - ((p - min) / span) * (H - 10)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 760;
  const H = 260;
  const pad = { l: 52, r: 12, t: 16, b: 30 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = niceCeil(max);
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - pad.b - (v / nice) * (H - pad.t - pad.b);
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);

  // Kurva halus (catmull-rom -> bezier)
  let line = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  const area = `${line} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const gid = "revFill";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Grafik uang masuk 6 bulan">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18181b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#18181b" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((f) => {
        const v = nice * f;
        const yy = y(v);
        return (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke="#e4e4e7" strokeDasharray={f === 0 ? "" : "4 4"} />
            <text x={pad.l - 8} y={yy + 4} textAnchor="end" fontSize={11} fill="#a1a1aa" fontWeight={600}>
              {shortRp(v)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="#18181b" strokeWidth={2.5} strokeLinecap="round" />
      {pts.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={10} fill="transparent">
            <title>{`${data[i].label}: ${formatRupiah(data[i].value)}`}</title>
          </circle>
          <circle cx={cx} cy={cy} r={4} fill="#18181b" stroke="#fff" strokeWidth={2} />
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize={12} fill="#71717a" fontWeight={600}>
          {d.label}
        </text>
      ))}
    </svg>
  );
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function shortRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
  if (n >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return `Rp${Math.round(n)}`;
}

/* ---------- Kartu KPI desktop ---------- */

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  spark,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  delta?: { text: string; up: boolean };
  spark?: number[];
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-zinc-900 text-white">
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-[13px] font-semibold text-zinc-500">{label}</p>
          </div>
          {delta && (
            <Badge variant={delta.up ? "success" : "warning"}>
              {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta.text}
            </Badge>
          )}
        </div>
        <p className="mt-4 text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-xs leading-relaxed text-zinc-500">{sub}</p>
          {spark && spark.length > 1 && (
            <div className="hidden shrink-0 sm:block">
              <Spark points={spark} stroke={delta && !delta.up ? "#b45309" : "#18181b"} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Halaman ---------- */

export default function DashboardPage() {
  const stats = useAdmin<{ data: DashboardStats }>(`/admin/stats`);
  const invoices = useAdmin<{ data: Invoice[] }>(`/admin/invoices?per_page=8`);

  const s = stats.data?.data;
  const invList: Invoice[] = (invoices.data?.data as unknown as Invoice[]) ?? [];
  const loading = stats.loading || invoices.loading;

  const growth = s?.growth_percent ?? 0;
  const naik = growth >= 0;
  const needAttention = (s?.expired_subscriptions ?? 0) + (s?.pending_invoices ?? 0);
  const topStores = (s?.top_stores ?? []).slice(0, 5);
  const maxSales = Math.max(1, ...topStores.map((t) => t.total_sales));
  const total6m = (s?.revenue_6m ?? []).reduce((a, b) => a + b.revenue, 0);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Ringkasan Bisnis"
        desc="Pantau uang masuk, toko, dan tagihan dalam satu layar"
      />

      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {loading && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-8 text-center text-sm text-zinc-500">Memuat data bisnis...</CardContent>
            </Card>
          </>
        )}

        {!loading && stats.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-red-800">Tidak bisa memuat data</p>
              <p className="mt-1 text-sm text-red-700 break-words">{stats.error}</p>
              <Button variant="outline" size="sm" className="mt-3 bg-white" onClick={() => { stats.reload(); invoices.reload(); }}>
                Coba lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {s && (
          <>
            {needAttention > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center lg:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-amber-500 text-white">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-amber-900">Ada {needAttention} hal perlu perhatian Anda</p>
                  <p className="mt-0.5 text-[13px] text-amber-800">
                    {[
                      s.pending_invoices > 0 ? `${s.pending_invoices} tagihan belum dibayar` : "",
                      s.expired_subscriptions > 0 ? `${s.expired_subscriptions} langganan toko bermasalah` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Link href="/billing" className="shrink-0">
                  <Button size="sm" variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                    Lihat & urus <ArrowRight />
                  </Button>
                </Link>
              </div>
            )}

            {/* KPI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi
                icon={Wallet}
                label="Uang masuk bulan ini"
                value={formatRupiah(s.revenue_month)}
                sub={`Bulan lalu ${formatRupiah(s.revenue_last_month || 0)}`}
                delta={{ text: `${naik ? "+" : ""}${growth}%`, up: naik }}
                spark={(s.revenue_6m ?? []).map((r) => r.revenue)}
              />
              <Kpi
                icon={PiggyBank}
                label="Total uang masuk"
                value={formatRupiah(s.revenue_total)}
                sub="Akumulasi sejak awal sampai sekarang"
              />
              <Kpi
                icon={Store}
                label="Toko aktif & masa coba"
                value={`${(s.active_subscriptions + s.trialing_subscriptions).toLocaleString("id-ID")} toko`}
                sub={`${s.total_businesses.toLocaleString("id-ID")} total toko · ${s.total_outlets.toLocaleString("id-ID")} cabang`}
                spark={(s.subscription_trend ?? []).map((t) => t.active)}
              />
              <Kpi
                icon={ReceiptText}
                label="Tagihan belum dibayar"
                value={`${s.pending_invoices.toLocaleString("id-ID")} tagihan`}
                sub={s.pending_invoices > 0 ? "Segera follow-up agar tidak kedaluwarsa" : "Semua tagihan sudah beres. Bagus!"}
                delta={s.pending_invoices > 0 ? { text: "Perlu tindakan", up: false } : undefined}
              />
            </div>

            {/* Grafik arus uang — selebar layar */}
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 pb-2 lg:p-6 lg:pb-2">
                <div>
                  <CardTitle className="text-base">Arus uang masuk · 6 bulan terakhir</CardTitle>
                  <CardDescription>Dari tagihan langganan yang sudah dibayar toko</CardDescription>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total 6 bulan</p>
                  <p className="text-lg font-bold tabular-nums">{formatRupiah(total6m)}</p>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2 lg:p-6 lg:pt-2">
                <RevenueChart data={(s.revenue_6m ?? []).map((r) => ({ label: r.month_short, value: r.revenue }))} />
              </CardContent>
            </Card>

            {/* Tabel tagihan + toko ramai */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <Card className="xl:col-span-3">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 p-5 pb-3 lg:p-6 lg:pb-3">
                  <div>
                    <CardTitle className="text-base">Tagihan terbaru</CardTitle>
                    <CardDescription>Nomor, toko, jumlah & status pembayaran</CardDescription>
                  </div>
                  <Link href="/billing">
                    <Button variant="outline" size="sm">
                      Semua tagihan <ArrowRight />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50/80">
                          <TableHead className="pl-5">No. Tagihan</TableHead>
                          <TableHead>Toko</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="pr-5">Jatuh tempo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invList.slice(0, 6).map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="pl-5 font-mono text-xs font-semibold">{inv.invoice_number}</TableCell>
                            <TableCell className="max-w-[220px] truncate font-medium">{inv.business_name}</TableCell>
                            <TableCell className="text-right font-bold tabular-nums">{formatRupiah(inv.amount_idr)}</TableCell>
                            <TableCell>
                              <Badge variant={inv.status === "paid" ? "success" : inv.status === "expired" || inv.status === "failed" ? "danger" : "warning"}>
                                {inv.status === "paid" ? "Lunas" : inv.status === "expired" ? "Kedaluwarsa" : "Belum bayar"}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-5 text-[13px] text-zinc-500">{formatTanggal(inv.due_date)}</TableCell>
                          </TableRow>
                        ))}
                        {invList.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Empty icon={Inbox} title="Belum ada tagihan" hint="Tagihan baru akan tercatat di sini." />
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="space-y-2 p-4 md:hidden">
                    {invList.slice(0, 6).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{inv.business_name}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{inv.invoice_number}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-bold tabular-nums">{formatRupiah(inv.amount_idr)}</p>
                          <Badge variant={inv.status === "paid" ? "success" : "warning"} className="mt-1">
                            {inv.status === "paid" ? "Lunas" : "Belum bayar"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 p-5 pb-3 lg:p-6 lg:pb-3">
                  <div>
                    <CardTitle className="text-base">Toko paling ramai</CardTitle>
                    <CardDescription>Transaksi terbanyak bulan ini</CardDescription>
                  </div>
                  <Link href="/stores" className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-zinc-600 hover:text-zinc-950">
                    Semua <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-1 lg:p-6 lg:pt-1">
                  {topStores.length === 0 && (
                    <Empty icon={Store} title="Belum ada data" hint="Data muncul setelah toko mulai berjualan." />
                  )}
                  {topStores.map((t, i) => (
                    <div key={t.id}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[13px] font-bold tabular-nums">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[13px] font-bold">{t.name}</p>
                            <p className="shrink-0 text-[13px] font-bold tabular-nums">{formatRupiah(t.total_sales)}</p>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                            <div className="h-full rounded-full bg-zinc-900" style={{ width: `${Math.max(4, (t.total_sales / maxSales) * 100)}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 tabular-nums">
                            {t.transactions_count.toLocaleString("id-ID")} transaksi · {t.outlets_count} cabang
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
