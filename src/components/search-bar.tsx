import { useState } from "react";

import { focusRing } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  large?: boolean;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-accent"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

export function SearchBar({
  initialQuery = "",
  placeholder = "搜索课程名、老师名、课号",
  large = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();

    window.location.href = nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search";
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label className="sr-only" htmlFor="site-search">
        搜索课程或老师
      </label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border bg-surface",
          large ? "px-4 py-4 sm:px-6" : "px-4 py-3",
        )}
      >
        <SearchIcon />
        <input
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent text-stone-900 outline-none placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            large ? "text-base sm:text-lg" : "text-sm sm:text-base",
          )}
        />
        <button
          type="submit"
          className={cn(
            "shrink-0 min-w-[4.5rem] whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-accent-hover active:scale-[0.98]",
            focusRing,
          )}
        >
          搜索
        </button>
      </div>
    </form>
  );
}
