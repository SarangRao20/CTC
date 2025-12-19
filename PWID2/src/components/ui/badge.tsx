import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Healthcare status badges
        stable: "border-transparent bg-success/10 text-success font-semibold",
        "needs-attention": "border-transparent bg-warning/15 text-warning-foreground font-semibold",
        urgent: "border-transparent bg-urgent/10 text-urgent font-semibold",
        info: "border-transparent bg-info/10 text-info font-semibold",
        // Task status
        pending: "border-transparent bg-secondary text-secondary-foreground",
        completed: "border-transparent bg-success/10 text-success",
        overdue: "border-transparent bg-urgent/10 text-urgent",
        snoozed: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
