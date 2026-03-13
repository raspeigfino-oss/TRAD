// src/app/api/deposits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEPOSIT_ADDRESSES: Record<string, string> = {
  TRC20: "TXxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  BEP20: "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};

export async function GET() {
  try {
    const auth = await requireAuth();
    const deposits = await prisma.deposit.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ deposits, addresses: DEPOSIT_ADDRESSES });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { amount, network, txHash } = await req.json() as {
      amount: number;
      network: string;
      txHash?: string;
    };

    if (!amount || amount < 50) {
      return NextResponse.json({ error: "Montant minimum : 50 USDT." }, { status: 400 });
    }
    if (!["TRC20", "BEP20"].includes(network)) {
      return NextResponse.json({ error: "Réseau invalide." }, { status: 400 });
    }

    const deposit = await prisma.deposit.create({
      data: { userId: auth.userId, amount, network, txHash },
    });

    return NextResponse.json({ success: true, deposit }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
