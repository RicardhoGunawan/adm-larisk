"use client";

import { useEffect, useState } from "react";
import { Search, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, KeyRound, Power, Eye, User as UserIcon, Users as UsersIcon, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Empty } from "@/components/ui/Empty";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useMe } from "@/lib/use-admin";
import { formatTanggal } from "@/lib/utils";
import type { User } from "@/lib/types";
import { apiFetch } from "@/lib/api";

type Filter = "all" | "owner" | "staff" | "inactive";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "owner", label: "Pemilik toko" },
  { value: "staff", label: "Kasir" },
  { value: "inactive", label: "Nonaktif" },
];

export default function UsersPage() {
  const { toast } = useToast();
  const me = useMe();
  const myId = me?.id ?? null;
  const [list, setList] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Parent–child: pemilik (induk) -> karyawan (anak) per toko
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [staffByBiz, setStaffByBiz] = useState<Record<number, User[]>>({});
  const [loadingStaff, setLoadingStaff] = useState<Record<number, boolean>>({});

  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPin, setNewPin] = useState("123456");
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [detail, setDetail] = useState<User | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", pin: "123456" });
  const [busy, setBusy] = useState(false);

  // Mode grup: pemilik sebagai induk, karyawan di bawahnya. Mode cari/filter lain: datar.
  const grouped = !q.trim() && (filter === "all" || filter === "owner");
  const withoutMe = (rows: User[]) => (myId ? rows.filter((u) => u.id !== myId) : rows);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (q) params.set("q", q);
      if (filter === "inactive") params.set("is_active", "0");
      if (grouped) params.set("is_owner", "1");
      const res = await apiFetch<{ data: User[]; meta: { total: number; last_page: number } }>(`/admin/users?${params}`);
      let rows = withoutMe(res.data);
      if (filter === "owner" && !grouped) rows = rows.filter((u) => u.is_owner);
      if (filter === "staff") rows = rows.filter((u) => !u.is_owner);
      setList(rows);
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
  }, [page, q, filter, myId]);

  async function toggleExpand(owner: User) {
    if (!owner.business_id) {
      toast("Pemilik ini belum punya toko", "info");
      return;
    }
    const next = new Set(expanded);
    if (next.has(owner.id)) {
      next.delete(owner.id);
      setExpanded(next);
      return;
    }
    next.add(owner.id);
    setExpanded(next);
    const bid = owner.business_id;
    if (staffByBiz[bid] || loadingStaff[bid]) return;
    setLoadingStaff((p) => ({ ...p, [bid]: true }));
    try {
      const res = await apiFetch<{ data: User[] }>(`/admin/users?business_id=${bid}&is_owner=false&per_page=100`);
      setStaffByBiz((p) => ({ ...p, [bid]: withoutMe(res.data) }));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoadingStaff((p) => ({ ...p, [bid]: false }));
    }
  }

  async function doToggle() {
    if (!toggleUser) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${toggleUser.id}/toggle-active`, { method: "POST" });
      toast(toggleUser.is_active ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan", "success");
      setToggleUser(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function doResetPin() {
    if (!resetUser) return;
    if (!/^\d{4,6}$/.test(newPin)) return toast("PIN harus 4-6 angka", "error");
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${resetUser.id}/reset-pin`, { method: "POST", body: JSON.stringify({ pin: newPin }) });
      toast(`PIN ${resetUser.name} jadi ${newPin}`, "success");
      setResetUser(null);
      setNewPin("123456");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function doAdd() {
    if (!form.name.trim() || !form.phone.trim()) return toast("Nama dan no. HP wajib diisi", "error");
    if (!/^\d{4,6}$/.test(form.pin)) return toast("PIN harus 4-6 angka", "error");
    setBusy(true);
    try {
      await apiFetch(`/admin/users`, { method: "POST", body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), pin: form.pin }) });
      toast("Pengguna baru dibuat", "success");
      setAddOpen(false);
      setForm({ name: "", phone: "", pin: "123456" });
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  function ActionMenu({ u }: { u: User }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Aksi untuk ${u.name}`}>
            <MoreHorizontal />
            <span className="sr-only">Buka menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDetail(u)}>
            <Eye /> Lihat detail
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResetUser(u)}>
            <KeyRound /> Ganti PIN
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={u.is_active ? "destructive" : "default"}
            onSelect={() => setToggleUser(u)}
          >
            <Power /> {u.is_active ? "Matikan akses" : "Nyalakan akses"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function StatusBadge({ u }: { u: User }) {
    return <Badge variant={u.is_active ? "success" : "danger"}>{u.is_active ? "Aktif" : "Nonaktif"}</Badge>;
  }

  function staffOf(owner: User): User[] {
    return owner.business_id ? staffByBiz[owner.business_id] ?? [] : [];
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title="Pengguna"
        desc={grouped ? "Pemilik toko — ketuk untuk melihat kasir di bawahnya" : "Pemilik toko & kasir yang memakai LarisK"}
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Tambah
          </Button>
        }
      />

      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau no. HP..."
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
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Memuat..." : grouped ? `${total} pemilik toko · halaman ${page}/${lastPage}` : `${total} pengguna · halaman ${page}/${lastPage}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          {/* Kartu di HP */}
          <div className="space-y-2 p-4 sm:hidden">
            {loading && <p className="py-6 text-center text-sm text-muted-foreground">Memuat...</p>}
            {!loading && list.length === 0 && <Empty icon={UserIcon} title="Tidak ada pengguna" hint="Coba ubah pencarian." />}
            {list.map((u) => {
              const kids = grouped ? staffOf(u) : [];
              const isOpen = expanded.has(u.id);
              const kidsLoading = u.business_id ? !!loadingStaff[u.business_id] : false;
              return (
                <div key={u.id} className="rounded-lg border">
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-1.5">
                        {grouped && (
                          <button
                            onClick={() => toggleExpand(u)}
                            aria-label={isOpen ? "Tutup kasir" : "Lihat kasir"}
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                          >
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{u.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{u.phone} · {u.business_name || "Belum punya toko"}</p>
                        </div>
                      </div>
                      <StatusBadge u={u} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant={u.is_owner ? "default" : "muted"}>{u.is_owner ? "Pemilik toko" : "Kasir"}</Badge>
                      {grouped && (
                        <button onClick={() => toggleExpand(u)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <UsersIcon className="h-3 w-3" />
                          {isOpen ? "Sembunyikan kasir" : `Lihat kasir${kids.length ? ` (${kids.length})` : ""}`}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(u)}><Eye /> Lihat</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setResetUser(u)}><KeyRound /> PIN</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setToggleUser(u)}><Power /> {u.is_active ? "Matikan" : "Nyalakan"}</Button>
                    </div>
                  </div>
                  {grouped && isOpen && (
                    <div className="space-y-2 border-t bg-muted/40 px-3 py-3">
                      {kidsLoading && <p className="py-1 text-center text-xs text-muted-foreground">Memuat kasir...</p>}
                      {!kidsLoading && kids.length === 0 && (
                        <p className="py-1 text-center text-xs text-muted-foreground">Belum ada kasir di toko ini.</p>
                      )}
                      {kids.map((k) => (
                        <div key={k.id} className="ml-2 rounded-lg border border-l-2 border-l-zinc-400 bg-white p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold">{k.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{k.phone}</p>
                            </div>
                            <StatusBadge u={k} />
                          </div>
                          <div className="mt-2 flex gap-2 border-t pt-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(k)}><Eye /> Lihat</Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setResetUser(k)}><KeyRound /> PIN</Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setToggleUser(k)}><Power /> {k.is_active ? "Matikan" : "Nyalakan"}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tabel desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nama</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((u) => {
                  const kids = grouped ? staffOf(u) : [];
                  const isOpen = expanded.has(u.id);
                  const kidsLoading = u.business_id ? !!loadingStaff[u.business_id] : false;
                  return [
                    <TableRow key={u.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-1.5">
                          {grouped && (
                            <button
                              onClick={() => toggleExpand(u)}
                              aria-label={isOpen ? "Tutup kasir" : "Lihat kasir"}
                              title={isOpen ? "Tutup kasir" : "Lihat kasir"}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={u.is_owner ? "default" : "muted"}>{u.is_owner ? "Pemilik toko" : "Kasir"}</Badge>
                          {grouped && kids.length > 0 && (
                            <span className="text-xs tabular-nums text-muted-foreground">· {kids.length} kasir</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-[13px]">{u.business_name || "-"}</TableCell>
                      <TableCell><StatusBadge u={u} /></TableCell>
                      <TableCell className="pr-4 text-right"><ActionMenu u={u} /></TableCell>
                    </TableRow>,
                    ...(grouped && isOpen
                      ? kidsLoading
                        ? [
                            <TableRow key={`${u.id}-loading`}>
                              <TableCell colSpan={5} className="py-3 pl-12 text-[13px] text-muted-foreground">
                                Memuat kasir...
                              </TableCell>
                            </TableRow>,
                          ]
                        : kids.length === 0
                          ? [
                              <TableRow key={`${u.id}-empty`}>
                                <TableCell colSpan={5} className="py-3 pl-12 text-[13px] text-muted-foreground">
                                  Belum ada kasir di toko ini.
                                </TableCell>
                              </TableRow>,
                            ]
                          : kids.map((k) => (
                              <TableRow key={k.id} className="bg-muted/40 hover:bg-muted/60">
                                <TableCell className="pl-12">
                                  <div className="flex items-center gap-2">
                                    <span aria-hidden className="h-4 w-0.5 shrink-0 rounded-full bg-zinc-300" />
                                    <div className="min-w-0">
                                      <p className="font-semibold">{k.name}</p>
                                      <p className="text-xs text-muted-foreground">{k.phone}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell><Badge variant="muted">Kasir</Badge></TableCell>
                                <TableCell className="max-w-[180px] truncate text-[13px]">{k.business_name || "-"}</TableCell>
                                <TableCell><StatusBadge u={k} /></TableCell>
                                <TableCell className="pr-4 text-right"><ActionMenu u={k} /></TableCell>
                              </TableRow>
                            ))
                      : []),
                  ];
                })}
                {list.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={5}><Empty icon={UserIcon} title="Tidak ada pengguna" hint="Coba ubah pencarian." /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">Halaman {page} dari {lastPage}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /> Kembali</Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Lanjut <ChevronRight /></Button>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={doToggle}
        title={toggleUser?.is_active ? `Matikan akses ${toggleUser?.name}?` : `Nyalakan akses ${toggleUser?.name}?`}
        description={toggleUser?.is_active ? "Ia tidak bisa masuk aplikasi sampai dinyalakan lagi." : "Ia bisa masuk aplikasi lagi."}
        confirmLabel={toggleUser?.is_active ? "Ya, matikan" : "Ya, nyalakan"}
        variant={toggleUser?.is_active ? "danger" : "default"}
        loading={busy}
      />

      <Dialog
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title={`Ganti PIN — ${resetUser?.name}`}
        description="PIN baru 4-6 angka. Beritahu pemilik toko PIN barunya."
        footer={
          <>
            <Button variant="outline" onClick={() => setResetUser(null)}>Batal</Button>
            <Button onClick={doResetPin} disabled={busy}>{busy ? "Menyimpan..." : "Simpan PIN"}</Button>
          </>
        }
      >
        <div className="space-y-2 pb-1">
          <Label>PIN baru</Label>
          <Input value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={6} inputMode="numeric" />
        </div>
      </Dialog>

      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Detail pengguna"}
        description={detail ? `${detail.phone}` : undefined}
        footer={<Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button>}
      >
        {detail && (
          <div className="space-y-2 pb-1 text-sm">
            <div className="flex gap-2">
              <Badge variant={detail.is_owner ? "default" : "muted"}>{detail.is_owner ? "Pemilik toko" : "Kasir"}</Badge>
              <Badge variant={detail.is_active ? "success" : "danger"}>{detail.is_active ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            <p className="text-[13px]">Toko: <b>{detail.business_name || "-"}</b></p>
            <p className="text-xs text-muted-foreground">Terdaftar {formatTanggal(detail.created_at)}</p>
          </div>
        )}
      </Dialog>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah pengguna"
        description="Buat akun baru untuk pemilik toko."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={doAdd} disabled={busy}>{busy ? "Menyimpan..." : "Tambah"}</Button>
          </>
        }
      >
        <div className="space-y-3 pb-1">
          <div className="space-y-1.5"><Label>Nama *</Label><Input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>No. HP *</Label><Input placeholder="08..." value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} inputMode="tel" /></div>
          <div className="space-y-1.5"><Label>PIN (4-6 angka) *</Label><Input value={form.pin} onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value }))} maxLength={6} inputMode="numeric" /></div>
        </div>
      </Dialog>
    </div>
  );
}
