"use client";

import { useState } from "react";

import { SITE_NAME } from "@/lib/constants";
import type { UserProfile } from "@/lib/types";

import { AuthStatus } from "./auth-status";

interface SiteHeaderProps {
  user: UserProfile | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#faf8f5]/95">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <a href="/" className="text-lg font-bold tracking-tight text-stone-900">
            {SITE_NAME}
          </a>
          <span className="hidden rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 sm:inline-flex">
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
          {user?.isAdmin ? (
            <a href="/admin" className="transition hover:text-stone-950">
              管理后台
            </a>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <AuthStatus user={user} />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="打开菜单"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex rounded-full border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 md:hidden"
          >
            菜单
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="border-t border-stone-200 bg-[#faf8f5] px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-stone-700">
            <a href="/search" className="rounded-md px-2 py-2 hover:bg-stone-100" onClick={() => setMenuOpen(false)}>
              搜索
            </a>
            <a href="/me" className="rounded-md px-2 py-2 hover:bg-stone-100" onClick={() => setMenuOpen(false)}>
              我的评论
            </a>
            {user?.isAdmin ? (
              <a href="/admin" className="rounded-md px-2 py-2 hover:bg-stone-100" onClick={() => setMenuOpen(false)}>
                管理后台
              </a>
            ) : null}
            {!user ? (
              <a href="/auth" className="rounded-md px-2 py-2 font-semibold text-orange-600 hover:bg-orange-50" onClick={() => setMenuOpen(false)}>
                校园邮箱登录
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
