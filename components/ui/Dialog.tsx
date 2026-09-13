import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl" | "6xl" | "full";
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "lg",
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full rounded-[8px] bg-white border border-[#E2E8F0] shadow-lg flex flex-col max-h-[90vh] overflow-hidden",
          maxWidthStyles[maxWidth],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div>
              {title && <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>}
              {description && (
                <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}
