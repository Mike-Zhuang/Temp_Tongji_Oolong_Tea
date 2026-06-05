"use client";

import { useState } from "react";

import { cn, clampText, formatDateTime } from "@/lib/utils";
import { listDivider } from "@/lib/ui-classes";
import type { Review } from "@/lib/types";

import { InfoPill } from "./info-pill";
import { Stars } from "./stars";

interface ReviewCardProps {
  review: Review;
  showCourseMeta?: boolean;
  variant?: "card" | "list";
}

const COLLAPSED_LENGTH = 220;

export function ReviewCard({ review, showCourseMeta = false, variant = "list" }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const content =
    expanded || review.comment.length <= COLLAPSED_LENGTH
      ? review.comment
      : clampText(review.comment, COLLAPSED_LENGTH);

  return (
    <article
      className={cn(
        variant === "list"
          ? listDivider
          : "rounded-md border border-stone-200 bg-white p-5 transition hover:border-orange-200",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} size="sm" />
            <InfoPill tone="warm">{review.semester}</InfoPill>
            {review.score ? <InfoPill>{review.score}</InfoPill> : null}
            {review.tags.map((tag) => (
              <InfoPill key={tag}>{tag}</InfoPill>
            ))}
          </div>
          {showCourseMeta ? (
            <p className="text-sm font-semibold text-stone-800">
              {review.courseName} · {review.teacherName} · {review.courseCode}
            </p>
          ) : (
            <p className="text-sm font-semibold text-stone-800">{review.teacherName}</p>
          )}
        </div>
        <div className="text-right text-xs text-stone-500">
          <p>发布于 {formatDateTime(review.createdAt)}</p>
          {review.modifiedAt !== review.createdAt ? (
            <p>更新于 {formatDateTime(review.modifiedAt)}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">{content}</div>
      {review.comment.length > COLLAPSED_LENGTH ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
        >
          {expanded ? "收起评论" : "展开全文"}
        </button>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-stone-500">
        <span>赞同 {review.approves}</span>
        <span>不赞同 {review.disapproves}</span>
        <span>{review.source === "seed" ? "历史导入" : "站内新增"}</span>
        {review.moderatorRemark ? <span>管理员备注：{review.moderatorRemark}</span> : null}
      </div>
    </article>
  );
}
