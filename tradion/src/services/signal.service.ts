// src/services/signal.service.ts
import { prisma } from "@/lib/prisma";
import type { SignalCodeStatus } from "@prisma/client";

export interface RedeemResult {
  success: boolean;
  error?: string;
  rewardApplied?: number;
  newBalance?: number;
}

export async function redeemSignalCode(userId: string, code: string): Promise<RedeemResult> {
  const signalCode = await prisma.signalCode.findUnique({ where: { code } });

  if (!signalCode) return { success: false, error: "Code invalide." };
  if (signalCode.status !== "ACTIVE") return { success: false, error: "Ce code est désactivé ou expiré." };
  if (signalCode.expiresAt && signalCode.expiresAt < new Date()) {
    await prisma.signalCode.update({ where: { id: signalCode.id }, data: { status: "EXPIRED" } });
    return { success: false, error: "Ce code a expiré." };
  }
  if (signalCode.maxUses !== null && signalCode.currentUses >= signalCode.maxUses) {
    return { success: false, error: "Ce code a atteint son nombre maximum d'utilisations." };
  }

  // Check already redeemed
  const existing = await prisma.signalRedemption.findUnique({
    where: { userId_signalCodeId: { userId, signalCodeId: signalCode.id } },
  });
  if (existing) return { success: false, error: "Vous avez déjà utilisé ce code." };

  // Get active cycle
  const cycle = await prisma.investmentCycle.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
  });
  if (!cycle) return { success: false, error: "Aucun cycle d'investissement actif trouvé." };

  // Calculate reward
  let rewardApplied = 0;
  if (signalCode.rewardType === "PERCENTAGE") {
    rewardApplied = (cycle.currentCapital * signalCode.rewardValue) / 100;
  } else {
    rewardApplied = signalCode.rewardValue;
  }

  // Transaction
  await prisma.$transaction([
    prisma.investmentCycle.update({
      where: { id: cycle.id },
      data: { currentCapital: { increment: rewardApplied } },
    }),
    prisma.signalRedemption.create({
      data: { userId, signalCodeId: signalCode.id, rewardApplied },
    }),
    prisma.signalCode.update({
      where: { id: signalCode.id },
      data: { currentUses: { increment: 1 } },
    }),
    prisma.balanceHistory.create({
      data: {
        userId,
        type: "SIGNAL_GAIN",
        amount: rewardApplied,
        description: `Signal ${code} (+${signalCode.rewardValue}%)`,
      },
    }),
  ]);

  return {
    success: true,
    rewardApplied,
    newBalance: cycle.currentCapital + rewardApplied,
  };
}

export async function createSignalCode(data: {
  code: string;
  rewardType: string;
  rewardValue: number;
  expiresAt?: Date;
  maxUses?: number;
}) {
  return prisma.signalCode.create({ data });
}

export async function toggleSignalCode(id: string, status: SignalCodeStatus) {
  return prisma.signalCode.update({ where: { id }, data: { status } });
}
