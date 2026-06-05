"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

interface AuthStatusProps {
  user: UserProfile | null;
}

export function AuthStatus({ user }: AuthStatusProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    setIsPending(true);
    await supabase.auth.signOut();
    window.location.href = "/";
    setIsPending(false);
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/auth"
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
        >
          校园邮箱登录
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-stone-900">{user.email}</p>
        <p className="text-xs text-stone-500">{user.isAdmin ? "管理员" : "已登录同济邮箱"}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        退出
      </button>
    </div>
  );
}
