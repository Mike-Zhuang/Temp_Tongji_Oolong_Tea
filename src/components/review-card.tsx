import { useState } from "react";

import { cardHover, listDivider } from "@/lib/ui-classes";
import { cn, clampText, formatDateTime } from "@/lib/utils";
import type { Review } from "@/lib/types";

import { InfoPill } from "./info-pill";
import { Stars } from "./stars";

interface ReviewCardProps {
  review: Review;
  showCourseMeta?: boolean;
  variant?: "card" | "list" | "preview";
}

const COLLAPSED_LENGTH = 220;
const PREVIEW_COLLAPSED_LENGTH = 100;

export function ReviewCard({ review, showCourseMeta = false, variant = "list" }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsedLength = variant === "preview" ? PREVIEW_COLLAPSED_LENGTH : COLLAPSED_LENGTH;
  const content =
    expanded || review.comment.length <= collapsedLength
      ? review.comment
      : clampText(review.comment, collapsedLength);

  return (
    <article
      className={cn(
        variant === "list" || variant === "preview"
          ? listDivider
          : cn("rounded-lg border border-border bg-surface p-5", cardHover),
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} size="sm" />
            <InfoPill tone="warm">{review.semester}</InfoPill>
            {review.score ? <InfoPill>{review.score}</InfoPill> : null}
            {variant !== "preview"
              ? review.tags.map((tag) => <InfoPill key={tag}>{tag}</InfoPill>)
              : null}
          </div>
          {showCourseMeta ? (
            <p className="text-sm font-semibold text-stone-800">
              {review.courseName} · {review.teacherName} · {review.courseCode}
            </p>
          ) : (
            <p className="text-sm font-semibold text-stone-800">{review.teacherName}</p>
          )}
        </div>
        <div className="text-right text-xs text-text-muted max-sm:w-full max-sm:text-left">
          <p>发布于 {formatDateTime(review.createdAt)}</p>
          {review.modifiedAt !== review.createdAt ? (
            <p>更新于 {formatDateTime(review.modifiedAt)}</p>
          ) : null}
        </div>
      </div>
      <div className="text-pretty mt-4 whitespace-pre-wrap text-sm leading-7 text-text-secondary">{content}</div>
      {review.comment.length > collapsedLength ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mt-3 text-sm font-semibold text-accent transition hover:text-accent-hover"
        >
          {expanded ? "收起评论" : "展开全文"}
        </button>
      ) : null}
      {variant !== "preview" ? (
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <span>赞同 {review.approves}</span>
          <span>不赞同 {review.disapproves}</span>
          <span>{review.source === "seed" ? "历史导入" : "站内新增"}</span>
          {review.moderatorRemark ? <span>管理员备注：{review.moderatorRemark}</span> : null}
        </div>
      ) : null}
    </article>
  );
}
