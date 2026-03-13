// src/app/admin/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock } from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json() as { error?: string; role?: string };
      if (!res.ok) { setError(d.error ?? "Erreur."); return; }
      if (d.role !== "ADMIN") { setError("Accès réservé aux administrateurs."); return; }
      router.push("/admin/dashboard");
    } catch { setError("Erreur de connexion."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg shadow-violet-500/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin TRADION</h1>
          <p className="text-slate-400 text-sm mt-1">Accès réservé aux administrateurs</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@tradion.app" leftIcon={<Mail className="w-4 h-4" />} required />
            <Input label="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" leftIcon={<Lock className="w-4 h-4" />} required />
            <Button type="submit" size="lg" loading={loading} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
              Accéder au panel
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
