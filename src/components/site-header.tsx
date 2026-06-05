import { SITE_NAME } from "@/lib/constants";
import type { UserProfile } from "@/lib/types";

import { AuthStatus } from "./auth-status";

interface SiteHeaderProps {
  user: UserProfile | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-[rgba(255,249,244,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <a href="/" className="text-lg font-black tracking-tight text-stone-900">
            {SITE_NAME}
          </a>
          <span className="hidden rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 sm:inline-flex">
            评课替代站
          </span>
        </div>
        <nav className="hidden items-center gap-4 text-sm text-stone-600 md:flex">
          <a href="/search" className="transition hover:text-stone-950">
            搜索
          </a>
          <a href="/me" className="transition hover:text-stone-950">
            我的评论
          </a>
          <a href="/admin" className="transition hover:text-stone-950">
            管理后台
          </a>
        </nav>
        <AuthStatus user={user} />
      </div>
    </header>
  );
}
