import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[6px] border bg-white px-3 py-1.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8]",
          "border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]",
          "disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:opacity-75 transition-colors",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
