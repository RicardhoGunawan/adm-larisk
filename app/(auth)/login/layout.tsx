import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke panel admin LarisK",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
