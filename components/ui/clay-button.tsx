import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * ClayButton - A Neo-Claymorphism style button component
 * 
 * Features:
 * - Tactile press effect with inset shadow on :active
 * - Scale animation on press
 * - Multiple variants matching design system
 */

const clayButtonVariants = cva(
  // Base styles - the foundation of our clay button
  [
    "relative inline-flex items-center justify-center gap-2",
    "rounded-2xl font-semibold",
    "transition-all duration-150 ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    // Press animation
    "active:scale-[0.97] active:shadow-clay-pressed",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - Amber gold, the main CTA
        primary: [
          "bg-gradient-to-br from-aura-gold to-aura-gold-dark",
          "text-stone-900 font-bold",
          "shadow-clay",
          "hover:from-aura-gold-light hover:to-aura-gold",
          "border border-aura-gold-dark/20",
        ].join(" "),
        
        // Secondary - Neutral stone
        secondary: [
          "bg-stone-100 dark:bg-stone-800",
          "text-stone-700 dark:text-stone-200",
          "shadow-clay",
          "hover:bg-stone-200 dark:hover:bg-stone-700",
          "border border-stone-200 dark:border-stone-700",
        ].join(" "),
        
        // Ghost - Minimal, transparent
        ghost: [
          "bg-transparent",
          "text-stone-600 dark:text-stone-400",
          "hover:bg-stone-100 dark:hover:bg-stone-800",
          "shadow-none",
        ].join(" "),
        
        // Outline - Bordered
        outline: [
          "bg-transparent",
          "text-stone-700 dark:text-stone-200",
          "border-2 border-stone-300 dark:border-stone-600",
          "hover:bg-stone-100 dark:hover:bg-stone-800",
          "shadow-none",
        ].join(" "),
        
        // Danger - For destructive actions
        danger: [
          "bg-aura-red/10",
          "text-aura-red",
          "shadow-clay",
          "hover:bg-aura-red/20",
          "border border-aura-red/20",
        ].join(" "),
        
        // Success - For positive confirmations
        success: [
          "bg-aura-green/10",
          "text-aura-green",
          "shadow-clay",
          "hover:bg-aura-green/20",
          "border border-aura-green/20",
        ].join(" "),
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-13 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

export interface ClayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof clayButtonVariants> {
  /** Render as a child component (for links, etc.) */
  asChild?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
}

const ClayButton = React.forwardRef<HTMLButtonElement, ClayButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leftIcon,
      rightIcon,
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(clayButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {/* Text content */}
        {children}
        
        {/* Right icon */}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);

ClayButton.displayName = "ClayButton";

export { ClayButton, clayButtonVariants };
