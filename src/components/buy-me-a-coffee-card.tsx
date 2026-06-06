import buyMeACoffeeUrl from "../../supabase/storage/site-assets/buy-me-a-coffee.jpg";

import { focusRing } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

interface BuyMeACoffeeCardProps {
  compact?: boolean;
}

export function BuyMeACoffeeCard({ compact = false }: BuyMeACoffeeCardProps) {
  return (
    <aside className="rounded-lg border border-border bg-surface p-5">
      <a href={buyMeACoffeeUrl} target="_blank" rel="noreferrer" className="block">
        <img
          src={buyMeACoffeeUrl}
          alt="支持站长的 Buy Me a Coffee 二维码"
          loading="lazy"
          decoding="async"
          className={`mx-auto h-auto w-full rounded-md object-contain ${
            compact ? "max-h-48" : "max-h-[720px]"
          }`}
        />
      </a>
      <div className="space-y-2 pt-5">
        <h3 className="text-lg font-bold text-stone-900">Buy me a coffee</h3>
        <p className="text-pretty text-sm leading-7 text-text-muted">
          如果这个替代站对你选课有帮助，可以在这里支持一下维护成本。
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={buyMeACoffeeUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition duration-200 hover:border-stone-300 hover:bg-surface-muted",
              focusRing,
            )}
          >
            打开原图扫码
          </a>
          {!compact ? (
            <p className="self-center text-xs text-text-muted">如果卡片里看不清，直接点按钮打开原图。</p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
