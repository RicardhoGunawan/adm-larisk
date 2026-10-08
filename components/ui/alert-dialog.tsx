"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button";

type AlertContext = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const AlertCtx = React.createContext<AlertContext>({ open: false, setOpen: () => {} });

function AlertDialog({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const controlled = open !== undefined;
  const isOpen = controlled ? (open as boolean) : internal;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (!controlled) setInternal(v);
      onOpenChange?.(v);
    },
    [controlled, onOpenChange]
  );

  return <AlertCtx.Provider value={{ open: isOpen, setOpen }}>{children}</AlertCtx.Provider>;
}

function AlertDialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const { setOpen } = React.useContext(AlertCtx);
  void asChild;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const child = React.Children.only(children) as React.ReactElement<any>;
  return React.cloneElement(child, {
    "aria-haspopup": "dialog",
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      setOpen(true);
    },
  });
}

function AlertDialogContent({
  size = "default",
  className,
  children,
  onClose,
}: {
  size?: "default" | "sm";
  className?: string;
  children: React.ReactNode;
  /** Dipanggil saat dialog diminta tutup (Escape). Opsional. */
  onClose?: () => void;
}) {
  const { open, setOpen } = React.useContext(AlertCtx);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, setOpen]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div data-slot="alert-dialog" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay alert-dialog tidak menutup saat diklik — harus pilih aksi */}
      <div data-slot="alert-dialog-overlay" className="absolute inset-0 bg-black/50" />
      <div
        data-slot="alert-dialog-content"
        role="alertdialog"
        aria-modal="true"
        className={cn(
          "relative grid w-full gap-4 rounded-lg border bg-background p-6 shadow-lg",
          size === "sm" ? "max-w-[calc(100%-2rem)] sm:max-w-sm" : "max-w-[calc(100%-2rem)] sm:max-w-md",
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div data-slot="alert-dialog-media" className={cn("mb-1 flex justify-center sm:justify-start", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
        {children}
      </span>
    </div>
  );
}

function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 data-slot="alert-dialog-title" className={cn("text-lg font-semibold", className)} {...props} />
  );
}

function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="alert-dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(AlertCtx);
  return (
    <button
      data-slot="alert-dialog-cancel"
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(false);
      }}
      className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    />
  );
}

function AlertDialogAction({
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <button
      data-slot="alert-dialog-action"
      {...props}
      className={cn(
        buttonVariants({ variant: variant === "destructive" ? "destructive" : "default" }),
        className
      )}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
