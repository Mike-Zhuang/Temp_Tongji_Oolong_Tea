import { LoginForm } from "@/components/login-form";
import { SectionTitle } from "@/components/section-title";

export default function AuthPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <section className="rounded-[36px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-950/5 sm:p-8">
        <SectionTitle
          eyebrow="校园邮箱登录"
          title="只允许 @tongji.edu.cn"
          description="站内评论采用同济校园邮箱登录。发送登录链接后，点击邮件中的链接即可回到本站完成登录。"
        />
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
      <section className="rounded-[36px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
        <h2 className="text-lg font-bold text-stone-900">为什么这样做</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
          <li>先把发评论的门槛限定在同济校园邮箱，能显著减少灌水和恶意内容。</li>
          <li>登录后评论会直接公开，管理员主要处理被举报内容，不提前卡审核。</li>
          <li>邮件 SMTP 配置通过环境变量注入，仓库里不会保存实际凭据。</li>
        </ul>
      </section>
    </div>
  );
}
