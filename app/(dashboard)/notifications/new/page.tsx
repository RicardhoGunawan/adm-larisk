"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Building2, 
  Users, 
  Store, 
  X,
  Loader2
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { QuillEditor } from "@/components/ui/QuillEditor";
import { apiFetch, getStoredToken } from "@/lib/api";
import Link from "next/link";

function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ") // ganti penutup blok dengan spasi biar kata tidak nempel
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NewNotificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "business">("all");
  const [businessId, setBusinessId] = useState("");
  const [businessSearch, setBusinessSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [businesses, setBusinesses] = useState<{ id: number; name: string; owner_name: string }[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (audience !== "business" || businesses.length > 0) return;
    setLoadingBusinesses(true);
    apiFetch<{ data: { id: number; name: string; owner_name: string }[] }>(`/admin/businesses?per_page=100`)
      .then((res) => setBusinesses(res.data))
      .catch(() => {})
      .finally(() => setLoadingBusinesses(false));
  }, [audience, businesses.length]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast("Gambar maksimal 2MB", "error");
      return;
    }
    const r = new FileReader();
    r.onload = () => setImagePreview(r.result as string);
    r.readAsDataURL(file);
  };

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const textOnly = stripHtml(body);
    if (!title.trim() || !textOnly) {
      toast("Judul dan pesan wajib diisi", "error");
      return;
    }
    if (audience === "business" && !businessId) {
      toast("Pilih toko tujuan terlebih dahulu", "error");
      return;
    }
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        // body: plain text -> dipakai untuk push notification tray & preview list di mobile
        body: textOnly,
        // body_html: HTML asli dari Quill -> dipakai untuk render rich text di halaman detail mobile
        body_html: body.trim(),
        audience,
        business_id: audience === "business" && businessId ? Number(businessId) : undefined,
        type: "announcement",
      };
      if (imagePreview) payload.image = imagePreview;
      const res = await apiFetch<{ meta?: { sent: number; devices: number } }>(`/admin/notifications`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast(`Terkirim — ${res?.meta?.devices ?? 0} device • ${res?.meta?.sent ?? 0} terkirim`, "success");
      router.push("/notifications");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), "error");
    } finally {
      setSending(false);
    }
  }

  const selectedBusiness = businesses.find((b) => String(b.id) === businessId);

  return (
    <div className="min-w-0 pb-12">
      <Header title="Buat Notifikasi Baru" subtitle="Tulis pesan broadcast & pilih penerima target" />

      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        
        <Link 
          href="/notifications" 
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
        </Link>

        <Card className="p-6 sm:p-8 lg:p-12 shadow-sm border border-zinc-200/80 rounded-2xl bg-white">
          <form onSubmit={onSend} className="space-y-8">
            
            {/* Target Penerima */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-zinc-900">
                Target Penerima <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAudience("all");
                    setBusinessId("");
                    setBusinessSearch("");
                  }}
                  className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                    audience === "all"
                      ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${audience === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-zinc-900">Semua Pengguna</div>
                    <div className="text-xs sm:text-sm text-zinc-500 mt-0.5">Broadcast global ke seluruh pengguna aplikasi</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudience("business")}
                  className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                    audience === "business"
                      ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${audience === "business" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-zinc-900">Toko Spesifik</div>
                    <div className="text-xs sm:text-sm text-zinc-500 mt-0.5">Kirim notifikasi terbatas ke satu toko pilihan</div>
                  </div>
                </button>
              </div>

              {audience === "business" && (
                <div className="pt-2 space-y-2 relative" ref={dropdownRef}>
                  <Label className="text-sm font-medium text-zinc-700">Pilih Toko Tujuan <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none z-10" />
                    <Input
                      value={
                        selectedBusiness
                          ? `${selectedBusiness.name} — ${selectedBusiness.owner_name}`
                          : businessSearch
                      }
                      onChange={(e) => {
                        setBusinessSearch(e.target.value);
                        setShowDropdown(true);
                        if (businessId) setBusinessId("");
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder={loadingBusinesses ? "Memuat daftar toko..." : "Cari nama toko / pemilik..."}
                      className="pl-10 pr-9 py-3 rounded-xl border-zinc-200 focus:border-zinc-900 text-sm"
                    />
                    {loadingBusinesses ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
                    ) : (selectedBusiness || businessSearch) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setBusinessId("");
                          setBusinessSearch("");
                          setShowDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-30 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-xl max-h-60 overflow-y-auto divide-y divide-zinc-100">
                      {businesses
                        .filter((b) => {
                          const q = businessSearch.toLowerCase();
                          if (!q) return true;
                          return b.name.toLowerCase().includes(q) || b.owner_name.toLowerCase().includes(q);
                        })
                        .map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setBusinessId(String(b.id));
                              setBusinessSearch("");
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-50 flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="text-sm font-medium text-zinc-900">{b.name}</div>
                              <div className="text-xs text-zinc-500">Pemilik: {b.owner_name}</div>
                            </div>
                            <span className="text-[11px] font-mono bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md">ID #{b.id}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="border-zinc-100" />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold text-zinc-900">
                  Judul Notifikasi <span className="text-rose-500">*</span>
                </Label>
                <span className="text-xs text-zinc-400 font-mono">{title.length}/80</span>
              </div>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Contoh: Promo Flash Sale Cashback 50% Hari Ini!" 
                maxLength={80} 
                required 
                className="rounded-xl py-3 text-sm border-zinc-200 focus:border-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold text-zinc-900">
                  Pesan <span className="text-rose-500">*</span>
                </Label>
                <span className="text-xs text-zinc-400 font-mono">{stripHtml(body).length}/5000</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-zinc-200 focus-within:border-zinc-900 transition-colors min-h-[340px]">
                <QuillEditor 
                  value={body} 
                  onChange={setBody} 
                  placeholder="Tuliskan isi pesan atau pengumuman di sini..." 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-zinc-900">Gambar (Opsional)</Label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-900/5">
                  <img src={imagePreview} alt="Preview Upload" className="w-full max-h-96 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }} 
                      className="h-10 w-10 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-lg hover:bg-rose-50 transition-transform transform hover:scale-105"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileRef.current?.click()} 
                  className="group cursor-pointer rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 p-8 text-center transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500 group-hover:bg-zinc-200 transition-colors">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 mt-3">Klik untuk upload gambar</p>
                  <p className="text-xs text-zinc-400 mt-1">Maksimal 2MB — Format JPG atau PNG</p>
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-white border border-zinc-200 shadow-sm text-xs font-semibold text-zinc-700 group-hover:border-zinc-300"
                  >
                    <Upload className="h-4 w-4" /> Pilih File
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/notifications")} 
                className="px-6 rounded-xl h-11 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={sending} 
                className="px-8 rounded-xl h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Kirim Notifikasi
                  </>
                )}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
}