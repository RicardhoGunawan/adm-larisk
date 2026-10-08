import { DashboardShell } from "@/components/layout/Shell";

/**
 * Di laptop: sidebar & topbar dikunci (fixed), hanya <main> yang scroll.
 * Offset: sidebar 272px (atau 76px saat diciutkan), topbar h-16.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
