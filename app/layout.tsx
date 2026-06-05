import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoteVault – Secure Note Sharing",
  description: "Create and share notes with secure expiring links",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
