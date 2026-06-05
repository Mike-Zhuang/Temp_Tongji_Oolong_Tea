import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserProfile, isTongjiEmail } from "@/lib/auth";
import { getCourseById, createUserReview } from "@/lib/data";

const createReviewSchema = z.object({
  courseId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  semester: z.string().trim().min(2).max(40),
  score: z.string().trim().max(80).optional().default(""),
  comment: z.string().trim().min(8).max(4000),
  tags: z.array(z.string().trim().min(1).max(40)).max(6),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ message: "请先登录后再发布评论。" }, { status: 401 });
  }

  if (!isTongjiEmail(user.email)) {
    return NextResponse.json({ message: "只允许同济校园邮箱发布评论。" }, { status: 403 });
  }

  const parsed = createReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "评论参数不合法。" },
      { status: 400 },
    );
  }

  const course = await getCourseById(parsed.data.courseId);
  if (!course) {
    return NextResponse.json({ message: "课程不存在。" }, { status: 404 });
  }

  try {
    const review = await createUserReview({
      ...parsed.data,
      userId: user.id,
      courseName: course.name,
      courseCode: course.code,
      teacherName: course.teacherName,
      teacherSlug: course.teacherSlug,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "评论提交失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
