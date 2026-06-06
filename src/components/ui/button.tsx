import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { focusRing } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonBaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "border border-border bg-surface text-stone-800 hover:border-stone-300 hover:bg-surface-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
  ghost: "text-stone-600 hover:bg-surface-muted hover:text-stone-900 active:scale-[0.98]",
};

type ButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonLinkProps = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: ButtonProps | ButtonLinkProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition duration-200",
    focusRing,
    variantClasses[variant],
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
