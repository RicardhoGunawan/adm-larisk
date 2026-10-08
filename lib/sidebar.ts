"use client";

import { useSyncExternalStore } from "react";

const KEY = "larisk_sidebar_collapsed";

let collapsed = false;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setSidebarCollapsed(v: boolean) {
  collapsed = v;
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* abaikan */
  }
  emit();
}

export function toggleSidebar() {
  setSidebarCollapsed(!collapsed);
}

/** Dibaca sekali saat sidebar pertama tampil (agar tidak merusak hydration). */
export function hydrateSidebarState() {
  if (hydrated) return;
  hydrated = true;
  try {
    if (localStorage.getItem(KEY) === "1") {
      collapsed = true;
      emit();
    }
  } catch {
    /* abaikan */
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, () => collapsed, () => false);
}
