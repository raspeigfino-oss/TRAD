// src/app/(user)/rewards/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, Button, Alert, Badge, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Gift } from "lucide-react";

interface Reward {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  claimedAt?: string;
}

interface DashboardData {
  pendingTotal: number;
  pendingRewards: Reward[];
}

export default function RewardsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const [dash, hist] = await Promise.all([
      fetch("/api/user/dashboard").then(r => r.json()) as Promise<DashboardData>,
      fetch("/api/user/rewards").then(r => r.json()) as Promise<{ rewards: Reward[] }>,
    ]);
    setData(dash);
    setAllRewards(hist.rewards ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function claim() {
    setClaiming(true);
    setMsg(null);
    const res = await fetch("/api/user/claim-rewards", { method: "POST" });
    const d = await res.json() as { error?: string; total?: number };
    if (!res.ok) { setMsg({ type: "error", text: d.error ?? "Erreur." }); }
    else { setMsg({ type: "success", text: `${formatCurrency(d.total ?? 0)} ajoutés à votre solde !` }); load(); }
    setClaiming(false);
  }

  if (loading) return <UserLayout><div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div></UserLayout>;

  return (
    <UserLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Récompenses</h1>
          <p className="text-slate-400 text-sm mt-1">Vos gains et bonus en attente</p>
        </div>

        {/* Pending banner */}
        {(data?.pendingTotal ?? 0) > 0 && (
          <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Gift className="w-6 h-6 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total disponible</p>
                  <p className="text-2xl font-bold text-violet-300">{formatCurrency(data?.pendingTotal ?? 0)}</p>
                  <p className="text-xs text-slate-500">{data?.pendingRewards.length} récompense(s) non réclamée(s)</p>
                </div>
              </div>
              <Button loading={claiming} onClick={claim} size="lg">
                Réclamer tout
              </Button>
            </div>
            {msg && <div className="mt-4"><Alert type={msg.type}>{msg.text}</Alert></div>}
          </Card>
        )}

        {(data?.pendingTotal ?? 0) === 0 && (
          <Alert type="info">Vous n'avez aucun gain en attente pour le moment.</Alert>
        )}

        {/* All rewards */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Toutes les récompenses</h2>
          {allRewards.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune récompense.</p>
          ) : (
            <div className="space-y-1">
              {allRewards.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{r.reason}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                    {r.claimedAt && <p className="text-xs text-slate-500">Réclamé le {formatDateTime(r.claimedAt)}</p>}
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-sm font-bold text-emerald-400">+{formatCurrency(r.amount)}</p>
                    <Badge variant={r.status === "CLAIMED" ? "success" : "warning"}>
                      {r.status === "CLAIMED" ? "Réclamé" : "En attente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </UserLayout>
  );
}
