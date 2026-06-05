import { NextResponse } from "next/server";

import { getTeacherBySlug } from "@/lib/data";

interface TeacherRouteProps {
  params: Promise<{ teacherSlug: string }>;
}

export async function GET(_request: Request, { params }: TeacherRouteProps) {
  const { teacherSlug } = await params;
  const teacher = await getTeacherBySlug(teacherSlug);

  if (!teacher) {
    return NextResponse.json({ message: "老师不存在" }, { status: 404 });
  }

  return NextResponse.json(teacher);
}
