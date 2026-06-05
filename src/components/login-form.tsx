"use client";

import { useState } from "react";

import { ADMIN_EMAIL } from "@/lib/constants";
import { createSupabaseBrowserClient, getSiteUrl } from "@/lib/supabase/client";

interface LoginFormProps {
  isEnabled: boolean;
}

export function LoginForm({ isEnabled }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isEnabled) {
      setMessage("登录功能暂未开放，站长正在补全配置。");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const canLogin =
      normalizedEmail === ADMIN_EMAIL.toLowerCase() ||
      normalizedEmail.endsWith("@tongji.edu.cn");

    if (!canLogin) {
      setMessage("只允许使用同济校园邮箱，管理员可使用预设管理员邮箱登录。");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("登录功能暂未开放，请稍后再试。");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("登录链接已经发送到你的校园邮箱，请查收后返回本站。");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-stone-900">
          同济校园邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example@tongji.edu.cn 或管理员邮箱"
          disabled={!isEnabled}
          className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-200 placeholder:text-stone-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !isEnabled}
        className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!isEnabled ? "登录功能暂未开放" : isSubmitting ? "发送中..." : "发送登录链接"}
      </button>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
