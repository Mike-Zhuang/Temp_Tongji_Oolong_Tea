import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="rounded-full bg-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
        Not Found
      </p>
      <h1 className="mt-6 text-4xl font-black tracking-tight text-stone-900">
        你找的页面不存在
      </h1>
      <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
        可能是课程编号有误，也可能是链接已经过期。你可以回到首页重新搜索课程名或老师名。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
      >
        返回首页
      </Link>
    </div>
  );
}
