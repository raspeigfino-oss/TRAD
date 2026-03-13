// src/app/(user)/withdrawals/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, Button, Input, Alert, Badge, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowUpFromLine, AlertTriangle } from "lucide-react";

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
}

interface Preview {
  isEarlyWithdrawal: boolean;
  feeAmount: number;
  finalAmount: number;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Approuvé", PENDING: "En attente", REJECTED: "Rejeté",
};
const NETWORKS = ["TRC20", "BEP20"];

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/withdrawals");
    if (res.status === 401) { window.location.href = "/login"; return; }
    const d = await res.json() as { withdrawals: Withdrawal[] };
    setWithdrawals(d.withdrawals ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPreview(null);
    setConfirmed(false);
    if (Number(amount) < 50) { setMsg({ type: "error", text: "Minimum 50 USDT." }); return; }
    if (!wallet) { setMsg({ type: "error", text: "Adresse wallet requise." }); return; }
    // Quick preview from client-side (real check is server-side)
    setPreview({ isEarlyWithdrawal: true, feeAmount: Number(amount) * 0.25, finalAmount: Number(amount) * 0.75 });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), walletAddress: wallet, network }),
      });
      const d = await res.json() as { error?: string; isEarlyWithdrawal?: boolean; finalAmount?: number };
      if (!res.ok) { setMsg({ type: "error", text: d.error ?? "Erreur." }); return; }
      setMsg({ type: "success", text: "Votre demande de retrait a été soumise." });
      setAmount(""); setWallet(""); setPreview(null); setConfirmed(false);
      load();
    } catch { setMsg({ type: "error", text: "Erreur réseau." }); }
    finally { setSubmitting(false); }
  }

  return (
    <UserLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Retraits</h1>
          <p className="text-slate-400 text-sm mt-1">Retirez vos fonds vers votre wallet externe</p>
        </div>

        <Card>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-amber-400" />
            Nouvelle demande
          </h2>

          {msg && <div className="mb-4"><Alert type={msg.type}>{msg.text}</Alert></div>}

          {!preview ? (
            <form onSubmit={handlePreview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Réseau</label>
                <div className="flex gap-2">
                  {NETWORKS.map(n => (
                    <button type="button" key={n} onClick={() => setNetwork(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        network === n
                          ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Montant (USDT)" type="number" min="50" placeholder="Min. 50 USDT"
                value={amount} onChange={e => setAmount(e.target.value)} required />
              <Input label="Adresse wallet de destination" type="text" placeholder="Votre adresse USDT"
                value={wallet} onChange={e => setWallet(e.target.value)} required />
              <Button type="submit" className="w-full">Vérifier le retrait</Button>
            </form>
          ) : (
            <div className="space-y-4">
              {preview.isEarlyWithdrawal && (
                <Alert type="warning" title="⚠️ Retrait anticipé">
                  Vous demandez un retrait avant d'avoir doublé votre capital dans ce cycle.
                  Des frais de <strong>25 %</strong> seront appliqués automatiquement.
                  Voulez-vous continuer ?
                </Alert>
              )}

              <div className="space-y-2 p-4 bg-slate-800/60 rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant demandé</span>
                  <span className="text-white font-medium">{formatCurrency(Number(amount))}</span>
                </div>
                {preview.isEarlyWithdrawal && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frais anticipé (25%)</span>
                    <span className="text-red-400 font-medium">-{formatCurrency(preview.feeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-300 font-semibold">Montant final reçu</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(preview.finalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Destination</span>
                  <span className="text-slate-300 font-mono">{wallet.slice(0, 16)}...</span>
                </div>
              </div>

              {preview.isEarlyWithdrawal && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-600" />
                  <span className="text-sm text-slate-300">
                    Je comprends les frais de retrait anticipé et je confirme ma demande.
                  </span>
                </label>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPreview(null)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={preview.isEarlyWithdrawal && !confirmed}
                  className="flex-1"
                >
                  Confirmer le retrait
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* History */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Historique des retraits</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : withdrawals.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucun retrait pour l'instant.</p>
          ) : (
            <div className="space-y-1">
              {withdrawals.map(w => (
                <div key={w.id} className="py-3 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{formatCurrency(w.finalAmount)}</p>
                        {w.isEarlyWithdrawal && (
                          <span className="text-xs text-amber-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Anticipé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{w.network} • {formatDateTime(w.createdAt)}</p>
                      {w.adminNote && <p className="text-xs text-slate-500 mt-1">Note : {w.adminNote}</p>}
                    </div>
                    <Badge variant={STATUS_BADGE[w.status] ?? "neutral"}>{STATUS_LABEL[w.status] ?? w.status}</Badge>
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
