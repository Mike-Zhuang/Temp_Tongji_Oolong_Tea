import type {
  ScheduleArrangement,
  ScheduleConflict,
  ScheduleCourse,
  ScheduleEvaluationIndex,
  ScheduleEvaluationMatchResult,
  ScheduleFilters,
  ScheduleGridBlock,
  ScheduleReviewMatch,
  ScheduleTeacherMatch,
} from "@/lib/types";

export const WEEKDAY_LABELS = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export const PERIOD_LABELS = [
  "",
  "第 1 节",
  "第 2 节",
  "第 3 节",
  "第 4 节",
  "第 5 节",
  "第 6 节",
  "第 7 节",
  "第 8 节",
  "第 9 节",
  "第 10 节",
  "第 11 节",
];

export const EMPTY_SCHEDULE_FILTERS: ScheduleFilters = {
  query: "",
  nature: "",
  language: "",
  campus: "",
  department: "",
  weekday: null,
  period: null,
  generalOnly: false,
};

export function formatWeeks(weeks: number[]) {
  if (weeks.length === 0) {
    return "周次暂缺";
  }
  const ranges: string[] = [];
  let start = weeks[0];
  let previous = weeks[0];

  weeks.slice(1).forEach((week) => {
    if (week === previous + 1) {
      previous = week;
      return;
    }
    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = week;
    previous = week;
  });
  ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  return `${ranges.join("、")} 周`;
}

export function formatPeriods(periods: number[]) {
  if (periods.length === 0) {
    return "节次暂缺";
  }
  const start = Math.min(...periods);
  const end = Math.max(...periods);
  return start === end ? `第 ${start} 节` : `第 ${start}-${end} 节`;
}

export function arrangementMatchesCell(arrangement: ScheduleArrangement, weekday: number, period: number) {
  return arrangement.weekday === weekday && arrangement.periods.includes(period);
}

export function courseMatchesCell(course: ScheduleCourse, weekday: number, period: number) {
  return course.arrangements.some((arrangement) => arrangementMatchesCell(arrangement, weekday, period));
}

export function filterScheduleCourses(
  courses: ScheduleCourse[],
  filters: ScheduleFilters,
  generalEducationNatures: string[],
) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const generalSet = new Set(generalEducationNatures);

  return courses.filter((course) => {
    if (filters.nature && course.nature !== filters.nature) {
      return false;
    }
    if (filters.language && course.language !== filters.language) {
      return false;
    }
    if (filters.campus && course.campus !== filters.campus) {
      return false;
    }
    if (filters.department && course.department !== filters.department) {
      return false;
    }
    if (filters.generalOnly && !generalSet.has(course.nature)) {
      return false;
    }
    if (filters.weekday && filters.period && !courseMatchesCell(course, filters.weekday, filters.period)) {
      return false;
    }
    if (filters.weekday && !filters.period && !course.arrangements.some((item) => item.weekday === filters.weekday)) {
      return false;
    }
    if (filters.period && !filters.weekday && !course.arrangements.some((item) => item.periods.includes(filters.period ?? -1))) {
      return false;
    }
    if (normalizedQuery && !course.searchText.includes(normalizedQuery)) {
      return false;
    }
    return true;
  });
}

function intersectNumbers(left: number[], right: number[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function arrangementConflicts(left: ScheduleArrangement, right: ScheduleArrangement) {
  if (left.weekday !== right.weekday) {
    return [];
  }
  const periods = intersectNumbers(left.periods, right.periods);
  const weeks = intersectNumbers(left.weeks, right.weeks);
  if (periods.length === 0 || weeks.length === 0) {
    return [];
  }
  return periods.map((period) => ({
    weekday: left.weekday,
    period,
    weeks,
  }));
}

export function detectConflictsForCourse(course: ScheduleCourse, selectedCourses: ScheduleCourse[]) {
  const conflicts: ScheduleConflict[] = [];

  selectedCourses.forEach((otherCourse) => {
    if (otherCourse.id === course.id) {
      return;
    }
    course.arrangements.forEach((arrangement) => {
      otherCourse.arrangements.forEach((otherArrangement) => {
        arrangementConflicts(arrangement, otherArrangement).forEach((conflict) => {
          conflicts.push({
            courseId: course.id,
            courseName: course.name,
            otherCourseId: otherCourse.id,
            otherCourseName: otherCourse.name,
            weekday: conflict.weekday,
            period: conflict.period,
            weeks: conflict.weeks,
          });
        });
      });
    });
  });

  return conflicts;
}

export function detectScheduleConflicts(selectedCourses: ScheduleCourse[]) {
  const conflicts: ScheduleConflict[] = [];

  selectedCourses.forEach((course, index) => {
    selectedCourses.slice(index + 1).forEach((otherCourse) => {
      course.arrangements.forEach((arrangement) => {
        otherCourse.arrangements.forEach((otherArrangement) => {
          arrangementConflicts(arrangement, otherArrangement).forEach((conflict) => {
            conflicts.push({
              courseId: course.id,
              courseName: course.name,
              otherCourseId: otherCourse.id,
              otherCourseName: otherCourse.name,
              weekday: conflict.weekday,
              period: conflict.period,
              weeks: conflict.weeks,
            });
          });
        });
      });
    });
  });

  return conflicts;
}

export function buildConflictCellSet(conflicts: ScheduleConflict[]) {
  return new Set(conflicts.map((conflict) => `${conflict.weekday}-${conflict.period}`));
}

export function buildScheduleGridBlocks(selectedCourses: ScheduleCourse[], conflicts: ScheduleConflict[]): ScheduleGridBlock[] {
  const conflictCells = buildConflictCellSet(conflicts);

  return selectedCourses.flatMap((course) =>
    course.arrangements.map((arrangement, arrangementIndex) => {
      const periods = [...arrangement.periods].sort((left, right) => left - right);
      return {
        id: `${course.id}-${arrangementIndex}`,
        courseId: course.id,
        courseName: course.name,
        teacherText: arrangement.teacher,
        room: arrangement.room,
        weekday: arrangement.weekday,
        startPeriod: periods[0],
        endPeriod: periods[periods.length - 1],
        periods,
        weeks: arrangement.weeks,
        rawWeeks: arrangement.rawWeeks,
        isConflict: periods.some((period) => conflictCells.has(`${arrangement.weekday}-${period}`)),
      };
    }),
  );
}

export function getCoursesAtCell(courses: ScheduleCourse[], weekday: number, period: number) {
  return courses.filter((course) => courseMatchesCell(course, weekday, period));
}

export function normalizeCourseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "")
    .replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/g, (match) => {
      const romanMap: Record<string, string> = {
        Ⅰ: "1",
        Ⅱ: "2",
        Ⅲ: "3",
        Ⅳ: "4",
        Ⅴ: "5",
        Ⅵ: "6",
        Ⅶ: "7",
        Ⅷ: "8",
        Ⅸ: "9",
        Ⅹ: "10",
      };
      return romanMap[match] ?? match;
    })
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function normalizeTeacherName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getScheduleTeacherNames(course: ScheduleCourse) {
  return Array.from(
    new Set(
      [
        ...course.teachers,
        course.leader,
        ...course.arrangements.map((arrangement) => arrangement.teacher),
      ]
        .filter(Boolean)
        .map(normalizeTeacherName),
    ),
  );
}

function namesMatch(left: string, right: string) {
  const normalizedLeft = normalizeTeacherName(left);
  const normalizedRight = normalizeTeacherName(right);
  return Boolean(
    normalizedLeft &&
      normalizedRight &&
      (normalizedLeft === normalizedRight ||
        normalizedLeft.includes(normalizedRight) ||
        normalizedRight.includes(normalizedLeft)),
  );
}

function courseNamesSimilar(left: string, right: string) {
  if (!left || !right) {
    return false;
  }
  return left.includes(right) || right.includes(left);
}

function buildFallbackSearchUrl(course: ScheduleCourse) {
  const query = [course.name, course.teachers[0] ?? course.teacherText].filter(Boolean).join(" ");
  return `/search?q=${encodeURIComponent(query)}`;
}

export function matchScheduleCourseToEvaluations(
  course: ScheduleCourse,
  index: ScheduleEvaluationIndex | null,
): ScheduleEvaluationMatchResult {
  if (!index) {
    return {
      courseMatches: [],
      teacherMatches: [],
      fallbackSearchUrl: buildFallbackSearchUrl(course),
    };
  }

  const scheduleName = normalizeCourseName(course.name);
  const scheduleCode = course.code === "未编号" ? "" : course.code.trim().toLowerCase();
  const scheduleTeachers = getScheduleTeacherNames(course);
  const courseMatches: ScheduleReviewMatch[] = [];

  index.courses.forEach((reviewCourse) => {
    const reviewName = normalizeCourseName(reviewCourse.courseName);
    const codeMatches = Boolean(scheduleCode && scheduleCode === reviewCourse.courseCode.trim().toLowerCase());
    const exactNameMatches = Boolean(scheduleName && scheduleName === reviewName);
    const similarNameMatches = courseNamesSimilar(scheduleName, reviewName);
    const teacherMatches = scheduleTeachers.some((teacherName) => namesMatch(teacherName, reviewCourse.teacherName));

    let score = 0;
    let confidence: ScheduleReviewMatch["confidence"] = "candidate";
    let reason = "";

    if (codeMatches && (exactNameMatches || similarNameMatches)) {
      score = 120;
      confidence = "high";
      reason = "课号一致，课程名相近";
    } else if (exactNameMatches && teacherMatches) {
      score = 105;
      confidence = "high";
      reason = "课程名和教师一致";
    } else if (exactNameMatches) {
      score = 72;
      reason = "课程名一致，教师可能不同";
    } else if (similarNameMatches && teacherMatches) {
      score = 64;
      reason = "课程名相近，教师一致";
    }

    if (score <= 0) {
      return;
    }

    courseMatches.push({
      ...reviewCourse,
      confidence,
      reason,
      score,
    });
  });

  const sortedCourseMatches = courseMatches
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.reviewCount - left.reviewCount ||
        right.averageRating - left.averageRating,
    )
    .slice(0, 3);

  const teacherMatches: ScheduleTeacherMatch[] = sortedCourseMatches.length
    ? []
    : index.teachers
        .filter((teacher) => scheduleTeachers.some((teacherName) => namesMatch(teacherName, teacher.name)))
        .map((teacher) => ({
          ...teacher,
          reason: "未匹配到对应课程，按任课教师兜底",
          score: 40 + teacher.reviewCount,
        }))
        .sort(
          (left, right) =>
            right.score - left.score ||
            right.reviewCount - left.reviewCount ||
            right.averageRating - left.averageRating,
        )
        .slice(0, 2);

  return {
    courseMatches: sortedCourseMatches,
    teacherMatches,
    fallbackSearchUrl: buildFallbackSearchUrl(course),
  };
}

export function buildScheduleEvaluationMatches(
  courses: ScheduleCourse[],
  index: ScheduleEvaluationIndex | null,
) {
  return new Map(courses.map((course) => [course.id, matchScheduleCourseToEvaluations(course, index)]));
}
