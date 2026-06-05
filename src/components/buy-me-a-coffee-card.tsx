import Image from "next/image";

export function BuyMeACoffeeCard() {
  return (
    <aside className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
      <a
        href="/api/site-assets/buy-me-a-coffee"
        target="_blank"
        rel="noreferrer"
        className="block border-b border-stone-100 bg-stone-50 p-4"
      >
        <Image
          src="/api/site-assets/buy-me-a-coffee"
          alt="Buy me a coffee"
          width={1200}
          height={900}
          unoptimized
          className="h-auto w-full object-contain"
        />
      </a>
      <div className="space-y-2 p-5">
        <h3 className="text-lg font-bold text-stone-900">Buy me a coffee</h3>
        <p className="text-sm leading-7 text-stone-600">
          如果这个替代站对你选课避雷有帮助，可以在这里支持一下维护成本。
        </p>
        <p className="text-xs text-stone-400">点图片可打开原图，方便直接扫码。</p>
      </div>
    </aside>
  );
}
