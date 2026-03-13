// src/app/(user)/deposits/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, Button, Input, Alert, Badge, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Copy, Check, ArrowDownToLine } from "lucide-react";

interface Deposit {
  id: string;
  amount: number;
  network: string;
  status: string;
  txHash?: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  REJECTED: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmé",
  PENDING: "En attente",
  REJECTED: "Rejeté",
};

const NETWORKS = ["TRC20", "BEP20"];
const WALLET_ADDRESSES: Record<string, string> = {
  TRC20: "TXxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  BEP20: "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState("TRC20");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/deposits");
    if (res.status === 401) { window.location.href = "/login"; return; }
    const d = await res.json() as { deposits: Deposit[] };
    setDeposits(d.deposits ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function copyAddress() {
    navigator.clipboard.writeText(WALLET_ADDRESSES[network]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (Number(amount) < 50) { setMsg({ type: "error", text: "Montant minimum : 50 USDT." }); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), network, txHash: txHash || undefined }),
      });
      const d = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "error", text: d.error ?? "Erreur." }); return; }
      setMsg({ type: "success", text: "Votre dépôt a été enregistré. Il sera confirmé après vérification." });
      setAmount(""); setTxHash("");
      load();
    } catch { setMsg({ type: "error", text: "Erreur réseau." }); }
    finally { setSubmitting(false); }
  }

  return (
    <UserLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dépôts</h1>
          <p className="text-slate-400 text-sm mt-1">Déposez des fonds en USDT sur votre compte</p>
        </div>

        {/* Deposit form */}
        <Card>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            Nouveau dépôt
          </h2>

          {msg && <div className="mb-4"><Alert type={msg.type}>{msg.text}</Alert></div>}

          {/* Network selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Réseau</label>
            <div className="flex gap-2">
              {NETWORKS.map(n => (
                <button key={n} onClick={() => setNetwork(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    network === n
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet address */}
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Adresse de dépôt ({network})</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-white font-mono break-all">{WALLET_ADDRESSES[network]}</p>
              <button onClick={copyAddress} className="shrink-0 p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Alert type="warning" title="Important">
            Envoyez uniquement des USDT sur le réseau {network}. Minimum conseillé : 50 USDT.
            Après envoi, renseignez le hash de la transaction ci-dessous.
          </Alert>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Montant déposé (USDT)"
              type="number"
              min="50"
              placeholder="Ex: 100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <Input
              label="Hash de transaction (optionnel)"
              type="text"
              placeholder="0x... ou TX..."
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
            />
            <Button type="submit" loading={submitting} className="w-full">
              Soumettre le dépôt
            </Button>
          </form>
        </Card>

        {/* History */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Historique des dépôts</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : deposits.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucun dépôt pour l'instant.</p>
          ) : (
            <div className="space-y-1">
              {deposits.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{formatCurrency(d.amount)}</p>
                    <p className="text-xs text-slate-400">{d.network} • {formatDateTime(d.createdAt)}</p>
                    {d.txHash && <p className="text-xs text-slate-500 font-mono">{d.txHash.slice(0, 20)}...</p>}
                  </div>
                  <Badge variant={STATUS_BADGE[d.status] ?? "neutral"}>{STATUS_LABEL[d.status] ?? d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </UserLayout>
  );
}
