// src/app/admin/rewards/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, Button, Input, Badge, Alert, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Gift, Plus } from "lucide-react";

interface Reward {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  claimedAt?: string;
  user: { email: string; profile: { publicUserId: string } | null };
}

interface UserOption {
  id: string;
  email: string;
  role: string;
  profile: { publicUserId: string } | null;
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    const [r, u] = await Promise.all([
      fetch("/api/admin/rewards").then(res => res.json()) as Promise<{ rewards: Reward[] }>,
      fetch("/api/admin/users").then(res => res.json()) as Promise<{ users: UserOption[] }>,
    ]);
    setRewards(r.rewards ?? []);
    setUsers((u.users ?? []).filter((u: UserOption) => u.role !== "ADMIN"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setMsg(null);
    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: Number(amount), reason }),
    });
    const d = await res.json() as { error?: string };
    if (!res.ok) setMsg({ type: "error", text: d.error ?? "Erreur." });
    else {
      setMsg({ type: "success", text: "Récompense attribuée avec succès." });
      setUserId(""); setAmount(""); setReason(""); setShowForm(false); load();
    }
    setSubmitting(false);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Récompenses</h1>
            <p className="text-slate-400 text-sm mt-1">
              {rewards.filter(r => r.status === "PENDING").length} en attente •{" "}
              {rewards.filter(r => r.status === "CLAIMED").length} réclamée(s)
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> Attribuer une récompense
          </Button>
        </div>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        {showForm && (
          <Card className="border-violet-500/20 bg-violet-500/5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-400" /> Nouvelle récompense
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Utilisateur</label>
                <select value={userId} onChange={e => setUserId(e.target.value)} required
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Sélectionner un utilisateur...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email} ({u.profile?.publicUserId})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Montant (USDT)" type="number" min="0.01" step="0.01" placeholder="25"
                  value={amount} onChange={e => setAmount(e.target.value)} required />
                <Input label="Raison" type="text" placeholder="Bonus anniversaire, Challenge..."
                  value={reason} onChange={e => setReason(e.target.value)} required />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Annuler</Button>
                <Button type="submit" loading={submitting} className="flex-1">Attribuer</Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Utilisateur</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Montant</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Raison</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Aucune récompense.</td></tr>
                ) : rewards.map(r => (
                  <tr key={r.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20">
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-white">{r.user.email}</p>
                      <p className="text-xs text-slate-500">{r.user.profile?.publicUserId}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-emerald-400">+{formatCurrency(r.amount)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{r.reason}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatDateTime(r.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={r.status === "CLAIMED" ? "success" : "warning"}>
                        {r.status === "CLAIMED" ? "Réclamé" : "En attente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
