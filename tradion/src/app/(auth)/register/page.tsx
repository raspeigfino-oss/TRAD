// src/app/(auth)/register/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Mail, Lock, Users } from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Minimum 8 caractères pour le mot de passe."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, referralCode: referralCode || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      router.push("/dashboard");
    } catch { setError("Erreur lors de l'inscription."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-slate-400 text-sm mt-1">Rejoignez TRADION et commencez à investir</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="vous@exemple.com"
              value={email} onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />} required />
            <Input label="Mot de passe" type="password" placeholder="Minimum 8 caractères"
              value={password} onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />} required />
            <Input label="Confirmer le mot de passe" type="password" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />} required />
            <Input label="Code de parrainage (optionnel)" type="text" placeholder="TRD000000"
              value={referralCode} onChange={e => setReferralCode(e.target.value)}
              leftIcon={<Users className="w-4 h-4" />} />
            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              Créer mon compte
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
