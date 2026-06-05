import { cn } from "@/lib/utils";

interface InfoPillProps {
  children: React.ReactNode;
  tone?: "neutral" | "warm" | "danger";
}

export function InfoPill({ children, tone = "neutral" }: InfoPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone === "neutral" && "bg-stone-100 text-stone-600",
        tone === "warm" && "bg-orange-100 text-orange-700",
        tone === "danger" && "bg-rose-100 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}
