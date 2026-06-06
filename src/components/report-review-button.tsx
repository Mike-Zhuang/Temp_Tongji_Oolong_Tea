import { useState } from "react";

import { focusRing, inputField, alertError, alertSuccess } from "@/lib/ui-classes";
import { reportReview } from "@/lib/data-client";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface ReportReviewButtonProps {
  reviewId: string;
}

export function ReportReviewButton({ reviewId }: ReportReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      setMessage("请填写举报原因。");
      setMessageTone("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setMessageTone(null);

    try {
      await reportReview(reviewId, reason.trim());
      setMessage("举报已提交，管理员会尽快处理。");
      setMessageTone("success");
      setOpen(false);
      setReason("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "举报提交失败，请稍后重试。");
      setMessageTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn("text-xs font-semibold text-text-muted transition hover:text-error", focusRing)}
        >
          举报该评论
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface-muted p-4">
          <label htmlFor={`report-${reviewId}`} className="text-sm font-semibold text-stone-900">
            举报原因
          </label>
          <textarea
            id={`report-${reviewId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="例如人身攻击、无关内容、恶意造谣"
            className={cn(inputField, "mt-2 leading-7")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs">
              {isSubmitting ? "提交中..." : "提交举报"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-4 py-2 text-xs"
              disabled={isSubmitting}
              onClick={() => {
                setOpen(false);
                setReason("");
                setMessage("");
                setMessageTone(null);
              }}
            >
              取消
            </Button>
          </div>
        </form>
      )}
      {message ? (
        <p role="alert" className={messageTone === "success" ? alertSuccess : alertError}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
