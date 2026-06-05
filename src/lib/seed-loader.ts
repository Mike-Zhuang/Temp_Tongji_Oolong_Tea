import type { RawCourse, RawRating } from "@/lib/types";
import { slugifyTeacherName } from "@/lib/utils";

export interface SeedCourseRow {
  id: number;
  code: string;
  name: string;
  teacher_name: string;
  teacher_slug: string;
  department: string | null;
  credit: number;
  categories: string[];
  seed_rating_count: number;
  seed_rating_average: number;
}

export interface SeedReviewRow {
  id: string;
  source_id: number | null;
  course_id: number;
  course_code: string;
  course_name: string;
  teacher_name: string;
  teacher_slug: string;
  semester: string;
  rating: number;
  comment: string;
  created_at: string;
  modified_at: string;
  score: string | null;
  moderator_remark: string | null;
  approves: number;
  disapproves: number;
  publish_status: "published" | "hidden";
  source: "seed" | "user";
  tags: string[] | null;
  user_id: string | null;
}

export function mapSeedCourse(row: RawCourse): SeedCourseRow {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    teacher_name: row.teacher,
    teacher_slug: slugifyTeacherName(row.teacher),
    department: row.department,
    credit: row.credit,
    categories: row.categories,
    seed_rating_count: row.rating.count,
    seed_rating_average: row.rating.avg,
  };
}

export function mapSeedReview(row: RawRating): SeedReviewRow {
  return {
    id: `seed-${row.id}`,
    source_id: row.id,
    course_id: row.course.id,
    course_code: row.course.code,
    course_name: row.course.name,
    teacher_name: row.course.teacher,
    teacher_slug: slugifyTeacherName(row.course.teacher),
    semester: row.semester,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    modified_at: row.modified_at,
    score: row.score,
    moderator_remark: row.moderator_remark,
    approves: row.reactions.approves,
    disapproves: row.reactions.disapproves,
    publish_status: "published",
    source: "seed",
    tags: [],
    user_id: null,
  };
}

export async function loadSeedRows(): Promise<{
  courses: SeedCourseRow[];
  reviews: SeedReviewRow[];
}> {
  const [coursesResponse, ratingsResponse] = await Promise.all([
    fetch("/data/wlc.courses.json"),
    fetch("/data/wlc.ratings.json"),
  ]);

  if (!coursesResponse.ok || !ratingsResponse.ok) {
    throw new Error("内置评课数据加载失败，请确认已执行构建并部署 public/data 目录。");
  }

  const [rawCourses, rawRatings] = await Promise.all([
    coursesResponse.json() as Promise<RawCourse[]>,
    ratingsResponse.json() as Promise<RawRating[]>,
  ]);

  return {
    courses: rawCourses.map(mapSeedCourse),
    reviews: rawRatings.map(mapSeedReview),
  };
}
