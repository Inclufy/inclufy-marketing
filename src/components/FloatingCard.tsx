import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delayed?: boolean;
}

export const FloatingCard = ({ children, className, delayed }: FloatingCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-3 shadow-lg border border-border",
        delayed ? "float-animation-delayed" : "float-animation",
        className
      )}
    >
      {children}
    </div>
  );
};
