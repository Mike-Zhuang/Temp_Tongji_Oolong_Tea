import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("缺少 Supabase 环境变量，请先配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const coursesFilePath = path.join(process.cwd(), "scripts", "seed-data", "wlc.courses.json");
const ratingsFilePath = path.join(process.cwd(), "scripts", "seed-data", "wlc.ratings.json");

function slugifyTeacherName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "") || "unknown-teacher";
}

async function loadJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function main() {
  const [courses, ratings] = await Promise.all([
    loadJson(coursesFilePath),
    loadJson(ratingsFilePath),
  ]);

  const teacherMap = new Map();

  for (const course of courses) {
    const teacherSlug = slugifyTeacherName(course.teacher);
    const current = teacherMap.get(teacherSlug) ?? {
      slug: teacherSlug,
      name: course.teacher,
      department_hints: [],
    };

    if (course.department && !current.department_hints.includes(course.department)) {
      current.department_hints.push(course.department);
    }

    teacherMap.set(teacherSlug, current);
  }

  const teachersPayload = Array.from(teacherMap.values());
  const coursesPayload = courses.map((course) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    teacher_name: course.teacher,
    teacher_slug: slugifyTeacherName(course.teacher),
    department: course.department,
    credit: course.credit,
    categories: course.categories,
    seed_rating_count: course.rating.count,
    seed_rating_average: course.rating.avg,
  }));

  const reviewsPayload = ratings.map((review) => ({
    id: `seed-${review.id}`,
    source_id: review.id,
    course_id: review.course.id,
    course_code: review.course.code,
    course_name: review.course.name,
    teacher_name: review.course.teacher,
    teacher_slug: slugifyTeacherName(review.course.teacher),
    semester: review.semester,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    modified_at: review.modified_at,
    score: review.score,
    moderator_remark: review.moderator_remark,
    approves: review.reactions.approves,
    disapproves: review.reactions.disapproves,
    publish_status: "published",
    source: "seed",
    tags: [],
    user_id: null,
  }));

  console.log(`准备导入 ${teachersPayload.length} 位老师、${coursesPayload.length} 门课程、${reviewsPayload.length} 条评论。`);

  const teacherResult = await supabase.from("teachers").upsert(teachersPayload, {
    onConflict: "slug",
  });
  if (teacherResult.error) {
    throw teacherResult.error;
  }

  const courseResult = await supabase.from("courses").upsert(coursesPayload, {
    onConflict: "id",
  });
  if (courseResult.error) {
    throw courseResult.error;
  }

  const chunkSize = 500;
  for (let index = 0; index < reviewsPayload.length; index += chunkSize) {
    const chunk = reviewsPayload.slice(index, index + chunkSize);
    const reviewResult = await supabase.from("course_reviews").upsert(chunk, {
      onConflict: "id",
    });

    if (reviewResult.error) {
      throw reviewResult.error;
    }

    console.log(`评论导入进度：${Math.min(index + chunk.length, reviewsPayload.length)}/${reviewsPayload.length}`);
  }

  console.log("种子数据导入完成。");
}

main().catch((error) => {
  console.error("导入失败：", error.message ?? error);
  process.exit(1);
});
