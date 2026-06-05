interface SortOption {
  value: string;
  label: string;
}

interface SortPillsProps {
  options: readonly SortOption[];
  activeValue: string;
  getHref: (value: string) => string;
}

export function SortPills({ options, activeValue, getHref }: SortPillsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {options.map((option) => {
        const active = option.value === activeValue;
        return (
          <a
            key={option.value}
            href={getHref(option.value)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {option.label}
          </a>
        );
      })}
    </div>
  );
}
