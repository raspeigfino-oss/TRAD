// src/app/api/withdrawals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createWithdrawalRequest } from "@/services/withdrawal.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ withdrawals });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { amount, walletAddress, network } = await req.json() as {
      amount: number;
      walletAddress: string;
      network: string;
    };

    if (!amount || !walletAddress || !network) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const result = await createWithdrawalRequest(auth.userId, amount, walletAddress, network);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({
      success: true,
      withdrawal: result.withdrawal,
      isEarlyWithdrawal: result.isEarlyWithdrawal,
      feeAmount: result.feeAmount,
      finalAmount: result.finalAmount,
    }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
