"use client";

import * as React from "react";
import { CheckCircle2, Info, Loader2, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "info" | "warning" | "error" | "loading";

export type ToastActionProps = {
  children: React.ReactNode;
  onClick: () => void;
};

export type ToastOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  type?: ToastType;
  /** Milidetik sebelum hilang otomatis. Default 4000 (loading: tidak hilang sendiri). */
  duration?: number;
  actionProps?: ToastActionProps;
  onClose?: () => void;
};

type ToastItem = ToastOptions & { id: string };

const MAX_STACK = 4;
let seq = 0;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ToastItem[] {
  return items;
}

/** Snapshot server harus stabil (referensi sama) supaya tidak loop. */
const EMPTY_SNAPSHOT: ToastItem[] = [];

function getServerSnapshot(): ToastItem[] {
  return EMPTY_SNAPSHOT;
}

function add(opts: ToastOptions): string {
  const id = `toast-${++seq}-${Date.now().toString(36)}`;
  const type = opts.type ?? "info";
  items = [...items.slice(-(MAX_STACK - 1)), { ...opts, type, id }];
  emit();
  return id;
}

function update(id: string, patch: Partial<ToastOptions>) {
  items = items.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

function close(id: string) {
  const found = items.find((t) => t.id === id);
  if (found?.onClose) {
    try {
      found.onClose();
    } catch {
      /* abaikan */
    }
  }
  items = items.filter((t) => t.id !== id);
  emit();
}

function clear() {
  items = [];
  emit();
}

function normalize(m: string | ToastOptions): ToastOptions {
  return typeof m === "string" ? { title: m } : m;
}

/** Satu toast mengikuti status promise: loading -> success/error. */
async function promise<T>(
  p: Promise<T>,
  msgs: {
    loading: string | ToastOptions;
    success: string | ToastOptions | ((data: T) => string | ToastOptions);
    error: string | ToastOptions | ((err: unknown) => string | ToastOptions);
  }
): Promise<T> {
  const id = add({ ...normalize(msgs.loading), type: "loading", duration: Number.POSITIVE_INFINITY });
  try {
    const data = await p;
    const s = typeof msgs.success === "function" ? msgs.success(data) : msgs.success;
    update(id, { ...normalize(s), type: "success", duration: 4000 });
    return data;
  } catch (err) {
    const e = typeof msgs.error === "function" ? msgs.error(err) : msgs.error;
    update(id, { ...normalize(e), type: "error", duration: 5000 });
    throw err;
  }
}

export const toast = { add, update, close, clear, promise };

const ICONS: Record<ToastType, { icon: React.ReactNode; className: string }> = {
  success: { icon: <CheckCircle2 className="h-[18px] w-[18px]" />, className: "text-emerald-600" },
  info: { icon: <Info className="h-[18px] w-[18px]" />, className: "text-sky-600" },
  warning: { icon: <TriangleAlert className="h-[18px] w-[18px]" />, className: "text-amber-600" },
  error: { icon: <XCircle className="h-[18px] w-[18px]" />, className: "text-red-600" },
  loading: { icon: <Loader2 className="h-[18px] w-[18px] animate-spin" />, className: "text-zinc-500" },
};

function ToastView({ item }: { item: ToastItem }) {
  const type = item.type ?? "info";
  const meta = ICONS[type];
  const duration = item.duration ?? 4000;

  React.useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const t = setTimeout(() => close(item.id), duration);
    return () => clearTimeout(t);
  }, [item.id, duration, item.title, item.description, item.type]);

  return (
    <div
      data-slot="toast"
      role="status"
      className="toast-enter pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-background p-4 shadow-lg"
    >
      <span className={cn("mt-0.5 shrink-0", meta.className)}>{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{item.description}</p>
        )}
        {item.actionProps && (
          <button
            onClick={() => {
              item.actionProps?.onClick();
            }}
            className="mt-2 inline-flex h-8 items-center rounded-md border bg-transparent px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-accent"
          >
            {item.actionProps.children}
          </button>
        )}
      </div>
      <button
        onClick={() => close(item.id)}
        aria-label="Tutup notifikasi"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Wadah toast — pasang sekali di layout seperti shadcn `<Toaster />`. */
export function Toaster() {
  const list = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <div
      data-slot="toaster"
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 right-4 z-[80] flex w-[356px] max-w-[calc(100vw-2rem)] flex-col gap-2 sm:right-6 lg:bottom-6"
    >
      {list.map((t) => (
        <ToastView key={t.id} item={t} />
      ))}
    </div>
  );
}

/**
 * Kompat dengan pemakaian lama: `const { toast } = useToast(); toast("pesan", "success")`.
 * Tidak butuh provider lagi — cukup render `<Toaster />` di layout.
 */
export function useToast() {
  return React.useMemo(
    () => ({
      toast: (message: string, type: "success" | "error" | "info" | "warning" = "info") =>
        toast.add({ title: message, type }),
    }),
    []
  );
}
