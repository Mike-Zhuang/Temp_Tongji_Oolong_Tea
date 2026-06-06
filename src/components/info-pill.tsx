import { cn } from "@/lib/utils";

interface InfoPillProps {
  children: React.ReactNode;
  tone?: "neutral" | "warm" | "danger";
}

export function InfoPill({ children, tone = "neutral" }: InfoPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-3 py-1 text-xs font-medium",
        tone === "neutral" && "bg-surface-muted text-stone-600",
        tone === "warm" && "bg-accent-soft text-accent",
        tone === "danger" && "bg-rose-100 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}
