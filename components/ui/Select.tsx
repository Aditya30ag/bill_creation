import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-[6px] border bg-white px-3 py-1 text-sm text-[#0F172A]",
          "border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]",
          "disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:opacity-75 transition-colors cursor-pointer",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
