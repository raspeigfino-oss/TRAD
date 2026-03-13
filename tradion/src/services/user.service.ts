// src/services/user.service.ts
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, signToken, setAuthCookie } from "@/lib/auth";
import { generatePublicUserId, generateReferralCode, generateReferralLink } from "@/lib/utils";

export async function registerUser(email: string, password: string, referralCode?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { success: false, error: "Cet email est déjà utilisé." };

  const passwordHash = await hashPassword(password);
  const publicUserId = generatePublicUserId();
  const refCode = generateReferralCode(publicUserId);
  const refLink = generateReferralLink(refCode);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: { publicUserId, referralCode: refCode, referralLink: refLink },
      },
    },
    include: { profile: true },
  });

  // Handle referral
  if (referralCode) {
    const sponsor = await prisma.profile.findUnique({
      where: { referralCode },
      include: { user: true },
    });
    if (sponsor) {
      // Direct relation (level 1)
      await prisma.teamRelation.create({
        data: { sponsorUserId: sponsor.userId, childUserId: user.id, level: 1 },
      });
      // Propagate to sponsor's sponsors (level 2+)
      const upperRelations = await prisma.teamRelation.findMany({
        where: { childUserId: sponsor.userId },
      });
      for (const rel of upperRelations) {
        await prisma.teamRelation.upsert({
          where: { sponsorUserId_childUserId: { sponsorUserId: rel.sponsorUserId, childUserId: user.id } },
          update: {},
          create: { sponsorUserId: rel.sponsorUserId, childUserId: user.id, level: rel.level + 1 },
        });
      }
    }
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(token);

  return { success: true, user };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) return { success: false, error: "Email ou mot de passe incorrect." };
  if (user.status === "BLOCKED") return { success: false, error: "Ce compte est bloqué." };

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return { success: false, error: "Email ou mot de passe incorrect." };

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(token);

  return { success: true, user };
}

export async function getDashboardData(userId: string) {
  const [cycle, pendingRewards, recentHistory, deposits, withdrawals] = await Promise.all([
    prisma.investmentCycle.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.pendingReward.findMany({ where: { userId, status: "PENDING" } }),
    prisma.balanceHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.deposit.aggregate({ where: { userId, status: "CONFIRMED" }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { userId, status: "APPROVED" }, _sum: { finalAmount: true } }),
  ]);

  const pendingTotal = pendingRewards.reduce((s, r) => s + r.amount, 0);

  // Growth chart: last 40 days
  const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
  const growthHistory = await prisma.balanceHistory.findMany({
    where: { userId, createdAt: { gte: fortyDaysAgo } },
    orderBy: { createdAt: "asc" },
  });

  return {
    cycle,
    pendingTotal,
    pendingRewards,
    recentHistory,
    totalDeposited: deposits._sum.amount ?? 0,
    totalWithdrawn: withdrawals._sum.finalAmount ?? 0,
    growthHistory,
  };
}

export async function getTeamStats(userId: string) {
  const relations = await prisma.teamRelation.findMany({
    where: { sponsorUserId: userId },
    include: { child: { include: { profile: true } } },
  });

  const direct = relations.filter((r) => r.level === 1);
  const indirect = relations.filter((r) => r.level > 1);

  return {
    directCount: direct.length,
    indirectCount: indirect.length,
    totalTeam: relations.length,
    members: relations,
  };
}

export async function getBalanceHistory(userId: string) {
  return prisma.balanceHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
