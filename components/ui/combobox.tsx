"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

type ComboboxContextValue<T = any> = {
  open: boolean;
  setOpen: (v: boolean) => void;
  query: string;
  commitQuery: (q: string) => void;
  filtered: T[];
  activeIndex: number;
  setActiveIndex: (i: number, via?: "keyboard" | "pointer") => void;
  selectItem: (item: T) => void;
  isSelected: (item: T) => boolean;
  getKey: (item: T) => string;
  wrapRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  inputId: string;
  listId: string;
  disabled?: boolean;
  lastNav: React.MutableRefObject<"keyboard" | "pointer">;
};

const ComboboxCtx = React.createContext<ComboboxContextValue<any> | null>(null);

function useComboboxCtx() {
  const ctx = React.useContext(ComboboxCtx);
  if (!ctx) throw new Error("Komponen Combobox harus dipakai di dalam <Combobox>");
  return ctx;
}

const ItemIndexCtx = React.createContext<number>(-1);

export function Combobox<T>({
  items,
  itemToStringValue,
  itemKey,
  value,
  defaultValue = null,
  onValueChange,
  onInputChange,
  filter,
  disabled,
  className,
  children,
}: {
  /** Daftar pilihan (boleh string atau object). */
  items: readonly T[];
  /** Ubah object menjadi teks untuk tampil & saring. Wajib jika items berupa object. */
  itemToStringValue?: (item: T) => string;
  /** Kunci unik tiap item. Default memakai hasil itemToStringValue. */
  itemKey?: (item: T) => string;
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (item: T | null) => void;
  /** Dipanggil tiap teks ketikan berubah (untuk pencarian ke server). */
  onInputChange?: (text: string) => void;
  /** Saring lokal. Isi `null` untuk mematikan (jika sudah disaring server). */
  filter?: ((item: T, query: string) => boolean) | null;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const toString = React.useCallback(
    (item: T | null | undefined): string => {
      if (item === null || item === undefined) return "";
      if (itemToStringValue) return itemToStringValue(item);
      return String(item);
    },
    [itemToStringValue]
  );
  const toKey = React.useCallback(
    (item: T): string => {
      if (itemKey) return itemKey(item);
      return toString(item);
    },
    [itemKey, toString]
  );

  const [internal, setInternal] = React.useState<T | null>(defaultValue);
  const controlled = value !== undefined;
  const selected = controlled ? (value as T | null) : internal;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndexState] = React.useState(0);
  const lastNav = React.useRef<"keyboard" | "pointer">("keyboard");
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const ids = React.useId();
  const inputId = `cb-input-${ids}`;
  const listId = `cb-list-${ids}`;

  const setActiveIndex = React.useCallback((i: number, via: "keyboard" | "pointer" = "keyboard") => {
    lastNav.current = via;
    setActiveIndexState(i);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter === null) return [...items];
    if (!q) return [...items];
    const fn = filter ?? ((item: T, qq: string) => toString(item).toLowerCase().includes(qq));
    return items.filter((it) => fn(it, q));
  }, [items, query, filter, toString]);

  const isSelected = React.useCallback(
    (item: T) => selected !== null && selected !== undefined && toKey(item) === toKey(selected),
    [selected, toKey]
  );

  const selectItem = React.useCallback(
    (item: T) => {
      if (!controlled) setInternal(item);
      onValueChange?.(item);
      setQuery(toString(item));
      setOpen(false);
    },
    [controlled, onValueChange, toString]
  );

  const commitQuery = React.useCallback(
    (q: string) => {
      setQuery(q);
      onInputChange?.(q);
      setActiveIndexState(0);
      lastNav.current = "keyboard";
      // Mengetik ulang = pilihan lama batal (harus pilih ulang dari daftar)
      if (selected !== null && selected !== undefined && q !== toString(selected)) {
        if (!controlled) setInternal(null);
        onValueChange?.(null);
      }
    },
    [onInputChange, selected, controlled, onValueChange, toString]
  );

  // Tutup saat klik di luar (cek `contains`, bukan mousedown, supaya klik
  // item tidak tertelan sebelum tereksekusi).
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (t && wrapRef.current?.contains(t)) return;
      if (t && contentRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const ctx: ComboboxContextValue<T> = {
    open,
    setOpen,
    query,
    commitQuery,
    filtered,
    activeIndex,
    setActiveIndex,
    selectItem,
    isSelected,
    getKey: toKey,
    wrapRef,
    contentRef,
    inputId,
    listId,
    disabled,
    lastNav,
  };

  return (
    <ComboboxCtx.Provider value={ctx}>
      <div data-slot="combobox" ref={wrapRef} className={cn("w-full", className)}>
        {children}
      </div>
    </ComboboxCtx.Provider>
  );
}

export function ComboboxInput({
  placeholder,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const { open, setOpen, query, commitQuery, filtered, activeIndex, setActiveIndex, selectItem, inputId, listId, disabled } =
    useComboboxCtx();

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          commitQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex(Math.min(activeIndex + 1, Math.max(0, filtered.length - 1)), "keyboard");
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex(Math.max(activeIndex - 1, 0), "keyboard");
          } else if (e.key === "Enter") {
            if (open && filtered.length > 0) {
              e.preventDefault();
              const idx = Math.min(Math.max(0, activeIndex), filtered.length - 1);
              selectItem(filtered[idx]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        onBlur={() => setOpen(false)}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background py-1 pl-3 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function ComboboxContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, wrapRef, contentRef, listId } = useComboboxCtx();
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  // Portal + posisi fixed dari input supaya tidak terpotong modal/scroll.
  React.useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const input = wrapRef.current?.querySelector("input");
      const r = input?.getBoundingClientRect();
      if (!r) return;
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, wrapRef]);

  if (!open || !pos || typeof document === "undefined") return null;
  return createPortal(
    <div
      data-slot="combobox-content"
      ref={contentRef}
      id={listId}
      role="listbox"
      style={{ top: pos.top, left: pos.left, width: Math.max(180, pos.width) }}
      className={cn(
        "fixed z-[70] max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

export function ComboboxEmpty({ className, children }: { className?: string; children: React.ReactNode }) {
  const { filtered } = useComboboxCtx();
  if (filtered.length > 0) return null;
  return <div className={cn("px-3 py-6 text-center text-sm text-zinc-500", className)}>{children}</div>;
}

export function ComboboxList({ children }: { children: (item: any) => React.ReactNode }) {
  const { filtered, getKey } = useComboboxCtx();
  return (
    <>
      {filtered.map((item, i) => (
        <ItemIndexCtx.Provider key={getKey(item)} value={i}>
          {children(item)}
        </ItemIndexCtx.Provider>
      ))}
    </>
  );
}

export function ComboboxItem({
  value,
  disabled,
  className,
  children,
  onSelect,
}: {
  value: any;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onSelect?: () => void;
}) {
  const { isSelected, selectItem, activeIndex, setActiveIndex, lastNav } = useComboboxCtx();
  const index = React.useContext(ItemIndexCtx);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const selected = isSelected(value);
  const active = index === activeIndex;

  // Ikuti sorotan keyboard supaya opsi terlihat saat navigasi panah.
  React.useEffect(() => {
    if (active && lastNav.current === "keyboard") {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [active, lastNav]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => !disabled && setActiveIndex(index, "pointer")}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        selectItem(value);
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-zinc-800 transition-colors",
        active && "bg-zinc-100",
        selected && "font-medium",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <Check className="h-4 w-4 shrink-0 text-zinc-700" />}
    </div>
  );
}
