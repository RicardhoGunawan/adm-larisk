"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, Users, Store, Receipt, Bell, LogOut, Menu, X, User, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { apiFetch, getStoredToken } from "@/lib/api";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Kelola User", icon: Users },
  { href: "/stores", label: "Daftar Toko", icon: Store },
  { href: "/billing", label: "Tagihan", icon: Receipt },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("larisk_sidebar_collapsed");
    if (v === "1") setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("larisk_sidebar_collapsed", next ? "1" : "0");
  };

  return (
    <>
      <aside className={cn("hidden shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex h-screen sticky top-0 self-start transition-all duration-300", collapsed ? "w-[72px]" : "w-[260px]")}>
        <div className={cn("flex h-16 items-center border-b border-zinc-200", collapsed ? "justify-center px-2" : "gap-3 px-6")}>
          <Image src="/larisk-logo.png" alt="LarisK" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1 border border-zinc-200" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none text-zinc-900">LarisK</p>
            </div>
          )}
        </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const content = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl text-sm font-semibold transition-colors",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600")}>
                <Icon className="h-4 w-4" />
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={item.href} content={item.label}>
              {content}
            </Tooltip>
          ) : (
            content
          );
        })}
      </nav>

      </aside>

      {/* Tombol bulat di luar sidebar — fixed biar tidak kepotong overflow */}
      <button
        onClick={toggle}
        className="hidden lg:flex fixed top-8 z-20 h-7 w-7 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 shadow-md hover:bg-zinc-50 hover:text-zinc-900 transition-all"
        style={{ left: collapsed ? 58 : 246 }}
        title={collapsed ? "Expand" : "Collapse"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const { toast } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getStoredToken()) return;
    apiFetch<{ data: { user: { name: string; email: string } } }>(`/admin/auth/me`)
      .then((res) => setUser(res.data.user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doLogout = () => {
    localStorage.removeItem("larisk_admin_token");
    toast("Berhasil logout", "success");
    setTimeout(() => (window.location.href = "/login"), 400);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <>
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="relative" ref={avatarRef}>
          <button onClick={() => setAvatarOpen((v) => !v)} className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-1 pr-2 py-1 hover:bg-zinc-50">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">{initial}</span>
            <ChevronDown className={`h-3 w-3 text-zinc-500 transition ${avatarOpen ? "rotate-180" : ""}`} />
          </button>
          {avatarOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
              <div className="p-3 border-b border-zinc-100">
                <p className="text-sm font-bold text-zinc-900 truncate flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-500" />
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user?.email || "admin@larisk.id"}</p>
              </div>
              <div className="p-2">
                <button onClick={() => { setAvatarOpen(false); setConfirmLogout(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div className="w-[300px] bg-white border-r border-zinc-200 flex flex-col shadow-2xl">
            <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5 bg-zinc-50/50">
              <Image src="/larisk-logo.png" alt="LarisK" width={44} height={44} className="h-11 w-11 rounded-xl bg-white object-contain p-1 border border-zinc-200 shadow-sm shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-none text-zinc-900">LarisK </p>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                      active ? "bg-zinc-900 text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent hover:border-zinc-200"
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-colors", active ? "bg-white/20 text-white" : "bg-white border border-zinc-200 text-zinc-600 shadow-sm")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
              <p className="text-xs text-zinc-500 text-center">© 2026 LarisK</p>
            </div>
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={doLogout}
        title="Keluar dari dashboard?"
        description="Sesi akan diakhiri dan kamu perlu login kembali."
        confirmLabel="Logout"
        variant="danger"
      />
    </>
  );
}
