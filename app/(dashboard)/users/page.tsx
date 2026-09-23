  "use client";

  import React, { useCallback, useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import { Search, Pencil, KeyRound, Power, Plus, ChevronLeft, ChevronRight, Eye, Ban, Download, ChevronDown, ChevronUp, Users as UsersIcon } from "lucide-react";
  import { Header } from "@/components/layout/Header";
  import { Card } from "@/components/ui/Card";
  import { Badge } from "@/components/ui/Badge";
  import { Button } from "@/components/ui/Button";
  import { Input, Label, Textarea } from "@/components/ui/Input";
  import { Modal, ConfirmModal } from "@/components/ui/Modal";
  import { useToast } from "@/components/ui/Toast";
  import { Tooltip } from "@/components/ui/Tooltip";
  import { formatDate, formatDateTime } from "@/lib/utils";
  import type { User } from "@/lib/types";
  import { apiFetch, getStoredToken } from "@/lib/api";

  type DetailData = {
    id: number;
    name: string;
    phone: string;
    email?: string;
    is_owner: boolean;
    is_active: boolean;
    suspended_reason?: string;
    suspended_at?: string;
    owned_businesses: { id: number; name: string; business_type: string; is_active: boolean; outlets: { id: number; name: string }[]; subscription?: { status: string; plan_name: string; current_period_end: string } }[];
    last_login_at?: string;
    created_at?: string;
  };

  export default function UsersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [q, setQ] = useState("");
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
    const [suspendUser, setSuspendUser] = useState<User | null>(null);
    const [suspendReason, setSuspendReason] = useState("");
    const [resetUser, setResetUser] = useState<User | null>(null);
    const [newPin, setNewPin] = useState("123456");
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: "", phone: "", email: "", pin: "123456" });
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedOwners, setExpandedOwners] = useState<Set<number>>(new Set());
  const [employeesByBusiness, setEmployeesByBusiness] = useState<Record<number, User[]>>({});
  const [loadingEmployees, setLoadingEmployees] = useState<Record<number, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
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
        if (filterActive === "active") params.set("is_active", "1");
        if (filterActive === "inactive") params.set("is_active", "0");
        const res = await apiFetch<{ data: User[]; meta: { total: number; last_page: number } }>(`/admin/users?${params.toString()}`);
        setUsers(res.data);
        setTotal(res.meta.total);
        setLastPage(res.meta.last_page);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setUsers([]);
        setTotal(0);
        setLastPage(1);
      } finally {
        setLoading(false);
      }
    }, [page, q, filterActive, router]);

    useEffect(() => {
      // ambil id akun sendiri untuk disembunyikan dari list
      if (!currentUserId) {
        apiFetch<{ data: { user: { id: number } } }>(`/admin/auth/me`)
          .then((res) => setCurrentUserId(res.data.user.id))
          .catch(() => {});
      }
    }, [currentUserId]);

    useEffect(() => {
      const t = setTimeout(fetchUsers, q ? 400 : 0);
      return () => clearTimeout(t);
    }, [fetchUsers, q]);

    async function openDetail(u: User) {
      setDetailUser(u);
      setDetailData(null);
      setDetailLoading(true);
      try {
        const res = await apiFetch<{ data: DetailData }>(`/admin/users/${u.id}`);
        setDetailData(res.data);
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      } finally {
        setDetailLoading(false);
      }
    }

    async function doToggleActive() {
      if (!confirmToggle) return;
      const target = confirmToggle;
      setActionLoading(true);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_active: !u.is_active } : u)));
      try {
        await apiFetch(`/admin/users/${target.id}/toggle-active`, { method: "POST" });
        toast(target.is_active ? "User dinonaktifkan" : "User diaktifkan", "success");
        setConfirmToggle(null);
      } catch (e) {
        setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_active: target.is_active } : u)));
        toast(e instanceof Error ? e.message : String(e), "error");
      } finally {
        setActionLoading(false);
      }
    }

    async function doSuspend() {
      if (!suspendUser) return;
      if (suspendUser.is_active) {
        if (suspendReason.trim().length < 5) {
          toast("Alasan suspend minimal 5 karakter", "error");
          return;
        }
        setActionLoading(true);
        try {
          await apiFetch(`/admin/users/${suspendUser.id}/suspend`, { method: "POST", body: JSON.stringify({ reason: suspendReason.trim() }) });
          toast(`User ${suspendUser.name} di-suspend`, "success");
          setSuspendUser(null);
          setSuspendReason("");
          fetchUsers();
        } catch (e) {
          toast(e instanceof Error ? e.message : String(e), "error");
        } finally {
          setActionLoading(false);
        }
      } else {
        // unsuspend
        setActionLoading(true);
        try {
          await apiFetch(`/admin/users/${suspendUser.id}/unsuspend`, { method: "POST" });
          toast(`User ${suspendUser.name} diaktifkan kembali`, "success");
          setSuspendUser(null);
          fetchUsers();
        } catch (e) {
          toast(e instanceof Error ? e.message : String(e), "error");
        } finally {
          setActionLoading(false);
        }
      }
    }

  async function doExport() {
      try {
        toast("Menyiapkan export...", "info");
        const params = new URLSearchParams();
        params.set("per_page", "1000");
        params.set("page", "1");
        if (q) params.set("q", q);
        if (filterActive === "active") params.set("is_active", "1");
        if (filterActive === "inactive") params.set("is_active", "0");
        const res = await apiFetch<{ data: User[] }>(`/admin/users?${params.toString()}`);
        const rows = res.data;
        const header = ["id", "name", "phone", "email", "is_owner", "is_active", "business_name", "total_businesses", "last_login_at", "created_at", "suspended_reason"];
        const csv = [header.join(",")]
          .concat(
            rows.map((u: unknown) => {
              const x = u as Record<string, unknown>;
              return header.map((h) => `"${String(x[h] ?? "").replace(/"/g, '""')}"`).join(",");
            })
          )
          .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `larisk-users-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`Export ${rows.length} user berhasil`, "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      }
    }

    async function doResetPin() {
      if (!resetUser) return;
      if (!/^\d{4,6}$/.test(newPin)) {
        toast("PIN harus 4-6 digit angka", "error");
        return;
      }
      setActionLoading(true);
      try {
        await apiFetch(`/admin/users/${resetUser.id}/reset-pin`, { method: "POST", body: JSON.stringify({ pin: newPin }) });
        toast(`PIN ${resetUser.name} berhasil direset`, "success");
        setResetUser(null);
        setNewPin("123456");
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      } finally {
        setActionLoading(false);
      }
    }

    async function doAddUser() {
      if (!addForm.name.trim() || !addForm.phone.trim() || !addForm.pin.trim()) {
        toast("Nama, phone, dan PIN wajib diisi", "error");
        return;
      }
      if (!/^\d{4,6}$/.test(addForm.pin)) {
        toast("PIN harus 4-6 digit", "error");
        return;
      }
      setActionLoading(true);
      try {
        await apiFetch(`/admin/users`, { method: "POST", body: JSON.stringify({ name: addForm.name.trim(), phone: addForm.phone.trim(), email: addForm.email.trim() || undefined, pin: addForm.pin.trim() }) });
        toast("User berhasil ditambahkan", "success");
        setAddOpen(false);
        setAddForm({ name: "", phone: "", email: "", pin: "123456" });
        fetchUsers();
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      } finally {
        setActionLoading(false);
      }
    }

    async function doEditUser() {
      if (!editUser) return;
      if (!editForm.name.trim() || !editForm.phone.trim()) {
        toast("Nama dan phone wajib diisi", "error");
        return;
      }
      setActionLoading(true);
      try {
        await apiFetch(`/admin/users/${editUser.id}`, { method: "PUT", body: JSON.stringify({ name: editForm.name.trim(), phone: editForm.phone.trim(), email: editForm.email.trim() || null }) });
        toast("User berhasil diupdate", "success");
        setEditUser(null);
        fetchUsers();
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      } finally {
        setActionLoading(false);
      }
    }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name, phone: u.phone, email: u.email || "" });
  }

  async function toggleExpandOwner(owner: User) {
    if (!owner.is_owner || !owner.business_id) {
      toast("Owner belum memiliki toko", "info");
      return;
    }
    const isExpanded = expandedOwners.has(owner.id);
    if (isExpanded) {
      const next = new Set(expandedOwners);
      next.delete(owner.id);
      setExpandedOwners(next);
      return;
    }
    // expand
    const next = new Set(expandedOwners);
    next.add(owner.id);
    setExpandedOwners(next);
    const bid = owner.business_id as number;
    if (employeesByBusiness[bid]) return;
    setLoadingEmployees((p) => ({ ...p, [bid]: true }));
    try {
      const res = await apiFetch<{ data: User[] }>(`/admin/users?business_id=${bid}&is_owner=false&per_page=50`);
      setEmployeesByBusiness((p) => ({ ...p, [bid]: res.data }));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoadingEmployees((p) => ({ ...p, [bid]: false }));
    }
  }

  const displayedUsers = currentUserId ? users.filter((u) => u.id !== currentUserId) : users;

    return (
    <div className="min-w-0">
      <Header title="Kelola User" subtitle="Detail, suspend, export — kelola user toko dengan baik" />
        <div className="space-y-4 p-4 sm:p-6 max-w-[1600px] mx-auto">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input placeholder="Cari nama / no HP / email..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
                </div>
                <select
                  value={filterActive}
                  onChange={(e) => { setFilterActive(e.target.value as never); setPage(1); }}
                  className="h-9 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="all">Semua status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={doExport}>
                  <Download className="h-4 w-4 mr-1.5" /> Export CSV
                </Button>
                <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1.5" /> Tambah User
                </Button>
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-600 mt-3">
              {loading ? "Memuat..." : `${total} user`} • Hal {page}/{lastPage}
            </p>
            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-red-800">Gagal memuat user</p>
                <p className="text-xs text-red-700 break-words mt-1">{error}</p>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left">
                  <tr className="border-b border-zinc-200">
                    <th className="px-4 py-3 text-xs font-semibold text-zinc-700">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Bisnis</th>
                    <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Last Login</th>
                    <th className="px-4 py-3 text-xs font-semibold text-zinc-700 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((u) => {
                    const suspended = !(u as unknown as { is_active: boolean }).is_active && (u as unknown as { suspended_reason?: string }).suspended_reason;
                    const isExpanded = expandedOwners.has(u.id);
                    const bid = (u as unknown as { business_id?: number }).business_id;
                    const employees = bid ? employeesByBusiness[bid] || [] : [];
                    const isLoadingEmp = bid ? !!loadingEmployees[bid] : false;
                    return (
                      <React.Fragment key={u.id}>
                        <tr className="border-t border-zinc-100 hover:bg-zinc-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              {u.is_owner && u.business_id && (
                                <button
                                  onClick={() => toggleExpandOwner(u)}
                                  className="mt-0.5 h-6 w-6 inline-flex items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-white hover:border-zinc-300 shrink-0"
                                  title={isExpanded ? "Tutup karyawan" : "Lihat karyawan"}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              <div className="min-w-0 flex-1">
                                <button onClick={() => openDetail(u)} className="text-left hover:underline block">
                                  <p className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
                                    {u.name}
                                    {u.is_owner && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded-full">OWNER</span>}
                                  </p>
                                </button>
                                <p className="font-mono text-xs text-zinc-600 mt-0.5">{u.phone}</p>
                                {u.email && <p className="text-xs text-zinc-500">{u.email}</p>}
                                {suspended && <p className="text-xs text-red-600 mt-1">Alasan: {(u as unknown as { suspended_reason: string }).suspended_reason}</p>}
                                {u.is_owner && u.business_id && (
                                  <button onClick={() => toggleExpandOwner(u)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900">
                                    <UsersIcon className="h-3 w-3" />
                                    {isExpanded ? "Sembunyikan karyawan" : `Lihat karyawan (${employees.length || "?"})`}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-700">
                            {u.business_name || <span className="text-zinc-400">-</span>}
                            {u.total_businesses ? <span className="text-zinc-500"> • {u.total_businesses} bisnis</span> : ""}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={u.is_owner ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-100 text-zinc-800 border-zinc-300"}>{u.is_owner ? "Owner" : "Karyawan"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={u.is_active ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-red-100 text-red-800 border-red-300"}>{u.is_active ? "Aktif" : "Suspended"}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDateTime(u.last_login_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Tooltip content="Lihat detail user">
                                <button onClick={() => openDetail(u)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Edit user">
                                <button onClick={() => openEdit(u)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Reset PIN">
                                <button onClick={() => setResetUser(u)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                                  <KeyRound className="h-4 w-4" />
                                </button>
                              </Tooltip>
                              <Tooltip content={u.is_active ? "Suspend user" : "Aktifkan kembali"}>
                                <button
                                  onClick={() => setSuspendUser(u)}
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50"
                                >
                                  {u.is_active ? <Ban className="h-4 w-4 text-zinc-600" /> : <Power className="h-4 w-4 text-zinc-600" />}
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                        {u.is_owner && isExpanded && (
                          <tr key={`${u.id}-expanded`}>
                            <td colSpan={6} className="bg-zinc-50/70 px-4 py-3">
                              <div className="ml-8 border-l-2 border-zinc-200 pl-4">
                                <p className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
                                  <UsersIcon className="h-3.5 w-3.5" /> Karyawan — {u.business_name || `Toko #${bid}`} {employees.length ? `(${employees.length})` : ""}
                                </p>
                                {isLoadingEmp ? (
                                  <p className="text-xs text-zinc-500 py-2">Memuat karyawan...</p>
                                ) : employees.length === 0 ? (
                                  <p className="text-xs text-zinc-500 py-2">Belum ada karyawan untuk toko ini.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {employees.map((emp) => (
                                      <div key={emp.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-zinc-200 px-3 py-2">
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-zinc-900 truncate">{emp.name}</p>
                                          <p className="text-xs text-zinc-500 font-mono">{emp.phone} {emp.email ? `• ${emp.email}` : ""}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <Badge className={emp.is_active ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-red-100 text-red-800 border-red-300"}>{emp.is_active ? "Aktif" : "Nonaktif"}</Badge>
                                          <span className="text-xs text-zinc-500 hidden sm:block">{formatDateTime(emp.last_login_at)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {displayedUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <p className="text-sm font-medium text-zinc-700">Tidak ada user ditemukan.</p>
                        <p className="text-xs text-zinc-500 mt-1">Coba ubah filter atau tambah user baru.</p>
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">
                        Memuat data user...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 bg-zinc-50">
              <p className="text-xs font-medium text-zinc-700">Total {total} user • Halaman {page} dari {lastPage}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Drawer */}
        <Modal
          open={!!detailUser}
          onClose={() => setDetailUser(null)}
          title={`Detail User — ${detailUser?.name}`}
          description={`${detailUser?.phone} • ${detailUser?.email || "-"}`}
          footer={<Button variant="outline" size="sm" onClick={() => setDetailUser(null)}>Tutup</Button>}
        >
          {detailLoading ? (
            <p className="text-sm text-zinc-600 py-8 text-center">Memuat detail...</p>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-zinc-50 p-3 border">
                  <p className="text-xs text-zinc-500">Status</p>
                  <p className={`text-sm font-bold ${detailData.is_active ? "text-emerald-700" : "text-red-700"}`}>{detailData.is_active ? "Aktif" : "Suspended"}</p>
                  {detailData.suspended_reason && <p className="text-xs text-red-600 mt-1">Alasan: {detailData.suspended_reason}</p>}
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border">
                  <p className="text-xs text-zinc-500">Last Login</p>
                  <p className="text-sm font-medium text-zinc-900">{formatDateTime(detailData.last_login_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-700 mb-2">Bisnis Dimiliki ({detailData.owned_businesses.length})</p>
                {detailData.owned_businesses.length === 0 ? (
                  <p className="text-xs text-zinc-500">Tidak ada bisnis.</p>
                ) : (
                  <div className="space-y-2">
                    {detailData.owned_businesses.map((b) => (
                      <div key={b.id} className="rounded-xl border border-zinc-200 p-3">
                        <p className="text-sm font-semibold text-zinc-900">{b.name}</p>
                        <p className="text-xs text-zinc-500">{b.business_type} • {b.is_active ? "Aktif" : "Nonaktif"}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={b.subscription?.status === "active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-zinc-100 text-zinc-700 border-zinc-200"}>{b.subscription?.plan_name || "-"} • {b.subscription?.status || "-"}</Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{b.outlets.length} outlet • Periode {b.subscription?.current_period_end ? formatDate(b.subscription.current_period_end) : "-"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-zinc-500 space-y-1 border-t pt-3">
                <p>Dibuat: {formatDate(detailData.created_at)}</p>
                <p>ID: {detailData.id}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Gagal memuat.</p>
          )}
        </Modal>

        <ConfirmModal
          open={!!confirmToggle}
          onClose={() => setConfirmToggle(null)}
          onConfirm={doToggleActive}
          title={confirmToggle?.is_active ? "Nonaktifkan user?" : "Aktifkan user?"}
          description={`${confirmToggle?.name} (${confirmToggle?.phone}) akan ${confirmToggle?.is_active ? "dinonaktifkan" : "diaktifkan kembali"}.`}
          confirmLabel={confirmToggle?.is_active ? "Nonaktifkan" : "Aktifkan"}
          variant={confirmToggle?.is_active ? "danger" : "primary"}
          loading={actionLoading}
        />

        <Modal
          open={!!suspendUser}
          onClose={() => { setSuspendUser(null); setSuspendReason(""); }}
          title={suspendUser?.is_active ? `Suspend ${suspendUser?.name}` : `Unsuspend ${suspendUser?.name}`}
          description={suspendUser?.is_active ? "Tulis alasan suspend — user tidak bisa login sampai di-unsuspend." : "User akan diaktifkan kembali dan suspended_reason dihapus."}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => { setSuspendUser(null); setSuspendReason(""); }}>
                Batal
              </Button>
              <Button size="sm" onClick={doSuspend} disabled={actionLoading} variant={suspendUser?.is_active ? "danger" : "primary"}>
                {actionLoading ? "Memproses..." : suspendUser?.is_active ? "Suspend" : "Unsuspend"}
              </Button>
            </>
          }
        >
          {suspendUser?.is_active ? (
            <div className="space-y-3">
              <Label>Alasan Suspend *</Label>
              <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Misal: Spam, fraud, tunggakan 30 hari..." rows={3} />
              <p className="text-xs text-zinc-500">Minimal 5 karakter.</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Yakin unsuspend {suspendUser?.name}?</p>
          )}
        </Modal>

        <Modal
          open={!!resetUser}
          onClose={() => setResetUser(null)}
          title={`Reset PIN — ${resetUser?.name}`}
          description="Masukkan PIN baru 4-6 digit. PIN lama akan diganti."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setResetUser(null)}>
                Batal
              </Button>
              <Button size="sm" onClick={doResetPin} disabled={actionLoading}>
                {actionLoading ? "Menyimpan..." : "Simpan PIN"}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <Label>PIN Baru</Label>
            <Input value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="123456" maxLength={6} inputMode="numeric" />
            <p className="text-xs text-zinc-500">4-6 digit angka.</p>
          </div>
        </Modal>

        <Modal
          open={!!editUser}
          onClose={() => setEditUser(null)}
          title={`Edit User — ${editUser?.name}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditUser(null)}>
                Batal
              </Button>
              <Button size="sm" onClick={doEditUser} disabled={actionLoading}>
                {actionLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" />
            </div>
            <div className="space-y-2">
              <Label>No HP</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="081234567890" />
            </div>
            <div className="space-y-2">
              <Label>Email (opsional)</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="user@email.com" type="email" />
            </div>
          </div>
        </Modal>

        <Modal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Tambah User Baru"
          description="Buat akun owner baru untuk toko"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={doAddUser} disabled={actionLoading}>
                {actionLoading ? "Menyimpan..." : "Tambah User"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama *</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder="Budi Santoso" />
            </div>
            <div className="space-y-2">
              <Label>No HP *</Label>
              <Input value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} placeholder="081234567890" />
            </div>
            <div className="space-y-2">
              <Label>Email (opsional)</Label>
              <Input value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="budi@email.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>PIN * (4-6 digit)</Label>
              <Input value={addForm.pin} onChange={(e) => setAddForm((p) => ({ ...p, pin: e.target.value }))} placeholder="123456" maxLength={6} inputMode="numeric" />
            </div>
          </div>
        </Modal>
      </div>
    );
  }
