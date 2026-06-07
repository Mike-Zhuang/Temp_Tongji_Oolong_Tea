import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TERM = "2026-2027学年第1学期";
const SOURCE_FILE = path.join(process.cwd(), "scripts", "schedule-data", "2026-2027-1.csv");
const OUTPUT_DIR = path.join(process.cwd(), "public", "data");
const COURSE_OUTPUT = path.join(OUTPUT_DIR, "schedule-courses.json");
const FILTER_OUTPUT = path.join(OUTPUT_DIR, "schedule-filters.json");
const SUMMARY_OUTPUT = path.join(OUTPUT_DIR, "schedule-summary.json");

const DAY_MAP = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
  天: 7,
};

const HEADER_ROW_INDEX = 2;
const SCHEDULE_PATTERN =
  /(?<teacher>[^\s()]+)\((?<teacherId>[^)]+)\)\s*星期(?<weekday>[一二三四五六日天])(?<periods>\d+(?:-\d+)?)节\s*\[(?<weeks>[^\]]+)\]\s*(?<room>.*?)(?=\s*[^\s()]+\([^)]+\)\s*星期[一二三四五六日天]\d|$)/g;

function parseCsvRows(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  const normalized = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function cleanCell(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  const cleaned = cleanCell(value);
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function expandNumberRange(value) {
  const [startText, endText] = value.split("-");
  const start = Number(startText);
  const end = Number(endText ?? startText);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return [];
  }
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  return Array.from({ length: high - low + 1 }, (_, index) => low + index);
}

export function parseWeekExpression(expression) {
  const weeks = new Set();
  const tokens = cleanCell(expression).split(/\s+/).filter(Boolean);

  tokens.forEach((token) => {
    const parity = token.endsWith("单") ? "odd" : token.endsWith("双") ? "even" : "all";
    const numberPart = token.replace(/[单双]$/, "");
    expandNumberRange(numberPart).forEach((week) => {
      if (parity === "odd" && week % 2 === 0) {
        return;
      }
      if (parity === "even" && week % 2 !== 0) {
        return;
      }
      weeks.add(week);
    });
  });

  return Array.from(weeks).sort((left, right) => left - right);
}

export function expandPeriodRange(expression) {
  return expandNumberRange(cleanCell(expression));
}

export function parseArrangementText(rawSchedule) {
  const text = cleanCell(rawSchedule);
  if (!text) {
    return [];
  }

  const arrangements = [];
  for (const match of text.matchAll(SCHEDULE_PATTERN)) {
    const groups = match.groups ?? {};
    const weekday = DAY_MAP[groups.weekday];
    const periods = expandPeriodRange(groups.periods);
    const weeks = parseWeekExpression(groups.weeks);

    if (!weekday || periods.length === 0 || weeks.length === 0) {
      continue;
    }

    arrangements.push({
      teacher: cleanCell(groups.teacher),
      teacherId: cleanCell(groups.teacherId),
      weekday,
      periods,
      weeks,
      room: cleanCell(groups.room),
      rawWeeks: cleanCell(groups.weeks),
      rawPeriods: cleanCell(groups.periods),
    });
  }

  return arrangements;
}

function buildCourse(row, headerMap, department, sourceLine) {
  const get = (name) => cleanCell(row[headerMap.get(name)]);
  const rawCourseId = get("新课程序号");
  const courseId = rawCourseId || `UNCODED-${sourceLine}`;
  const rawSchedule = get("排课信息");
  const arrangements = parseArrangementText(rawSchedule);
  const teacherNames = Array.from(
    new Set([
      ...get("授课教师").split(/[,\s，、]+/).filter(Boolean),
      ...arrangements.map((item) => item.teacher).filter(Boolean),
    ]),
  );
  const teacherIds = Array.from(
    new Set([
      ...get("教师工号").split(/[,\s，、]+/).filter(Boolean),
      ...arrangements.map((item) => item.teacherId).filter(Boolean),
    ]),
  );

  return {
    id: courseId,
    code: rawCourseId || "未编号",
    name: get("课程名称"),
    weeklyHours: get("周学时"),
    leader: get("负责人"),
    teachers: teacherNames,
    teacherIds,
    teacherText: get("授课教师"),
    teacherIdText: get("教师工号"),
    teacherTitle: get("教师职称"),
    nature: get("课程性质") || "未分类",
    language: get("授课语言") || "未标注",
    campus: get("校区") || "校区暂缺",
    audience: get("听课专业"),
    enrollment: toNumber(get("选课人数")),
    startWeek: toNumber(get("起始周")),
    endWeek: toNumber(get("结束周")),
    department: department || "开课学院暂缺",
    rawSchedule,
    arrangements,
    sourceLine,
    searchText: [
      rawCourseId,
      get("课程名称"),
      get("负责人"),
      get("授课教师"),
      get("教师工号"),
      get("课程性质"),
      get("授课语言"),
      get("校区"),
      get("听课专业"),
      department,
      rawSchedule,
      arrangements.map((item) => item.room).join(" "),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function buildOptionList(courses, key) {
  const countMap = new Map();
  courses.forEach((course) => {
    const value = course[key] || "未标注";
    countMap.set(value, (countMap.get(value) ?? 0) + 1);
  });
  return Array.from(countMap.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, "zh-Hans-CN"));
}

async function main() {
  const text = await readFile(SOURCE_FILE, "utf8");
  const rows = parseCsvRows(text);
  const headers = rows[HEADER_ROW_INDEX].map(cleanCell);
  const headerMap = new Map(headers.map((header, index) => [header, index]));

  const courses = [];
  const warnings = [];
  let department = "";

  rows.slice(HEADER_ROW_INDEX + 1).forEach((row, rowIndex) => {
    const sourceLine = rowIndex + HEADER_ROW_INDEX + 2;
    const normalized = row.map(cleanCell);
    if (normalized.every((cell) => !cell)) {
      return;
    }

    const firstCell = normalized[0];
    const hasCourseName = Boolean(normalized[headerMap.get("课程名称")]);
    if (firstCell && !hasCourseName && normalized.slice(1).every((cell) => !cell)) {
      department = firstCell;
      return;
    }

    if (!hasCourseName) {
      warnings.push({ sourceLine, reason: "missing-course-id-or-name", row: normalized });
      return;
    }

    const course = buildCourse(normalized, headerMap, department, sourceLine);
    if (course.rawSchedule && course.arrangements.length === 0) {
      warnings.push({
        sourceLine,
        courseId: course.id,
        courseName: course.name,
        reason: "schedule-unmatched",
        rawSchedule: course.rawSchedule,
      });
    }
    courses.push(course);
  });

  const arrangementCount = courses.reduce((sum, course) => sum + course.arrangements.length, 0);
  const scheduledCourseCount = courses.filter((course) => course.arrangements.length > 0).length;
  const generalEducationNatures = [
    "科学探索与生命关怀",
    "社会发展与国际视野",
    "人文经典与审美素养",
    "工程能力与创新思维",
    "艺术体验与审美表达",
    "中华文明与世界文明",
    "通识必修课",
    "通识选修课",
  ];

  const filters = {
    term: TERM,
    natures: buildOptionList(courses, "nature"),
    languages: buildOptionList(courses, "language"),
    campuses: buildOptionList(courses, "campus"),
    departments: buildOptionList(courses, "department"),
    generalEducationNatures,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    periods: Array.from({ length: 11 }, (_, index) => index + 1),
  };

  const summary = {
    term: TERM,
    source: "scripts/schedule-data/2026-2027-1.csv",
    generatedAt: new Date().toISOString(),
    courseCount: courses.length,
    scheduledCourseCount,
    unscheduledCourseCount: courses.length - scheduledCourseCount,
    arrangementCount,
    warningCount: warnings.length,
    warnings: warnings.slice(0, 20),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(COURSE_OUTPUT, `${JSON.stringify(courses)}\n`);
  await writeFile(FILTER_OUTPUT, `${JSON.stringify(filters, null, 2)}\n`);
  await writeFile(SUMMARY_OUTPUT, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(
    `[schedule-data] ${courses.length} courses, ${scheduledCourseCount} scheduled, ${arrangementCount} arrangements, ${warnings.length} warnings`,
  );
}

main().catch((error) => {
  console.error("[schedule-data] failed", error);
  process.exit(1);
});
