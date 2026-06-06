import { useState } from "react";

import { alertError, alertSuccess, inputField } from "@/lib/ui-classes";
import { ADMIN_EMAIL } from "@/lib/constants";
import { createSupabaseBrowserClient, getSiteUrl } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface LoginFormProps {
  isEnabled: boolean;
}

export function LoginForm({ isEnabled }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageTone(null);

    if (!isEnabled) {
      setMessage("登录功能暂未开放，站长正在补全配置。");
      setMessageTone("error");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const canLogin =
      normalizedEmail === ADMIN_EMAIL.toLowerCase() ||
      normalizedEmail.endsWith("@tongji.edu.cn");

    if (!canLogin) {
      setMessage("只允许使用同济校园邮箱，管理员可使用预设管理员邮箱登录。");
      setMessageTone("error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("登录功能暂未开放，请稍后再试。");
      setMessageTone("error");
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
      setMessageTone("error");
      return;
    }

    setMessage("登录链接已发送到你的校园邮箱，请查收后返回本站。");
    setMessageTone("success");
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
          className={inputField}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !isEnabled} className="w-full">
        {!isEnabled ? "登录功能暂未开放" : isSubmitting ? "发送中..." : "发送登录链接"}
      </Button>
      {message ? (
        <p role="alert" className={cn(messageTone === "success" ? alertSuccess : alertError)}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
