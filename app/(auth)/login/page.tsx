"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
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
        description: "Selamat datang kembali.",
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
      {/* ================= SISI KIRI: Light Minimalist Branding ================= */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-50 p-12 lg:p-16 border-r border-slate-100 lg:flex">
        {/* Soft Decorative Glow */}
        <div
          aria-hidden
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#CD1F26]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#F5B301]/15 blur-3xl"
        />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/larisk-logo.png"
            alt="LarisK"
            width={36}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-slate-800">LarisK</span>
          <span className="text-xs font-medium text-slate-400">• Central Console</span>
        </div>

        {/* Center Pitch */}
        <div className="relative z-10 max-w-lg space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Pusat kendali & pengelolaan SaaS LarisK.
          </h1>
          <p className="text-base leading-relaxed text-slate-500">
            Kelola tenant, pantau aktivitas ekosistem, dan atur performa platform secara real-time dalam satu konsol terpusat.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} LarisK SaaS Platform
        </div>
      </div>

      {/* ================= SISI KANAN: Form Proporsional ================= */}
      <div className="flex min-h-screen items-center justify-center bg-white p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            {/* Mobile Logo */}
            <div className="mb-6 lg:hidden">
              <Image
                src="/larisk-logo.png"
                alt="LarisK"
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Masuk
            </h2>
            <p className="text-sm text-slate-500">
              Gunakan akun admin utama untuk mengakses panel kontrol.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email
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
                className="h-11 border-slate-200 bg-white text-sm text-slate-900 shadow-none focus-visible:ring-1 focus-visible:ring-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
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
                  className="h-11 pr-10 border-slate-200 bg-white text-sm text-slate-900 shadow-none focus-visible:ring-1 focus-visible:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Sembunyikan password" : "Lihat password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs font-medium text-red-600 border border-red-100">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-[#CD1F26] text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Masuk ke Panel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}