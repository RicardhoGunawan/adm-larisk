import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk - LarisK",
  description: "Masuk ke panel admin LarisK",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white antialiased">{children}</div>;
}