// src/services/reward.service.ts
import { prisma } from "@/lib/prisma";

export async function claimPendingRewards(userId: string) {
  const rewards = await prisma.pendingReward.findMany({
    where: { userId, status: "PENDING" },
  });

  if (rewards.length === 0) return { success: false, error: "Aucun gain en attente." };

  const total = rewards.reduce((s, r) => s + r.amount, 0);

  const cycle = await prisma.investmentCycle.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
  });

  if (!cycle) return { success: false, error: "Aucun cycle actif pour recevoir les gains." };

  await prisma.$transaction([
    prisma.pendingReward.updateMany({
      where: { userId, status: "PENDING" },
      data: { status: "CLAIMED", claimedAt: new Date() },
    }),
    prisma.investmentCycle.update({
      where: { id: cycle.id },
      data: { currentCapital: { increment: total } },
    }),
    prisma.balanceHistory.create({
      data: {
        userId,
        type: "REWARD_CLAIMED",
        amount: total,
        description: `Gains réclamés (${rewards.length} récompense(s))`,
      },
    }),
  ]);

  return { success: true, total };
}

export async function assignPendingReward(userId: string, amount: number, reason: string) {
  return prisma.pendingReward.create({
    data: { userId, amount, reason },
  });
}
