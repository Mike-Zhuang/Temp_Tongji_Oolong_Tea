import { LoginForm } from "@/components/login-form";
import { SectionTitle } from "@/components/section-title";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function AuthPage() {
  const authEnabled = hasSupabaseEnv();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
        <SectionTitle
          eyebrow="校园邮箱登录"
          title="只允许 @tongji.edu.cn"
          description={
            authEnabled
              ? "站内评论采用同济校园邮箱登录。发送登录链接后，点击邮件中的链接即可回到本站完成登录。"
              : "登录功能还在收尾配置中，当前先开放课程搜索与评论浏览。"
          }
        />
        <div className="mt-8">
          <LoginForm isEnabled={authEnabled} />
          {!authEnabled ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600">
              当前站点的浏览功能正常，校园邮箱登录和站内发评论会在配置完成后开放。
            </div>
          ) : null}
        </div>
      </section>
      <section className="rounded-[36px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
        <h2 className="text-lg font-bold text-stone-900">为什么这样做</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
          <li>先把发评论的门槛限定在同济校园邮箱，能显著减少灌水和恶意内容。</li>
          <li>登录后评论会直接公开，管理员主要处理被举报内容，不提前卡审核。</li>
        </ul>
      </section>
    </div>
  );
}
