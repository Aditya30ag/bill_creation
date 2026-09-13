import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "low-stock" | "success" | "primary" | "secondary" | "danger" | "outline";
}

export function Badge({
  className,
  variant = "secondary",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    // Low stock badge design tokens: #FEF3C7 bg, #D97706 text
    "low-stock": "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] font-medium",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
    primary: "bg-blue-50 text-[#2563EB] border border-blue-200 font-medium",
    secondary: "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium",
    danger: "bg-rose-50 text-rose-700 border border-rose-200 font-medium",
    outline: "bg-white text-[#0F172A] border border-[#E2E8F0]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
