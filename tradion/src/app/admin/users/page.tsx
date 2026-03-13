// src/app/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, Badge, Input, Spinner } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  profile: { publicUserId: string; referralCode: string } | null;
  investmentCycles: Array<{ currentCapital: number }>;
  _count: { teamAsSponsor: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(q = "") {
    setLoading(true);
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
    if (res.status === 403) { window.location.href = "/admin/login"; return; }
    const d = await res.json() as { users: User[] };
    setUsers(d.users?.filter(u => u.role !== "ADMIN") ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const STATUS_BADGE: Record<string, "success" | "danger" | "warning"> = {
    ACTIVE: "success", BLOCKED: "danger", PENDING: "warning",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
            <p className="text-slate-400 text-sm mt-1">{users.length} utilisateur(s)</p>
          </div>
        </div>

        <Input
          placeholder="Rechercher par email ou ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Équipe</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Inscrit le</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{u.email}</p>
                      <p className="text-xs text-slate-500 font-mono">{u.profile?.publicUserId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-emerald-400">
                        {u.investmentCycles[0] ? formatCurrency(u.investmentCycles[0].currentCapital) : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-300">{u._count.teamAsSponsor} membre(s)</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[u.status] ?? "neutral"}>
                        {u.status === "ACTIVE" ? "Actif" : u.status === "BLOCKED" ? "Bloqué" : u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-400">{formatDate(u.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${u.id}`} className="text-slate-400 hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
