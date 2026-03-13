// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generatePublicUserId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `TRD-${num}`;
}

export function generateReferralCode(publicUserId: string): string {
  return publicUserId.replace("-", "");
}

export function generateReferralLink(referralCode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://tradion.app";
  return `${base}/register?ref=${referralCode}`;
}

export function formatCurrency(amount: number, symbol = "USDT"): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateSignalRate(signalCount: number): number {
  // 1 signal = 0.56%, each additional = +0.56%
  const rate = Math.min(signalCount, 4) * 0.56;
  return rate;
}

export function calculateEarlyWithdrawalFee(amount: number): { feeAmount: number; finalAmount: number } {
  const feeAmount = amount * 0.25;
  const finalAmount = amount - feeAmount;
  return { feeAmount, finalAmount };
}

export function isEarlyWithdrawal(initialCapital: number, currentCapital: number): boolean {
  return currentCapital < 2 * initialCapital;
}
