import type { Course } from "@/lib/types";
import { buildCourseUrl, buildTeacherUrl, formatDateTime, formatRating } from "@/lib/utils";

import { InfoPill } from "./info-pill";
import { Stars } from "./stars";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-950/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <InfoPill tone="warm">{course.code}</InfoPill>
            {course.categories.slice(0, 2).map((category) => (
              <InfoPill key={category}>{category}</InfoPill>
            ))}
          </div>
          <div>
            <a href={buildCourseUrl(course.id)} className="text-xl font-bold text-stone-900 hover:text-orange-600">
              {course.name}
            </a>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
              <a href={buildTeacherUrl(course.teacherSlug)} className="font-medium text-stone-700 hover:text-orange-600">
                {course.teacherName}
              </a>
              <span>·</span>
              <span>{course.department ?? "院系暂缺"}</span>
              <span>·</span>
              <span>{course.credit} 学分</span>
            </div>
          </div>
        </div>
        <div className="min-w-28 rounded-3xl bg-orange-50 px-4 py-3 text-right">
          <p className="text-2xl font-black text-stone-900">{formatRating(course.averageRating)}</p>
          <div className="mt-1 flex justify-end">
            <Stars rating={course.averageRating} size="sm" />
          </div>
          <p className="mt-1 text-xs text-stone-500">{course.reviewCount} 条评论</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-500">
        <span>最近活跃：{formatDateTime(course.lastReviewAt)}</span>
        <span>原始收录评论：{course.seedRatingCount}</span>
      </div>
    </article>
  );
}
