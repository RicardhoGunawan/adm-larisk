// Central API client untuk Laravel LarisK — FULL API INTEGRATION (tanpa mock)
const RAW_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8001";
export const API_BASE = `${RAW_BASE}/api/v1`;

type ApiOptions = RequestInit & {
  token?: string;
  businessId?: string | number;
  outletId?: string | number;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("larisk_admin_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("larisk_admin_token", token);
  else localStorage.removeItem("larisk_admin_token");
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, businessId, outletId, headers, ...rest } = opts;
  const effectiveToken = token ?? getStoredToken();
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
      ...(businessId ? { "X-Business-Id": String(businessId) } : {}),
      ...(outletId ? { "X-Outlet-Id": String(outletId) } : {}),
      ...(headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    let message = `API ${res.status}: ${res.statusText}`;
    try {
      const json = JSON.parse(body);
      message = json.message || message;
      if (json.errors) message += ` - ${JSON.stringify(json.errors)}`;
    } catch {
      if (body) message = body.slice(0, 600);
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
