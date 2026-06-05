import Link from "next/link";

import { BuyMeACoffeeCard } from "@/components/buy-me-a-coffee-card";
import { CourseCard } from "@/components/course-card";
import { ReviewCard } from "@/components/review-card";
import { SearchBar } from "@/components/search-bar";
import { SectionTitle } from "@/components/section-title";
import { TeacherCard } from "@/components/teacher-card";
import { SITE_DESCRIPTION } from "@/lib/constants";
import { getHomePageData } from "@/lib/data";

export default async function Home() {
  const homePageData = await getHomePageData();

  return (
    <div className="pb-16">
      <section className="noise-panel overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-18">
          <div className="relative rounded-[40px] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.88),_rgba(255,244,231,0.98))] p-8 shadow-xl shadow-orange-950/10 sm:p-10">
            <div className="inline-flex rounded-full bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-white">
              Tongji Course Radar
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-stone-900 sm:text-5xl">
              先搜老师，再决定这门课值不值得上。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
              {SITE_DESCRIPTION} 搜索课程名或老师名后，你可以一眼看到老师名下全部课程、每门课的历史评论、评分走势和真实上课体验。
            </p>
            <div className="mt-8 max-w-3xl">
              <SearchBar large />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-3xl bg-white/90 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">课程</p>
                <p className="mt-2 text-3xl font-black text-stone-900">{homePageData.siteStats.courseCount}</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">老师</p>
                <p className="mt-2 text-3xl font-black text-stone-900">{homePageData.siteStats.teacherCount}</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">评论</p>
                <p className="mt-2 text-3xl font-black text-stone-900">{homePageData.siteStats.reviewCount}</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">分类</p>
                <p className="mt-2 text-3xl font-black text-stone-900">{homePageData.siteStats.categoryCount}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5">
              <SectionTitle
                eyebrow="新鲜热评"
                title="最近大家在说什么"
                description="首屏先把最近有讨论的课程摆出来，方便快速捞到当学期活跃评价。"
              />
              <div className="mt-5 space-y-4">
                {homePageData.latestReviews.slice(0, 3).map((review) => (
                  <ReviewCard key={review.id} review={review} showCourseMeta />
                ))}
              </div>
            </div>
            <BuyMeACoffeeCard />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="热门课程"
          title="评论最多的课程"
          description="优先展示评论量高的课程，方便你快速找到信息密度最高的入口。"
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {homePageData.featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="高分教师"
          title="口碑最稳的一批老师"
          description="这里会优先综合平均分和评论量，避免只靠一两条样本冲榜。"
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {homePageData.topTeachers.map((teacher) => (
            <TeacherCard key={teacher.slug} teacher={teacher} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="避雷参考"
          title="低分且样本不算少的课程"
          description="低分不一定代表课程差，但至少说明分歧明显，建议点进去先看评论再决定。"
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {homePageData.cautionCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 flex w-full max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8">
        <p className="max-w-2xl text-sm leading-7 text-stone-600">
          想补充自己的选课体验？使用同济校园邮箱登录后，可以直接在课程页发布评论。评论会即时展示，管理员仅在收到举报或明显违规时介入。
        </p>
        <Link
          href="/auth"
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          去登录并写评论
        </Link>
      </section>
    </div>
  );
}
