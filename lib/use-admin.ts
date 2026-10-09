"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getStoredToken } from "@/lib/api";
import { getMe, type AdminMe } from "@/lib/me";

export function useAdmin<T>(path: string | null) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) return;
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<T>(path);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [path, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export function useMe() {
  const [me, setMe] = useState<AdminMe | null>(null);
  useEffect(() => {
    if (!getStoredToken()) return;
    let alive = true;
    // Lewat cache: pindah halaman tidak memicu request baru.
    getMe()
      .then((u) => {
        if (alive) setMe(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return me;
}
