import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyMeACoffeeCard } from "@/components/buy-me-a-coffee-card";
import { ReportReviewButton } from "@/components/report-review-button";
import { ReviewCard } from "@/components/review-card";
import { SectionTitle } from "@/components/section-title";
import { Stars } from "@/components/stars";
import { REVIEW_SORT_OPTIONS } from "@/lib/constants";
import { getCourseById } from "@/lib/data";
import type { ReviewSort } from "@/lib/types";
import { buildTeacherUrl, formatDateTime, formatRating } from "@/lib/utils";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { courseId } = await params;
  const resolvedSearchParams = await searchParams;
  const sort = (typeof resolvedSearchParams.sort === "string"
    ? resolvedSearchParams.sort
    : "latest") as ReviewSort;
  const course = await getCourseById(Number(courseId), sort);

  if (!course) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:items-start lg:px-8">
      <div className="space-y-8">
        <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <SectionTitle
                eyebrow={course.code}
                title={course.name}
                description={`教师：${course.teacherName}。这里会展示尽可能完整的评分、评论、成绩原文、时间、赞踩和课程基础信息。`}
              />
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                <Link href={buildTeacherUrl(course.teacherSlug)} className="font-semibold text-stone-800 hover:text-orange-600">
                  查看老师主页
                </Link>
                <span>·</span>
                <span>{course.department ?? "院系暂缺"}</span>
                <span>·</span>
                <span>{course.credit} 学分</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.categories.map((category) => (
                  <span key={category} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div className="min-w-52 rounded-[32px] bg-stone-900 p-5 text-white">
              <p className="text-sm text-white/70">课程总评分</p>
              <p className="mt-2 text-5xl font-black">{formatRating(course.averageRating)}</p>
              <div className="mt-3">
                <Stars rating={course.averageRating} />
              </div>
              <p className="mt-3 text-sm text-white/70">{course.reviewCount} 条评论</p>
              <p className="mt-1 text-sm text-white/70">最近活跃：{formatDateTime(course.lastReviewAt)}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-5">
            {course.ratingDistribution.map((item) => (
              <div key={item.stars} className="rounded-[24px] bg-orange-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">{item.stars} 星</p>
                <p className="mt-2 text-2xl font-black text-stone-900">{item.count}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[36px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionTitle
              eyebrow="评论区"
              title={`${course.reviewCount} 条历史评论`}
              description="支持按最新、最热、高分、低分排序。超长评论默认折叠，点开可看全文。"
            />
            <Link
              href={`/write-review/${course.id}`}
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              写一条评论
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {REVIEW_SORT_OPTIONS.map((option) => {
              const active = option.value === sort;
              return (
                <Link
                  key={option.value}
                  href={`/course/${course.id}?sort=${option.value}`}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-6 space-y-5">
            {course.reviews.length ? (
              course.reviews.map((review) => (
                <div key={review.id}>
                  <ReviewCard review={review} />
                  <div className="mt-3">
                    <ReportReviewButton reviewId={review.id} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8 text-sm leading-7 text-stone-500">
                这门课暂时还没有评论，欢迎成为第一个留下经验的人。
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-24">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
                  快速结论
                </p>
                <h2 className="mt-2 text-lg font-bold text-stone-900">这门课值不值得点开细看</h2>
              </div>
              <div className="rounded-2xl bg-orange-50 px-4 py-3 text-right">
                <p className="text-2xl font-black text-stone-900">{formatRating(course.averageRating)}</p>
                <p className="mt-1 text-xs text-stone-500">{course.reviewCount} 条评论</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
              <li>先看评分和评论总数，样本量足够时参考价值会明显更高。</li>
              <li>再看最近活跃时间，避免把很老的口碑直接套用到现在。</li>
              <li>如果成绩原文很分裂，优先看评论正文里的考核和给分细节。</li>
            </ul>
            <Link
              href={`/write-review/${course.id}`}
              className="mt-5 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              我也写一条评论
            </Link>
          </div>

          <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
            <h2 className="text-lg font-bold text-stone-900">课程信息</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoBlock label="课号" value={course.code} />
              <InfoBlock label="学分" value={`${course.credit}`} />
              <InfoBlock label="院系" value={course.department ?? "院系暂缺"} />
              <InfoBlock label="最近活跃" value={formatDateTime(course.lastReviewAt)} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">授课老师</p>
              <Link
                href={buildTeacherUrl(course.teacherSlug)}
                className="mt-2 block text-base font-semibold text-stone-900 hover:text-orange-600"
              >
                {course.teacherName}
              </Link>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">课程分类</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {course.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
            <h2 className="text-lg font-bold text-stone-900">评分分布</h2>
            <div className="mt-4 space-y-3">
              {course.ratingDistribution.map((item) => {
                const percentage =
                  course.reviewCount > 0 ? Math.round((item.count / course.reviewCount) * 100) : 0;

                return (
                  <div key={item.stars} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-stone-600">
                      <span>{item.stars} 星</span>
                      <span>
                        {item.count} 条 · {percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <BuyMeACoffeeCard />
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-stone-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-stone-900">{value}</p>
    </div>
  );
}
