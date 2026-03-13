// src/app/api/admin/signals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, buildSignalMessage } from "@/services/telegram.service";

export async function GET() {
  try {
    await requireAdmin();
    const codes = await prisma.signalCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    });
    return NextResponse.json({ codes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { code, rewardType, rewardValue, expiresAt, maxUses, sendToTelegram } = await req.json() as {
      code: string;
      rewardType: string;
      rewardValue: number;
      expiresAt?: string;
      maxUses?: number;
      sendToTelegram?: boolean;
    };

    if (!code || !rewardValue) {
      return NextResponse.json({ error: "Code et valeur requis." }, { status: 400 });
    }

    const signal = await prisma.signalCode.create({
      data: {
        code: code.toUpperCase(),
        rewardType: rewardType ?? "PERCENTAGE",
        rewardValue,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        maxUses: maxUses ?? null,
      },
    });

    let telegramResult = null;
    if (sendToTelegram) {
      const msg = buildSignalMessage(signal.code, signal.rewardValue, signal.expiresAt);
      telegramResult = await sendTelegramMessage(msg);
      if (telegramResult.success) {
        await prisma.signalCode.update({
          where: { id: signal.id },
          data: { telegramSent: true, telegramMsgId: telegramResult.messageId },
        });
      }
    }

    return NextResponse.json({ success: true, signal, telegramResult }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const { id, status } = await req.json() as { id: string; status: string };
    const updated = await prisma.signalCode.update({
      where: { id },
      data: { status: status as "ACTIVE" | "DISABLED" },
    });
    return NextResponse.json({ success: true, signal: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
