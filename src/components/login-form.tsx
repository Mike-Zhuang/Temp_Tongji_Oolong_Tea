import { useId, useState } from "react";

import { alertError, alertSuccess, inputField } from "@/lib/ui-classes";
import { ADMIN_EMAIL } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface LoginFormProps {
  isEnabled: boolean;
  redirectTo?: string;
}

function LoginStepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { id: 1, label: "输入邮箱" },
    { id: 2, label: "填写验证码" },
  ] as const;

  return (
    <ol className="flex flex-wrap gap-3 text-sm" aria-label="登录步骤">
      {steps.map((step) => {
        const active = currentStep === step.id;
        const done = currentStep > step.id;
        return (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 font-medium",
              active && "bg-accent-soft text-accent",
              done && "text-text-muted",
              !active && !done && "text-text-muted",
            )}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                active ? "bg-accent text-white" : "bg-surface-muted text-text-secondary",
              )}
            >
              {step.id}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

export function LoginForm({ isEnabled, redirectTo = "/me" }: LoginFormProps) {
  const emailHelpId = useId();
  const tokenHelpId = useId();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const currentStep: 1 | 2 = otpSentTo ? 2 : 1;

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
    setTokenInvalid(false);

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
    setMessage("验证码已发送到你的邮箱，请把邮件里的数字验证码填到下方。");
    setMessageTone("success");
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageTone(null);
    setTokenInvalid(false);

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
    if (!/^\d{6,8}$/.test(normalizedToken)) {
      setMessage("请输入邮件中的数字验证码。");
      setMessageTone("error");
      setTokenInvalid(true);
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
      setTokenInvalid(true);
      return;
    }

    setMessage("登录成功，正在跳转...");
    setMessageTone("success");
    window.setTimeout(() => {
      window.location.href = redirectTo;
    }, 350);
  }

  return (
    <div className="space-y-6">
      <LoginStepIndicator currentStep={currentStep} />

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
              setTokenInvalid(false);
            }}
            placeholder="example@tongji.edu.cn 或管理员邮箱"
            disabled={!isEnabled || isSending || isVerifying}
            aria-describedby={emailHelpId}
            className={inputField}
          />
          <p id={emailHelpId} className="text-xs leading-6 text-text-muted">
            仅支持 @tongji.edu.cn 校园邮箱，管理员可使用预设邮箱登录。
          </p>
        </div>
        <Button type="submit" disabled={isSending || isVerifying || !isEnabled} className="w-full">
          {!isEnabled ? "登录功能暂未开放" : isSending ? "发送中..." : otpSentTo ? "重新发送验证码" : "发送验证码"}
        </Button>
      </form>

      {otpSentTo ? (
        <form
          onSubmit={handleVerifyCode}
          className="motion-safe-fade-up space-y-4 rounded-lg border border-border bg-surface-muted p-4"
        >
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-semibold text-stone-900">
              邮箱验证码
            </label>
            <input
              id="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(event) => {
                setToken(event.target.value.replace(/[^\d]/g, "").slice(0, 8));
                setTokenInvalid(false);
              }}
              placeholder="输入邮件中的数字验证码"
              disabled={isVerifying}
              aria-describedby={tokenHelpId}
              aria-invalid={tokenInvalid}
              className={inputField}
            />
            <p id={tokenHelpId} className="text-xs leading-6 text-text-muted">
              验证码已发送至 {otpSentTo}。没收到邮件可以先检查垃圾箱；频繁请求可能会短暂限流。
            </p>
          </div>
          <Button type="submit" disabled={isVerifying || !isEnabled} className="w-full">
            {isVerifying ? "验证中..." : "验证并登录"}
          </Button>
        </form>
      ) : null}

      {message ? (
        <p role="alert" className={cn(messageTone === "success" ? alertSuccess : alertError)}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
