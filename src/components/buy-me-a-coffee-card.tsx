import buyMeACoffeeUrl from "../../supabase/storage/site-assets/buy-me-a-coffee.jpg";

export function BuyMeACoffeeCard() {
  return (
    <aside className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
      <div className="rounded-[24px] border border-stone-100 bg-stone-50 p-4">
        <a
          href={buyMeACoffeeUrl}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <img
            src={buyMeACoffeeUrl}
            alt="Buy me a coffee"
            className="mx-auto h-auto max-h-[720px] w-full rounded-2xl object-contain"
          />
        </a>
      </div>
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
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-700"
          >
            打开原图扫码
          </a>
          <p className="self-center text-xs text-stone-400">如果卡片里看不清，直接点按钮打开原图。</p>
        </div>
      </div>
    </aside>
  );
}
