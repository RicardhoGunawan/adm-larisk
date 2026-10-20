"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, TriangleAlert, ShieldCheck, Layers, Server } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, setStoredToken } from "@/lib/api";
import { setMeCache } from "@/lib/me";
import { toast } from "@/components/ui/Toast";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { token: string } }>(`/admin/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const token = (res as unknown as { token?: string })?.token ?? res.data?.token;
      if (!token) throw new Error("Server tidak mengirim token. Coba lagi.");
      
      setStoredToken(token);
      
      const me = await apiFetch<{ data: { user: { id: number; name: string; email: string } } }>(`/admin/auth/me`);
      setMeCache(me.data.user);

      toast.add({
        title: `${greeting()}, ${me.data.user.name}!`,
        description: "Selamat datang di Panel Superadmin LarisK.",
        type: "success",
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* ================= SISI KIRI: SaaS Owner Branding ================= */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white lg:flex">
        {/* Decorative Background */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]"
        />
        <div
          aria-hidden
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#CD1F26]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#F5B301]/15 blur-3xl"
        />

        {/* Top Header / SaaS Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur-md ring-1 ring-white/20">
            <Image
              src="/larisk-logo.png"
              alt="LarisK Platform"
              width={36}
              height={36}
              className="h-auto w-auto object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">LarisK</span>
            <span className="ml-2.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/30">
              SaaS Admin Portal
            </span>
          </div>
        </div>

        {/* Hero Section / SaaS Metrics Focus */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md ring-1 ring-white/10">
            <Server className="h-3.5 w-3.5 text-[#F5B301]" />
            Core Infrastructure & Control
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Pusat Kendali Platform & Multi-Tenant LarisK
          </h2>
          <p className="text-base leading-relaxed text-zinc-400">
            Kelola seluruh ekosistem bisnis, langganan tenant, lisensi toko, performa server, dan analisis pendapatan SaaS Anda secara terpusat.
          </p>

          {/* Key Capabilities */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Layers className="mb-2 h-5 w-5 text-[#F5B301]" />
              <h4 className="text-sm font-semibold text-white">Management Tenant</h4>
              <p className="mt-1 text-xs text-zinc-400">Kontrol penuh akses & paket berlangganan klien.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <ShieldCheck className="mb-2 h-5 w-5 text-[#CD1F26]" />
              <h4 className="text-sm font-semibold text-white">Root Access</h4>
              <p className="mt-1 text-xs text-zinc-400">Keamanan terenkripsi dengan otorisasi khusus superadmin.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} LarisK Inc. Master Admin Console.
        </div>
      </div>

      {/* ================= SISI KANAN: Form Login Cardless (Borderless) ================= */}
      <div className="relative flex min-h-screen items-center justify-center bg-white p-6 sm:p-12 dark:bg-zinc-950">
        <div className="relative w-full max-w-sm space-y-8">
          {/* Mobile Header Logo */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 p-2.5 dark:bg-zinc-900">
              <Image
                src="/larisk-logo.png"
                alt="LarisK Platform"
                width={36}
                height={36}
                className="h-auto w-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">LarisK SaaS</h1>
            <span className="mt-1.5 rounded-full border border-red-500/20 bg-red-50 px-3 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
              Portal Superadmin
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Portal Pemilik SaaS
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Masukkan kredensial master admin untuk masuk.
            </p>
          </div>

          {/* Form Direct (Tanpa Card) */}
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Email Admin
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@larisk.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="h-11 border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="h-11 pr-10 border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Sembunyikan password" : "Lihat password"}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="break-words leading-relaxed">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full bg-[#CD1F26] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b3121b] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD1F26]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengautentikasi...
                </>
              ) : (
                "Masuk ke Portal Control"
              )}
            </Button>
          </form>

          {/* Footer Copyright */}
          <p className="text-center text-xs text-zinc-400 lg:text-left">
            LarisK Master Console &bull; Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
}