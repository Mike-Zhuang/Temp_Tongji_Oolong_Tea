import { useEffect, useMemo, useRef, useState } from "react";

import { InfoPill } from "@/components/info-pill";
import { SectionTitle } from "@/components/section-title";
import { PageErrorState, SchedulerLoadingSkeleton } from "@/components/ui/page-states";
import { PageSection } from "@/components/ui/page-section";
import { StatInline } from "@/components/ui/stat-inline";
import { getScheduleData, getScheduleEvaluationIndex, getUserSchedule, saveUserSchedule } from "@/lib/data-client";
import {
  EMPTY_SCHEDULE_FILTERS,
  PERIOD_LABELS,
  WEEKDAY_LABELS,
  buildScheduleEvaluationMatches,
  buildConflictCellSet,
  buildScheduleGridBlocks,
  detectConflictsForCourse,
  detectScheduleConflicts,
  filterScheduleCourses,
  formatPeriods,
  formatWeeks,
  getCoursesAtCell,
} from "@/lib/schedule-utils";
import { alertError, alertSuccess, cardHover, focusRing, inputField } from "@/lib/ui-classes";
import type {
  ScheduleConflict,
  ScheduleCourse,
  ScheduleData,
  ScheduleEvaluationIndex,
  ScheduleEvaluationMatchResult,
  ScheduleFilters,
  UserProfile,
} from "@/lib/types";
import { buildCourseUrl, buildTeacherUrl, cn, formatRating } from "@/lib/utils";

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

function EvaluationReference({ match }: { match: ScheduleEvaluationMatchResult | undefined }) {
  if (!match) {
    return (
      <div className="mt-4 rounded-md bg-surface-muted p-3 text-sm text-text-muted">
        正在匹配评课数据...
      </div>
    );
  }

  if (match.courseMatches.length > 0) {
    const hasHighConfidence = match.courseMatches.some((item) => item.confidence === "high");
    return (
      <div className="mt-4 rounded-md border border-border bg-surface-muted p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">
            {hasHighConfidence ? "评价参考" : "可能相关课程评价"}
          </p>
          <a href={buildCourseUrl(match.courseMatches[0].courseId)} className="text-xs font-semibold text-accent hover:text-accent-hover">
            查看完整评论
          </a>
        </div>
        <div className="mt-3 space-y-2">
          {match.courseMatches.map((item) => (
            <a
              key={item.courseId}
              href={buildCourseUrl(item.courseId)}
              className="block rounded-md bg-surface px-3 py-2 text-sm transition hover:bg-accent-soft"
            >
              <span className="block font-semibold text-stone-950">
                {item.courseName} · {item.teacherName}
              </span>
              <span className="mt-1 block text-xs leading-5 text-text-muted">
                {formatEvaluationRating(item.averageRating)} · {item.reviewCount} 条评论 · {item.reason}
              </span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (match.teacherMatches.length > 0) {
    return (
      <div className="mt-4 rounded-md border border-border bg-surface-muted p-3">
        <p className="text-sm font-semibold text-stone-900">暂无对应课程评价，可先看老师评价</p>
        <div className="mt-3 space-y-2">
          {match.teacherMatches.map((teacher) => (
            <a
              key={teacher.slug}
              href={buildTeacherUrl(teacher.slug)}
              className="block rounded-md bg-surface px-3 py-2 text-sm transition hover:bg-accent-soft"
            >
              <span className="block font-semibold text-stone-950">{teacher.name}</span>
              <span className="mt-1 block text-xs leading-5 text-text-muted">
                {formatEvaluationRating(teacher.averageRating)} · {teacher.reviewCount} 条评论 · {teacher.courseCount} 门课
              </span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-border bg-surface-muted p-3 text-sm">
      <p className="font-semibold text-stone-900">暂无匹配评价</p>
      <a href={match.fallbackSearchUrl} className="mt-2 inline-flex font-semibold text-accent hover:text-accent-hover">
        去评课搜索里找找
      </a>
    </div>
  );
}

function getEvaluationHref(match: ScheduleEvaluationMatchResult | undefined) {
  if (!match) {
    return "";
  }
  if (match.courseMatches[0]) {
    return buildCourseUrl(match.courseMatches[0].courseId);
  }
  if (match.teacherMatches[0]) {
    return buildTeacherUrl(match.teacherMatches[0].slug);
  }
  return match.fallbackSearchUrl;
}

function formatEvaluationRating(value: number) {
  const formatted = formatRating(value);
  return formatted === "暂无" ? "暂无评分" : `${formatted} 分`;
}

function ScheduleCourseCard({
  course,
  selected,
  evaluationMatch,
  onAdd,
  onRemove,
}: {
  course: ScheduleCourse;
  selected: boolean;
  evaluationMatch: ScheduleEvaluationMatchResult | undefined;
  onAdd: (course: ScheduleCourse) => void;
  onRemove: (courseId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={cn("rounded-lg border border-border bg-surface p-5", cardHover)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <InfoPill tone="warm">{course.code}</InfoPill>
            <InfoPill>{course.nature}</InfoPill>
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{course.name}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {course.teachers.length ? course.teachers.join("、") : course.teacherText || "教师暂缺"}
            </p>
          </div>
        </div>
        <div className="shrink-0 sm:self-end">
          {selected ? (
            <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => onRemove(course.id)}>
              移除课程
            </Button>
          ) : (
            <Button type="button" className="px-4 py-2" onClick={() => onAdd(course)}>
              加入课表
            </Button>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <CourseMeta label="校区" value={course.campus} />
        <CourseMeta label="语言" value={course.language} />
        <CourseMeta label="学院" value={course.department} />
        <CourseMeta label="人数" value={course.enrollment} />
        <CourseMeta label="周学时" value={course.weeklyHours} />
      </div>
      <div className="mt-4">
        <CourseScheduleSummary course={course} />
      </div>
      <EvaluationReference match={evaluationMatch} />
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
                    aria-pressed={active}
                    aria-label={`${WEEKDAY_LABELS[weekday]} ${PERIOD_LABELS[period]}，${count} 门可选`}
                    className={cn(
                      "min-h-12 border-b border-l border-border p-2 text-left transition duration-200",
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
                      "border-b border-l border-border transition duration-200",
                      conflict ? "bg-rose-50" : "bg-white hover:bg-surface-muted",
                      focusRing,
                    )}
                    style={{ gridColumn: weekday + 1, gridRow: period + 1 }}
                    aria-label={`${WEEKDAY_LABELS[weekday]} ${PERIOD_LABELS[period]}${conflict ? "，存在冲突" : ""}`}
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
              "pointer-events-none z-10 m-1 overflow-hidden rounded-md border p-2 leading-5",
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (pending && !dialog.open) {
      confirmedRef.current = false;
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>("button")?.focus();
    }
    if (!pending && dialog.open) {
      dialog.close();
    }
  }, [pending]);

  function handleClose() {
    if (!confirmedRef.current) {
      onCancel();
    }
    confirmedRef.current = false;
  }

  function handleConfirm() {
    confirmedRef.current = true;
    onConfirm();
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-border bg-surface p-6 backdrop:bg-stone-950/35 open:flex open:flex-col"
      aria-labelledby="conflict-dialog-title"
      aria-describedby="conflict-dialog-desc"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={handleClose}
    >
      {pending ? (
        <>
          <p className="text-sm font-semibold text-error">检测到时间冲突</p>
          <h2 id="conflict-dialog-title" className="mt-2 text-2xl font-bold tracking-tight text-stone-950">
            仍然加入 {pending.course.name} 吗？
          </h2>
          <div id="conflict-dialog-desc" className="mt-4 max-h-64 space-y-3 overflow-y-auto text-sm leading-6 text-text-secondary">
            {pending.conflicts.slice(0, 8).map((conflict, index) => (
              <p key={`${conflict.otherCourseId}-${conflict.period}-${index}`}>
                与 <span className="font-semibold text-stone-950">{conflict.otherCourseName}</span> 冲突：
                {WEEKDAY_LABELS[conflict.weekday]} 第 {conflict.period} 节，{formatWeeks(conflict.weeks)}
              </p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onCancel}>
              取消加入
            </Button>
            <Button type="button" onClick={handleConfirm}>
              仍然加入并高亮
            </Button>
          </div>
        </>
      ) : null}
    </dialog>
  );
}

function CloudMergeBar({
  onChoose,
}: {
  onChoose: (choice: CloudMergeChoice) => void;
}) {
  return (
    <PageSection variant="muted">
      <p className="font-semibold text-stone-950">检测到本地和云端都有课表</p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">
        请选择这次打开页面时的处理方式。合并会保留两边课程，使用云端会覆盖本地显示。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" className="px-4 py-2" onClick={() => onChoose("merge")}>
          合并本地课表
        </Button>
        <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => onChoose("cloud")}>
          使用云端课表
        </Button>
      </div>
    </PageSection>
  );
}

export function SchedulerPage({ user }: SchedulerPageProps) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [evaluationIndex, setEvaluationIndex] = useState<ScheduleEvaluationIndex | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ScheduleFilters>(EMPTY_SCHEDULE_FILTERS);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);
  const [cloudMerge, setCloudMerge] = useState<{ localIds: string[]; cloudIds: string[] } | null>(null);
  const [syncMessage, setSyncMessage] = useState("本地课表会自动保存。");
  const hydratedTermRef = useRef("");
  const cloudReadyRef = useRef(false);

  useEffect(() => {
    Promise.all([getScheduleData(), getScheduleEvaluationIndex()])
      .then(([loadedData, loadedEvaluationIndex]) => {
        setData(loadedData);
        setEvaluationIndex(loadedEvaluationIndex);
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
  const evaluationMatches = useMemo(() => {
    if (!data || !evaluationIndex) {
      return new Map<string, ScheduleEvaluationMatchResult>();
    }
    return buildScheduleEvaluationMatches(data.courses, evaluationIndex);
  }, [data, evaluationIndex]);

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
      <PageErrorState
        title="排课数据加载失败"
        message={error}
      />
    );
  }

  if (!data) {
    return <SchedulerLoadingSkeleton />;
  }

  const visibleCourses = filteredCourses.slice(0, COURSE_LIST_LIMIT);

  return (
    <div className="pb-16">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageSection variant="plain">
          <SectionTitle
            level={1}
            eyebrow={data.filters.term}
            title="模拟排课"
            description="搜索全校课程、按校区和通识类别筛选，点击时间格查看可选课程。加入冲突课程前会二次确认，冲突格会直接高亮。"
          />
          <div className="mt-6">
            <StatInline
              items={[
                { label: "课程记录", value: data.summary.courseCount.toString() },
                { label: "有排课", value: data.summary.scheduledCourseCount.toString() },
                { label: "已选", value: selectedCourseIds.length.toString() },
                {
                  label: "冲突点",
                  value: conflicts.length.toString(),
                  tone: conflicts.length > 0 ? "error" : "default",
                },
              ]}
            />
          </div>
        </PageSection>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.78fr)] lg:px-8">
        <div className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-2">
          <PageSection>
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
          </PageSection>

          <PageSection>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <SectionTitle
                title="点击时间格筛课"
                description="格子里的数字表示当前筛选条件下该时间可选课程数。"
              />
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
          </PageSection>

          <div className="space-y-4">
            <SectionTitle
              title="课程池"
              description={`已匹配 ${filteredCourses.length} 门课程，当前显示前 ${visibleCourses.length} 门。`}
            />
            {visibleCourses.length ? (
              <div className="space-y-3">
                {visibleCourses.map((course) => (
                  <ScheduleCourseCard
                    key={course.id}
                    course={course}
                    selected={selectedIdSet.has(course.id)}
                    evaluationMatch={evaluationIndex ? evaluationMatches.get(course.id) : undefined}
                    onAdd={addCourse}
                    onRemove={removeCourse}
                  />
                ))}
              </div>
            ) : (
              <PageSection variant="muted" className="text-center text-sm text-text-muted">
                当前筛选条件下没有课程。可以清空时间格或减少筛选条件再试。
              </PageSection>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pl-1">
          {cloudMerge ? <CloudMergeBar onChoose={chooseCloudMerge} /> : null}
          <PageSection>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionTitle title="我的课表" description={syncMessage} />
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => setSelectedCourseIds([])}>
                清空课表
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
          </PageSection>

          <PageSection>
            <SectionTitle title="已选课程" />
            <div className="mt-4 space-y-3">
              {selectedCourses.length ? (
                selectedCourses.map((course) => {
                  const evaluationHref = evaluationIndex ? getEvaluationHref(evaluationMatches.get(course.id)) : "";
                  return (
                    <div key={course.id} className="rounded-md border border-border bg-surface-muted p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-950">{course.name}</p>
                          <p className="mt-1 text-xs text-text-muted">{course.code} · {course.campus} · {course.nature}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {evaluationHref ? (
                            <a
                              href={evaluationHref}
                              className={cn("text-xs font-semibold text-accent hover:text-accent-hover", focusRing)}
                            >
                              评价
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeCourse(course.id)}
                            className={cn("text-xs font-semibold text-accent hover:text-accent-hover", focusRing)}
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-md bg-surface-muted p-4 text-sm text-text-muted">
                  还没有加入课程。可以先点时间格，或者直接在左侧搜索课程。
                </p>
              )}
            </div>
          </PageSection>
        </aside>
      </section>

      <ConflictDialog pending={pendingConflict} onCancel={() => setPendingConflict(null)} onConfirm={confirmConflictCourse} />
    </div>
  );
}
