"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Wallet, CircleCheck, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Empty } from "@/components/ui/Empty";
import { Stat } from "@/components/Stat";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatTanggal, statusTagihan } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { apiFetch } from "@/lib/api";

type Filter = "all" | "unpaid" | "paid";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "unpaid", label: "Belum bayar" },
  { value: "paid", label: "Lunas" },
];

export default function BillingPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Invoice[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (q) params.set("q", q);
      if (filter === "unpaid") params.set("status", "open");
      else if (filter === "paid") params.set("status", "paid");
      const [res, expiredRes] = await Promise.all([
        apiFetch<{ data: Invoice[]; meta: { total: number; last_page: number } }>(
          `/admin/invoices?${params}`
        ),
        // Tagihan kedaluwarsa disembunyikan — hitung agar total tetap jujur
        filter === "all"
          ? apiFetch<{ data: Invoice[]; meta: { total: number } }>(`/admin/invoices?status=expired&per_page=1`)
          : Promise.resolve(null),
      ]);
      // Kedaluwarsa tidak perlu ditampilkan
      setList(res.data.filter((i) => i.status !== "expired"));
      setTotal(res.meta.total - (expiredRes?.meta.total ?? 0));
      setLastPage(res.meta.last_page);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, filter]);

  const lunas = list.filter((i) => i.status === "paid").reduce((a, b) => a + b.amount_idr, 0);
  const belum = list.filter((i) => ["open", "pending", "draft"].includes(i.status)).reduce((a, b) => a + b.amount_idr, 0);

  return (
    <div className="min-w-0">
      <PageHeader title="Tagihan" desc="Siapa sudah bayar, siapa belum" />

      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat icon={Wallet} label="Total tagihan" value={String(total)} hint={`Halaman ${page}/${lastPage}`} />
          <Stat icon={CircleCheck} label="Sudah dibayar" value={formatRupiah(lunas)} hint="Di halaman ini" tone="good" />
          <div className="col-span-2 lg:col-span-1">
            <Stat icon={Hourglass} label="Belum dibayar" value={formatRupiah(belum)} hint="Perlu ditagih" tone={belum > 0 ? "warn" : "good"} />
          </div>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nomor tagihan atau nama toko..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setFilter(f.value); setPage(1); }}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                    filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          {/* Kartu di HP */}
          <div className="space-y-2 p-4 sm:hidden">
            {loading && <p className="py-6 text-center text-sm text-muted-foreground">Memuat tagihan...</p>}
            {!loading && list.length === 0 && <Empty icon={Wallet} title="Tidak ada tagihan" hint="Coba ubah saringan." />}
            {list.map((inv) => {
              const st = statusTagihan(inv.status);
              return (
                <div key={inv.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">{inv.business_name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{inv.invoice_number}</p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold">{formatRupiah(inv.amount_idr)}</p>
                    <p className="text-xs text-muted-foreground">Jatuh tempo {formatTanggal(inv.due_date)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel di desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tagihan</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4">Jatuh tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((inv) => {
                  const st = statusTagihan(inv.status);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-4 font-mono text-xs font-semibold">{inv.invoice_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">{inv.business_name}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{formatRupiah(inv.amount_idr)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="pr-4 text-xs text-muted-foreground whitespace-nowrap">{formatTanggal(inv.due_date)}</TableCell>
                    </TableRow>
                  );
                })}
                {list.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={5}><Empty icon={Wallet} title="Tidak ada tagihan" hint="Coba ubah saringan." /></TableCell></TableRow>
                )}
                {loading && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Memuat tagihan...</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">Halaman {page} dari {lastPage} · {total} tagihan · tanpa yang kedaluwarsa</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft /> Kembali
              </Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                Lanjut <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
