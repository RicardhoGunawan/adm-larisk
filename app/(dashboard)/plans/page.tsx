"use client";

import { useEffect, useState } from "react";
import { Package, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Empty } from "@/components/ui/Empty";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Plan = {
  id: number;
  slug: string;
  name: string;
  price_idr: number;
  trial_days?: number;
  interval?: string;
  is_active?: boolean;
};

export default function PlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Plan | null>(null);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Plan[] }>(`/admin/plans`);
      setPlans(res.data);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!edit) return;
    const n = Number(price.replace(/\D/g, "") || "0");
    setBusy(true);
    try {
      await apiFetch(`/admin/plans/${edit.id}`, { method: "PUT", body: JSON.stringify({ price_idr: n }) });
      toast(`Harga ${edit.name} jadi ${formatRupiah(n)}`, "success");
      setEdit(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader title="Paket Harga" desc="Harga langganan yang dibayar toko tiap bulan" />

      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {loading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat paket...</p>}
        {!loading && plans.length === 0 && (
          <Card><Empty icon={Package} title="Belum ada paket" hint="Paket dibuat dari server." /></Card>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{p.name}</p>
                  {p.is_active === false ? <Badge variant="muted">Mati</Badge> : <Badge variant="success">Aktif</Badge>}
                </div>
                <p className="mt-2 text-2xl font-bold">{formatRupiah(p.price_idr)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.trial_days ? `Coba gratis ${p.trial_days} hari` : "Tanpa masa coba"} · {p.interval || "bulanan"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => { setEdit(p); setPrice(String(p.price_idr)); }}
                >
                  <Pencil /> Ubah harga
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">Harga dalam Rupiah per bulan. Perubahan langsung berlaku untuk tagihan baru.</p>
      </div>

      <Dialog
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Ubah harga — ${edit?.name}`}
        description="Hanya angka. Contoh: 49000 untuk Rp49.000."
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(null)}>Batal</Button>
            <Button onClick={save} disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-2 pb-1">
          <Label>Harga (Rp / bulan)</Label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="49000" />
        </div>
      </Dialog>
    </div>
  );
}
