// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
        investmentCycles: { orderBy: { startedAt: "desc" } },
        deposits: { orderBy: { createdAt: "desc" }, take: 10 },
        withdrawals: { orderBy: { createdAt: "desc" }, take: 10 },
        pendingRewards: { orderBy: { createdAt: "desc" } },
        balanceHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        teamAsSponsor: {
          include: { child: { include: { profile: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const { action } = await req.json() as { action: "BLOCK" | "UNBLOCK" };

    const status = action === "BLOCK" ? "BLOCKED" : "ACTIVE";
    await prisma.user.update({ where: { id: params.id }, data: { status } });
    await prisma.adminAction.create({
      data: {
        adminUserId: admin.userId,
        actionType: action === "BLOCK" ? "BLOCK_USER" : "UNBLOCK_USER",
        targetUserId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    await prisma.adminAction.create({
      data: { adminUserId: admin.userId, actionType: "DELETE_USER", targetUserId: params.id },
    });
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
