import { useState } from "react";

import { updateAdminReview } from "@/lib/data-client";
import type { PublishStatus, Review } from "@/lib/types";

interface AdminReviewActionsProps {
  review: Review;
}

export function AdminReviewActions({ review }: AdminReviewActionsProps) {
  const [remark, setRemark] = useState(review.moderatorRemark ?? "");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function updateReview(publishStatus?: PublishStatus) {
    setIsPending(true);
    try {
      await updateAdminReview(review.id, {
        publishStatus,
        moderatorRemark: remark,
      });
      setMessage("已更新，刷新后可看到最新列表。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新失败");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-md bg-stone-50 p-4">
      <textarea
        value={remark}
        onChange={(event) => setRemark(event.target.value)}
        rows={3}
        placeholder="管理员备注"
        className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateReview("published")}
          disabled={isPending}
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
        >
          恢复公开
        </button>
        <button
          type="button"
          onClick={() => updateReview("hidden")}
          disabled={isPending}
          className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
        >
          隐藏评论
        </button>
        <button
          type="button"
          onClick={() => updateReview(undefined)}
          disabled={isPending}
          className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white"
        >
          仅保存备注
        </button>
      </div>
      {message ? <p className="text-xs text-stone-500">{message}</p> : null}
    </div>
  );
}
