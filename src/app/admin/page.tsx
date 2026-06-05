import { AdminReviewActions } from "@/components/admin-review-actions";
import { ReviewCard } from "@/components/review-card";
import { SectionTitle } from "@/components/section-title";
import { ADMIN_EMAIL } from "@/lib/constants";
import { getCurrentUserProfile } from "@/lib/auth";
import { getAdminReviews } from "@/lib/data";

export default async function AdminPage() {
  const user = await getCurrentUserProfile();
  const isAdmin = user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="rounded-full bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-rose-700">
          Admin Only
        </p>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-stone-900">
          这里只有管理员能看
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          请使用管理员邮箱登录后再访问管理后台。
        </p>
      </div>
    );
  }

  const reviews = await getAdminReviews();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
        <SectionTitle
          eyebrow="管理后台"
          title="最新评论与举报处理"
          description="这里可以查看全部站内评论、被举报记录数、当前公开状态，并支持隐藏/恢复评论或补充管理员备注。"
        />
      </section>
      <div className="mt-8 space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
            <ReviewCard review={review} showCourseMeta />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-500">
              <span>当前状态：{review.publishStatus}</span>
              <span>举报次数：{review.reportsCount ?? 0}</span>
              <span>来源：{review.source}</span>
            </div>
            <AdminReviewActions review={review} />
          </div>
        ))}
      </div>
    </div>
  );
}
