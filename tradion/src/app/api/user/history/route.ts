// src/app/api/user/history/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getBalanceHistory } from "@/services/user.service";

export async function GET() {
  try {
    const auth = await requireAuth();
    const history = await getBalanceHistory(auth.userId);
    return NextResponse.json({ history });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
