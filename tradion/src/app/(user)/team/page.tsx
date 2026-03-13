// src/app/(user)/team/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, StatCard, Badge, Spinner } from "@/components/ui";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Member {
  id: string;
  level: number;
  createdAt: string;
  child: {
    email: string;
    profile: { publicUserId: string } | null;
  };
}

interface TeamData {
  directCount: number;
  indirectCount: number;
  totalTeam: number;
  members: Member[];
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/team")
      .then(r => { if (r.status === 401) { window.location.href = "/login"; } return r.json(); })
      .then((d: TeamData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <UserLayout><div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div></UserLayout>;

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon Équipe</h1>
          <p className="text-slate-400 text-sm mt-1">Votre réseau de parrainage</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Membres directs" value={data?.directCount ?? 0} icon={<UserCheck className="w-5 h-5 text-indigo-400" />} color="indigo" />
          <StatCard label="Membres indirects" value={data?.indirectCount ?? 0} icon={<Users className="w-5 h-5 text-violet-400" />} color="violet" />
          <StatCard label="Équipe totale" value={data?.totalTeam ?? 0} icon={<UserPlus className="w-5 h-5 text-emerald-400" />} color="emerald" />
        </div>

        <Card>
          <h2 className="font-semibold text-white mb-4">Liste des membres</h2>
          {(data?.members ?? []).length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Vous n'avez pas encore de membres dans votre équipe.</p>
              <p className="text-slate-500 text-sm mt-1">Partagez votre lien depuis votre profil pour inviter des amis.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {(data?.members ?? []).map(m => (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300">
                      {m.child.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{m.child.email}</p>
                      <p className="text-xs text-slate-500">{m.child.profile?.publicUserId} • Rejoint le {formatDate(m.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={m.level === 1 ? "info" : "neutral"}>
                    {m.level === 1 ? "Direct" : `Niveau ${m.level}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </UserLayout>
  );
}
