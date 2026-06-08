import { Button } from "./button";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-muted ${className ?? ""}`} aria-hidden="true" />;
}

export function SchedulerLoadingSkeleton() {
  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-4 h-10 w-full max-w-xl" />
        <SkeletonBlock className="mt-3 h-16 w-full max-w-2xl" />
        <div className="mt-6 flex gap-4">
          <SkeletonBlock className="h-14 w-24" />
          <SkeletonBlock className="h-14 w-24" />
          <SkeletonBlock className="h-14 w-24" />
          <SkeletonBlock className="h-14 w-24" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.78fr)] lg:px-8">
        <div className="space-y-6">
          <SkeletonBlock className="h-48 w-full rounded-lg" />
          <SkeletonBlock className="h-64 w-full rounded-lg" />
          <SkeletonBlock className="h-40 w-full rounded-lg" />
        </div>
        <SkeletonBlock className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function PageErrorState({
  title,
  message,
  retryLabel = "重新加载",
  secondaryHref = "/",
  secondaryLabel = "返回首页",
}: {
  title: string;
  message: string;
  retryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-stone-900">{title}</h1>
      <p className="text-pretty mt-4 text-sm leading-7 text-text-muted">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => window.location.reload()}>
          {retryLabel}
        </Button>
        <Button href={secondaryHref} variant="secondary">
          {secondaryLabel}
        </Button>
      </div>
    </div>
  );
}
