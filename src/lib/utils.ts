import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function slugifyTeacherName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "");

  return normalized || "unknown-teacher";
}

export function formatRating(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "暂无";
  }

  return value.toFixed(1);
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value.replace(/\//g, "-"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function pickRecentTimestamp(values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = new Date(left as string).getTime();
      const rightTime = new Date(right as string).getTime();
      return rightTime - leftTime;
    })[0] ?? null;
}

export function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

export function buildCourseUrl(courseId: number) {
  return `/course/${courseId}`;
}

export function buildTeacherUrl(teacherSlug: string) {
  return `/teacher/${teacherSlug}`;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
