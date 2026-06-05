import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewForm } from "@/components/review-form";
import { SectionTitle } from "@/components/section-title";
import { getCurrentUserProfile } from "@/lib/auth";
import { getCourseById } from "@/lib/data";

interface WriteReviewPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function WriteReviewPage({ params }: WriteReviewPageProps) {
  const { courseId } = await params;
  const user = await getCurrentUserProfile();
  const course = await getCourseById(Number(courseId));

  if (!course) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
        <SectionTitle
          eyebrow="写评论"
          title={`${course.name} · ${course.teacherName}`}
          description="为了让评论更有参考价值，建议尽量写清楚课程内容、上课自由度、考核标准、给分体验和授课质量。"
        />
        <div className="mt-8">
          {user ? (
            <ReviewForm courseId={course.id} />
          ) : (
            <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8 text-sm leading-7 text-stone-600">
              你还没有登录。请先使用 <span className="font-semibold">@tongji.edu.cn</span> 校园邮箱登录，再回来发布评论。
              <div className="mt-5">
                <Link
                  href="/auth"
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  去登录
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[36px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
        <h2 className="text-lg font-bold text-stone-900">写作建议</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
          <li>越具体越有用，比如“论文 1000 字”“每周点名”“上课几乎不管”这类细节。</li>
          <li>成绩字段保留原文即可，不需要为了统一格式硬改成 A/B/C。</li>
          <li>如果是强烈主观看法，尽量补上你为什么这么判断，方便别人自己衡量。</li>
        </ul>
      </section>
    </div>
  );
}
