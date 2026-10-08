"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { useMe } from "@/lib/use-admin";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, getStoredToken } from "@/lib/api";
import { hydrateSidebarState, useSidebarCollapsed } from "@/lib/sidebar";

function useLogout() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const doLogout = () => {
    localStorage.removeItem("larisk_admin_token");
    toast("Berhasil keluar", "success");
    setTimeout(() => router.push("/login"), 300);
  };
  return { confirm, setConfirm, doLogout };
}

/** Angka kecil di menu: tagihan belum bayar & toko bermasalah */
function useMenuBadges() {
  const [badges, setBadges] = useState<{ billing: number; stores: number }>({ billing: 0, stores: 0 });
  useEffect(() => {
    if (!getStoredToken()) return;
    apiFetch<{ data: { pending_invoices: number; expired_subscriptions: number } }>(`/admin/stats`)
      .then((r) => setBadges({ billing: r.data.pending_invoices ?? 0, stores: r.data.expired_subscriptions ?? 0 }))
      .catch(() => {});
  }, []);
  return badges;
}

const MAIN = NAV.slice(0, 4);
const MORE = NAV.slice(4);

/**
 * Isi sidebar yang SAMA untuk laptop & HP (1 desain):
 * seksi menu + badge angka. Di laptop bisa diciutkan, di HP tampil penuh.
 */
function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const badges = useMenuBadges();

  const badgeFor = (href: string) => {
    if (href === "/billing" && badges.billing > 0) return badges.billing;
    if (href === "/stores" && badges.stores > 0) return badges.stores;
    return 0;
  };

  const link = (item: (typeof NAV)[number]) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    const n = badgeFor(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-primary font-semibold text-primary-foreground shadow-sm"
            : "font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && (
          <span className="min-w-0 flex-1 whitespace-nowrap">
            <span className="block leading-tight">{item.label}</span>
            <span className={cn("mt-0.5 block truncate text-[11px] font-normal leading-tight", active ? "text-primary-foreground/70" : "text-zinc-400")}>
              {item.desc}
            </span>
          </span>
        )}
        {!collapsed && n > 0 && (
          <span
            className={cn(
              "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
              active ? "bg-white/25 text-white" : "bg-red-100 text-red-700"
            )}
          >
            {n > 99 ? "99+" : n}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
      <div>
        {!collapsed && (
          <p className="whitespace-nowrap px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            Menu utama
          </p>
        )}
        <div className="space-y-1">{MAIN.map(link)}</div>
      </div>
      <div>
        {!collapsed && (
          <p className="whitespace-nowrap px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            Lainnya
          </p>
        )}
        <div className="space-y-1">{MORE.map(link)}</div>
      </div>
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 px-5",
        collapsed && "justify-center px-0"
      )}
    >
      <Image
        src="/larisk-logo.png"
        alt="LarisK"
        width={38}
        height={38}
        className="h-[38px] w-[38px] shrink-0 rounded-[10px] border border-zinc-200 bg-white object-contain"
      />
      {!collapsed && (
        <div className="min-w-0 whitespace-nowrap">
          <p className="text-[15px] font-bold leading-none tracking-tight">LarisK</p>
          <p className="mt-1 text-[11px] font-medium leading-none text-zinc-500">Panel Pemilik Bisnis</p>
        </div>
      )}
    </Link>
  );
}

/** Sidebar laptop: dikunci (fixed), bisa diciutkan jadi ikon saja. */
export function Sidebar() {
  const collapsed = useSidebarCollapsed();

  useEffect(() => {
    hydrateSidebarState();
  }, []);

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 hidden flex-col overflow-hidden border-r border-zinc-200 bg-white transition-[width] duration-200 ease-in-out lg:flex",
        collapsed ? "w-[76px]" : "w-[272px]"
      )}
    >
      <Brand collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}

/**
 * HP: bar atas + sidebar drawer geser dari kiri — isi SAMA dengan laptop.
 * Tidak ada lagi navbar bawah yang berbeda desain.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const me = useMe();
  const { confirm, setConfirm, doLogout } = useLogout();
  const initial = me?.name?.charAt(0)?.toUpperCase() || "A";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <>
      <div className="sticky top-0 z-20 flex h-14 items-center gap-2.5 border-b border-zinc-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1" />
        <button
          onClick={() => setConfirm(true)}
          aria-label="Keluar"
          title={me?.name || "Keluar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white"
        >
          {initial}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="overlay-enter absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="drawer-enter absolute bottom-0 left-0 top-0 flex w-[280px] max-w-[85vw] flex-col overflow-hidden bg-white shadow-xl">
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 px-4">
              <Image src="/larisk-logo.png" alt="LarisK" width={30} height={30} className="h-8 w-8 rounded-lg border border-zinc-200 bg-white object-contain" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-none">LarisK</p>
                <p className="mt-0.5 text-[11px] leading-none text-zinc-500">Panel Pemilik Bisnis</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav collapsed={false} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={doLogout}
        title="Keluar dari panel?"
        description="Anda harus masuk lagi untuk mengelola toko."
        confirmLabel="Keluar"
        variant="danger"
      />
    </>
  );
}
