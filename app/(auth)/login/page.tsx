"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, setStoredToken } from "@/lib/api";
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
      const me = await apiFetch<{ data: { user: { name: string } } }>(`/admin/auth/me`);
      toast.add({
        title: `${greeting()}, ${me.data.user.name}!`,
        description: "Senang melihatmu kembali.",
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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-100 p-4">
      {/* Latar premium */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,#d4d4d8_1px,transparent_1px),linear-gradient(to_bottom,#d4d4d8_1px,transparent_1px)] bg-[size:36px_36px] opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />
      <div aria-hidden className="absolute left-1/2 top-0 h-72 w-[640px] max-w-full -translate-x-1/2 rounded-full bg-zinc-900/[0.07] blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl border bg-white shadow-lg shadow-zinc-200">
            <Image
              src="/larisk-logo.png"
              alt="LarisK"
              width={52}
              height={52}
              className="h-[52px] w-[52px] object-contain"
              priority
            />
          </span>
        </div>

        <Card className="shadow-xl shadow-zinc-200/70">
          <CardContent className="p-7 sm:p-8">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-12 text-[15px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    className="h-12 pr-11 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Sembunyikan password" : "Lihat password"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-800">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="h-12 w-full text-[15px] font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" /> Masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
