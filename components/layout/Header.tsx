"use client";

import { useEffect, useState, useRef } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/Modal";
import { apiFetch, getStoredToken } from "@/lib/api";

type MeUser = { name: string; email: string };

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!getStoredToken()) return;
    apiFetch<{ data: { user: MeUser } }>(`/admin/auth/me`)
      .then((res) => setUser(res.data.user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
      <div
        className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:py-5"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl truncate">{title}</h1>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-600 sm:text-sm leading-relaxed line-clamp-2">{subtitle}</p>}
          </div>

          {/* Sembunyikan avatar/profile sepenuhnya di layar mobile (< lg) */}
          <div className="relative shrink-0 hidden lg:block" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white pl-1 pr-2 py-1 hover:bg-zinc-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">{initial}</span>
              <span className="text-xs font-semibold text-zinc-700 max-w-[120px] truncate">{user?.name || ""}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden z-20">
                <div className="p-4 border-b border-zinc-100">
                  <p className="text-sm font-bold text-zinc-900 truncate flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-500" />
                    {user?.name || ""}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-1">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={doLogout}
        title="Keluar dari dashboard?"
        description="Sesi akan diakhiri dan kamu perlu login kembali."
        confirmLabel="Keluar"
        variant="danger"
      />
    </>
  );
}