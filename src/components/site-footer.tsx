import { ACKNOWLEDGEMENT_LINK, ICP_FILING_LINK, ICP_FILING_NUMBER, SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-stone-600 sm:px-6 lg:px-8">
        <p className="font-semibold text-stone-900">{SITE_NAME}</p>
        <p>致谢 <a className="text-orange-600 underline-offset-4 hover:underline" href={ACKNOWLEDGEMENT_LINK} target="_blank" rel="noreferrer">1.tongji.icu</a></p>
        <p>仅用于学习交流与课程体验参考，请理性辨别信息。</p>
        <div className="flex flex-wrap gap-4">
          <a href="/search" className="hover:text-stone-900">
            搜索课程
          </a>
          <a href="/auth" className="hover:text-stone-900">
            校园邮箱登录
          </a>
          <a href="/admin" className="hover:text-stone-900">
            管理后台
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-stone-500">
          <a
            href={ICP_FILING_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-stone-800"
          >
            <img src="/beian-icon.png" alt="" width={16} height={16} className="h-4 w-4" />
            <span>{ICP_FILING_NUMBER}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
