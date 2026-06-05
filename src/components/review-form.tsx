"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { REVIEW_TAG_OPTIONS } from "@/lib/constants";

interface ReviewFormProps {
  courseId: number;
}

export function ReviewForm({ courseId }: ReviewFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    rating: 5,
    semester: "",
    score: "",
    comment: "",
    tags: [] as string[],
  });
  const [message, setMessage] = useState("");
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
    setIsSubmitting(true);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseId,
        ...formState,
      }),
    });

    const result = (await response.json()) as { message?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.message ?? "评论提交失败。");
      return;
    }

    setMessage("评论已发布，现在已经可以在课程页看到。");
    setFormState({
      rating: 5,
      semester: "",
      score: "",
      comment: "",
      tags: [],
    });
    router.push(`/course/${courseId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[32px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5">
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
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 font-normal outline-none ring-orange-200 focus:ring-4"
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
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 font-normal outline-none ring-orange-200 focus:ring-4"
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
          className="w-full rounded-2xl border border-stone-200 px-4 py-3 font-normal outline-none ring-orange-200 focus:ring-4"
        />
      </label>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-900">课程标签</p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAG_OPTIONS.map((tag) => {
            const selected = formState.tags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selected
                    ? "bg-orange-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="space-y-2 text-sm font-semibold text-stone-900">
        评论正文
        <textarea
          value={formState.comment}
          onChange={(event) =>
            setFormState((current) => ({ ...current, comment: event.target.value }))
          }
          placeholder="尽量写清楚课程内容、上课自由度、考核方式、给分体验、授课质量和你觉得有参考价值的细节。"
          rows={9}
          className="w-full rounded-[24px] border border-stone-200 px-4 py-3 font-normal leading-7 outline-none ring-orange-200 placeholder:text-stone-400 focus:ring-4"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "提交中..." : "发布评论"}
      </button>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
