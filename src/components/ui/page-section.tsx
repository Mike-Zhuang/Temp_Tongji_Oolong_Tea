import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { surfaceSection, surfaceSectionMuted } from "@/lib/ui-classes";

interface PageSectionProps {
  children: ReactNode;
  variant?: "primary" | "muted";
  className?: string;
}

export function PageSection({ children, variant = "primary", className }: PageSectionProps) {
  return (
    <section className={cn(variant === "muted" ? surfaceSectionMuted : surfaceSection, className)}>
      {children}
    </section>
  );
}
