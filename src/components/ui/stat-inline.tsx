interface StatItem {
  label: string;
  value: string;
}

interface StatInlineProps {
  items: StatItem[];
}

export function StatInline({ items }: StatInlineProps) {
  return (
    <div className="flex flex-wrap divide-x divide-border">
      {items.map((item) => (
        <div key={item.label} className="min-w-[5.5rem] flex-1 px-4 py-2 first:pl-0 last:pr-0 sm:flex-none">
          <p className="text-xs font-medium text-stone-500">{item.label}</p>
          <p className="tabular-nums mt-1 text-lg font-bold text-stone-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
