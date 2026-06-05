import { notFound } from "next/navigation";

import { CourseCard } from "@/components/course-card";
import { BuyMeACoffeeCard } from "@/components/buy-me-a-coffee-card";
import { SectionTitle } from "@/components/section-title";
import { Stars } from "@/components/stars";
import { getTeacherBySlug, getCourseById } from "@/lib/data";
import { formatDateTime, formatRating } from "@/lib/utils";

interface TeacherPageProps {
  params: Promise<{ teacherSlug: string }>;
}

export default async function TeacherPage({ params }: TeacherPageProps) {
  const { teacherSlug } = await params;
  const teacher = await getTeacherBySlug(teacherSlug);

  if (!teacher) {
    notFound();
  }

  const courses = await Promise.all(
    teacher.courses.map((course) => getCourseById(course.id)),
  );
  const existingCourses = courses.filter((course) => course !== null);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="space-y-8">
        <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
          <SectionTitle
            eyebrow="教师主页"
            title={teacher.name}
            description="这里按老师聚合同名下全部课程，适合判断这位老师整体的上课风格、给分习惯和稳定性。"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <StatCard label="名下课程" value={teacher.courseCount.toString()} />
            <StatCard label="累计评论" value={teacher.reviewCount.toString()} />
            <StatCard label="平均评分" value={formatRating(teacher.averageRating)} />
            <StatCard label="最近活跃" value={teacher.lastReviewAt ? formatDateTime(teacher.lastReviewAt) : "暂无"} />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Stars rating={teacher.averageRating} />
            <p className="text-sm text-stone-500">涉及院系：{teacher.departmentHints.join("、")}</p>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="全部课程"
            title={`${teacher.name} 名下的 ${existingCourses.length} 门课`}
            description="课程卡片里会尽量保留课号、分类、学分、院系、均分、评论量和最近活跃时间。"
          />
          {existingCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      </div>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
          <h2 className="text-lg font-bold text-stone-900">如何看老师页</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
            <li>优先看“评论总数”而不是只看均分，样本越多越稳定。</li>
            <li>如果同一老师不同课程分差很大，建议点进具体课程页看评论细节。</li>
            <li>部分课程的院系字段在原始数据中缺失，页面会显示“院系暂缺”。</li>
          </ul>
        </div>
        <BuyMeACoffeeCard />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-stone-100 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-black text-stone-900">{value}</p>
    </div>
  );
}
