import { Sidebar, MobileNav } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileNav />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-zinc-50">{children}</main>
      </div>
    </div>
  );
}
