// src/app/(user)/history/page.tsx
"use client";
import { useEffect, useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { Card, Badge, Spinner } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface HistoryItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Dépôt", WITHDRAWAL: "Retrait", SIGNAL_GAIN: "Signal",
  REWARD_CLAIMED: "Récompense", BONUS: "Bonus", FEE: "Frais",
};
const TYPE_BADGE: Record<string, "success" | "danger" | "info" | "warning" | "neutral"> = {
  DEPOSIT: "success", WITHDRAWAL: "danger", SIGNAL_GAIN: "info",
  REWARD_CLAIMED: "warning", BONUS: "success", FEE: "danger",
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/history")
      .then(r => { if (r.status === 401) { window.location.href = "/login"; } return r.json(); })
      .then((d: { history: HistoryItem[] }) => setHistory(d.history ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique</h1>
          <p className="text-slate-400 text-sm mt-1">Toutes vos transactions et mouvements</p>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
          ) : history.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune transaction pour l'instant.</p>
          ) : (
            <div className="space-y-0">
              {history.map((h, i) => (
                <div key={h.id} className={`flex items-center justify-between py-3.5 ${i < history.length - 1 ? "border-b border-slate-800/60" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Badge variant={TYPE_BADGE[h.type] ?? "neutral"}>{TYPE_LABELS[h.type] ?? h.type}</Badge>
                    <div>
                      <p className="text-sm text-slate-200">{h.description}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(h.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${h.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {h.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(h.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </UserLayout>
  );
}
