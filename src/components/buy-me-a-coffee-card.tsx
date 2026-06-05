import Image from "next/image";

export function BuyMeACoffeeCard() {
  return (
    <aside className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
      <Image
        src="/api/site-assets/buy-me-a-coffee"
        alt="Buy me a coffee"
        width={1200}
        height={900}
        unoptimized
        className="h-56 w-full object-cover"
      />
      <div className="space-y-2 p-5">
        <h3 className="text-lg font-bold text-stone-900">Buy me a coffee</h3>
        <p className="text-sm leading-7 text-stone-600">
          如果这个替代站对你选课避雷有帮助，可以在这里支持一下维护成本。
        </p>
      </div>
    </aside>
  );
}
