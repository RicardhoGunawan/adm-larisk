import { apiFetch, getStoredToken } from "./api";

export type AdminMe = { id: number; name: string; email: string };

/**
 * Cache data akun sendiri supaya endpoint /admin/auth/me TIDAK dipanggil
 * berulang-ulang setiap pindah halaman. Satu sesi cukup sekali (maksimal
 * refresh tiap 5 menit). Logout wajib memanggil clearMeCache().
 */
let cached: AdminMe | null = null;
let inflight: Promise<AdminMe> | null = null;
let fetchedAt = 0;
const TTL_MS = 5 * 60 * 1000;

export function setMeCache(user: AdminMe) {
  cached = user;
  fetchedAt = Date.now();
}

export function clearMeCache() {
  cached = null;
  inflight = null;
  fetchedAt = 0;
}

export async function getMe(force = false): Promise<AdminMe> {
  if (!getStoredToken()) throw new Error("Belum login");
  if (!force && cached && Date.now() - fetchedAt < TTL_MS) return cached;
  if (!force && inflight) return inflight;
  inflight = apiFetch<{ data: { user: AdminMe } }>(`/admin/auth/me`)
    .then((r) => {
      cached = r.data.user;
      fetchedAt = Date.now();
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
