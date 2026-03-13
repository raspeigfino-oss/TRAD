// src/services/withdrawal.service.ts
import { prisma } from "@/lib/prisma";
import { isEarlyWithdrawal, calculateEarlyWithdrawalFee } from "@/lib/utils";

const MIN_WITHDRAWAL = 50;

export async function createWithdrawalRequest(
  userId: string,
  requestedAmount: number,
  walletAddress: string,
  network: string
) {
  if (requestedAmount < MIN_WITHDRAWAL) {
    return { success: false, error: `Le montant minimum de retrait est ${MIN_WITHDRAWAL} USDT.` };
  }

  const cycle = await prisma.investmentCycle.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
  });

  if (!cycle) return { success: false, error: "Aucun cycle actif." };
  if (cycle.currentCapital < requestedAmount) {
    return { success: false, error: "Solde insuffisant." };
  }

  const early = isEarlyWithdrawal(cycle.initialCapital, cycle.currentCapital);
  let feeAmount = 0;
  let finalAmount = requestedAmount;

  if (early) {
    const calc = calculateEarlyWithdrawalFee(requestedAmount);
    feeAmount = calc.feeAmount;
    finalAmount = calc.finalAmount;
  }

  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      requestedAmount,
      feeAmount,
      finalAmount,
      walletAddress,
      network,
      isEarlyWithdrawal: early,
    },
  });

  return { success: true, withdrawal, isEarlyWithdrawal: early, feeAmount, finalAmount };
}

export async function processWithdrawal(
  withdrawalId: string,
  action: "APPROVED" | "REJECTED",
  adminNote?: string
) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });
  if (!withdrawal) return { success: false, error: "Retrait introuvable." };
  if (withdrawal.status !== "PENDING") return { success: false, error: "Ce retrait a déjà été traité." };

  if (action === "APPROVED") {
    const cycle = await prisma.investmentCycle.findFirst({
      where: { userId: withdrawal.userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
    });
    if (!cycle) return { success: false, error: "Cycle introuvable." };

    await prisma.$transaction([
      prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: "APPROVED", adminNote } }),
      prisma.investmentCycle.update({
        where: { id: cycle.id },
        data: { currentCapital: { decrement: withdrawal.requestedAmount } },
      }),
      prisma.balanceHistory.create({
        data: {
          userId: withdrawal.userId,
          type: "WITHDRAWAL",
          amount: -withdrawal.finalAmount,
          description: `Retrait ${action === "APPROVED" ? "approuvé" : "refusé"} — ${withdrawal.network}`,
        },
      }),
    ]);
  } else {
    await prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: "REJECTED", adminNote } });
  }

  return { success: true };
}
