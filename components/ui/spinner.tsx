import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface SpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Screen reader text for accessibility
   */
  label?: string;
}

/**
 * Spinner Component
 *
 * A loading spinner with various sizes and color variants.
 *
 * @example
 * ```tsx
 * import { Spinner } from "@/components/ui/spinner";
 *
 * <Spinner size="lg" variant="primary" />
 * ```
 */
function Spinner({
  className,
  size,
  variant,
  label = "Loading...",
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export { Spinner, spinnerVariants };
