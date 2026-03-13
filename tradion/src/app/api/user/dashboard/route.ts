// src/app/api/user/dashboard/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDashboardData } from "@/services/user.service";

export async function GET() {
  try {
    const auth = await requireAuth();
    const data = await getDashboardData(auth.userId);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
