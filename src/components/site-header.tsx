import { useId, useState } from "react";

import { focusRing } from "@/lib/ui-classes";
import { SITE_NAME } from "@/lib/constants";
import { isNavActive } from "@/lib/nav-utils";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AuthStatus } from "./auth-status";
import { SearchBar } from "./search-bar";

interface SiteHeaderProps {
  user: UserProfile | null;
  currentPath: string;
  searchQuery?: string;
}

function navLinkClass(active: boolean) {
  return cn(
    "border-b-2 pb-0.5 transition duration-200",
    active
      ? "border-accent font-semibold text-stone-900"
      : "border-transparent text-text-muted hover:text-stone-950",
  );
}

function mobileNavClass(active: boolean) {
  return cn(
    "rounded-md px-2 py-2 transition",
    active ? "bg-accent-soft font-semibold text-accent" : "hover:bg-surface-muted",
  );
}

export function SiteHeader({ user, currentPath, searchQuery = "" }: SiteHeaderProps) {
  const showPersistentSearch = currentPath !== "/" && currentPath !== "/scheduler";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <a href="#main-content" className="sr-only">
        跳到主要内容
      </a>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <a
            href="/"
            aria-current={isNavActive(currentPath, "/") ? "page" : undefined}
            className={cn("text-lg font-bold tracking-tight", isNavActive(currentPath, "/") ? "text-stone-900" : "text-stone-900")}
          >
            {SITE_NAME}
          </a>
          <span className="hidden rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted sm:inline-flex">
            评课替代站
          </span>
        </div>
        <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="主导航">
          <a
            href="/search"
            aria-current={isNavActive(currentPath, "/search") ? "page" : undefined}
            className={navLinkClass(isNavActive(currentPath, "/search"))}
          >
            搜索
          </a>
          <a
            href="/scheduler"
            aria-current={isNavActive(currentPath, "/scheduler") ? "page" : undefined}
            className={navLinkClass(isNavActive(currentPath, "/scheduler"))}
          >
            排课
          </a>
          <a
            href="/me"
            aria-current={isNavActive(currentPath, "/me") ? "page" : undefined}
            className={navLinkClass(isNavActive(currentPath, "/me"))}
          >
            我的评论
          </a>
          {user?.isAdmin ? (
            <a
              href="/admin"
              aria-current={isNavActive(currentPath, "/admin") ? "page" : undefined}
              className={navLinkClass(isNavActive(currentPath, "/admin"))}
            >
              管理后台
            </a>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <AuthStatus user={user} />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "inline-flex rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition duration-200 hover:border-stone-300 md:hidden",
              focusRing,
            )}
          >
            {menuOpen ? "关闭" : "菜单"}
          </button>
        </div>
      </div>
      {showPersistentSearch ? (
        <div className="border-t border-border px-4 pb-3 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <SearchBar initialQuery={searchQuery} compact />
          </div>
        </div>
      ) : null}
      {menuOpen ? (
        <nav id={menuId} className="border-t border-border bg-background px-4 py-4 md:hidden" aria-label="移动导航">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-text-secondary">
            <a
              href="/search"
              className={mobileNavClass(isNavActive(currentPath, "/search"))}
              aria-current={isNavActive(currentPath, "/search") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              搜索
            </a>
            <a
              href="/scheduler"
              className={mobileNavClass(isNavActive(currentPath, "/scheduler"))}
              aria-current={isNavActive(currentPath, "/scheduler") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              排课
            </a>
            <a
              href="/me"
              className={mobileNavClass(isNavActive(currentPath, "/me"))}
              aria-current={isNavActive(currentPath, "/me") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              我的评论
            </a>
            {user?.isAdmin ? (
              <a
                href="/admin"
                className={mobileNavClass(isNavActive(currentPath, "/admin"))}
                aria-current={isNavActive(currentPath, "/admin") ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                管理后台
              </a>
            ) : null}
            {!user ? (
              <a
                href="/auth"
                className={mobileNavClass(isNavActive(currentPath, "/auth"))}
                aria-current={isNavActive(currentPath, "/auth") ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                校园邮箱登录
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
