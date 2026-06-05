interface StatItem {
  label: string;
  value: string;
}

interface StatInlineProps {
  items: StatItem[];
}

export function StatInline({ items }: StatInlineProps) {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-0">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`min-w-[7rem] flex-1 rounded-md bg-stone-100 px-4 py-3 sm:flex-none sm:rounded-none sm:bg-transparent sm:px-5 sm:py-2 ${
            index > 0 ? "sm:border-l sm:border-stone-200" : ""
          }`}
        >
          <p className="text-xs font-medium text-stone-500">{item.label}</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
