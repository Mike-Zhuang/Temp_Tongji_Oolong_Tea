import fs from "node:fs/promises";
import path from "node:path";

const DEPARTMENT_FALLBACK = "院系暂缺";

const coursesFilePath = path.join(process.cwd(), "scripts", "seed-data", "wlc.courses.json");
const ratingsFilePath = path.join(process.cwd(), "scripts", "seed-data", "wlc.ratings.json");
const outputDir = path.join(process.cwd(), "public", "data");

function slugifyTeacherName(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[\s/]+/g, "-")
      .replace(/[^\p{Letter}\p{Number}-]+/gu, "") || "unknown-teacher"
  );
}

function pickRecentTimestamp(values) {
  return (
    values
      .filter(Boolean)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null
  );
}

function mapSeedCourse(row) {
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

function mapSeedReview(row) {
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

function mapReview(row) {
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

function sortReviewsByLatest(left, right) {
  return (
    new Date(right.modifiedAt || right.createdAt).getTime() -
    new Date(left.modifiedAt || left.createdAt).getTime()
  );
}

function computeTeacherAverageRating(courses) {
  let weightedSum = 0;
  let totalReviews = 0;

  courses.forEach((course) => {
    if (course.reviewCount <= 0) {
      return;
    }
    weightedSum += course.averageRating * course.reviewCount;
    totalReviews += course.reviewCount;
  });

  return totalReviews > 0 ? weightedSum / totalReviews : 0;
}

function buildDataIndex(courseRows, reviewRows) {
  const reviews = reviewRows.map(mapReview);
  const reviewsByCourseId = new Map();

  reviews.forEach((review) => {
    const list = reviewsByCourseId.get(review.courseId) ?? [];
    list.push(review);
    reviewsByCourseId.set(review.courseId, list);
  });

  const courseMap = new Map();
  courseRows.forEach((row) => {
    const courseReviews = (reviewsByCourseId.get(row.id) ?? [])
      .filter((review) => review.publishStatus === "published")
      .sort(sortReviewsByLatest);
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
      reviews: [],
    });
  });

  const teacherMap = new Map();
  courseMap.forEach((course) => {
    const courseCard = {
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
        averageRating: computeTeacherAverageRating([courseCard]),
        lastReviewAt: course.lastReviewAt,
        courses: [courseCard],
      });
      return;
    }

    existing.courseCount += 1;
    existing.reviewCount += course.reviewCount;
    existing.courses.push(courseCard);
    existing.averageRating = computeTeacherAverageRating(existing.courses);
    existing.departmentHints = Array.from(
      new Set([...existing.departmentHints, course.department ?? DEPARTMENT_FALLBACK]),
    );
    existing.lastReviewAt = pickRecentTimestamp([existing.lastReviewAt, course.lastReviewAt]);
  });

  teacherMap.forEach((teacher) => {
    teacher.courses.sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) {
        return right.reviewCount - left.reviewCount;
      }
      return right.averageRating - left.averageRating;
    });
  });

  const categories = Array.from(
    new Set(courseRows.flatMap((course) => course.categories ?? [])),
  ).sort();

  return {
    courses: Array.from(courseMap.values()),
    teachers: Array.from(teacherMap.values()),
    reviews: [...reviews].sort(sortReviewsByLatest),
    categories,
  };
}

function buildHomePageData(data) {
  return {
    featuredCourses: [...data.courses]
      .filter((course) => course.reviewCount > 0)
      .sort((left, right) => right.reviewCount - left.reviewCount)
      .slice(0, 6),
    topTeachers: [...data.teachers]
      .filter((teacher) => teacher.reviewCount > 0)
      .sort(
        (left, right) =>
          right.averageRating - left.averageRating || right.reviewCount - left.reviewCount,
      )
      .slice(0, 6),
    latestReviews: data.reviews
      .filter((review) => review.publishStatus === "published")
      .slice(0, 8),
    cautionCourses: [...data.courses]
      .filter((course) => course.reviewCount >= 2)
      .sort(
        (left, right) =>
          left.averageRating - right.averageRating || right.reviewCount - left.reviewCount,
      )
      .slice(0, 6),
    siteStats: {
      courseCount: data.courses.length,
      teacherCount: data.teachers.length,
      reviewCount: data.reviews.filter((review) => review.publishStatus === "published").length,
      categoryCount: data.categories.length,
    },
  };
}

async function main() {
  const [rawCourses, rawRatings] = await Promise.all([
    fs.readFile(coursesFilePath, "utf8").then(JSON.parse),
    fs.readFile(ratingsFilePath, "utf8").then(JSON.parse),
  ]);

  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all([
    fs.copyFile(coursesFilePath, path.join(outputDir, "wlc.courses.json")),
    fs.copyFile(ratingsFilePath, path.join(outputDir, "wlc.ratings.json")),
  ]);

  const courseRows = rawCourses.map(mapSeedCourse);
  const reviewRows = rawRatings.map(mapSeedReview);
  const dataIndex = buildDataIndex(courseRows, reviewRows);
  const homeSummary = buildHomePageData(dataIndex);

  await fs.writeFile(
    path.join(outputDir, "home-summary.json"),
    JSON.stringify(homeSummary),
    "utf8",
  );

  console.log("Copied seed JSON to public/data/ and generated home-summary.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
