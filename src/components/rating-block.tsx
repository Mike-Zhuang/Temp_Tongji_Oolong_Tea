import { cn, formatRating } from "@/lib/utils";
import { ratingBlock } from "@/lib/ui-classes";

import { Stars } from "./stars";

interface RatingBlockProps {
  rating: number;
  reviewCount: number;
  lastReviewAt?: string | null;
  className?: string;
}

export function RatingBlock({ rating, reviewCount, lastReviewAt, className }: RatingBlockProps) {
  return (
    <div className={cn(ratingBlock, className)}>
      <p className="text-sm text-text-muted">课程总评分</p>
      <p className="tabular-nums mt-2 text-4xl font-bold text-stone-900">{formatRating(rating)}</p>
      <div className="mt-3 flex justify-end">
        <Stars rating={rating} />
      </div>
      <p className="mt-3 text-sm text-text-muted">{reviewCount} 条评论</p>
      {lastReviewAt ? (
        <p className="mt-1 text-sm text-text-muted">最近活跃：{lastReviewAt}</p>
      ) : null}
    </div>
  );
}
