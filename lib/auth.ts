"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getStoredToken, setStoredToken } from "./api";

export type MeResponse = {
  data: {
    user: { id: number; name: string; phone: string; is_owner: boolean; is_admin?: boolean; is_active: boolean };
    businesses: unknown[];
    permissions: string[];
  };
};

export function useAuth() {
  const [user, setUser] = useState<MeResponse["data"]["user"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<MeResponse>("/me")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        // token invalid — clear
        setStoredToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

export function useRequireAuth() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && !getStoredToken()) {
      router.replace("/login");
    }
    // If token exists but /me failed (is_admin check), also redirect if 401/403
  }, [loading, user, router]);

  return { user, loading };
}
