// src/app/api/signals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { redeemSignalCode } from "@/services/signal.service";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { code } = await req.json() as { code: string };
    if (!code?.trim()) return NextResponse.json({ error: "Code requis." }, { status: 400 });

    const result = await redeemSignalCode(auth.userId, code.trim().toUpperCase());
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({
      success: true,
      rewardApplied: result.rewardApplied,
      newBalance: result.newBalance,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
