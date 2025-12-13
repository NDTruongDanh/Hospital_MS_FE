import * as React from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Text to display below the spinner
   */
  text?: string;
  /**
   * Whether to take up full screen height
   */
  fullScreen?: boolean;
  /**
   * Size of the spinner
   */
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  /**
   * Variant of the spinner
   */
  variant?: "default" | "secondary" | "destructive" | "muted" | "white";
}

/**
 * Loading Component
 *
 * A loading state component with a spinner and optional text.
 * Can be used for full-screen loading or inline loading states.
 *
 * @example
 * ```tsx
 * import { Loading } from "@/components/ui/loading";
 *
 * // Full screen loading
 * <Loading fullScreen text="Loading data..." />
 *
 * // Inline loading
 * <Loading text="Processing..." size="sm" />
 * ```
 */
function Loading({
  text = "Loading...",
  fullScreen = false,
  size = "xl",
  variant = "default",
  className,
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        fullScreen && "min-h-screen",
        !fullScreen && "py-8",
        className
      )}
      {...props}
    >
      <Spinner size={size} variant={variant} label={text} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

export { Loading };
