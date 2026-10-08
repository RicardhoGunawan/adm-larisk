"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Megaphone, Store, Trash2, Users } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { QuillEditor } from "@/components/ui/QuillEditor";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

type StoreOpt = { id: number; name: string; owner_name: string };

/** Modal tulis & kirim pengumuman — standar shadcn, editor Quill tetap dipakai. */
export function AnnouncementDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "one">("all");
  const [storeQ, setStoreQ] = useState("");
  const [stores, setStores] = useState<StoreOpt[]>([]);
  const [storeId, setStoreId] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Muat daftar toko saat memilih tujuan satu toko / saat mencari
  useEffect(() => {
    if (!open || target !== "one") return;
    let cancel = false;
    apiFetch<{ data: StoreOpt[] }>(
      `/admin/businesses?per_page=50${storeQ ? `&q=${encodeURIComponent(storeQ)}` : ""}`
    )
      .then((r) => {
        if (!cancel) setStores(r.data);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [open, target, storeQ]);

  const selectedStore = stores.find((s) => String(s.id) === storeId) ?? null;

  function reset() {
    setTitle("");
    setBody("");
    setTarget("all");
    setStoreQ("");
    setStoreId("");
    setStores([]);
    setImage(null);
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast("Gambar maksimal 2MB", "error");
      return;
    }
    const r = new FileReader();
    r.onload = () => setImage(r.result as string);
    r.readAsDataURL(f);
  }

  async function send() {
    const textOnly = stripHtml(body);
    if (!title.trim()) {
      toast("Judul wajib diisi", "error");
      return;
    }
    if (textOnly.length < 5) {
      toast("Isi pesan minimal 5 huruf", "error");
      return;
    }
    if (target === "one" && !storeId) {
      toast("Pilih toko tujuan dulu", "error");
      return;
    }
    setSending(true);
    try {
      await apiFetch(`/admin/notifications`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: textOnly,
          body_html: body.trim(),
          audience: target === "all" ? "all" : "business",
          business_id: target === "one" ? Number(storeId) : undefined,
          type: "announcement",
          ...(image ? { image } : {}),
        }),
      });
      toast("Pengumuman terkirim", "success");
      reset();
      onClose();
      onSent?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title="Buat pengumuman"
      description="Tulis info, pilih siapa yang menerima, lalu kirim."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Batal
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="animate-spin" /> Mengirim...
              </>
            ) : (
              <>
                <Megaphone /> Kirim sekarang
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-5 pb-1">
        <div className="space-y-2">
          <Label>Siapa yang menerima? *</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTarget("all");
                setStoreId("");
                setStoreQ("");
              }}
              className={cn(
                "flex items-center gap-2 rounded-md border p-3 text-left text-sm font-semibold transition-colors",
                target === "all" ? "border-primary bg-accent" : "hover:bg-accent/50"
              )}
            >
              <Users className="h-4 w-4 shrink-0" /> Semua toko
            </button>
            <button
              type="button"
              onClick={() => setTarget("one")}
              className={cn(
                "flex items-center gap-2 rounded-md border p-3 text-left text-sm font-semibold transition-colors",
                target === "one" ? "border-primary bg-accent" : "hover:bg-accent/50"
              )}
            >
              <Store className="h-4 w-4 shrink-0" /> Satu toko
            </button>
          </div>
          {target === "one" && (
            <Combobox
              items={stores}
              itemToStringValue={(s) => `${s.name} — ${s.owner_name}`}
              value={selectedStore}
              onValueChange={(s) => setStoreId(s ? String(s.id) : "")}
              onInputChange={setStoreQ}
            >
              <ComboboxInput placeholder="Ketik nama toko / pemilik..." />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada toko yang cocok.</ComboboxEmpty>
                <ComboboxList>
                  {(s) => (
                    <ComboboxItem key={s.id} value={s}>
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="block text-xs text-zinc-500">Pemilik: {s.owner_name}</span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Judul *</Label>
            <span className="font-mono text-xs text-zinc-400">{title.length}/80</span>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Info maintenance malam ini"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Isi pesan *</Label>
            <span className="font-mono text-xs text-zinc-400">{stripHtml(body).length} huruf</span>
          </div>
          <QuillEditor value={body} onChange={setBody} placeholder="Tulis info yang jelas dan singkat..." />
        </div>

        <div className="space-y-2">
          <Label>Gambar (tidak wajib)</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {image ? (
            <div className="relative overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Pratinjau gambar pengumuman" className="max-h-56 w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Hapus gambar"
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary"
            >
              <ImagePlus className="h-5 w-5" /> Pilih gambar (maks 2MB)
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
