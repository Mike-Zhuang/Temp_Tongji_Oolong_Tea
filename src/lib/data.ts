import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { DEPARTMENT_FALLBACK } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AdminReviewUpdateInput,
  Course,
  HomePageData,
  RawCourse,
  RawRating,
  Review,
  ReviewFormInput,
  ReviewSort,
  SearchResult,
  SearchSort,
  TeacherCourseCard,
  TeacherSummary,
} from "@/lib/types";
import {
  normalizeText,
  pickRecentTimestamp,
  safeJsonParse,
  slugifyTeacherName,
} from "@/lib/utils";

interface SeedIndex {
  courses: Course[];
  courseMap: Map<number, Course>;
  teacherMap: Map<string, TeacherSummary>;
  teachers: TeacherSummary[];
  reviews: Review[];
  categories: string[];
}

interface SupabaseReviewRow {
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
  reports_count?: number;
}

const coursesFilePath = path.join(
  process.cwd(),
  "scripts",
  "seed-data",
  "wlc.courses.json",
);
const ratingsFilePath = path.join(
  process.cwd(),
  "scripts",
  "seed-data",
  "wlc.ratings.json",
);

const loadSeedIndex = cache(async (): Promise<SeedIndex> => {
  const [coursesContent, ratingsContent] = await Promise.all([
    fs.readFile(coursesFilePath, "utf8"),
    fs.readFile(ratingsFilePath, "utf8"),
  ]);

  const rawCourses = safeJsonParse<RawCourse[]>(coursesContent, []);
  const rawRatings = safeJsonParse<RawRating[]>(ratingsContent, []);

  const reviews = rawRatings.map<Review>((item) => ({
    id: `seed-${item.id}`,
    sourceId: item.id,
    courseId: item.course.id,
    courseCode: item.course.code,
    courseName: item.course.name,
    teacherName: item.course.teacher,
    teacherSlug: slugifyTeacherName(item.course.teacher),
    semester: item.semester,
    rating: item.rating,
    comment: item.comment,
    createdAt: item.created_at,
    modifiedAt: item.modified_at,
    score: item.score,
    moderatorRemark: item.moderator_remark,
    approves: item.reactions.approves,
    disapproves: item.reactions.disapproves,
    isMine: item.is_mine,
    publishStatus: "published",
    source: "seed",
    tags: [],
  }));

  const reviewsByCourseId = new Map<number, Review[]>();
  reviews.forEach((review) => {
    const existing = reviewsByCourseId.get(review.courseId) ?? [];
    existing.push(review);
    reviewsByCourseId.set(review.courseId, existing);
  });

  const courseMap = new Map<number, Course>();
  rawCourses.forEach((item) => {
    const relatedReviews = reviewsByCourseId.get(item.id) ?? [];
    const publishedReviews = relatedReviews.filter(
      (review) => review.publishStatus === "published",
    );
    const reviewCount = publishedReviews.length || item.rating.count;
    const averageRating = publishedReviews.length
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) /
        publishedReviews.length
      : item.rating.avg;

    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: publishedReviews.filter((review) => review.rating === stars).length,
    }));

    courseMap.set(item.id, {
      id: item.id,
      code: item.code,
      name: item.name,
      teacherName: item.teacher,
      teacherSlug: slugifyTeacherName(item.teacher),
      department: item.department,
      credit: item.credit,
      categories: item.categories,
      seedRatingCount: item.rating.count,
      seedRatingAverage: item.rating.avg,
      reviewCount,
      averageRating,
      lastReviewAt: pickRecentTimestamp(
        publishedReviews.map((review) => review.modifiedAt || review.createdAt),
      ),
      ratingDistribution: distribution,
      reviews: publishedReviews.sort(sortReviewsByLatest),
    });
  });

  const teacherCourseMap = new Map<string, TeacherCourseCard[]>();
  courseMap.forEach((course) => {
    const list = teacherCourseMap.get(course.teacherSlug) ?? [];
    list.push({
      id: course.id,
      code: course.code,
      name: course.name,
      department: course.department,
      credit: course.credit,
      categories: course.categories,
      averageRating: course.averageRating,
      reviewCount: course.reviewCount,
      lastReviewAt: course.lastReviewAt,
    });
    teacherCourseMap.set(course.teacherSlug, list);
  });

  const teachers = Array.from(teacherCourseMap.entries()).map(([slug, list]) => {
    const courseIds = new Set(list.map((course) => course.id));
    const teacherReviews = reviews.filter((review) => courseIds.has(review.courseId));
    const ratingSum = list.reduce((sum, course) => sum + course.averageRating, 0);

    return {
      name: courseMap.get(list[0].id)?.teacherName ?? "未知教师",
      slug,
      departmentHints: Array.from(
        new Set(
          list.map((course) => course.department ?? DEPARTMENT_FALLBACK).filter(Boolean),
        ),
      ),
      courseCount: list.length,
      reviewCount: list.reduce((sum, course) => sum + course.reviewCount, 0),
      averageRating: ratingSum / Math.max(list.length, 1),
      lastReviewAt: pickRecentTimestamp(
        teacherReviews.map((review) => review.modifiedAt || review.createdAt),
      ),
      courses: list.sort((left, right) => {
        if (right.reviewCount !== left.reviewCount) {
          return right.reviewCount - left.reviewCount;
        }
        return right.averageRating - left.averageRating;
      }),
    } satisfies TeacherSummary;
  });

  const teacherMap = new Map(teachers.map((teacher) => [teacher.slug, teacher]));

  return {
    courses: Array.from(courseMap.values()),
    courseMap,
    teacherMap,
    teachers,
    reviews: reviews.sort(sortReviewsByLatest),
    categories: Array.from(new Set(rawCourses.flatMap((course) => course.categories))).sort(),
  };
});

function sortReviewsByLatest(left: Review, right: Review) {
  return (
    new Date(right.modifiedAt || right.createdAt).getTime() -
    new Date(left.modifiedAt || left.createdAt).getTime()
  );
}

function sortReviews(reviews: Review[], sort: ReviewSort) {
  return [...reviews].sort((left, right) => {
    if (sort === "hot") {
      return right.approves - right.disapproves - (left.approves - left.disapproves);
    }
    if (sort === "highest") {
      return right.rating - left.rating || sortReviewsByLatest(left, right);
    }
    if (sort === "lowest") {
      return left.rating - right.rating || sortReviewsByLatest(left, right);
    }
    return sortReviewsByLatest(left, right);
  });
}

function computeSearchScore(target: string, query: string) {
  if (!query) {
    return 0;
  }

  const normalizedTarget = normalizeText(target);
  const normalizedQuery = normalizeText(query);

  if (normalizedTarget === normalizedQuery) {
    return 200;
  }
  if (normalizedTarget.startsWith(normalizedQuery)) {
    return 120;
  }
  if (normalizedTarget.includes(normalizedQuery)) {
    return 80;
  }

  return 0;
}

function sortCoursesBySearch(
  courses: Course[],
  query: string,
  sort: SearchSort,
) {
  return [...courses].sort((left, right) => {
    if (sort === "rating") {
      return right.averageRating - left.averageRating || right.reviewCount - left.reviewCount;
    }
    if (sort === "reviews") {
      return right.reviewCount - left.reviewCount || right.averageRating - left.averageRating;
    }
    if (sort === "recent") {
      return (
        new Date(right.lastReviewAt ?? 0).getTime() -
          new Date(left.lastReviewAt ?? 0).getTime() ||
        right.reviewCount - left.reviewCount
      );
    }

    const leftScore =
      computeSearchScore(left.name, query) +
      computeSearchScore(left.teacherName, query) +
      computeSearchScore(left.code, query);
    const rightScore =
      computeSearchScore(right.name, query) +
      computeSearchScore(right.teacherName, query) +
      computeSearchScore(right.code, query);

    return (
      rightScore - leftScore ||
      right.reviewCount - left.reviewCount ||
      right.averageRating - left.averageRating
    );
  });
}

function sortTeachersBySearch(
  teachers: TeacherSummary[],
  query: string,
  sort: SearchSort,
) {
  return [...teachers].sort((left, right) => {
    if (sort === "rating") {
      return right.averageRating - left.averageRating || right.reviewCount - left.reviewCount;
    }
    if (sort === "reviews") {
      return right.reviewCount - left.reviewCount || right.averageRating - left.averageRating;
    }
    if (sort === "recent") {
      return (
        new Date(right.lastReviewAt ?? 0).getTime() -
          new Date(left.lastReviewAt ?? 0).getTime() ||
        right.reviewCount - left.reviewCount
      );
    }

    const leftScore = computeSearchScore(left.name, query);
    const rightScore = computeSearchScore(right.name, query);

    return (
      rightScore - leftScore ||
      right.reviewCount - left.reviewCount ||
      right.averageRating - left.averageRating
    );
  });
}

function mapSupabaseReview(row: SupabaseReviewRow): Review {
  return {
    id: row.id,
    sourceId: row.source_id,
    courseId: row.course_id,
    courseCode: row.course_code,
    courseName: row.course_name,
    teacherName: row.teacher_name,
    teacherSlug: row.teacher_slug,
    semester: row.semester,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    modifiedAt: row.modified_at,
    score: row.score,
    moderatorRemark: row.moderator_remark,
    approves: row.approves,
    disapproves: row.disapproves,
    isMine: false,
    publishStatus: row.publish_status,
    source: row.source,
    tags: row.tags ?? [],
    userId: row.user_id,
    reportsCount: row.reports_count ?? 0,
  };
}

async function getSupabaseUserReviews(): Promise<Review[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("course_reviews")
    .select("*")
    .eq("source", "user");

  if (error || !data) {
    return [];
  }

  return (data as SupabaseReviewRow[]).map(mapSupabaseReview);
}

async function getMergedCourses() {
  const seed = await loadSeedIndex();
  const userReviews = await getSupabaseUserReviews();
  if (!userReviews.length) {
    return seed;
  }

  const mergedCourseMap = new Map<number, Course>(
    seed.courses.map((course) => [course.id, structuredClone(course)]),
  );

  userReviews.forEach((review) => {
    if (review.publishStatus !== "published") {
      return;
    }

    const course = mergedCourseMap.get(review.courseId);
    if (!course) {
      return;
    }

    course.reviews = sortReviews([...course.reviews, review], "latest");
    course.reviewCount = course.reviews.length;
    course.averageRating =
      course.reviews.reduce((sum, item) => sum + item.rating, 0) /
      Math.max(course.reviews.length, 1);
    course.lastReviewAt = pickRecentTimestamp(
      course.reviews.map((item) => item.modifiedAt || item.createdAt),
    );
    course.ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: course.reviews.filter((item) => item.rating === stars).length,
    }));
  });

  const courses = Array.from(mergedCourseMap.values());
  const teacherMap = new Map<string, TeacherSummary>();

  courses.forEach((course) => {
    const existing = teacherMap.get(course.teacherSlug);
    const courseCard: TeacherCourseCard = {
      id: course.id,
      code: course.code,
      name: course.name,
      department: course.department,
      credit: course.credit,
      categories: course.categories,
      averageRating: course.averageRating,
      reviewCount: course.reviewCount,
      lastReviewAt: course.lastReviewAt,
    };

    if (!existing) {
      teacherMap.set(course.teacherSlug, {
        name: course.teacherName,
        slug: course.teacherSlug,
        departmentHints: [course.department ?? DEPARTMENT_FALLBACK],
        courseCount: 1,
        reviewCount: course.reviewCount,
        averageRating: course.averageRating,
        lastReviewAt: course.lastReviewAt,
        courses: [courseCard],
      });
      return;
    }

    existing.courseCount += 1;
    existing.reviewCount += course.reviewCount;
    existing.courses.push(courseCard);
    existing.averageRating =
      existing.courses.reduce((sum, item) => sum + item.averageRating, 0) /
      existing.courses.length;
    existing.departmentHints = Array.from(
      new Set([
        ...existing.departmentHints,
        course.department ?? DEPARTMENT_FALLBACK,
      ]),
    );
    existing.lastReviewAt = pickRecentTimestamp([
      existing.lastReviewAt,
      course.lastReviewAt,
    ]);
  });

  return {
    ...seed,
    courses,
    courseMap: mergedCourseMap,
    teachers: Array.from(teacherMap.values()),
    teacherMap,
    reviews: sortReviews([...seed.reviews, ...userReviews], "latest"),
  } satisfies SeedIndex;
}

export async function getHomePageData(): Promise<HomePageData> {
  const data = await getMergedCourses();

  return {
    featuredCourses: [...data.courses]
      .filter((course) => course.reviewCount > 0)
      .sort((left, right) => {
        return (
          right.reviewCount - left.reviewCount ||
          right.averageRating - left.averageRating
        );
      })
      .slice(0, 6),
    topTeachers: [...data.teachers]
      .filter((teacher) => teacher.reviewCount > 0)
      .sort((left, right) => {
        return (
          right.averageRating - left.averageRating ||
          right.reviewCount - left.reviewCount
        );
      })
      .slice(0, 6),
    latestReviews: data.reviews.slice(0, 8),
    cautionCourses: [...data.courses]
      .filter((course) => course.reviewCount >= 2)
      .sort((left, right) => {
        return left.averageRating - right.averageRating || right.reviewCount - left.reviewCount;
      })
      .slice(0, 6),
    siteStats: {
      courseCount: data.courses.length,
      teacherCount: data.teachers.length,
      reviewCount: data.reviews.length,
      categoryCount: data.categories.length,
    },
  };
}

export async function searchSite(
  query: string,
  sort: SearchSort = "relevance",
): Promise<SearchResult> {
  const data = await getMergedCourses();
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return {
      courses: sortCoursesBySearch(data.courses, query, sort).slice(0, 20),
      teachers: sortTeachersBySearch(data.teachers, query, sort).slice(0, 20),
      query,
      sort,
    };
  }

  const courseResults = data.courses.filter((course) => {
    return [course.name, course.teacherName, course.code, ...course.categories]
      .filter(Boolean)
      .some((value) => normalizeText(value).includes(normalizedQuery));
  });

  const teacherResults = data.teachers.filter((teacher) => {
    return teacher.name && normalizeText(teacher.name).includes(normalizedQuery);
  });

  return {
    courses: sortCoursesBySearch(courseResults, query, sort).slice(0, 40),
    teachers: sortTeachersBySearch(teacherResults, query, sort).slice(0, 30),
    query,
    sort,
  };
}

export async function getTeacherBySlug(slug: string) {
  const data = await getMergedCourses();
  return data.teacherMap.get(slug) ?? null;
}

export async function getCourseById(courseId: number, sort: ReviewSort = "latest") {
  const data = await getMergedCourses();
  const course = data.courseMap.get(courseId);
  if (!course) {
    return null;
  }

  return {
    ...course,
    reviews: sortReviews(course.reviews, sort),
  } satisfies Course;
}

export async function getAllCourses() {
  const data = await getMergedCourses();
  return data.courses;
}

export async function getMyReviews(userId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("course_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as SupabaseReviewRow[]).map(mapSupabaseReview);
}

export async function createUserReview(
  input: ReviewFormInput & {
    userId: string;
    courseName: string;
    courseCode: string;
    teacherName: string;
    teacherSlug: string;
  },
) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase 未配置，暂时不能在线提交评论。");
  }

  const payload = {
    source_id: null,
    course_id: input.courseId,
    course_code: input.courseCode,
    course_name: input.courseName,
    teacher_name: input.teacherName,
    teacher_slug: input.teacherSlug,
    semester: input.semester,
    rating: input.rating,
    comment: input.comment,
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    score: input.score || null,
    moderator_remark: null,
    approves: 0,
    disapproves: 0,
    publish_status: "published",
    source: "user",
    tags: input.tags,
    user_id: input.userId,
  };

  const { data, error } = await supabase
    .from("course_reviews")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "评论创建失败");
  }

  return mapSupabaseReview(data as SupabaseReviewRow);
}

export async function reportReview(reviewId: string, reporterId: string | null, reason: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase 未配置，暂时不能提交举报。");
  }

  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: reporterId,
    reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminReviews() {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const [{ data: reviews }, { data: reports }] = await Promise.all([
      supabase
        .from("course_reviews")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("review_reports").select("review_id"),
    ]);

    const reportCountMap = new Map<string, number>();
    (reports ?? []).forEach((item: { review_id: string }) => {
      reportCountMap.set(item.review_id, (reportCountMap.get(item.review_id) ?? 0) + 1);
    });

    return ((reviews ?? []) as SupabaseReviewRow[]).map((row) =>
      mapSupabaseReview({
        ...row,
        reports_count: reportCountMap.get(row.id) ?? 0,
      }),
    );
  }

  const data = await getMergedCourses();
  return data.reviews.slice(0, 50);
}

export async function updateAdminReview(reviewId: string, input: AdminReviewUpdateInput) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase 未配置，暂时不能管理评论。");
  }

  const payload: Record<string, string | null> = {
    modified_at: new Date().toISOString(),
  };

  if (input.publishStatus) {
    payload.publish_status = input.publishStatus;
  }

  if (typeof input.moderatorRemark !== "undefined") {
    payload.moderator_remark = input.moderatorRemark;
  }

  const { data, error } = await supabase
    .from("course_reviews")
    .update(payload)
    .eq("id", reviewId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "评论更新失败");
  }

  return mapSupabaseReview(data as SupabaseReviewRow);
}
