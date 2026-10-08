"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";

/** Kompat lama: Modal -> Dialog */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} footer={footer}>
      {children}
    </Dialog>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel: _cancelLabel,
  variant = "primary",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
}) {
  void _cancelLabel;
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant={variant === "danger" ? "danger" : "default"}
      loading={loading}
    />
  );
}

export function XButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
      aria-label="Tutup"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
