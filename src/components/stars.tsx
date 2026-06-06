import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  size?: "sm" | "md";
}

export function Stars({ rating, size = "md" }: StarsProps) {
  const rounded = Math.round(rating);
  const starClassName = size === "sm" ? "text-sm" : "text-base";
  const label = `${formatRatingLabel(rating)}，满分 5 星`;

  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          aria-hidden="true"
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

function formatRatingLabel(rating: number) {
  if (!Number.isFinite(rating) || rating <= 0) {
    return "暂无评分";
  }
  return `${rating.toFixed(1)} 分`;
}
