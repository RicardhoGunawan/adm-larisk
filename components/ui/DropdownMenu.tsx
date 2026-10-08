"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type MenuContext = {
  open: boolean;
  setOpen: (v: boolean) => void;
  wrapRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

const Ctx = React.createContext<MenuContext>({
  open: false,
  setOpen: () => {},
  wrapRef: { current: null },
  contentRef: { current: null },
});

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Tutup saat klik di luar menu. Pengecekan pakai `contains` (bukan
  // mousedown) supaya klik pada item menu tetap tereksekusi dulu.
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
    const onScroll = () => setOpen(false);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
    };
  }, [open ]);

  return (
    <Ctx.Provider value={{ open, setOpen, wrapRef, contentRef }}>
      <div data-slot="dropdown-menu" ref={wrapRef} className="relative inline-block text-left">
        {children}
      </div>
    </Ctx.Provider>
  );
}

function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const { open, setOpen } = React.useContext(Ctx);
  void asChild;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const child = React.Children.only(children) as React.ReactElement<any>;
  return React.cloneElement(child, {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      setOpen(!open);
    },
  });
}

function DropdownMenuContent({
  align = "start",
  className,
  children,
}: {
  align?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
}) {
  const { open, wrapRef, contentRef } = React.useContext(Ctx);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // Render via portal + posisi fixed dari tombol pemicu, supaya tidak
  // terpotong oleh scroll di dalam tabel/card.
  React.useLayoutEffect(() => {
    if (!open) return;
    const btn = wrapRef.current?.querySelector("button");
    const r = btn?.getBoundingClientRect();
    if (!r || typeof window === "undefined") return;
    const W = 224;
    const maxLeft = Math.max(8, window.innerWidth - W - 8);
    const raw =
      align === "end"
        ? r.right - W
        : align === "center"
          ? r.left + r.width / 2 - W / 2
          : r.left;
    setPos({ top: r.bottom + 6, left: Math.min(Math.max(8, raw), maxLeft) });
  }, [open, align, wrapRef]);

  if (!open || !pos || typeof document === "undefined") return null;
  return createPortal(
    <div
      data-slot="dropdown-menu-content"
      ref={contentRef}
      role="menu"
      style={{ top: pos.top, left: pos.left, width: 224 }}
      className={cn(
        "fixed z-[60] max-h-[70vh] overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

function DropdownMenuItem({
  variant = "default",
  onSelect,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive";
  onSelect?: () => void;
}) {
  const { setOpen } = React.useContext(Ctx);
  return (
    <button
      data-slot="dropdown-menu-item"
      type="button"
      role="menuitem"
      onClick={(e) => {
        props.onClick?.(e);
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-zinc-100",
        variant === "destructive" ? "text-red-600 hover:bg-red-50" : "text-zinc-800",
        "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        className
      )}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div data-slot="dropdown-menu-separator" className={cn("-mx-1 my-1 h-px bg-zinc-200", className)} />;
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="dropdown-menu-label" className={cn("px-2 py-1.5 text-xs font-semibold text-zinc-500", className)} {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
