import { focusRing } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

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
    <div className="mt-5 flex flex-wrap gap-2" role="navigation" aria-label="排序方式">
      {options.map((option) => {
        const active = option.value === activeValue;
        return (
          <a
            key={option.value}
            href={getHref(option.value)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-4 py-2 text-sm transition duration-200",
              focusRing,
              active
                ? "bg-accent-soft font-medium text-accent"
                : "bg-surface-muted text-text-muted hover:bg-stone-200/70",
            )}
          >
            {option.label}
          </a>
        );
      })}
    </div>
  );
}
