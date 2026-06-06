import { ACKNOWLEDGEMENT_LINK, GITHUB_REPO_LINK, ICP_FILING_LINK, ICP_FILING_NUMBER, SITE_NAME } from "@/lib/constants";
import { linkAccent } from "@/lib/ui-classes";
import type { UserProfile } from "@/lib/types";

interface SiteFooterProps {
  user: UserProfile | null;
}

export function SiteFooter({ user }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-text-muted sm:px-6 lg:px-8">
        <p className="font-semibold text-stone-900">{SITE_NAME}</p>
        <p>
          致谢{" "}
          <a className={linkAccent} href={ACKNOWLEDGEMENT_LINK} target="_blank" rel="noreferrer">
            1.tongji.icu
          </a>
        </p>
        <p>
          源码仓库{" "}
          <a className={linkAccent} href={GITHUB_REPO_LINK} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
        <p className="text-pretty">仅用于学习交流与课程体验参考，请理性辨别信息。</p>
        <div className="flex flex-wrap gap-5">
          <a href="/search" className="underline-offset-4 hover:text-stone-900 hover:underline">
            搜索课程
          </a>
          <a href="/auth" className="underline-offset-4 hover:text-stone-900 hover:underline">
            校园邮箱登录
          </a>
          {user?.isAdmin ? (
            <a href="/admin" className="underline-offset-4 hover:text-stone-900 hover:underline">
              管理后台
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-text-muted">
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
