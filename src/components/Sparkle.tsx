import { cn } from "@/lib/utils";

interface SparkleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "magenta" | "orange" | "green" | "purple";
}

export const Sparkle = ({ className, size = "md", color = "magenta" }: SparkleProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const colorClasses = {
    magenta: "text-primary",
    orange: "text-projextpal-orange",
    green: "text-projextpal-green",
    purple: "text-projextpal-purple",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn(sizeClasses[size], colorClasses[color], "sparkle-animation", className)}
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
};
