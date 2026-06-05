import Link from "next/link";

import { ACKNOWLEDGEMENT_LINK, SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-orange-100 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-stone-600 sm:px-6 lg:px-8">
        <p className="font-semibold text-stone-900">{SITE_NAME}</p>
        <p>致谢 <a className="text-orange-600 underline-offset-4 hover:underline" href={ACKNOWLEDGEMENT_LINK} target="_blank" rel="noreferrer">1.tongji.icu</a></p>
        <p>仅用于学习交流与课程体验参考，请理性辨别信息。</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/search" className="hover:text-stone-900">
            搜索课程
          </Link>
          <Link href="/auth" className="hover:text-stone-900">
            校园邮箱登录
          </Link>
          <Link href="/admin" className="hover:text-stone-900">
            管理后台
          </Link>
        </div>
      </div>
    </footer>
  );
}
