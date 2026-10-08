"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { useMe } from "@/lib/use-admin";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/toast";
import { toggleSidebar, useSidebarCollapsed } from "@/lib/sidebar";
import { cn } from "@/lib/utils";

/**
 * Bar atas ramping (h-16): hanya tombol sidebar + aksi + profil.
 * Judul halaman tampil di area konten (bukan di bar) + tanpa breadcrumb.
 */
export function PageHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  const me = useMe();
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const collapsed = useSidebarCollapsed();
  const initial = me?.name?.charAt(0)?.toUpperCase() || "A";
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {/* Bar atas: hanya di laptop, dikunci */}
      <div
        className={cn(
          "hidden border-b border-zinc-200 bg-white transition-[left] duration-200 ease-in-out lg:fixed lg:right-0 lg:top-0 lg:z-30 lg:block lg:h-16",
          collapsed ? "lg:left-[76px]" : "lg:left-[272px]"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 pl-2 pr-4 sm:pr-6 lg:pr-8">
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 xl:block">
              {today}
            </span>
            <button
              onClick={() => setConfirm(true)}
              className="hidden h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2.5 hover:bg-zinc-50 sm:flex"
              title={me?.name || "Akun"}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                {initial}
              </span>
              <span className="max-w-[110px] truncate text-[13px] font-semibold text-zinc-800">{me?.name || "Pemilik"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Judul halaman + tombol aksi: di area konten */}
      <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 lg:text-2xl">{title}</h1>
            {desc && <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{desc}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          localStorage.removeItem("larisk_admin_token");
          toast("Berhasil keluar", "success");
          setTimeout(() => router.push("/login"), 300);
        }}
        title="Keluar dari panel?"
        description="Anda harus masuk lagi untuk mengelola toko."
        confirmLabel="Keluar"
        variant="danger"
      />
    </>
  );
}

// Kompat: Header lama
export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return <PageHeader title={title} desc={subtitle} />;
}
