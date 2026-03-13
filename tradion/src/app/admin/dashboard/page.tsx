// src/app/admin/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Users, ArrowUpFromLine, ArrowDownToLine, Gift, Activity, TrendingUp, AlertCircle, Zap } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalDeposited: number;
  depositCount: number;
  totalWithdrawn: number;
  withdrawalCount: number;
  pendingWithdrawals: number;
  pendingRewardsTotal: number;
  activeCycles: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => { if (r.status === 401 || r.status === 403) window.location.href = "/admin/login"; return r.json(); })
      .then((d: Stats) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Vue globale de la plateforme TRADION</p>
        </div>

        {stats?.pendingWithdrawals ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span><strong>{stats.pendingWithdrawals}</strong> demande(s) de retrait en attente de traitement.</span>
            <a href="/admin/withdrawals" className="ml-auto underline font-medium">Voir →</a>
          </div>
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Utilisateurs" value={stats?.totalUsers ?? 0} icon={<Users className="w-5 h-5" />} color="indigo" />
          <StatCard label="Comptes actifs" value={stats?.activeUsers ?? 0} icon={<Activity className="w-5 h-5" />} color="emerald" trend={`${stats?.blockedUsers} bloqué(s)`} />
          <StatCard label="Cycles actifs" value={stats?.activeCycles ?? 0} icon={<TrendingUp className="w-5 h-5" />} color="violet" />
          <StatCard label="Retraits en attente" value={stats?.pendingWithdrawals ?? 0} icon={<AlertCircle className="w-5 h-5" />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard label="Total déposé" value={formatCurrency(stats?.totalDeposited ?? 0)} icon={<ArrowDownToLine className="w-5 h-5" />} color="emerald"
            trend={`${stats?.depositCount} dépôts`} className="lg:col-span-1" />
          <StatCard label="Total retiré" value={formatCurrency(stats?.totalWithdrawn ?? 0)} icon={<ArrowUpFromLine className="w-5 h-5" />} color="rose"
            trend={`${stats?.withdrawalCount} retraits`} className="lg:col-span-1" />
          <StatCard label="Récompenses en attente" value={formatCurrency(stats?.pendingRewardsTotal ?? 0)} icon={<Gift className="w-5 h-5" />} color="violet"
            className="lg:col-span-1" />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/admin/users", label: "Gérer les utilisateurs", icon: Users, color: "indigo" },
            { href: "/admin/withdrawals", label: "Traiter les retraits", icon: ArrowUpFromLine, color: "amber" },
            { href: "/admin/signals", label: "Créer un signal", icon: Zap, color: "emerald" },
            { href: "/admin/rewards", label: "Attribuer une récompense", icon: Gift, color: "violet" },
          ].map(({ href, label, icon: Icon, color }) => (
            <a key={href} href={href}
              className={`flex items-center gap-3 p-4 rounded-xl border bg-slate-800/40 border-slate-700/60 hover:border-${color}-500/40 hover:bg-${color}-500/10 transition-all group`}>
              <Icon className={`w-5 h-5 text-slate-400 group-hover:text-${color}-400`} />
              <span className="text-sm text-slate-300 font-medium">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
