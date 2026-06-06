import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { surfacePlain, surfaceSection, surfaceSectionMuted } from "@/lib/ui-classes";

interface PageSectionProps {
  children: ReactNode;
  variant?: "primary" | "muted" | "plain";
  className?: string;
}

const variantClasses = {
  primary: surfaceSection,
  muted: surfaceSectionMuted,
  plain: surfacePlain,
};

export function PageSection({ children, variant = "primary", className }: PageSectionProps) {
  return <section className={cn(variantClasses[variant], className)}>{children}</section>;
}
