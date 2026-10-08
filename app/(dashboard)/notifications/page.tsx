"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Megaphone, Users, Store, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { AnnouncementDialog } from "@/components/AnnouncementDialog";
import { useToast } from "@/components/ui/Toast";
import { formatTanggal } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Item = {
  id: string;
  title: string;
  body: string;
  audience: string;
  business_name?: string;
  business_id?: number;
  created_at: string;
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Item[] }>(`/admin/notifications?per_page=50`);
      setList(res.data);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = list.filter((h) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return h.title.toLowerCase().includes(s) || h.body.toLowerCase().includes(s) || (h.business_name || "").toLowerCase().includes(s);
  });

  return (
    <div className="min-w-0">
      <PageHeader
        title="Pengumuman"
        desc="Info yang pernah dikirim ke toko"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus /> Buat baru</Button>
        }
      />

      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <Card>
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari judul atau isi pengumuman..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} /> Muat ulang
            </Button>
            <Button className="w-full sm:hidden" onClick={() => setModalOpen(true)}><Plus /> Buat pengumuman</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            {loading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat...</p>}
            {!loading && filtered.length === 0 && (
              <Empty
                icon={Megaphone}
                title={q ? "Tidak ketemu" : "Belum ada pengumuman"}
                hint={q ? "Coba kata kunci lain." : "Buat pengumuman pertama untuk memberi info ke toko."}
                action={!q ? <Button size="sm" onClick={() => setModalOpen(true)}><Plus /> Buat pengumuman</Button> : undefined}
              />
            )}
            <div className="space-y-2">
              {filtered.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Megaphone className="h-[18px] w-[18px] text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{plain(item.body)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t pt-2 sm:border-0 sm:pt-0">
                    {item.audience === "all" ? (
                      <Badge variant="muted"><Users className="h-3 w-3" /> Semua toko</Badge>
                    ) : (
                      <Badge variant="info"><Store className="h-3 w-3" /> {item.business_name || `Toko #${item.business_id}`}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatTanggal(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            {!loading && filtered.length > 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {filtered.length} dari {list.length} pengumuman · terbaru paling atas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AnnouncementDialog open={modalOpen} onClose={() => setModalOpen(false)} onSent={load} />
    </div>
  );
}

function plain(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
