"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Power, Gift, Eye, Store as StoreIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { Empty } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatTanggal, statusLangganan } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { Business } from "@/lib/types";
import { apiFetch } from "@/lib/api";

type Filter = "all" | "active" | "trialing" | "problem" | "inactive";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "trialing", label: "Masa coba" },
  { value: "problem", label: "Perlu bayar" },
  { value: "inactive", label: "Nonaktif" },
];

export default function StoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<Business[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState<Business | null>(null);
  const [detail, setDetail] = useState<Business | null>(null);
  const [gift, setGift] = useState<Business | null>(null);
  const [giftMonths, setGiftMonths] = useState("1");
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ owner_id: "", business_name: "", business_type: "retail", outlet_name: "Outlet Utama" });
  const [ownerQ, setOwnerQ] = useState("");
  const [owners, setOwners] = useState<{ id: number; name: string; phone: string }[]>([]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "12" });
      if (q) params.set("q", q);
      if (filter === "problem") params.set("status", "expired");
      else if (filter !== "all" && filter !== "inactive") params.set("status", filter);
      const res = await apiFetch<{ data: Business[]; meta: { total: number; last_page: number } }>(
        `/admin/businesses?${params}`
      );
      let list = res.data;
      if (filter === "inactive") list = list.filter((s) => !s.is_active);
      if (filter === "problem") {
        // sertakan past_due juga bila backend hanya filter expired
        const extra = list.filter((s) => s.subscription_status === "past_due");
        void extra;
      }
      setStores(list);
      setTotal(res.meta.total);
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

  useEffect(() => {
    if (!addOpen) return;
    apiFetch<{ data: { id: number; name: string; phone: string }[] }>(`/admin/users?per_page=20${ownerQ ? `&q=${encodeURIComponent(ownerQ)}` : ""}`)
      .then((r) => setOwners(r.data))
      .catch(() => {});
  }, [addOpen, ownerQ]);

  async function toggleActive() {
    if (!confirm) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/businesses/${confirm.id}/toggle-active`, { method: "POST" });
      toast(confirm.is_active ? "Toko dinonaktifkan" : "Toko diaktifkan", "success");
      setConfirm(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function giveFree() {
    if (!gift) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/businesses/${gift.id}/assign-plan`, {
        method: "POST",
        body: JSON.stringify({ plan_slug: "essential", months: Number(giftMonths) }),
      });
      toast(`Paket gratis ${giftMonths} bulan diberikan`, "success");
      setGift(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function createStore() {
    if (!form.owner_id) return toast("Pilih pemilik toko dulu", "error");
    if (!form.business_name.trim()) return toast("Nama toko wajib diisi", "error");
    setBusy(true);
    try {
      await apiFetch(`/admin/businesses`, {
        method: "POST",
        body: JSON.stringify({
          owner_id: Number(form.owner_id),
          business_name: form.business_name.trim(),
          business_type: form.business_type,
          outlet_name: form.outlet_name.trim() || "Outlet Utama",
        }),
      });
      toast("Toko dibuat · masa coba 7 hari langsung jalan", "success");
      setAddOpen(false);
      setForm({ owner_id: "", business_name: "", business_type: "retail", outlet_name: "Outlet Utama" });
      setOwnerQ("");
      setPage(1);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  const selectedOwner = owners.find((o) => String(o.id) === form.owner_id) ?? null;

  return (
    <div className="min-w-0">
      <PageHeader
        title="Toko"
        desc="Semua toko yang memakai LarisK"
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Tambah toko
          </Button>
        }
      />

      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* Cari + saring */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama toko atau pemilik..."
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
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{loading ? "Memuat..." : `${total} toko · halaman ${page}/${lastPage}`}</p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-8 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <Card><Empty icon={StoreIcon} title="Tidak ada toko" hint="Coba ubah pencarian atau tambah toko baru." action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus /> Tambah toko</Button>} /></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stores.map((s) => {
              const st = statusLangganan(s.subscription_status);
              return (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{s.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {s.owner_name} · {s.owner_phone}
                        </p>
                      </div>
                      {!s.is_active && <Badge variant="muted">Nonaktif</Badge>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-muted-foreground">{s.plan_name} · {s.outlets_count} outlet · {s.users_count} pengguna</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Berlaku sampai {formatTanggal(s.current_period_end)}</p>
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(s)}>
                        <Eye /> Detail
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setGift(s); setGiftMonths("1"); }}>
                        <Gift /> Gratis
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirm(s)}>
                        <Power /> {s.is_active ? "Matikan" : "Nyalakan"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Halaman {page} dari {lastPage}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft /> Kembali
            </Button>
            <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
              Lanjut <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={toggleActive}
        title={confirm?.is_active ? `Matikan "${confirm?.name}"?` : `Nyalakan "${confirm?.name}"?`}
        description={confirm?.is_active ? "Toko tidak bisa dipakai kasir sampai dinyalakan lagi." : "Toko bisa dipakai kasir lagi."}
        confirmLabel={confirm?.is_active ? "Ya, matikan" : "Ya, nyalakan"}
        variant={confirm?.is_active ? "danger" : "default"}
        loading={busy}
      />

      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Detail toko"}
        description={detail ? `${detail.owner_name} · ${detail.owner_phone}` : undefined}
        footer={<Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button>}
      >
        {detail && (
          <div className="space-y-3 pb-1 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Outlet</p><p className="text-lg font-bold">{detail.outlets_count}</p></div>
              <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Pengguna</p><p className="text-lg font-bold">{detail.users_count}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusLangganan(detail.subscription_status).variant}>{statusLangganan(detail.subscription_status).label}</Badge>
              <span className="text-[13px] font-medium">{detail.plan_name}</span>
            </div>
            <p className="text-[13px] text-muted-foreground">Alamat: {detail.address || "-"} · Dibuat {formatTanggal(detail.created_at)}</p>
          </div>
        )}
      </Dialog>

      <Dialog
        open={!!gift}
        onClose={() => setGift(null)}
        title={`Kasih gratis — ${gift?.name}`}
        description="Toko dapat paket Essential gratis, tanpa tagihan."
        footer={
          <>
            <Button variant="outline" onClick={() => setGift(null)}>Batal</Button>
            <Button onClick={giveFree} disabled={busy}><Gift /> {busy ? "Memproses..." : "Kasih gratis"}</Button>
          </>
        }
      >
        <div className="space-y-2 pb-1">
          <Label>Berapa lama?</Label>
          <Select value={giftMonths} onChange={(e) => setGiftMonths(e.target.value)}>
            <option value="1">1 bulan</option>
            <option value="3">3 bulan</option>
            <option value="6">6 bulan</option>
            <option value="12">12 bulan</option>
          </Select>
        </div>
      </Dialog>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah toko baru"
        description="Pilih pemilik, lalu isi nama toko. Masa coba 7 hari langsung jalan."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={createStore} disabled={busy}>{busy ? "Menyimpan..." : "Buat toko"}</Button>
          </>
        }
      >
        <div className="space-y-4 pb-1">
          <div className="space-y-2">
            <Label>Pemilik toko *</Label>
            <Combobox
              items={owners}
              itemToStringValue={(o) => `${o.name} — ${o.phone}`}
              value={selectedOwner}
              onValueChange={(o) => setForm((p) => ({ ...p, owner_id: o ? String(o.id) : "" }))}
              onInputChange={setOwnerQ}
            >
              <ComboboxInput placeholder="Ketik nama / no. HP pemilik..." />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada pemilik yang cocok. Coba kata kunci lain.</ComboboxEmpty>
                <ComboboxList>
                  {(o) => (
                    <ComboboxItem key={o.id} value={o}>
                      <span className="block truncate font-medium">{o.name}</span>
                      <span className="block text-xs text-zinc-500">{o.phone}</span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {selectedOwner && (
              <p className="text-xs font-semibold text-emerald-700">Terpilih: {selectedOwner.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Nama toko *</Label>
            <Input placeholder="Contoh: Toko Berkah Jaya" value={form.business_name} onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Jenis</Label>
              <Select value={form.business_type} onChange={(e) => setForm((p) => ({ ...p, business_type: e.target.value }))}>
                <option value="retail">Retail / Kelontong</option>
                <option value="fnb">Makanan & Minuman</option>
                <option value="coop">Koperasi</option>
                <option value="other">Lainnya</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama cabang</Label>
              <Input value={form.outlet_name} onChange={(e) => setForm((p) => ({ ...p, outlet_name: e.target.value }))} />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
