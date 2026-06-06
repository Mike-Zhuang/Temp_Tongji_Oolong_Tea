import { useState } from "react";

import { alertError, focusRing, inputField } from "@/lib/ui-classes";
import { REVIEW_TAG_OPTIONS } from "@/lib/constants";
import { createUserReview, invalidateDataCache } from "@/lib/data-client";
import type { Course, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface ReviewFormProps {
  course: Course;
  user: UserProfile;
}

export function ReviewForm({ course, user }: ReviewFormProps) {
  const [formState, setFormState] = useState({
    rating: 5,
    semester: "",
    score: "",
    comment: "",
    tags: [] as string[],
  });
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleTag(tag: string) {
    setFormState((current) => {
      const tags = current.tags.includes(tag)
        ? current.tags.filter((item) => item !== tag)
        : [...current.tags, tag];
      return { ...current, tags };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);

    if (!formState.semester.trim() || formState.comment.trim().length < 10) {
      setMessage("请补充学期，并至少写 10 个字的评论正文。");
      setMessageIsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await createUserReview({
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        teacherName: course.teacherName,
        teacherSlug: course.teacherSlug,
        userId: user.id,
        ...formState,
        semester: formState.semester.trim(),
        score: formState.score.trim(),
        comment: formState.comment.trim(),
      });
      invalidateDataCache();
      setMessage("评论已发布，现在已经可以在课程页看到。");
      window.location.href = `/course/${course.id}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "评论提交失败，请稍后重试。");
      setMessageIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-stone-900">
          星级评分
          <select
            value={formState.rating}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                rating: Number(event.target.value),
              }))
            }
            className={inputField}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} 星
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold text-stone-900">
          学期
          <input
            value={formState.semester}
            onChange={(event) =>
              setFormState((current) => ({ ...current, semester: event.target.value }))
            }
            placeholder="例如 2025-2026第一学期"
            className={inputField}
          />
        </label>
      </div>
      <label className="space-y-2 text-sm font-semibold text-stone-900">
        成绩 / 结果
        <input
          value={formState.score}
          onChange={(event) =>
            setFormState((current) => ({ ...current, score: event.target.value }))
          }
          placeholder="例如 优 / 良 / A / W / 未出分"
          className={inputField}
        />
      </label>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-900">课程标签</legend>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAG_OPTIONS.map((tag) => {
            const selected = formState.tags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(tag.value)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm transition duration-200",
                  focusRing,
                  selected
                    ? "bg-accent text-white"
                    : "bg-surface-muted text-stone-600 hover:bg-stone-200/70",
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="space-y-2 text-sm font-semibold text-stone-900">
        评论正文
        <textarea
          value={formState.comment}
          onChange={(event) =>
            setFormState((current) => ({ ...current, comment: event.target.value }))
          }
          placeholder="尽量写清楚课程内容、上课自由度、考核方式、给分体验、授课质量和你觉得有参考价值的细节。"
          rows={9}
          className={cn(inputField, "leading-7")}
        />
      </label>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "提交中..." : "发布评论"}
      </Button>
      {message ? (
        <p role="alert" className={messageIsError ? alertError : "text-sm text-text-muted"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
