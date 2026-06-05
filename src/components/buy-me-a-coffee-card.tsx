import buyMeACoffeeUrl from "../../supabase/storage/site-assets/buy-me-a-coffee.jpg";

interface BuyMeACoffeeCardProps {
  compact?: boolean;
}

export function BuyMeACoffeeCard({ compact = false }: BuyMeACoffeeCardProps) {
  return (
    <aside className="rounded-lg border border-stone-200 bg-white p-5">
      <a href={buyMeACoffeeUrl} target="_blank" rel="noreferrer" className="block">
        <img
          src={buyMeACoffeeUrl}
          alt="Buy me a coffee"
          loading="lazy"
          decoding="async"
          className={`mx-auto h-auto w-full rounded-md object-contain ${
            compact ? "max-h-48" : "max-h-[720px]"
          }`}
        />
      </a>
      <div className="space-y-2 pt-5">
        <h3 className="text-lg font-bold text-stone-900">Buy me a coffee</h3>
        <p className="text-sm leading-7 text-stone-600">
          如果这个替代站对你选课避雷有帮助，可以在这里支持一下维护成本。
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={buyMeACoffeeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
          >
            打开原图扫码
          </a>
          {!compact ? (
            <p className="self-center text-xs text-stone-400">如果卡片里看不清，直接点按钮打开原图。</p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
