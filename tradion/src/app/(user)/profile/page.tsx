// src/app/(user)/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, Button, Spinner } from "@/components/ui";
import { Copy, Check, User, Link as LinkIcon, Hash } from "lucide-react";

interface ProfileData {
  cycle: null | { currentCapital: number };
}

interface UserProfile {
  email: string;
  profile: {
    publicUserId: string;
    referralCode: string;
    referralLink: string;
  } | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/dashboard")
      .then(r => r.json())
      .then(() => {
        // Fetch profile separately via me endpoint
        fetch("/api/user/me")
          .then(r => r.json())
          .then((d: UserProfile) => setProfile(d))
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  }, []);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return <UserLayout><div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div></UserLayout>;
  }

  const p = profile?.profile;

  return (
    <UserLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
          <p className="text-slate-400 text-sm mt-1">Vos informations et identifiants de parrainage</p>
        </div>

        {/* Identity card */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{profile?.email}</p>
              <p className="text-slate-400 text-sm">{p?.publicUserId}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Public ID */}
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-xs text-slate-400">Identifiant public</p>
                  <p className="text-white font-mono font-semibold">{p?.publicUserId}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy(p?.publicUserId ?? "", "id")}>
                {copied === "id" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Referral code */}
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-violet-400" />
                <div>
                  <p className="text-xs text-slate-400">Code de parrainage</p>
                  <p className="text-white font-mono font-semibold">{p?.referralCode}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy(p?.referralCode ?? "", "code")}>
                {copied === "code" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Referral link */}
            <div className="p-3 bg-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-slate-400">Lien de parrainage</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => copy(p?.referralLink ?? "", "link")}>
                  {copied === "link" ? (
                    <><Check className="w-3.5 h-3.5" /> Copié !</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copier le lien</>
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-300 font-mono break-all">{p?.referralLink}</p>
            </div>
          </div>
        </Card>

        {/* Info block */}
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <h3 className="font-semibold text-white mb-2">Comment parrainer ?</h3>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>Partagez votre lien ou votre code de parrainage à vos contacts.</li>
            <li>Lorsqu'ils s'inscrivent, ils sont automatiquement ajoutés à votre équipe.</li>
            <li>Suivez l'évolution de votre équipe dans la section "Mon Équipe".</li>
          </ol>
        </Card>
      </div>
    </UserLayout>
  );
}
