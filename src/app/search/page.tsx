import Link from "next/link";

import { CourseCard } from "@/components/course-card";
import { SearchBar } from "@/components/search-bar";
import { SectionTitle } from "@/components/section-title";
import { TeacherCard } from "@/components/teacher-card";
import { SEARCH_SORT_OPTIONS } from "@/lib/constants";
import { searchSite } from "@/lib/data";
import type { SearchSort } from "@/lib/types";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const sort = (typeof params.sort === "string" ? params.sort : "relevance") as SearchSort;
  const result = await searchSite(query, sort);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[36px] border border-orange-100 bg-white/90 p-6 shadow-sm shadow-orange-950/5 sm:p-8">
        <SectionTitle
          eyebrow="搜索"
          title="找课程，也找老师"
          description="统一搜索框会同时命中课程名、老师名、课号和课程分类。建议先搜老师，再看名下所有课。"
        />
        <div className="mt-6">
          <SearchBar initialQuery={query} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {SEARCH_SORT_OPTIONS.map((option) => {
            const active = option.value === sort;
            const href = `/search?q=${encodeURIComponent(query)}&sort=${option.value}`;
            return (
              <Link
                key={option.value}
                href={href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-5">
          <SectionTitle
            eyebrow="老师结果"
            title={`匹配到 ${result.teachers.length} 位老师`}
          />
          {result.teachers.length ? (
            result.teachers.map((teacher) => <TeacherCard key={teacher.slug} teacher={teacher} />)
          ) : (
            <EmptyState text="没有找到匹配的老师，试试课程名、课号或者更短一点的关键词。" />
          )}
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="课程结果"
            title={`匹配到 ${result.courses.length} 门课程`}
          />
          {result.courses.length ? (
            result.courses.map((course) => <CourseCard key={course.id} course={course} />)
          ) : (
            <EmptyState text="没有找到匹配的课程，换一个老师名或删掉部分关键词再试试。" />
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-stone-300 bg-white/70 p-8 text-sm leading-7 text-stone-500">
      {text}
    </div>
  );
}
