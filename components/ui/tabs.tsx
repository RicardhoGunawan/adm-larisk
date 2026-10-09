"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContext = {
  value: string;
  onValueChange: (v: string) => void;
};

const TabsCtx = React.createContext<TabsContext | null>(null);

function useTabsCtx() {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("Komponen Tabs harus dipakai di dalam <Tabs>");
  return ctx;
}

function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  className,
  children,
  ...props
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onValueChange">) {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as string) : internal;
  const handle = React.useCallback(
    (v: string) => {
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange]
  );
  return (
    <TabsCtx.Provider value={{ value: current, onValueChange: handle }}>
      <div data-slot="tabs" className={cn("w-fit", className)} {...props}>
        {children}
      </div>
    </TabsCtx.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  value,
  className,
  onClick,
  onKeyDown,
  ...props
}: {
  value: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value">) {
  const { value: current, onValueChange } = useTabsCtx();
  const active = current === value;

  const move = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const tabs = Array.from(
      e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []
    );
    if (tabs.length < 2) return;
    const i = tabs.indexOf(e.currentTarget);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    e.preventDefault();
    tabs[n]?.focus();
    tabs[n]?.click();
  };

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      onClick={(e) => {
        onClick?.(e);
        onValueChange(value);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        move(e);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium ring-offset-background transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  value,
  className,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "value">) {
  const { value: current } = useTabsCtx();
  if (current !== value) return null;
  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
