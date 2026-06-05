import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  size?: "sm" | "md";
}

export function Stars({ rating, size = "md" }: StarsProps) {
  const rounded = Math.round(rating);
  const starClassName = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            starClassName,
            index < rounded ? "text-amber-500" : "text-stone-300",
          )}
        >
          ★
        </span>
      ))}
    </div>
  );
}
