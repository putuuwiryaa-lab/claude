import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poltar 4D Scanner",
  description: "Scanner Poltar 4D berbasis data Supabase"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
