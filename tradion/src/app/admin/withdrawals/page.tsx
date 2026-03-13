// src/app/admin/withdrawals/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, Button, Badge, Alert, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Withdrawal {
  id: string;
  requestedAmount: number;
  feeAmount: number;
  finalAmount: number;
  walletAddress: string;
  network: string;
  isEarlyWithdrawal: boolean;
  status: string;
  adminNote?: string;
  createdAt: string;
  user: { email: string; profile: { publicUserId: string } | null };
}

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger",
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/withdrawals");
    if (res.status === 403) { window.location.href = "/admin/login"; return; }
    const d = await res.json() as { withdrawals: Withdrawal[] };
    setWithdrawals(d.withdrawals ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function process(id: string, action: "APPROVED" | "REJECTED") {
    setProcessing(id);
    setMsg(null);
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, adminNote: noteMap[id] }),
    });
    const d = await res.json() as { error?: string };
    if (!res.ok) setMsg({ type: "error", text: d.error ?? "Erreur." });
    else { setMsg({ type: "success", text: `Retrait ${action === "APPROVED" ? "approuvé" : "refusé"}.` }); load(); }
    setProcessing(null);
  }

  const pending = withdrawals.filter(w => w.status === "PENDING");
  const done = withdrawals.filter(w => w.status !== "PENDING");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Retraits</h1>
          <p className="text-slate-400 text-sm mt-1">{pending.length} en attente de traitement</p>
        </div>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
        ) : (
          <>
            {/* Pending */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">En attente</h2>
              {pending.length === 0 ? (
                <Card><p className="text-slate-400 text-sm">Aucun retrait en attente. 🎉</p></Card>
              ) : (
                <div className="space-y-4">
                  {pending.map(w => (
                    <Card key={w.id} className="border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-semibold text-white">{w.user.email}</p>
                          <p className="text-sm text-slate-400">{w.user.profile?.publicUserId} • {formatDateTime(w.createdAt)}</p>
                        </div>
                        {w.isEarlyWithdrawal && (
                          <span className="flex items-center gap-1 text-amber-400 text-sm">
                            <AlertTriangle className="w-4 h-4" /> Retrait anticipé
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div><p className="text-slate-400 text-xs">Montant demandé</p><p className="text-white font-semibold">{formatCurrency(w.requestedAmount)}</p></div>
                        <div><p className="text-slate-400 text-xs">Frais {w.isEarlyWithdrawal ? "(25%)" : ""}</p><p className="text-red-400 font-semibold">{w.feeAmount > 0 ? `-${formatCurrency(w.feeAmount)}` : "—"}</p></div>
                        <div><p className="text-slate-400 text-xs">Montant final</p><p className="text-emerald-400 font-bold">{formatCurrency(w.finalAmount)}</p></div>
                      </div>

                      <div className="mb-4 p-3 bg-slate-800/60 rounded-xl text-sm">
                        <p className="text-slate-400 text-xs mb-1">Destination ({w.network})</p>
                        <p className="text-white font-mono break-all">{w.walletAddress}</p>
                      </div>

                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Note admin (optionnel)"
                          value={noteMap[w.id] ?? ""}
                          onChange={e => setNoteMap(prev => ({ ...prev, [w.id]: e.target.value }))}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Button variant="danger" size="sm" loading={processing === w.id} onClick={() => process(w.id, "REJECTED")}>
                          <XCircle className="w-3.5 h-3.5" /> Refuser
                        </Button>
                        <Button size="sm" loading={processing === w.id} onClick={() => process(w.id, "APPROVED")}
                          className="bg-emerald-600 hover:bg-emerald-500">
                          <CheckCircle className="w-3.5 h-3.5" /> Approuver
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Done */}
            {done.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Traités</h2>
                <Card className="p-0 overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-700/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Utilisateur</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Montant final</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Statut</th>
                    </tr></thead>
                    <tbody>
                      {done.map(w => (
                        <tr key={w.id} className="border-b border-slate-800/50 last:border-0">
                          <td className="px-5 py-3 text-sm text-white">{w.user.email}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-emerald-400">{formatCurrency(w.finalAmount)}</td>
                          <td className="px-5 py-3 text-sm text-slate-400">{formatDateTime(w.createdAt)}</td>
                          <td className="px-5 py-3"><Badge variant={STATUS_BADGE[w.status] ?? "neutral"}>{w.status === "APPROVED" ? "Approuvé" : "Refusé"}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
