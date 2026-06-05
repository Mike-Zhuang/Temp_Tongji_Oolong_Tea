import type { TeacherSummary } from "@/lib/types";
import { buildTeacherUrl, formatDateTime, formatRating } from "@/lib/utils";

import { InfoPill } from "./info-pill";
import { Stars } from "./stars";

interface TeacherCardProps {
  teacher: TeacherSummary;
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const hasRating = Number.isFinite(teacher.averageRating) && teacher.averageRating > 0;

  return (
    <article className="rounded-md border border-stone-200 bg-white p-5 transition hover:border-orange-200">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <a href={buildTeacherUrl(teacher.slug)} className="text-xl font-bold text-stone-900 hover:text-orange-600">
            {teacher.name}
          </a>
          <div className="flex flex-wrap gap-2">
            {teacher.departmentHints.slice(0, 3).map((department) => (
              <InfoPill key={department}>{department}</InfoPill>
            ))}
          </div>
          <p className="text-sm text-stone-500">
            共 {teacher.courseCount} 门课，累计 {teacher.reviewCount} 条评论
          </p>
        </div>
        <div className="rounded-md bg-orange-50 px-4 py-3 text-right">
          {hasRating ? (
            <>
              <p className="text-2xl font-bold text-stone-900">{formatRating(teacher.averageRating)}</p>
              <div className="mt-1 flex justify-end">
                <Stars rating={teacher.averageRating} size="sm" />
              </div>
            </>
          ) : (
            <p className="text-sm text-stone-400">暂无评分</p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-stone-500">最近活跃：{formatDateTime(teacher.lastReviewAt)}</p>
    </article>
  );
}
