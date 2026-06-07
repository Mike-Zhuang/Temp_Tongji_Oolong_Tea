import { useEffect, useMemo, useRef, useState } from "react";

import { getScheduleData, getUserSchedule, saveUserSchedule } from "@/lib/data-client";
import {
  EMPTY_SCHEDULE_FILTERS,
  PERIOD_LABELS,
  WEEKDAY_LABELS,
  buildConflictCellSet,
  buildScheduleGridBlocks,
  detectConflictsForCourse,
  detectScheduleConflicts,
  filterScheduleCourses,
  formatPeriods,
  formatWeeks,
  getCoursesAtCell,
} from "@/lib/schedule-utils";
import { alertError, alertSuccess, focusRing, inputField } from "@/lib/ui-classes";
import type {
  ScheduleConflict,
  ScheduleCourse,
  ScheduleData,
  ScheduleFilters,
  UserProfile,
} from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

const LOCAL_STORAGE_KEY = "tongji-oolong-tea-selected-schedule";
const COURSE_LIST_LIMIT = 120;

interface SchedulerPageProps {
  user: UserProfile | null;
}

interface PendingConflict {
  course: ScheduleCourse;
  conflicts: ScheduleConflict[];
}

type CloudMergeChoice = "merge" | "cloud";

function loadLocalSelectedIds(term: string) {
  try {
    const raw = window.localStorage.getItem(`${LOCAL_STORAGE_KEY}:${term}`);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as { selectedCourseIds?: string[] };
    return Array.isArray(parsed.selectedCourseIds) ? parsed.selectedCourseIds.map(String) : [];
  } catch {
    return [];
  }
}

function saveLocalSelectedIds(term: string, selectedCourseIds: string[]) {
  window.localStorage.setItem(
    `${LOCAL_STORAGE_KEY}:${term}`,
    JSON.stringify({
      term,
      selectedCourseIds,
      updatedAt: new Date().toISOString(),
    }),
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; count: number }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-stone-800">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputField}>
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}（{option.count}）
          </option>
        ))}
      </select>
    </label>
  );
}

function CourseMeta({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }
  return (
    <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs text-text-secondary">
      {label}：{value}
    </span>
  );
}

function CourseScheduleSummary({ course }: { course: ScheduleCourse }) {
  if (course.arrangements.length === 0) {
    return <p className="text-sm text-warning">该课程暂未给出具体排课时间，可加入备选但不会占用课表格。</p>;
  }

  return (
    <div className="space-y-2">
      {course.arrangements.map((arrangement, index) => (
        <p key={`${course.id}-${index}`} className="text-sm leading-6 text-text-secondary">
          <span className="font-medium text-stone-900">{WEEKDAY_LABELS[arrangement.weekday]}</span>{" "}
          {formatPeriods(arrangement.periods)}，{arrangement.rawWeeks || formatWeeks(arrangement.weeks)}，
          {arrangement.room || "教室暂缺"}，{arrangement.teacher || "教师暂缺"}
        </p>
      ))}
    </div>
  );
}

function ScheduleCourseCard({
  course,
  selected,
  onAdd,
  onRemove,
}: {
  course: ScheduleCourse;
  selected: boolean;
  onAdd: (course: ScheduleCourse) => void;
  onRemove: (courseId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm shadow-stone-200/40 transition hover:border-accent/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-accent-soft px-2.5 py-1 font-mono text-xs font-semibold text-accent">
              {course.code}
            </span>
            <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs text-text-secondary">
              {course.nature}
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-stone-950">{course.name}</h3>
          <p className="text-sm leading-6 text-text-secondary">
            {course.teachers.length ? course.teachers.join("、") : course.teacherText || "教师暂缺"}
          </p>
        </div>
        {selected ? (
          <Button type="button" variant="secondary" className="shrink-0 px-4 py-2" onClick={() => onRemove(course.id)}>
            移除
          </Button>
        ) : (
          <Button type="button" className="shrink-0 px-4 py-2" onClick={() => onAdd(course)}>
            加入课表
          </Button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <CourseMeta label="校区" value={course.campus} />
        <CourseMeta label="语言" value={course.language} />
        <CourseMeta label="学院" value={course.department} />
        <CourseMeta label="人数" value={course.enrollment} />
        <CourseMeta label="周学时" value={course.weeklyHours} />
      </div>
      <div className="mt-4">
        <CourseScheduleSummary course={course} />
      </div>
      {(course.audience || course.rawSchedule) && (
        <div className="mt-4">
          <button
            type="button"
            className={cn("text-sm font-semibold text-accent hover:text-accent-hover", focusRing)}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "收起完整信息" : "展开听课专业与原始排课"}
          </button>
          {expanded ? (
            <div className="mt-3 space-y-2 rounded-md bg-surface-muted p-3 text-sm leading-6 text-text-secondary">
              {course.audience ? <p>听课专业：{course.audience}</p> : null}
              {course.rawSchedule ? <p>原始排课：{course.rawSchedule}</p> : null}
              {course.teacherIdText ? <p>教师工号：{course.teacherIdText}</p> : null}
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

function TimeFilterGrid({
  courses,
  filters,
  onPickCell,
}: {
  courses: ScheduleCourse[];
  filters: ScheduleFilters;
  onPickCell: (weekday: number, period: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <div className="grid min-w-[760px] grid-cols-[72px_repeat(7,minmax(84px,1fr))] text-xs">
        <div className="border-b border-border bg-surface-muted p-2 font-semibold text-text-muted">节次</div>
        {WEEKDAY_LABELS.slice(1).map((label) => (
          <div key={label} className="border-b border-l border-border bg-surface-muted p-2 text-center font-semibold">
            {label}
          </div>
        ))}
        {PERIOD_LABELS.slice(1).map((periodLabel, periodIndex) => {
          const period = periodIndex + 1;
          return (
            <div key={period} className="contents">
              <div className="border-b border-border p-2 font-semibold text-text-muted">{periodLabel}</div>
              {WEEKDAY_LABELS.slice(1).map((_, weekdayIndex) => {
                const weekday = weekdayIndex + 1;
                const count = getCoursesAtCell(courses, weekday, period).length;
                const active = filters.weekday === weekday && filters.period === period;
                return (
                  <button
                    key={`${weekday}-${period}`}
                    type="button"
                    onClick={() => onPickCell(weekday, period)}
                    className={cn(
                      "min-h-12 border-b border-l border-border p-2 text-left transition",
                      active
                        ? "bg-accent text-white"
                        : count
                          ? "bg-accent-soft hover:bg-orange-100"
                          : "bg-surface hover:bg-surface-muted",
                      focusRing,
                    )}
                  >
                    <span className="block text-center font-mono text-sm font-bold">{count}</span>
                    <span className={cn("block text-center", active ? "text-white/80" : "text-text-muted")}>门</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SelectedTimetable({
  selectedCourses,
  conflicts,
  onCellClick,
}: {
  selectedCourses: ScheduleCourse[];
  conflicts: ScheduleConflict[];
  onCellClick: (weekday: number, period: number) => void;
}) {
  const blocks = useMemo(() => buildScheduleGridBlocks(selectedCourses, conflicts), [selectedCourses, conflicts]);
  const conflictCells = useMemo(() => buildConflictCellSet(conflicts), [conflicts]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <div
        className="grid min-w-[560px] text-[11px]"
        style={{
          gridTemplateColumns: "54px repeat(7, minmax(70px, 1fr))",
          gridTemplateRows: "42px repeat(11, minmax(58px, auto))",
        }}
      >
        <div className="border-b border-border bg-surface-muted p-2 font-semibold text-text-muted">节次</div>
        {WEEKDAY_LABELS.slice(1).map((label) => (
          <div key={label} className="border-b border-l border-border bg-surface-muted p-2 text-center font-semibold">
            {label}
          </div>
        ))}
        {PERIOD_LABELS.slice(1).map((periodLabel, periodIndex) => {
          const period = periodIndex + 1;
          return (
            <div key={period} className="contents">
              <div
                className="border-b border-border p-2 font-semibold text-text-muted"
                style={{ gridColumn: 1, gridRow: period + 1 }}
              >
                {periodLabel}
              </div>
              {WEEKDAY_LABELS.slice(1).map((_, weekdayIndex) => {
                const weekday = weekdayIndex + 1;
                const conflict = conflictCells.has(`${weekday}-${period}`);
                return (
                  <button
                    key={`${weekday}-${period}`}
                    type="button"
                    onClick={() => onCellClick(weekday, period)}
                    className={cn(
                      "border-b border-l border-border transition",
                      conflict ? "bg-rose-50" : "bg-white hover:bg-surface-muted",
                      focusRing,
                    )}
                    style={{ gridColumn: weekday + 1, gridRow: period + 1 }}
                    aria-label={`${WEEKDAY_LABELS[weekday]} ${PERIOD_LABELS[period]}`}
                  />
                );
              })}
            </div>
          );
        })}
        {blocks.map((block) => (
          <div
            key={block.id}
            className={cn(
              "pointer-events-none z-10 m-1 overflow-hidden rounded-md border p-2 leading-5 shadow-sm",
              block.isConflict
                ? "border-rose-300 bg-rose-100 text-rose-950"
                : "border-orange-200 bg-accent-soft text-stone-950",
            )}
            style={{
              gridColumn: block.weekday + 1,
              gridRow: `${block.startPeriod + 1} / span ${block.periods.length}`,
            }}
            title={`${block.courseName} ${block.teacherText} ${block.room} ${block.rawWeeks}`}
          >
            <p className="line-clamp-2 font-semibold leading-4">{block.courseName}</p>
            <p className="truncate text-[11px] text-text-secondary">{block.teacherText || "教师暂缺"}</p>
            <p className="truncate text-[11px] text-text-secondary">{block.room || "教室暂缺"}</p>
            <p className="truncate font-mono text-[11px]">{block.rawWeeks || formatWeeks(block.weeks)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConflictDialog({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: PendingConflict | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!pending) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-2xl">
        <p className="text-sm font-semibold text-error">检测到时间冲突</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">仍然加入 {pending.course.name} 吗？</h2>
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto text-sm leading-6 text-text-secondary">
          {pending.conflicts.slice(0, 8).map((conflict, index) => (
            <p key={`${conflict.otherCourseId}-${conflict.period}-${index}`}>
              与 <span className="font-semibold text-stone-950">{conflict.otherCourseName}</span> 冲突：
              {WEEKDAY_LABELS[conflict.weekday]} 第 {conflict.period} 节，{formatWeeks(conflict.weeks)}
            </p>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button type="button" onClick={onConfirm}>
            仍然加入并高亮
          </Button>
        </div>
      </div>
    </div>
  );
}

function CloudMergeBar({
  onChoose,
}: {
  onChoose: (choice: CloudMergeChoice) => void;
}) {
  return (
    <div className="rounded-lg border border-orange-200 bg-accent-soft p-4 text-sm text-text-secondary">
      <p className="font-semibold text-stone-950">检测到本地和云端都有课表</p>
      <p className="mt-1">请选择这次打开页面时的处理方式。合并会保留两边课程，使用云端会覆盖本地显示。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" className="px-4 py-2" onClick={() => onChoose("merge")}>
          合并本地课表
        </Button>
        <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => onChoose("cloud")}>
          使用云端课表
        </Button>
      </div>
    </div>
  );
}

export function SchedulerPage({ user }: SchedulerPageProps) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ScheduleFilters>(EMPTY_SCHEDULE_FILTERS);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);
  const [cloudMerge, setCloudMerge] = useState<{ localIds: string[]; cloudIds: string[] } | null>(null);
  const [syncMessage, setSyncMessage] = useState("本地课表会自动保存。");
  const hydratedTermRef = useRef("");
  const cloudReadyRef = useRef(false);

  useEffect(() => {
    getScheduleData()
      .then((loadedData) => {
        setData(loadedData);
        const localIds = loadLocalSelectedIds(loadedData.filters.term);
        setSelectedCourseIds(localIds);
        hydratedTermRef.current = loadedData.filters.term;
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "排课数据加载失败");
      });
  }, []);

  useEffect(() => {
    if (!data || !user) {
      cloudReadyRef.current = false;
      return;
    }

    let cancelled = false;
    getUserSchedule(user.id, data.filters.term).then((cloudSchedule) => {
      if (cancelled) {
        return;
      }
      const localIds = loadLocalSelectedIds(data.filters.term);
      const cloudIds = cloudSchedule?.selectedCourseIds ?? [];
      if (localIds.length > 0 && cloudIds.length > 0 && localIds.join("|") !== cloudIds.join("|")) {
        setCloudMerge({ localIds, cloudIds });
        setSyncMessage("登录成功：请选择本地课表和云端课表的合并方式。");
      } else if (cloudIds.length > 0) {
        setSelectedCourseIds(cloudIds);
        setSyncMessage("已从云端恢复课表。");
      } else if (localIds.length > 0) {
        setSyncMessage("已继续使用本地课表，并会尝试同步到云端。");
      } else {
        setSyncMessage("登录后课表会自动同步到云端。");
      }
      cloudReadyRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [data, user]);

  useEffect(() => {
    if (!data || hydratedTermRef.current !== data.filters.term) {
      return;
    }

    saveLocalSelectedIds(data.filters.term, selectedCourseIds);
    if (!user || !cloudReadyRef.current || cloudMerge) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveUserSchedule({
        userId: user.id,
        term: data.filters.term,
        selectedCourseIds,
        updatedAt: new Date().toISOString(),
      }).then(() => setSyncMessage("课表已保存到本地，并已尝试同步云端。"));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [cloudMerge, data, selectedCourseIds, user]);

  const courseMap = useMemo(() => new Map((data?.courses ?? []).map((course) => [course.id, course])), [data]);
  const selectedCourses = useMemo(
    () => selectedCourseIds.map((courseId) => courseMap.get(courseId)).filter((course): course is ScheduleCourse => Boolean(course)),
    [courseMap, selectedCourseIds],
  );
  const selectedIdSet = useMemo(() => new Set(selectedCourseIds), [selectedCourseIds]);
  const baseFilteredCourses = useMemo(() => {
    if (!data) {
      return [];
    }
    return filterScheduleCourses(
      data.courses,
      { ...filters, weekday: null, period: null },
      data.filters.generalEducationNatures,
    );
  }, [data, filters]);
  const filteredCourses = useMemo(() => {
    if (!data) {
      return [];
    }
    return filterScheduleCourses(data.courses, filters, data.filters.generalEducationNatures);
  }, [data, filters]);
  const conflicts = useMemo(() => detectScheduleConflicts(selectedCourses), [selectedCourses]);

  const updateFilter = <Key extends keyof ScheduleFilters>(key: Key, value: ScheduleFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const addCourse = (course: ScheduleCourse) => {
    if (selectedIdSet.has(course.id)) {
      return;
    }
    const nextConflicts = detectConflictsForCourse(course, selectedCourses);
    if (nextConflicts.length > 0) {
      setPendingConflict({ course, conflicts: nextConflicts });
      return;
    }
    setSelectedCourseIds((ids) => [...ids, course.id]);
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourseIds((ids) => ids.filter((id) => id !== courseId));
  };

  const confirmConflictCourse = () => {
    if (!pendingConflict) {
      return;
    }
    setSelectedCourseIds((ids) => (ids.includes(pendingConflict.course.id) ? ids : [...ids, pendingConflict.course.id]));
    setPendingConflict(null);
  };

  const chooseCloudMerge = (choice: CloudMergeChoice) => {
    if (!cloudMerge || !data) {
      return;
    }
    const nextIds =
      choice === "merge"
        ? Array.from(new Set([...cloudMerge.cloudIds, ...cloudMerge.localIds]))
        : cloudMerge.cloudIds;
    setSelectedCourseIds(nextIds);
    setCloudMerge(null);
    setSyncMessage(choice === "merge" ? "已合并本地和云端课表。" : "已使用云端课表覆盖当前显示。");
  };

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-stone-950">排课数据加载失败</h1>
        <p className="mt-4 text-sm leading-7 text-text-muted">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
        <div className="h-4 w-52 animate-pulse rounded-md bg-surface-muted" />
        <p className="mt-4 text-sm text-text-muted">正在加载全校课表数据...</p>
      </div>
    );
  }

  const visibleCourses = filteredCourses.slice(0, COURSE_LIST_LIMIT);

  return (
    <div className="bg-[radial-gradient(circle_at_20%_0%,rgba(254,243,235,0.95),transparent_30%),linear-gradient(180deg,#f7f6f4_0%,#fff_46%,#f7f6f4_100%)] pb-16">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="space-y-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              {data.filters.term}
            </p>
            <h1 className="text-balance text-4xl font-black tracking-tight text-stone-950 sm:text-5xl">
              排课，不靠玄学手搓表格
            </h1>
            <p className="max-w-2xl text-base leading-8 text-text-secondary">
              从全校课表中搜索课程、筛选校区和通识类别，点击时间格查看可选课程。加入冲突课程前会二次确认，确认后冲突格会直接高亮。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-2xl font-black">{data.summary.courseCount}</p>
              <p className="mt-1 text-xs text-text-muted">课程记录</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-2xl font-black">{data.summary.scheduledCourseCount}</p>
              <p className="mt-1 text-xs text-text-muted">有排课</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-2xl font-black">{selectedCourseIds.length}</p>
              <p className="mt-1 text-xs text-text-muted">已选</p>
            </div>
            <div className={cn("rounded-lg border p-4", conflicts.length ? "border-rose-200 bg-rose-50" : "border-border bg-surface")}>
              <p className="text-2xl font-black">{conflicts.length}</p>
              <p className="mt-1 text-xs text-text-muted">冲突点</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.78fr)] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1.5 text-sm font-medium text-stone-800 md:col-span-2">
                <span>全文搜索</span>
                <input
                  value={filters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="课程名、课程序号、教师、工号、教室、专业..."
                  className={inputField}
                />
              </label>
              <SelectField label="课程性质" value={filters.nature} options={data.filters.natures} onChange={(value) => updateFilter("nature", value)} />
              <SelectField label="授课语言" value={filters.language} options={data.filters.languages} onChange={(value) => updateFilter("language", value)} />
              <SelectField label="校区" value={filters.campus} options={data.filters.campuses} onChange={(value) => updateFilter("campus", value)} />
              <SelectField label="开课学院" value={filters.department} options={data.filters.departments} onChange={(value) => updateFilter("department", value)} />
              <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={filters.generalOnly}
                  onChange={(event) => updateFilter("generalOnly", event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                只看通识/选修类别
              </label>
              <Button type="button" variant="secondary" onClick={() => setFilters(EMPTY_SCHEDULE_FILTERS)}>
                清空筛选
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-950">点击时间格筛课</h2>
                <p className="mt-1 text-sm text-text-muted">格子里的数字表示当前筛选条件下该时间可选课程数。</p>
              </div>
              {filters.weekday && filters.period ? (
                <Button type="button" variant="ghost" onClick={() => setFilters((current) => ({ ...current, weekday: null, period: null }))}>
                  取消时间筛选
                </Button>
              ) : null}
            </div>
            <TimeFilterGrid
              courses={baseFilteredCourses}
              filters={filters}
              onPickCell={(weekday, period) => setFilters((current) => ({ ...current, weekday, period }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-stone-950">课程池</h2>
                <p className="mt-1 text-sm text-text-muted">
                  已匹配 {filteredCourses.length} 门课程，当前显示前 {visibleCourses.length} 门。
                </p>
              </div>
            </div>
            {visibleCourses.length ? (
              <div className="space-y-3">
                {visibleCourses.map((course) => (
                  <ScheduleCourseCard
                    key={course.id}
                    course={course}
                    selected={selectedIdSet.has(course.id)}
                    onAdd={addCourse}
                    onRemove={removeCourse}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-text-muted">
                当前筛选条件下没有课程。可以清空时间格或减少筛选条件再试。
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {cloudMerge ? <CloudMergeBar onChoose={chooseCloudMerge} /> : null}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-950">我的课表</h2>
                <p className="mt-1 text-sm text-text-muted">{syncMessage}</p>
              </div>
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => setSelectedCourseIds([])}>
                清空
              </Button>
            </div>
            <div className="mt-4">
              <SelectedTimetable
                selectedCourses={selectedCourses}
                conflicts={conflicts}
                onCellClick={(weekday, period) => setFilters((current) => ({ ...current, weekday, period }))}
              />
            </div>
            {conflicts.length ? (
              <p className={cn(alertError, "mt-3")}>存在 {conflicts.length} 个冲突点；冲突课程仍会保留，方便你自己权衡。</p>
            ) : (
              <p className={cn(alertSuccess, "mt-3")}>当前已选课程没有检测到时间冲突。</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-stone-950">已选课程</h2>
            <div className="mt-4 space-y-3">
              {selectedCourses.length ? (
                selectedCourses.map((course) => (
                  <div key={course.id} className="rounded-md border border-border bg-surface-muted p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">{course.name}</p>
                        <p className="mt-1 text-xs text-text-muted">{course.code} · {course.campus} · {course.nature}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCourse(course.id)}
                        className={cn("shrink-0 text-xs font-semibold text-accent hover:text-accent-hover", focusRing)}
                      >
                        移除
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-surface-muted p-4 text-sm text-text-muted">
                  还没有加入课程。可以先点时间格，或者直接在左侧搜索课程。
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>

      <ConflictDialog pending={pendingConflict} onCancel={() => setPendingConflict(null)} onConfirm={confirmConflictCourse} />
    </div>
  );
}
