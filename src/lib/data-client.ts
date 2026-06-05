import { ADMIN_EMAIL, DEPARTMENT_FALLBACK } from "@/lib/constants";
import { loadSeedRows, type SeedCourseRow, type SeedReviewRow } from "@/lib/seed-loader";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AdminReviewUpdateInput,
  Course,
  HomePageData,
  Review,
  ReviewFormInput,
  ReviewSort,
  SearchResult,
  SearchSort,
  TeacherCourseCard,
  TeacherSummary,
  UserProfile,
} from "@/lib/types";
import {
  normalizeText,
  pickRecentTimestamp,
  slugifyTeacherName,
} from "@/lib/utils";

type CourseRow = SeedCourseRow;

type ReviewRow = SeedReviewRow;

interface ReportRow {
  review_id: string;
}

interface DataIndex {
  courses: Course[];
  courseMap: Map<number, Course>;
  teacherMap: Map<string, TeacherSummary>;
  teachers: TeacherSummary[];
  reviews: Review[];
  categories: string[];
}

let dataIndexPromise: Promise<DataIndex> | null = null;
let homeSummaryPromise: Promise<HomePageData | null> | null = null;

async function fetchAllRows<T>(tableName: string, orderColumn: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const pageSize = 1000;
  const rows: T[] = [];

  for (let page = 0; ; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order(orderColumn, { ascending: tableName !== "course_reviews" })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const pageRows = (data ?? []) as T[];
    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      return rows;
    }
  }
}

async function fetchSupabaseRows() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return {
      courses: [] as CourseRow[],
      reviews: [] as ReviewRow[],
      canUseDatabase: false,
    };
  }

  try {
    const [courses, reviews] = await Promise.all([
      fetchAllRows<CourseRow>("courses", "id"),
      fetchAllRows<ReviewRow>("course_reviews", "created_at"),
    ]);

    return {
      courses,
      reviews,
      canUseDatabase: courses.length > 0,
    };
  } catch (error) {
    console.warn("Supabase 数据表暂不可用，已回退到内置评课数据。", error);
    return {
      courses: [] as CourseRow[],
      reviews: [] as ReviewRow[],
      canUseDatabase: false,
    };
  }
}

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

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    sourceId: row.source_id,
    courseId: row.course_id,
    courseCode: row.course_code,
    courseName: row.course_name,
    teacherName: row.teacher_name,
    teacherSlug: row.teacher_slug || slugifyTeacherName(row.teacher_name),
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
  };
}

function buildDataIndex(courseRows: CourseRow[], reviewRows: ReviewRow[]): DataIndex {
  const reviews = reviewRows.map(mapReview);
  const reviewsByCourseId = new Map<number, Review[]>();

  reviews.forEach((review) => {
    const list = reviewsByCourseId.get(review.courseId) ?? [];
    list.push(review);
    reviewsByCourseId.set(review.courseId, list);
  });

  const courseMap = new Map<number, Course>();
  courseRows.forEach((row) => {
    const courseReviews = sortReviews(
      reviewsByCourseId.get(row.id)?.filter((review) => review.publishStatus === "published") ?? [],
      "latest",
    );
    const reviewCount = courseReviews.length || row.seed_rating_count;
    const averageRating = courseReviews.length
      ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length
      : Number(row.seed_rating_average);

    courseMap.set(row.id, {
      id: row.id,
      code: row.code,
      name: row.name,
      teacherName: row.teacher_name,
      teacherSlug: row.teacher_slug || slugifyTeacherName(row.teacher_name),
      department: row.department,
      credit: Number(row.credit),
      categories: row.categories ?? [],
      seedRatingCount: row.seed_rating_count,
      seedRatingAverage: Number(row.seed_rating_average),
      reviewCount,
      averageRating,
      lastReviewAt: pickRecentTimestamp(
        courseReviews.map((review) => review.modifiedAt || review.createdAt),
      ),
      ratingDistribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: courseReviews.filter((review) => review.rating === stars).length,
      })),
      reviews: courseReviews,
    });
  });

  const teacherMap = new Map<string, TeacherSummary>();
  courseMap.forEach((course) => {
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
    const existing = teacherMap.get(course.teacherSlug);

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
      Math.max(existing.courses.length, 1);
    existing.departmentHints = Array.from(
      new Set([...existing.departmentHints, course.department ?? DEPARTMENT_FALLBACK]),
    );
    existing.lastReviewAt = pickRecentTimestamp([
      existing.lastReviewAt,
      course.lastReviewAt,
    ]);
  });

  teacherMap.forEach((teacher) => {
    teacher.courses.sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) {
        return right.reviewCount - left.reviewCount;
      }
      return right.averageRating - left.averageRating;
    });
  });

  return {
    courses: Array.from(courseMap.values()),
    courseMap,
    teacherMap,
    teachers: Array.from(teacherMap.values()),
    reviews: sortReviews(reviews, "latest"),
    categories: Array.from(new Set(courseRows.flatMap((course) => course.categories ?? []))).sort(),
  };
}

async function loadDataIndex() {
  if (!dataIndexPromise) {
    dataIndexPromise = fetchSupabaseRows().then(async (supabaseData) => {
      if (supabaseData.canUseDatabase) {
        return buildDataIndex(supabaseData.courses, supabaseData.reviews);
      }

      const seedRows = await loadSeedRows();
      return buildDataIndex(seedRows.courses, seedRows.reviews);
    });
  }

  return dataIndexPromise;
}

async function fetchHomeSummary(): Promise<HomePageData | null> {
  if (!homeSummaryPromise) {
    homeSummaryPromise = fetch("/data/home-summary.json")
      .then((response) => (response.ok ? (response.json() as Promise<HomePageData>) : null))
      .catch(() => null);
  }

  return homeSummaryPromise;
}

function buildHomePageDataFromIndex(data: DataIndex): HomePageData {
  return {
    featuredCourses: [...data.courses]
      .filter((course) => course.reviewCount > 0)
      .sort((left, right) => right.reviewCount - left.reviewCount)
      .slice(0, 6),
    topTeachers: [...data.teachers]
      .filter((teacher) => teacher.reviewCount > 0)
      .sort((left, right) => right.averageRating - left.averageRating || right.reviewCount - left.reviewCount)
      .slice(0, 6),
    latestReviews: data.reviews.filter((review) => review.publishStatus === "published").slice(0, 8),
    cautionCourses: [...data.courses]
      .filter((course) => course.reviewCount >= 2)
      .sort((left, right) => left.averageRating - right.averageRating || right.reviewCount - left.reviewCount)
      .slice(0, 6),
    siteStats: {
      courseCount: data.courses.length,
      teacherCount: data.teachers.length,
      reviewCount: data.reviews.filter((review) => review.publishStatus === "published").length,
      categoryCount: data.categories.length,
    },
  };
}

export function invalidateDataCache() {
  dataIndexPromise = null;
  homeSummaryPromise = null;
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

function sortCoursesBySearch(courses: Course[], query: string, sort: SearchSort) {
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

    return rightScore - leftScore || right.reviewCount - left.reviewCount;
  });
}

function sortTeachersBySearch(teachers: TeacherSummary[], query: string, sort: SearchSort) {
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

    return computeSearchScore(right.name, query) - computeSearchScore(left.name, query);
  });
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!data.user || !email) {
    return null;
  }

  return {
    id: data.user.id,
    email,
    isAdmin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  const supabaseData = await fetchSupabaseRows();
  if (supabaseData.canUseDatabase) {
    return buildHomePageDataFromIndex(buildDataIndex(supabaseData.courses, supabaseData.reviews));
  }

  const summary = await fetchHomeSummary();
  if (summary) {
    return summary;
  }

  throw new Error("首页摘要数据暂不可用，请先执行 npm run build 生成 public/data/home-summary.json。");
}

export async function searchSite(query: string, sort: SearchSort = "relevance"): Promise<SearchResult> {
  const data = await loadDataIndex();
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return {
      courses: sortCoursesBySearch(data.courses, query, sort).slice(0, 20),
      teachers: sortTeachersBySearch(data.teachers, query, sort).slice(0, 20),
      query,
      sort,
    };
  }

  return {
    courses: sortCoursesBySearch(
      data.courses.filter((course) =>
        [course.name, course.teacherName, course.code, ...course.categories]
          .some((value) => normalizeText(value).includes(normalizedQuery)),
      ),
      query,
      sort,
    ).slice(0, 40),
    teachers: sortTeachersBySearch(
      data.teachers.filter((teacher) => normalizeText(teacher.name).includes(normalizedQuery)),
      query,
      sort,
    ).slice(0, 30),
    query,
    sort,
  };
}

export async function getTeacherBySlug(slug: string) {
  const data = await loadDataIndex();
  return data.teacherMap.get(slug) ?? null;
}

export async function getCourseById(courseId: number, sort: ReviewSort = "latest") {
  const data = await loadDataIndex();
  const course = data.courseMap.get(courseId);
  if (!course) {
    return null;
  }

  return {
    ...course,
    reviews: sortReviews(course.reviews, sort),
  } satisfies Course;
}

export async function getMyReviews(userId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("course_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ReviewRow[]).map(mapReview);
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
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase 未配置，暂时不能在线提交评论。");
  }

  const now = new Date().toISOString();
  const payload = {
    id: crypto.randomUUID(),
    source_id: null,
    course_id: input.courseId,
    course_code: input.courseCode,
    course_name: input.courseName,
    teacher_name: input.teacherName,
    teacher_slug: input.teacherSlug,
    semester: input.semester,
    rating: input.rating,
    comment: input.comment,
    created_at: now,
    modified_at: now,
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

  invalidateDataCache();
  return mapReview(data as ReviewRow);
}

export async function reportReview(reviewId: string, reason: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase 未配置，暂时不能提交举报。");
  }

  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: userData.user?.id ?? null,
    reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminReviews() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const [{ data: reviews, error: reviewsError }, { data: reports }] = await Promise.all([
    supabase
      .from("course_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("review_reports").select("review_id").limit(1000),
  ]);

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const reportCountMap = new Map<string, number>();
  ((reports ?? []) as ReportRow[]).forEach((item) => {
    reportCountMap.set(item.review_id, (reportCountMap.get(item.review_id) ?? 0) + 1);
  });

  return ((reviews ?? []) as ReviewRow[]).map((row) => ({
    ...mapReview(row),
    reportsCount: reportCountMap.get(row.id) ?? 0,
  }));
}

export async function updateAdminReview(reviewId: string, input: AdminReviewUpdateInput) {
  const supabase = createSupabaseBrowserClient();
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

  invalidateDataCache();
  return mapReview(data as ReviewRow);
}
