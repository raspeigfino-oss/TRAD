// src/app/api/user/claim-rewards/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { claimPendingRewards } from "@/services/reward.service";

export async function POST() {
  try {
    const auth = await requireAuth();
    const result = await claimPendingRewards(auth.userId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, total: result.total });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
