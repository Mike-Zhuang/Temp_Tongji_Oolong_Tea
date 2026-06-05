"use client";

import { useState } from "react";

interface ReportReviewButtonProps {
  reviewId: string;
}

export function ReportReviewButton({ reviewId }: ReportReviewButtonProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReport() {
    const reason = window.prompt("请输入举报原因（例如人身攻击、无关内容、恶意造谣）");
    if (!reason?.trim()) {
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    const result = (await response.json()) as { message?: string };
    setIsSubmitting(false);
    setMessage(result.message ?? (response.ok ? "举报已提交" : "举报失败"));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleReport}
        disabled={isSubmitting}
        className="text-xs font-semibold text-stone-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "提交中..." : "举报该评论"}
      </button>
      {message ? <span className="text-xs text-stone-500">{message}</span> : null}
    </div>
  );
}
