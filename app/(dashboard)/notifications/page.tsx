"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  BellRing, 
  Users, 
  Plus, 
  Search, 
  RefreshCw, 
  Store, 
  Calendar, 
  Image as ImageIcon,
  ChevronRight,
  Send
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, getStoredToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SentItem = {
  id: string;
  title: string;
  body: string;
  audience: string;
  business_name?: string;
  business_id?: number;
  created_at: string;
  data?: { image?: string };
  image?: string;
};

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<SentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: SentItem[] }>(`/admin/notifications?per_page=50`);
      setHistory(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = history.filter((h) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      h.title.toLowerCase().includes(s) || 
      h.body.toLowerCase().includes(s) ||
      (h.business_name && h.business_name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-w-0 pb-12">
      <Header title="Notifikasi" subtitle="Kelola dan pantau riwayat notifikasi terkirim" />

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
        
        {/* Header Action & Search Bar */}
        <Card className="p-4 sm:p-5 shadow-sm border border-zinc-200/80 rounded-2xl bg-white">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Cari berdasarkan judul, isi pesan, atau nama toko..." 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="pl-10 rounded-xl text-sm border-zinc-200 focus:border-zinc-900" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadHistory} 
                disabled={loading}
                className="rounded-xl h-10 px-4 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Link href="/notifications/new">
                <Button size="sm" className="rounded-xl h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
                  <Plus className="h-4 w-4 mr-2" /> Buat Notifikasi
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-3">
              <div className="text-red-700 text-xs flex-1">
                <p className="font-semibold">Gagal memuat data notifikasi</p>
                <p className="mt-0.5 break-words">{error}</p>
              </div>
            </div>
          )}
        </Card>

        {/* List Content Container */}
        <Card className="overflow-hidden p-0 shadow-sm border border-zinc-200/80 rounded-2xl bg-white">
          {loading ? (
            /* Loading State Skeleton List */
            <div className="divide-y divide-zinc-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 sm:p-5 flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-100 rounded w-1/3" />
                    <div className="h-3 bg-zinc-100 rounded w-2/3" />
                  </div>
                  <div className="h-6 w-24 bg-zinc-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-3">
                <BellRing className="h-7 w-7" />
              </div>
              <p className="text-base font-semibold text-zinc-800">{q ? "Notifikasi tidak ditemukan" : "Belum ada notifikasi"}</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {q ? "Coba sesuaikan kata kunci pencarian Anda." : "Buat dan kirimkan notifikasi pertama Anda kepada pengguna atau toko."}
              </p>
              {!q && (
                <Link href="/notifications/new" className="inline-block mt-5">
                  <Button size="sm" className="rounded-xl h-10 px-5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
                    <Plus className="h-4 w-4 mr-2" /> Buat Notifikasi Baru
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            /* Data List View */
            <div className="divide-y divide-zinc-100">
              {filtered.map((item) => {
                const img = item.image || item.data?.image;
                const plainTextBody = stripHtml(item.body);

                return (
                  <div 
                    key={item.id} 
                    className="p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Info Utama: Gambar + Judul + Pesan */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Media Image / Icon Placeholder */}
                      {img ? (
                        <div 
                          onClick={() => setSelectedImage(img)}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-zinc-200 shrink-0 cursor-pointer group relative bg-zinc-100"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center shrink-0 text-zinc-400">
                          <BellRing className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 truncate">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                          {plainTextBody}
                        </p>
                      </div>
                    </div>

                    {/* Metadata: Audience & Tanggal */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                      
                      {/* Target Audience Badge */}
                      <div>
                        {item.audience === "all" ? (
                          <Badge className="bg-zinc-100 text-zinc-800 border-zinc-200 text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-zinc-500" /> Semua User
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200/80 text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-blue-600" /> {item.business_name || `Toko #${item.business_id}`}
                          </Badge>
                        )}
                      </div>

                      {/* Waktu Terkirim */}
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium min-w-[110px] justify-end">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        {new Date(item.created_at).toLocaleDateString("id-ID", { 
                          day: "2-digit", 
                          month: "short", 
                          year: "numeric" 
                        })}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Stats */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3.5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>Menampilkan {filtered.length} dari {history.length} notifikasi</span>
              <span>Diurutkan berdasarkan yang terbaru</span>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Lightbox Gambar (Jika Thumbnail Diklik) */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <img src={selectedImage} alt="Large Preview" className="w-full max-h-[80vh] object-contain bg-zinc-950" />
            <div className="p-3 text-center text-xs text-zinc-500 bg-white">
              Klik di mana saja untuk menutup
            </div>
          </div>
        </div>
      )}

    </div>
  );
}