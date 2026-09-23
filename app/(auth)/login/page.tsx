"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiFetch, setStoredToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { token: string } }>(`/admin/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const token = (res as unknown as { token?: string })?.token ?? res.data?.token;
      if (!token) throw new Error("Token tidak diterima dari server");
      setStoredToken(token);
      await apiFetch(`/admin/auth/me`);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative overflow-hidden">
      {/* subtle background - tetap simple, cuma aksen halus biar lebih premium */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-zinc-100" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-zinc-900/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.04] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* brand - tetap center, sedikit lebih premium */}
        <div className="text-center mb-6">
          <div className="relative mx-auto w-fit">
            <Image src="/larisk-logo.png" alt="LarisK" width={56} height={56} className="mx-auto h-14 w-14 rounded-2xl bg-white object-contain p-1.5 border border-zinc-200 shadow-sm" priority />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 border-2 border-white shadow-sm">
              <ShieldCheck className="h-3 w-3 text-white" />
            </span>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900">LarisK Admin</h1>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Sparkles className="h-3 w-3 text-zinc-400" /> Private • Super Admin Access
          </p>
        </div>

        <Card className="shadow-lg shadow-zinc-200/50 border-zinc-200/80 bg-white/80 backdrop-blur">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@larisk.id" required autoComplete="email" autoFocus className="h-11 bg-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="pr-10 h-11 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800 break-words">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold shadow-sm">
              {loading ? "Memproses..." : "Masuk Dashboard"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="h-3 w-3" /> Aman & terenkripsi • Hanya pemilik platform
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-400">© 2026 LarisK — Super Admin Panel</p>
      </div>
    </div>
  );
}
