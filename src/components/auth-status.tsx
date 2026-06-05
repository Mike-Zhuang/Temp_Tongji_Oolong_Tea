"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

import { Button } from "./ui/button";

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
        <Button href="/auth" className="px-4 py-2 text-sm">
          校园邮箱登录
        </Button>
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
        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        退出
      </button>
    </div>
  );
}
