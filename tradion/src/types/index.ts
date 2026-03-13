// src/types/index.ts

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING";
export type CycleStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type DepositStatus = "PENDING" | "CONFIRMED" | "REJECTED";
export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RewardStatus = "PENDING" | "CLAIMED";
export type SignalCodeStatus = "ACTIVE" | "DISABLED" | "EXPIRED";
export type BalanceHistoryType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "SIGNAL_GAIN"
  | "REWARD_CLAIMED"
  | "BONUS"
  | "FEE";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
