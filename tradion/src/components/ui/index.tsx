// src/components/ui/index.tsx
"use client";
import { cn } from "@/lib/utils";
import React from "react";

// ─── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white focus:ring-indigo-500 shadow-lg shadow-indigo-500/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    ghost: "hover:bg-slate-800 text-slate-300 hover:text-white focus:ring-slate-500",
    outline: "border border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white focus:ring-indigo-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ className, glass, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        glass
          ? "bg-white/5 border-white/10 backdrop-blur-sm"
          : "bg-slate-800/60 border-slate-700/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  const variants = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    info: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    neutral: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</div>
        )}
        <input
          className={cn(
            "w-full rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500",
            "px-4 py-2.5 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "transition-all duration-200",
            leftIcon && "pl-10",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "indigo" | "violet" | "emerald" | "amber" | "rose";
  className?: string;
}

export function StatCard({ label, value, icon, trend, color = "indigo", className }: StatCardProps) {
  const colors = {
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400",
  };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-5", colors[color], className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-white/10">{icon}</div>
        {trend && <span className="text-xs text-emerald-400 font-medium">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm opacity-70">{label}</p>
    </div>
  );
}

// ─── Alert ─────────────────────────────────────────────────────────────────
interface AlertProps {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
}

export function Alert({ type = "info", title, children }: AlertProps) {
  const styles = {
    info: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    error: "bg-red-500/10 border-red-500/30 text-red-300",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  };

  return (
    <div className={cn("rounded-xl border p-4 text-sm", styles[type])}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      {children}
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-5 w-5 text-indigo-400", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
