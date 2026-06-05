import Link from "next/link";

import { ReviewCard } from "@/components/review-card";
import { SectionTitle } from "@/components/section-title";
import { getCurrentUserProfile } from "@/lib/auth";
import { getMyReviews } from "@/lib/data";

export default async function MePage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="rounded-full bg-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
          My Reviews
        </p>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-stone-900">
          先登录，才能看到你的评论历史
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          使用同济校园邮箱登录后，你可以查看自己发布过的评论记录。
        </p>
        <Link
          href="/auth"
          className="mt-8 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          去登录
        </Link>
      </div>
    );
  }

  const reviews = await getMyReviews(user.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
        <SectionTitle
          eyebrow="我的评论"
          title="你发布过的历史记录"
          description="这里会列出你所有站内新增评论，方便回看和后续补充。"
        />
      </section>
      <div className="mt-8 space-y-5">
        {reviews.length ? (
          reviews.map((review) => <ReviewCard key={review.id} review={review} showCourseMeta />)
        ) : (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8 text-sm leading-7 text-stone-600">
            你还没有发布过站内评论。先去搜索课程，再补上一条真实体验吧。
          </div>
        )}
      </div>
    </div>
  );
}
