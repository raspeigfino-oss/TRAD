// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRADION — Plateforme d'Investissement",
  description: "Gérez vos investissements avec TRADION",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
