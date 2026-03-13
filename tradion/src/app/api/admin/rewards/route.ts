// src/app/api/admin/rewards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assignPendingReward } from "@/services/reward.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const rewards = await prisma.pendingReward.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ rewards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { userId, amount, reason } = await req.json() as {
      userId: string;
      amount: number;
      reason: string;
    };

    if (!userId || !amount || !reason) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const reward = await assignPendingReward(userId, amount, reason);
    await prisma.adminAction.create({
      data: {
        adminUserId: admin.userId,
        actionType: "ASSIGN_REWARD",
        targetUserId: userId,
        metadata: { amount, reason },
      },
    });

    return NextResponse.json({ success: true, reward }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
