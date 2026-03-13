// src/app/api/admin/withdrawals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processWithdrawal } from "@/services/withdrawal.service";

export async function GET() {
  try {
    await requireAdmin();
    const withdrawals = await prisma.withdrawal.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ withdrawals });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { id, action, adminNote } = await req.json() as {
      id: string;
      action: "APPROVED" | "REJECTED";
      adminNote?: string;
    };

    const result = await processWithdrawal(id, action, adminNote);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    await prisma.adminAction.create({
      data: {
        adminUserId: admin.userId,
        actionType: action === "APPROVED" ? "APPROVE_WITHDRAWAL" : "REJECT_WITHDRAWAL",
        metadata: { withdrawalId: id, adminNote },
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
