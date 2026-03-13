// prisma/seed.ts
import { PrismaClient, Role, UserStatus, CycleStatus, DepositStatus, WithdrawalStatus, SignalCodeStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generatePublicId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `TRD-${num}`;
}

function generateReferralCode(publicId: string): string {
  return publicId.replace("-", "");
}

async function main() {
  console.log("🌱 Seeding TRADION database...");

  // Admin
  const adminHash = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tradion.app" },
    update: {},
    create: {
      email: "admin@tradion.app",
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          publicUserId: "TRD-000001",
          referralCode: "TRD000001",
          referralLink: "https://tradion.app/register?ref=TRD000001",
        },
      },
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Users
  const userHash = await bcrypt.hash("user123!", 12);

  const aliceId = "TRD-112233";
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash: userHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          publicUserId: aliceId,
          referralCode: aliceId.replace("-", ""),
          referralLink: `https://tradion.app/register?ref=${aliceId.replace("-", "")}`,
        },
      },
    },
  });

  const bobId = "TRD-223344";
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash: userHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          publicUserId: bobId,
          referralCode: bobId.replace("-", ""),
          referralLink: `https://tradion.app/register?ref=${bobId.replace("-", "")}`,
        },
      },
    },
  });

  const carolId = "TRD-334455";
  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      passwordHash: userHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          publicUserId: carolId,
          referralCode: carolId.replace("-", ""),
          referralLink: `https://tradion.app/register?ref=${carolId.replace("-", "")}`,
        },
      },
    },
  });

  console.log("✅ Users created: alice, bob, carol");

  // Parrainage: alice -> bob (direct), alice -> carol (indirect via bob)
  await prisma.teamRelation.upsert({
    where: { sponsorUserId_childUserId: { sponsorUserId: alice.id, childUserId: bob.id } },
    update: {},
    create: { sponsorUserId: alice.id, childUserId: bob.id, level: 1 },
  });
  await prisma.teamRelation.upsert({
    where: { sponsorUserId_childUserId: { sponsorUserId: bob.id, childUserId: carol.id } },
    update: {},
    create: { sponsorUserId: bob.id, childUserId: carol.id, level: 1 },
  });
  await prisma.teamRelation.upsert({
    where: { sponsorUserId_childUserId: { sponsorUserId: alice.id, childUserId: carol.id } },
    update: {},
    create: { sponsorUserId: alice.id, childUserId: carol.id, level: 2 },
  });
  console.log("✅ Team relations created");

  // Investment cycles
  const now = new Date();
  const end40 = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);

  await prisma.investmentCycle.create({
    data: {
      userId: alice.id,
      initialCapital: 500,
      currentCapital: 612.5,
      startedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      status: CycleStatus.ACTIVE,
    },
  });

  await prisma.investmentCycle.create({
    data: {
      userId: bob.id,
      initialCapital: 200,
      currentCapital: 214.8,
      startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      endsAt: end40,
      status: CycleStatus.ACTIVE,
    },
  });
  console.log("✅ Investment cycles created");

  // Deposits
  await prisma.deposit.createMany({
    data: [
      { userId: alice.id, amount: 500, network: "TRC20", status: DepositStatus.CONFIRMED },
      { userId: bob.id, amount: 200, network: "BEP20", status: DepositStatus.CONFIRMED },
      { userId: carol.id, amount: 100, network: "TRC20", status: DepositStatus.PENDING },
    ],
  });
  console.log("✅ Deposits created");

  // Pending rewards
  await prisma.pendingReward.createMany({
    data: [
      { userId: alice.id, amount: 25, reason: "Bonus anniversaire" },
      { userId: alice.id, amount: 15, reason: "Challenge hebdomadaire" },
      { userId: bob.id, amount: 10, reason: "Bonus de bienvenue" },
    ],
  });
  console.log("✅ Pending rewards created");

  // Signal codes
  await prisma.signalCode.createMany({
    data: [
      {
        code: "SIG-ALPHA-001",
        rewardType: "PERCENTAGE",
        rewardValue: 0.56,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        maxUses: 100,
        status: SignalCodeStatus.ACTIVE,
      },
      {
        code: "SIG-BETA-002",
        rewardType: "PERCENTAGE",
        rewardValue: 1.12,
        expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        maxUses: 50,
        status: SignalCodeStatus.ACTIVE,
      },
      {
        code: "SIG-GAMMA-003",
        rewardType: "PERCENTAGE",
        rewardValue: 0.56,
        expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        maxUses: 100,
        status: SignalCodeStatus.EXPIRED,
      },
    ],
  });
  console.log("✅ Signal codes created");

  // Balance history for alice
  await prisma.balanceHistory.createMany({
    data: [
      { userId: alice.id, type: "DEPOSIT", amount: 500, description: "Dépôt initial TRC20", createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) },
      { userId: alice.id, type: "SIGNAL_GAIN", amount: 2.8, description: "Signal SIG-ALPHA-001 (+0.56%)", createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      { userId: alice.id, type: "SIGNAL_GAIN", amount: 6.16, description: "Signal SIG-BETA-002 (+1.12%)", createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      { userId: alice.id, type: "SIGNAL_GAIN", amount: 2.84, description: "Signal SIG-ALPHA-001 (+0.56%)", createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { userId: alice.id, type: "BONUS", amount: 25, description: "Bonus parrainage", createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { userId: bob.id, type: "DEPOSIT", amount: 200, description: "Dépôt BEP20", createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { userId: bob.id, type: "SIGNAL_GAIN", amount: 1.12, description: "Signal SIG-ALPHA-001 (+0.56%)", createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    ],
  });
  console.log("✅ Balance history created");

  // Withdrawal request
  await prisma.withdrawal.create({
    data: {
      userId: alice.id,
      requestedAmount: 100,
      feeAmount: 25,
      finalAmount: 75,
      walletAddress: "TXxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      network: "TRC20",
      isEarlyWithdrawal: true,
      status: WithdrawalStatus.PENDING,
    },
  });
  console.log("✅ Withdrawal created");

  console.log("\n🎉 Seed complete!\n");
  console.log("Test accounts:");
  console.log("  Admin : admin@tradion.app / admin123!");
  console.log("  Alice : alice@example.com / user123!");
  console.log("  Bob   : bob@example.com   / user123!");
  console.log("  Carol : carol@example.com / user123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
