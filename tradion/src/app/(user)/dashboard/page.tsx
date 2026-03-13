// src/app/(user)/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, StatCard, Button, Alert, Badge, Spinner } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine,
  Gift, Zap, Clock, CheckCircle, XCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DashboardData {
  cycle: {
    id: string;
    initialCapital: number;
    currentCapital: number;
    startedAt: string;
    endsAt: string;
    status: string;
  } | null;
  pendingTotal: number;
  pendingRewards: Array<{ id: string; amount: number; reason: string }>;
  recentHistory: Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>;
  totalDeposited: number;
  totalWithdrawn: number;
  growthHistory: Array<{ type: string; amount: number; createdAt: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Dépôt",
  WITHDRAWAL: "Retrait",
  SIGNAL_GAIN: "Gain signal",
  REWARD_CLAIMED: "Récompense",
  BONUS: "Bonus",
  FEE: "Frais",
};

const TYPE_BADGE: Record<string, "success" | "danger" | "info" | "warning" | "neutral"> = {
  DEPOSIT: "success",
  WITHDRAWAL: "danger",
  SIGNAL_GAIN: "info",
  REWARD_CLAIMED: "warning",
  BONUS: "success",
  FEE: "danger",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalCode, setSignalCode] = useState("");
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalMsg, setSignalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/user/dashboard");
      if (res.status === 401) { window.location.href = "/login"; return; }
      const d = await res.json() as DashboardData;
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submitSignal() {
    if (!signalCode.trim()) return;
    setSignalLoading(true);
    setSignalMsg(null);
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: signalCode }),
      });
      const d = await res.json() as { error?: string; rewardApplied?: number };
      if (!res.ok) { setSignalMsg({ type: "error", text: d.error ?? "Erreur." }); return; }
      setSignalMsg({ type: "success", text: `+${formatCurrency(d.rewardApplied ?? 0)} appliqué avec succès !` });
      setSignalCode("");
      load();
    } catch { setSignalMsg({ type: "error", text: "Erreur réseau." }); }
    finally { setSignalLoading(false); }
  }

  async function claimRewards() {
    setClaimLoading(true);
    setClaimMsg(null);
    try {
      const res = await fetch("/api/user/claim-rewards", { method: "POST" });
      const d = await res.json() as { error?: string; total?: number };
      if (!res.ok) { setClaimMsg({ type: "error", text: d.error ?? "Erreur." }); return; }
      setClaimMsg({ type: "success", text: `${formatCurrency(d.total ?? 0)} ajoutés à votre solde !` });
      load();
    } catch { setClaimMsg({ type: "error", text: "Erreur réseau." }); }
    finally { setClaimLoading(false); }
  }

  // Build chart data
  function buildChartData() {
    if (!data) return [];
    let running = data.cycle?.initialCapital ?? 0;
    const points: Array<{ date: string; solde: number }> = [
      { date: data.cycle ? formatDate(data.cycle.startedAt) : "", solde: running },
    ];
    for (const h of data.growthHistory) {
      running += h.amount;
      points.push({ date: formatDate(h.createdAt), solde: Math.max(0, running) });
    }
    return points;
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </UserLayout>
    );
  }

  const chartData = buildChartData();
  const gain = data?.cycle ? data.cycle.currentCapital - data.cycle.initialCapital : 0;
  const gainPct = data?.cycle && data.cycle.initialCapital > 0
    ? ((gain / data.cycle.initialCapital) * 100).toFixed(2)
    : "0.00";

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-1">Vue d'ensemble de votre portefeuille</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Capital actuel"
            value={formatCurrency(data?.cycle?.currentCapital ?? 0)}
            icon={<Wallet className="w-5 h-5 text-indigo-400" />}
            trend={`+${gainPct}%`}
            color="indigo"
          />
          <StatCard
            label="Total déposé"
            value={formatCurrency(data?.totalDeposited ?? 0)}
            icon={<ArrowDownToLine className="w-5 h-5 text-emerald-400" />}
            color="emerald"
          />
          <StatCard
            label="Total retiré"
            value={formatCurrency(data?.totalWithdrawn ?? 0)}
            icon={<ArrowUpFromLine className="w-5 h-5 text-amber-400" />}
            color="amber"
          />
          <StatCard
            label="Gains en attente"
            value={formatCurrency(data?.pendingTotal ?? 0)}
            icon={<Gift className="w-5 h-5 text-violet-400" />}
            color="violet"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Growth chart */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-white">Courbe de croissance</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Évolution de votre capital</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Gain total</p>
                  <p className={`font-bold ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
                  </p>
                </div>
              </div>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v} $`} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, color: "#fff" }}
                      formatter={(v: number) => [formatCurrency(v), "Solde"]}
                    />
                    <Area type="monotone" dataKey="solde" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                  Pas encore de données suffisantes
                </div>
              )}
            </Card>

            {/* Recent history */}
            <Card>
              <h2 className="font-semibold text-white mb-4">Historique récent</h2>
              {(data?.recentHistory ?? []).length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune transaction.</p>
              ) : (
                <div className="space-y-1">
                  {(data?.recentHistory ?? []).map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
                      <div className="flex items-center gap-3">
                        <Badge variant={TYPE_BADGE[h.type] ?? "neutral"}>{TYPE_LABELS[h.type] ?? h.type}</Badge>
                        <span className="text-sm text-slate-300">{h.description}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${h.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {h.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(h.amount))}
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(h.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Cycle info */}
            {data?.cycle && (
              <Card>
                <h2 className="font-semibold text-white mb-3">Cycle actif</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capital initial</span>
                    <span className="text-white font-medium">{formatCurrency(data.cycle.initialCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capital actuel</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(data.cycle.currentCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Début</span>
                    <span className="text-white">{formatDate(data.cycle.startedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fin</span>
                    <span className="text-white">{formatDate(data.cycle.endsAt)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progression vers x2</span>
                      <span>{Math.min(100, ((data.cycle.currentCapital / (data.cycle.initialCapital * 2)) * 100)).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (data.cycle.currentCapital / (data.cycle.initialCapital * 2)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick actions */}
            <Card>
              <h2 className="font-semibold text-white mb-3">Actions rapides</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/deposits"}>
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Déposer
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/withdrawals"}>
                  <ArrowUpFromLine className="w-3.5 h-3.5" /> Retirer
                </Button>
              </div>
            </Card>

            {/* Signal code entry */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-white">Code signal</h2>
              </div>
              <p className="text-xs text-slate-400 mb-3">Entrez le code reçu sur Telegram</p>
              {signalMsg && (
                <div className="mb-3">
                  <Alert type={signalMsg.type}>{signalMsg.text}</Alert>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signalCode}
                  onChange={e => setSignalCode(e.target.value.toUpperCase())}
                  placeholder="SIG-XXXXX"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  onKeyDown={e => e.key === "Enter" && submitSignal()}
                />
                <Button size="sm" loading={signalLoading} onClick={submitSignal}>OK</Button>
              </div>
            </Card>

            {/* Pending rewards */}
            {(data?.pendingTotal ?? 0) > 0 && (
              <Card className="border-violet-500/30 bg-violet-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4 text-violet-400" />
                  <h2 className="font-semibold text-white">Gains en attente</h2>
                </div>
                {claimMsg && (
                  <div className="mb-3"><Alert type={claimMsg.type}>{claimMsg.text}</Alert></div>
                )}
                <p className="text-2xl font-bold text-violet-300 mb-1">{formatCurrency(data?.pendingTotal ?? 0)}</p>
                <p className="text-xs text-slate-400 mb-3">{data?.pendingRewards.length} récompense(s) disponible(s)</p>
                <Button variant="primary" size="sm" loading={claimLoading} onClick={claimRewards} className="w-full">
                  Réclamer les gains
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
