// src/app/admin/stats/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, StatCard, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Gift, Activity } from "lucide-react";

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

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then((d: Stats) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div></AdminLayout>;

  const netFlow = (stats?.totalDeposited ?? 0) - (stats?.totalWithdrawn ?? 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistiques globales</h1>
          <p className="text-slate-400 text-sm mt-1">Vue d'ensemble de la plateforme</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Utilisateurs totaux" value={stats?.totalUsers ?? 0} icon={<Users className="w-5 h-5" />} color="indigo" />
          <StatCard label="Comptes actifs" value={stats?.activeUsers ?? 0} icon={<Activity className="w-5 h-5" />} color="emerald" />
          <StatCard label="Cycles actifs" value={stats?.activeCycles ?? 0} icon={<TrendingUp className="w-5 h-5" />} color="violet" />
          <StatCard label="Total déposé" value={formatCurrency(stats?.totalDeposited ?? 0)} icon={<ArrowDownToLine className="w-5 h-5" />} color="emerald" trend={`${stats?.depositCount} transactions`} />
          <StatCard label="Total retiré" value={formatCurrency(stats?.totalWithdrawn ?? 0)} icon={<ArrowUpFromLine className="w-5 h-5" />} color="rose" trend={`${stats?.withdrawalCount} transactions`} />
          <StatCard label="Flux net" value={formatCurrency(netFlow)} icon={<TrendingUp className="w-5 h-5" />} color={netFlow >= 0 ? "emerald" : "rose"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-white mb-4">Utilisateurs</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total inscrits</span>
                <span className="text-white font-bold">{stats?.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Actifs</span>
                <span className="text-emerald-400 font-bold">{stats?.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Bloqués</span>
                <span className="text-red-400 font-bold">{stats?.blockedUsers}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
                  style={{ width: `${stats?.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-slate-500 text-right">
                {stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% actifs
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-4">Flux financiers</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Dépôts confirmés</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(stats?.totalDeposited ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Retraits approuvés</span>
                <span className="text-red-400 font-bold">{formatCurrency(stats?.totalWithdrawn ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Récompenses pendantes</span>
                <span className="text-violet-400 font-bold">{formatCurrency(stats?.pendingRewardsTotal ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                <span className="text-sm text-white font-semibold">Flux net</span>
                <span className={`font-bold ${netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
