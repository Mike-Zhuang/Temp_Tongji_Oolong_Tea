import { NextResponse, type NextRequest } from "next/server";

import { getCourseById } from "@/lib/data";
import type { ReviewSort } from "@/lib/types";

interface CourseRouteProps {
  params: Promise<{ courseId: string }>;
}

export async function GET(request: NextRequest, { params }: CourseRouteProps) {
  const { courseId } = await params;
  const sort = (request.nextUrl.searchParams.get("sort") ?? "latest") as ReviewSort;
  const course = await getCourseById(Number(courseId), sort);

  if (!course) {
    return NextResponse.json({ message: "课程不存在" }, { status: 404 });
  }

  return NextResponse.json(course);
}
