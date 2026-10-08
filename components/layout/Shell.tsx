"use client";

import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { useSidebarCollapsed } from "@/lib/sidebar";
import { cn } from "@/lib/utils";

/** Cangkang + offset konten mengikuti lebar sidebar (penuh / ciut). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarCollapsed();
  return (
    <div className="min-h-screen bg-zinc-100">
      <MobileNav />
      <Sidebar />
      {/* pb untuk ruang navigasi bawah di HP */}
      <main
        className={cn(
          "min-w-0 pb-10 transition-[margin] duration-200 ease-in-out lg:pb-12 lg:pt-16",
          collapsed ? "lg:ml-[76px]" : "lg:ml-[272px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
