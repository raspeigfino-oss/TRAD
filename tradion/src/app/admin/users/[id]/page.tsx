// src/app/admin/users/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, Button, Badge, Alert, Input, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Shield, ShieldOff, Trash2, Gift } from "lucide-react";

interface UserDetail {
  id: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  profile: { publicUserId: string; referralCode: string; referralLink: string } | null;
  investmentCycles: Array<{ id: string; initialCapital: number; currentCapital: number; status: string; startedAt: string; endsAt: string }>;
  deposits: Array<{ id: string; amount: number; network: string; status: string; createdAt: string }>;
  withdrawals: Array<{ id: string; requestedAmount: number; finalAmount: number; status: string; createdAt: string }>;
  pendingRewards: Array<{ id: string; amount: number; reason: string; status: string; createdAt: string }>;
  balanceHistory: Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>;
}

export default function AdminUserDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardReason, setRewardReason] = useState("");
  const [rewardLoading, setRewardLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/users/${id}`);
    if (res.status === 403) { router.push("/admin/login"); return; }
    const d = await res.json() as { user: UserDetail };
    setUser(d.user);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function toggleBlock() {
    if (!user) return;
    setActionLoading(true);
    setMsg(null);
    const action = user.status === "ACTIVE" ? "BLOCK" : "UNBLOCK";
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json() as { error?: string };
    if (!res.ok) setMsg({ type: "error", text: d.error ?? "Erreur." });
    else { setMsg({ type: "success", text: `Compte ${action === "BLOCK" ? "bloqué" : "débloqué"}.` }); load(); }
    setActionLoading(false);
  }

  async function deleteUser() {
    if (!confirm("Supprimer définitivement cet utilisateur ? Cette action est irréversible.")) return;
    setActionLoading(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    router.push("/admin/users");
  }

  async function assignReward(e: React.FormEvent) {
    e.preventDefault();
    if (!rewardAmount || !rewardReason) return;
    setRewardLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, amount: Number(rewardAmount), reason: rewardReason }),
    });
    const d = await res.json() as { error?: string };
    if (!res.ok) setMsg({ type: "error", text: d.error ?? "Erreur." });
    else { setMsg({ type: "success", text: "Récompense attribuée." }); setRewardAmount(""); setRewardReason(""); load(); }
    setRewardLoading(false);
  }

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div></AdminLayout>;
  if (!user) return <AdminLayout><p className="text-slate-400">Utilisateur introuvable.</p></AdminLayout>;

  const activeCycle = user.investmentCycles.find(c => c.status === "ACTIVE");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.email}</h1>
            <p className="text-slate-400 text-sm">{user.profile?.publicUserId}</p>
          </div>
          <Badge variant={user.status === "ACTIVE" ? "success" : "danger"} className="ml-auto">
            {user.status === "ACTIVE" ? "Actif" : "Bloqué"}
          </Badge>
        </div>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="space-y-4">
            {/* Info */}
            <Card>
              <h3 className="font-semibold text-white mb-3">Informations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="text-white">{user.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ID</span><span className="text-white font-mono">{user.profile?.publicUserId}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Code parrain</span><span className="text-white font-mono">{user.profile?.referralCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Inscrit le</span><span className="text-white">{formatDateTime(user.createdAt)}</span></div>
              </div>
            </Card>

            {/* Cycle */}
            {activeCycle && (
              <Card>
                <h3 className="font-semibold text-white mb-3">Cycle actif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Capital initial</span><span className="text-white">{formatCurrency(activeCycle.initialCapital)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Capital actuel</span><span className="text-emerald-400 font-bold">{formatCurrency(activeCycle.currentCapital)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Progression x2</span>
                    <span className="text-white">{Math.min(100, (activeCycle.currentCapital / (activeCycle.initialCapital * 2) * 100)).toFixed(0)}%</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <h3 className="font-semibold text-white mb-3">Actions admin</h3>
              <div className="space-y-2">
                <Button
                  variant={user.status === "ACTIVE" ? "danger" : "secondary"}
                  size="sm" className="w-full" loading={actionLoading} onClick={toggleBlock}
                >
                  {user.status === "ACTIVE" ? <><ShieldOff className="w-3.5 h-3.5" /> Bloquer le compte</> : <><Shield className="w-3.5 h-3.5" /> Débloquer le compte</>}
                </Button>
                <Button variant="danger" size="sm" className="w-full" onClick={deleteUser} loading={actionLoading}>
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer définitivement
                </Button>
              </div>
            </Card>

            {/* Assign reward */}
            <Card>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-violet-400" /> Attribuer une récompense
              </h3>
              <form onSubmit={assignReward} className="space-y-3">
                <Input label="Montant (USDT)" type="number" min="0.01" step="0.01" placeholder="Ex: 25"
                  value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} required />
                <Input label="Raison" type="text" placeholder="Ex: Bonus anniversaire"
                  value={rewardReason} onChange={e => setRewardReason(e.target.value)} required />
                <Button type="submit" size="sm" className="w-full" loading={rewardLoading}>
                  Attribuer
                </Button>
              </form>
            </Card>
          </div>

          {/* Right: history */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="font-semibold text-white mb-3">Historique récent</h3>
              {user.balanceHistory.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune transaction.</p>
              ) : (
                <div className="space-y-0">
                  {user.balanceHistory.map((h, i) => (
                    <div key={h.id} className={`flex justify-between py-2.5 ${i < user.balanceHistory.length - 1 ? "border-b border-slate-800/50" : ""}`}>
                      <div>
                        <p className="text-sm text-slate-200">{h.description}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(h.createdAt)}</p>
                      </div>
                      <p className={`text-sm font-semibold ${h.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {h.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(h.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-semibold text-white mb-3">Récompenses en attente</h3>
              {user.pendingRewards.filter(r => r.status === "PENDING").length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune récompense en attente.</p>
              ) : (
                <div className="space-y-2">
                  {user.pendingRewards.filter(r => r.status === "PENDING").map(r => (
                    <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                      <div>
                        <p className="text-sm text-white">{r.reason}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                      </div>
                      <p className="text-sm font-bold text-violet-400">+{formatCurrency(r.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
