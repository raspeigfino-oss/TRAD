// src/app/admin/signals/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, Button, Input, Badge, Alert, Spinner } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { Zap, Plus } from "lucide-react";

interface Signal {
  id: string;
  code: string;
  rewardType: string;
  rewardValue: number;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  status: string;
  telegramSent: boolean;
  createdAt: string;
  _count: { redemptions: number };
}

const STATUS_BADGE: Record<string, "success" | "danger" | "neutral"> = {
  ACTIVE: "success", DISABLED: "danger", EXPIRED: "neutral",
};

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [rewardValue, setRewardValue] = useState("0.56");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [sendTg, setSendTg] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/signals");
    if (res.status === 403) { window.location.href = "/admin/login"; return; }
    const d = await res.json() as { codes: Signal[] };
    setSignals(d.codes ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setMsg(null);
    const res = await fetch("/api/admin/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        rewardType: "PERCENTAGE",
        rewardValue: Number(rewardValue),
        expiresAt: expiresAt || undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        sendToTelegram: sendTg,
      }),
    });
    const d = await res.json() as { error?: string; telegramResult?: { success: boolean } };
    if (!res.ok) { setMsg({ type: "error", text: d.error ?? "Erreur." }); }
    else {
      const tgMsg = d.telegramResult ? (d.telegramResult.success ? " ✅ Envoyé sur Telegram." : " ⚠️ Telegram non configuré.") : "";
      setMsg({ type: "success", text: `Code créé avec succès.${tgMsg}` });
      setCode(""); setRewardValue("0.56"); setExpiresAt(""); setMaxUses(""); setSendTg(false);
      setShowForm(false);
      load();
    }
    setSubmitting(false);
  }

  async function toggleStatus(id: string, status: string) {
    const newStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await fetch("/api/admin/signals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    load();
  }

  const SIGNAL_RATES = [
    { label: "1 signal (0.56%)", value: "0.56" },
    { label: "2 signaux (1.12%)", value: "1.12" },
    { label: "3 signaux (1.68%)", value: "1.68" },
    { label: "4 signaux (2.24%)", value: "2.24" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Codes Signal</h1>
            <p className="text-slate-400 text-sm mt-1">{signals.length} code(s) créé(s)</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> Nouveau signal
          </Button>
        </div>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        {/* Create form */}
        {showForm && (
          <Card className="border-indigo-500/20 bg-indigo-500/5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Créer un code signal
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <Input label="Code" type="text" placeholder="SIG-ALPHA-001" value={code}
                onChange={e => setCode(e.target.value.toUpperCase())} required />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Taux de gain</label>
                <select value={rewardValue} onChange={e => setRewardValue(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {SIGNAL_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <Input label="Expiration" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              <Input label="Utilisation max (vide = illimité)" type="number" min="1" placeholder="100" value={maxUses} onChange={e => setMaxUses(e.target.value)} />

              <div className="col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendTg} onChange={e => setSendTg(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-600" />
                  <span className="text-sm text-slate-300">Envoyer automatiquement sur Telegram</span>
                </label>
              </div>

              <div className="col-span-2 flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Annuler</Button>
                <Button type="submit" loading={submitting} className="flex-1">Créer le code</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-slate-700/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Code</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Gain</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Utilisations</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Expiration</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Statut</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {signals.map(s => (
                  <tr key={s.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-mono font-bold text-white">{s.code}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(s.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-amber-400">{s.rewardValue}%</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {s.currentUses}{s.maxUses ? `/${s.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {s.expiresAt ? formatDateTime(s.expiresAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_BADGE[s.status] ?? "neutral"}>
                          {s.status === "ACTIVE" ? "Actif" : s.status === "DISABLED" ? "Désactivé" : "Expiré"}
                        </Badge>
                        {s.telegramSent && <span className="text-xs text-indigo-400">📱 TG</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.status !== "EXPIRED" && (
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(s.id, s.status)}>
                          {s.status === "ACTIVE" ? "Désactiver" : "Activer"}
                        </Button>
                      )}
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
