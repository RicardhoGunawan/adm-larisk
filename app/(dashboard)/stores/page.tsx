"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Power, ChevronLeft, ChevronRight, Building2, Plus, Gift, Coins } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatDate, getSubscriptionBadge } from "@/lib/utils";
import type { Business } from "@/lib/types";
import { apiFetch, getStoredToken } from "@/lib/api";

export default function StoresPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stores, setStores] = useState<Business[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmStore, setConfirmStore] = useState<Business | null>(null);
  const [detailStore, setDetailStore] = useState<Business | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Tambah Toko
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ owner_id: "", business_name: "", business_type: "retail", outlet_name: "Outlet Utama", address: "", phone: "", load_demo_data: false });
  const [ownerSearch, setOwnerSearch] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [owners, setOwners] = useState<{ id: number; name: string; phone: string; email?: string }[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Beri Essential
  const [assignStore, setAssignStore] = useState<Business | null>(null);
  const [assignMonths, setAssignMonths] = useState("1");

  const fetchStores = useCallback(async () => {
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
      const res = await apiFetch<{ data: Business[]; meta: { total: number; last_page: number } }>(`/admin/businesses?${params.toString()}`);
      setStores(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStores([]);
      setTotal(0);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  }, [page, q, status, router]);

  useEffect(() => {
    const t = setTimeout(fetchStores, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchStores, q]);

  const fetchOwners = useCallback(async (query: string) => {
    setLoadingOwners(true);
    try {
      const params = new URLSearchParams();
      params.set("per_page", "20");
      if (query) params.set("q", query);
      const res = await apiFetch<{ data: { id: number; name: string; phone: string; email?: string }[] }>(`/admin/users?${params.toString()}`);
      setOwners(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  useEffect(() => {
    if (addOpen) fetchOwners(ownerSearch);
  }, [addOpen, ownerSearch, fetchOwners]);

  async function doToggleActive() {
    if (!confirmStore) return;
    const target = confirmStore;
    setActionLoading(true);
    setStores((prev) => prev.map((s) => (s.id === target.id ? { ...s, is_active: !s.is_active } : s)));
    try {
      await apiFetch(`/admin/businesses/${target.id}/toggle-active`, { method: "POST" });
      toast(target.is_active ? "Bisnis dinonaktifkan" : "Bisnis diaktifkan", "success");
      setConfirmStore(null);
    } catch (e) {
      setStores((prev) => prev.map((s) => (s.id === target.id ? target : s)));
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function doAddStore() {
    if (!addForm.owner_id) {
      toast("Pilih pemilik toko dulu", "error");
      return;
    }
    if (!addForm.business_name.trim()) {
      toast("Nama toko wajib diisi", "error");
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/admin/businesses`, {
        method: "POST",
        body: JSON.stringify({
          owner_id: Number(addForm.owner_id),
          business_name: addForm.business_name.trim(),
          business_type: addForm.business_type,
          outlet_name: addForm.outlet_name.trim() || "Outlet Utama",
          address: addForm.address.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
          load_demo_data: addForm.load_demo_data,
        }),
      });
      toast("Toko berhasil dibuat — trial 7 hari aktif", "success");
      setAddOpen(false);
      setAddForm({ owner_id: "", business_name: "", business_type: "retail", outlet_name: "Outlet Utama", address: "", phone: "", load_demo_data: false });
      setOwnerSearch("");
      fetchStores();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function doAssignPlan() {
    if (!assignStore) return;
    setActionLoading(true);
    try {
      const res = await apiFetch<{ message: string; data: { subscription: { current_period_end: string } } }>(`/admin/businesses/${assignStore.id}/assign-plan`, {
        method: "POST",
        body: JSON.stringify({ plan_slug: "essential", months: Number(assignMonths) }),
      });
      toast(res.message || `Essential ${assignMonths} bulan diberikan`, "success");
      setAssignStore(null);
      fetchStores();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setActionLoading(false);
    }
  }

  const selectedOwner = owners.find((o) => String(o.id) === addForm.owner_id);

  return (
    <div className="min-w-0">
      <Header title="Daftar Toko / Bisnis" subtitle="Kelola bisnis, outlet, dan langganan — 1 owner 1 toko" />
      <div className="space-y-4 p-4 sm:p-6 max-w-[1600px] mx-auto">
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input placeholder="Cari toko / owner..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
              </div>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="h-9 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="trialing">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-zinc-600 whitespace-nowrap hidden sm:block">
                {loading ? "Memuat..." : `${total} bisnis`} • Hal {page}/{lastPage}
              </p>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Toko
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-red-800">Gagal memuat bisnis</p>
              <p className="text-xs text-red-700 break-words mt-1">{error}</p>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="hidden sm:grid grid-cols-[1.7fr_1fr_0.9fr_0.9fr_160px] gap-4 bg-zinc-50 border-b border-zinc-200 px-5 py-3">
            <span className="text-xs font-semibold text-zinc-600">Toko / Bisnis</span>
            <span className="text-xs font-semibold text-zinc-600">Owner</span>
            <span className="text-xs font-semibold text-zinc-600">Outlet & User</span>
            <span className="text-xs font-semibold text-zinc-600">Langganan</span>
            <span className="text-xs font-semibold text-zinc-600 text-right">Aksi</span>
          </div>

          {loading && <div className="py-12 text-center text-sm text-zinc-600">Memuat data toko...</div>}
          {!loading && stores.length === 0 && <div className="py-12 text-center text-sm font-medium text-zinc-700">Tidak ada bisnis ditemukan.</div>}

          {!loading && stores.length > 0 && (
            <div className="divide-y divide-zinc-100">
              {stores.map((s) => {
                const badge = getSubscriptionBadge(s.subscription_status);
                return (
                  <div key={s.id} className="group flex flex-col sm:grid sm:grid-cols-[1.7fr_1fr_0.9fr_0.9fr_160px] gap-3 sm:gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex gap-3 min-w-0">
                      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{s.name}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{s.business_type} • ID #{s.id}</p>
                        <p className="text-xs text-zinc-500 truncate hidden sm:block">{s.address || "-"}</p>
                        <div className="flex sm:hidden items-center gap-2 mt-2">
                          <Badge className={`${badge.className} text-xs`}>{badge.label}</Badge>
                          <span className={`text-xs font-medium ${s.is_active ? "text-emerald-700" : "text-red-700"}`}>• {s.is_active ? "Aktif" : "Nonaktif"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:block items-center justify-between sm:justify-start min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{s.owner_name}</p>
                        <p className="text-xs text-zinc-500 truncate">{s.owner_phone}</p>
                      </div>
                      <p className="sm:hidden text-xs text-zinc-400">{formatDate(s.created_at)}</p>
                    </div>

                    <div className="flex sm:flex-col gap-4 sm:gap-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" /> {s.outlets_count} outlet
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> {s.users_count} user
                      </span>
                      <span className="sm:hidden ml-auto text-xs text-zinc-500">{s.plan_name}</span>
                    </div>

                    <div className="hidden sm:block min-w-0">
                      <Badge className={badge.className}>{badge.label}</Badge>
                      <p className="text-xs font-medium text-zinc-700 truncate mt-1">{s.plan_name}</p>
                      <p className="text-xs text-zinc-500">{formatDate(s.current_period_end)}</p>
                      <p className={`text-xs font-medium mt-1 ${s.is_active ? "text-emerald-700" : "text-red-700"}`}>{s.is_active ? "Aktif" : "Nonaktif"}</p>
                    </div>

                    <div className="flex sm:justify-end items-center gap-1 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100">
                      <Tooltip content={s.is_active ? "Nonaktifkan toko" : "Aktifkan toko"}>
                        <button onClick={() => setConfirmStore(s)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                          <Power className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Beri Essential">
                        <button onClick={() => { setAssignStore(s); setAssignMonths("1"); }} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100">
                          <Gift className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Lihat detail toko">
                        <button onClick={() => setDetailStore(s)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 bg-zinc-50">
            <p className="text-xs font-medium text-zinc-700">Total {total} bisnis • Hal {page}/{lastPage}</p>
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

      <ConfirmModal
        open={!!confirmStore}
        onClose={() => setConfirmStore(null)}
        onConfirm={doToggleActive}
        title={confirmStore?.is_active ? "Nonaktifkan bisnis?" : "Aktifkan bisnis?"}
        description={`${confirmStore?.name} akan ${confirmStore?.is_active ? "dinonaktifkan" : "diaktifkan"} — bisnis nonaktif tidak bisa transaksi.`}
        confirmLabel={confirmStore?.is_active ? "Nonaktifkan" : "Aktifkan"}
        variant={confirmStore?.is_active ? "danger" : "primary"}
        loading={actionLoading}
      />

      <Modal
        open={!!detailStore}
        onClose={() => setDetailStore(null)}
        title={detailStore?.name || "Detail Bisnis"}
        description={`${detailStore?.business_type} • Owner ${detailStore?.owner_name} (${detailStore?.owner_phone})`}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDetailStore(null)}>Tutup</Button>
            <Button size="sm" onClick={() => { if (detailStore) { setAssignStore(detailStore); setDetailStore(null); } }}>
              <Gift className="h-4 w-4 mr-1.5" /> Beri Essential
            </Button>
          </div>
        }
      >
        {detailStore && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-zinc-50 p-3 border">
                <p className="text-xs text-zinc-500">Outlet</p>
                <p className="font-bold text-zinc-900">{detailStore.outlets_count}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 border">
                <p className="text-xs text-zinc-500">User</p>
                <p className="font-bold text-zinc-900">{detailStore.users_count}</p>
              </div>
            </div>
            <div className="text-xs space-y-1">
              <p><span className="text-zinc-500">Alamat:</span> <span className="text-zinc-900">{detailStore.address || "-"}</span></p>
              <p><span className="text-zinc-500">Plan:</span> <span className="font-medium text-zinc-900">{detailStore.plan_name}</span></p>
              <p><span className="text-zinc-500">Periode:</span> {formatDate(detailStore.current_period_end)}</p>
              <p><span className="text-zinc-500">Dibuat:</span> {formatDate(detailStore.created_at)}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Toko untuk User"
        description="1 owner hanya 1 toko — pilih pemilik lalu isi data toko. Trial 7 hari otomatis aktif."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button size="sm" onClick={doAddStore} disabled={actionLoading}>{actionLoading ? "Menyimpan..." : "Buat Toko"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pemilik *</Label>
            <div className="relative">
              <Input placeholder="Ketik nama / phone user..." value={ownerSearch} onChange={(e) => { setOwnerSearch(e.target.value); setShowOwnerDropdown(true); }} onFocus={() => { setShowOwnerDropdown(true); fetchOwners(ownerSearch); }} />
              {showOwnerDropdown && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-48 overflow-y-auto">
                  {loadingOwners ? (
                    <p className="p-3 text-xs text-zinc-500">Memuat...</p>
                  ) : owners.length === 0 ? (
                    <p className="p-3 text-xs text-zinc-500">Tidak ada user</p>
                  ) : (
                    owners.filter((u) => !ownerSearch || u.name.toLowerCase().includes(ownerSearch.toLowerCase()) || u.phone.includes(ownerSearch)).map((u) => (
                      <button key={u.id} type="button" onClick={() => { setAddForm((p) => ({ ...p, owner_id: String(u.id) })); setOwnerSearch(`${u.name} — ${u.phone}`); setShowOwnerDropdown(false); }} className={`w-full text-left px-3 py-2 hover:bg-zinc-50 ${String(u.id) === addForm.owner_id ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""}`}>
                        <p className={`text-sm font-medium ${String(u.id) === addForm.owner_id ? "text-white" : "text-zinc-900"}`}>{u.name}</p>
                        <p className={`text-xs ${String(u.id) === addForm.owner_id ? "text-zinc-300" : "text-zinc-500"}`}>{u.phone} {u.email ? `• ${u.email}` : ""}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {addForm.owner_id && <p className="text-xs text-emerald-700">Terpilih ID {addForm.owner_id}</p>}
          </div>
          <div className="space-y-2">
            <Label>Nama Toko *</Label>
            <Input value={addForm.business_name} onChange={(e) => setAddForm((p) => ({ ...p, business_name: e.target.value }))} placeholder="Toko Berkah Jaya" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={addForm.business_type} onChange={(e) => setAddForm((p) => ({ ...p, business_type: e.target.value }))}>
                <option value="retail">Retail</option>
                <option value="fnb">F&B</option>
                <option value="coop">Koperasi</option>
                <option value="other">Lainnya</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Outlet</Label>
              <Input value={addForm.outlet_name} onChange={(e) => setAddForm((p) => ({ ...p, outlet_name: e.target.value }))} placeholder="Outlet Utama" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alamat (opsional)</Label>
            <Input value={addForm.address} onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))} placeholder="Jl. Merdeka No.1" />
          </div>
          <div className="space-y-2">
            <Label>Phone Toko (opsional)</Label>
            <Input value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} placeholder="081234567890" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addForm.load_demo_data} onChange={(e) => setAddForm((p) => ({ ...p, load_demo_data: e.target.checked }))} className="rounded" />
            <span className="font-medium text-zinc-700">Aktifkan data demo (produk contoh)</span>
          </label>
          <p className="text-xs text-zinc-500">Trial 7 hari otomatis aktif setelah toko dibuat.</p>
        </div>
      </Modal>

      <Modal
        open={!!assignStore}
        onClose={() => setAssignStore(null)}
        title={`Beri Essential — ${assignStore?.name}`}
        description="Gratis tanpa tagihan. Pilih durasi, expired akan diset otomatis."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAssignStore(null)}>Batal</Button>
            <Button size="sm" onClick={doAssignPlan} disabled={actionLoading}><Coins className="h-4 w-4 mr-1.5" />{actionLoading ? "Memproses..." : "Beri Essential"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Label>Durasi *</Label>
          <Select value={assignMonths} onChange={(e) => setAssignMonths(e.target.value)}>
            <option value="1">1 Bulan</option>
            <option value="3">3 Bulan</option>
            <option value="6">6 Bulan</option>
            <option value="12">12 Bulan</option>
          </Select>
          <p className="text-xs text-zinc-500">Akan diperpanjang {assignMonths} bulan dari sekarang (gratis).</p>
        </div>
      </Modal>
    </div>
  );
}
