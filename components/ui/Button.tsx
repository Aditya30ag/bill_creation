import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] border border-transparent shadow-none",
      secondary: "bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] border border-[#E2E8F0]",
      outline: "bg-white text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0]",
      danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
      ghost: "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-[6px] gap-1.5",
      md: "h-9 px-4 text-sm rounded-[6px] gap-2",
      lg: "h-11 px-5 text-base rounded-[6px] gap-2.5",
      icon: "h-9 w-9 p-0 rounded-[6px]",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
