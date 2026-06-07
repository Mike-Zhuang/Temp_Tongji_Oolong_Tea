import type {
  ScheduleArrangement,
  ScheduleConflict,
  ScheduleCourse,
  ScheduleFilters,
  ScheduleGridBlock,
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
