import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * ClayCard - A Neo-Claymorphism style card component
 * 
 * The "clay" effect creates a soft, tactile appearance using
 * dual shadows (light from top-left, dark from bottom-right)
 */

const clayCardVariants = cva(
  // Base styles
  "rounded-3xl transition-all duration-200",
  {
    variants: {
      variant: {
        elevated: [
          "bg-card",
          "shadow-clay",
          "border border-stone-100/50",
        ].join(" "),
        inset: [
          "bg-stone-100 dark:bg-stone-900",
          "shadow-clay-inset",
        ].join(" "),
        flat: [
          "bg-card",
          "border border-border",
        ].join(" "),
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer clay-hover active:shadow-clay-pressed active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "elevated",
      size: "md",
      interactive: false,
    },
  }
);

export interface ClayCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof clayCardVariants> {
  /** Element to render as */
  asChild?: boolean;
}

const ClayCard = React.forwardRef<HTMLDivElement, ClayCardProps>(
  ({ className, variant, size, interactive, children, onClick, ...props }, ref) => {
    // If onClick is provided, treat as interactive
    const isInteractive = interactive ?? !!onClick;

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          clayCardVariants({ variant, size, interactive: isInteractive }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ClayCard.displayName = "ClayCard";

/**
 * ClayCardHeader - Header section for ClayCard
 */
const ClayCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
ClayCardHeader.displayName = "ClayCardHeader";

/**
 * ClayCardTitle - Title element for ClayCard
 */
const ClayCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
ClayCardTitle.displayName = "ClayCardTitle";

/**
 * ClayCardDescription - Description element for ClayCard
 */
const ClayCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ClayCardDescription.displayName = "ClayCardDescription";

/**
 * ClayCardContent - Main content area for ClayCard
 */
const ClayCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
ClayCardContent.displayName = "ClayCardContent";

/**
 * ClayCardFooter - Footer section for ClayCard
 */
const ClayCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
ClayCardFooter.displayName = "ClayCardFooter";

export {
  ClayCard,
  ClayCardHeader,
  ClayCardTitle,
  ClayCardDescription,
  ClayCardContent,
  ClayCardFooter,
  clayCardVariants,
};
