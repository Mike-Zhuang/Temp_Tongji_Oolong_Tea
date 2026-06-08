import { useState } from "react";

import { alertError, alertSuccess, inputField } from "@/lib/ui-classes";
import { ADMIN_EMAIL } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface LoginFormProps {
  isEnabled: boolean;
}

export function LoginForm({ isEnabled }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  function validateEmail() {
    const normalizedEmail = email.trim().toLowerCase();
    const canLogin =
      normalizedEmail === ADMIN_EMAIL.toLowerCase() ||
      normalizedEmail.endsWith("@tongji.edu.cn");

    if (!canLogin) {
      return {
        email: normalizedEmail,
        error: "只允许使用同济校园邮箱，管理员可使用预设管理员邮箱登录。",
      };
    }

    return {
      email: normalizedEmail,
      error: "",
    };
  }

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageTone(null);

    if (!isEnabled) {
      setMessage("登录功能暂未开放，站长正在补全配置。");
      setMessageTone("error");
      return;
    }

    const validation = validateEmail();
    if (validation.error) {
      setMessage(validation.error);
      setMessageTone("error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("登录功能暂未开放，请稍后再试。");
      setMessageTone("error");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: validation.email,
      options: {
        shouldCreateUser: true,
      },
    });

    setIsSending(false);

    if (error) {
      setMessage(error.message);
      setMessageTone("error");
      return;
    }

    setOtpSentTo(validation.email);
    setMessage("验证码已发送到你的邮箱，请把邮件里的 6 位验证码填到下方。");
    setMessageTone("success");
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageTone(null);

    const validation = validateEmail();
    const normalizedToken = token.replace(/\s+/g, "");
    if (validation.error) {
      setMessage(validation.error);
      setMessageTone("error");
      return;
    }
    if (!otpSentTo) {
      setMessage("请先发送验证码。");
      setMessageTone("error");
      return;
    }
    if (!/^\d{6}$/.test(normalizedToken)) {
      setMessage("请输入邮件中的 6 位数字验证码。");
      setMessageTone("error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("登录功能暂未开放，请稍后再试。");
      setMessageTone("error");
      return;
    }

    setIsVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: validation.email,
      token: normalizedToken,
      type: "email",
    });
    setIsVerifying(false);

    if (error) {
      setMessage(error.message);
      setMessageTone("error");
      return;
    }

    setMessage("登录成功，正在进入我的评论...");
    setMessageTone("success");
    window.setTimeout(() => {
      window.location.href = "/me";
    }, 350);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-stone-900">
            同济校园邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setOtpSentTo("");
              setToken("");
            }}
            placeholder="example@tongji.edu.cn 或管理员邮箱"
            disabled={!isEnabled || isSending || isVerifying}
            className={inputField}
          />
        </div>
        <Button type="submit" disabled={isSending || isVerifying || !isEnabled} className="w-full">
          {!isEnabled ? "登录功能暂未开放" : isSending ? "发送中..." : otpSentTo ? "重新发送验证码" : "发送验证码"}
        </Button>
      </form>

      <form onSubmit={handleVerifyCode} className="space-y-4 rounded-lg border border-border bg-surface-muted p-4">
        <div className="space-y-2">
          <label htmlFor="token" className="text-sm font-semibold text-stone-900">
            邮箱验证码
          </label>
          <input
            id="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={token}
            onChange={(event) => setToken(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            placeholder="输入 6 位数字"
            disabled={!otpSentTo || isVerifying}
            className={inputField}
          />
        </div>
        <Button type="submit" disabled={!otpSentTo || isVerifying || !isEnabled} className="w-full">
          {isVerifying ? "验证中..." : "验证并登录"}
        </Button>
        <p className="text-xs leading-6 text-text-muted">
          没收到邮件可以先检查垃圾箱；如果频繁请求验证码，邮箱服务可能会短暂限流。
        </p>
      </form>

      {message ? (
        <p role="alert" className={cn(messageTone === "success" ? alertSuccess : alertError)}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
