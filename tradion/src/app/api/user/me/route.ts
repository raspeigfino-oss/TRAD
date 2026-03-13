// src/app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    return NextResponse.json(user);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
