import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100/80",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-100/80",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100/80",
        purple:
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-100/80",
        cyan: "border-transparent bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300 hover:bg-cyan-100/80",
        orange:
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 hover:bg-orange-100/80",
        pink: "border-transparent bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 hover:bg-pink-100/80",
        amber:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-100/80",
        emerald:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/80",
        gray: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  /**
   * Icon to display before the text
   */
  icon?: React.ReactNode;
}

/**
 * StatusBadge Component
 *
 * A versatile badge component for displaying status information with consistent styling.
 *
 * @example
 * ```tsx
 * import { StatusBadge } from "@/components/ui/status-badge";
 * import { Check } from "lucide-react";
 *
 * <StatusBadge variant="success" icon={<Check className="h-3 w-3" />}>
 *   Completed
 * </StatusBadge>
 * ```
 */
function StatusBadge({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="mr-1 inline-flex">{icon}</span>}
      {children}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };
