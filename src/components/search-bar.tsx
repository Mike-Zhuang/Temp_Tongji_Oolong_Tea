"use client";

import { useState } from "react";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  large?: boolean;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-orange-500"
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
        className={`flex items-center gap-3 rounded-full border border-stone-200 bg-white shadow-sm ${
          large ? "px-4 py-4 sm:px-6" : "px-4 py-3"
        }`}
      >
        <SearchIcon />
        <input
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-stone-900 outline-none placeholder:text-stone-400 ${
            large ? "text-base sm:text-lg" : "text-sm sm:text-base"
          }`}
        />
        <button
          type="submit"
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          搜索
        </button>
      </div>
    </form>
  );
}
