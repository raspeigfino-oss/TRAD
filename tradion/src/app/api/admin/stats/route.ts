// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      totalRewards,
      activeCycles,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "USER", status: "BLOCKED" } }),
      prisma.deposit.aggregate({ where: { status: "CONFIRMED" }, _sum: { amount: true }, _count: true }),
      prisma.withdrawal.aggregate({ where: { status: "APPROVED" }, _sum: { finalAmount: true }, _count: true }),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.pendingReward.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      prisma.investmentCycle.count({ where: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      blockedUsers,
      totalDeposited: totalDeposits._sum.amount ?? 0,
      depositCount: totalDeposits._count,
      totalWithdrawn: totalWithdrawals._sum.finalAmount ?? 0,
      withdrawalCount: totalWithdrawals._count,
      pendingWithdrawals,
      pendingRewardsTotal: totalRewards._sum.amount ?? 0,
      activeCycles,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
