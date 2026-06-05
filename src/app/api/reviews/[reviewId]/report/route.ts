import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserProfile } from "@/lib/auth";
import { reportReview } from "@/lib/data";

const reportSchema = z.object({
  reason: z.string().trim().min(4).max(500),
});

interface ReportRouteProps {
  params: Promise<{ reviewId: string }>;
}

export async function POST(request: Request, { params }: ReportRouteProps) {
  const { reviewId } = await params;
  const body = await request.json();
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "举报原因太短或格式不合法。" }, { status: 400 });
  }

  const user = await getCurrentUserProfile();

  try {
    await reportReview(reviewId, user?.id ?? null, parsed.data.reason);
    return NextResponse.json({ message: "举报已提交，管理员会尽快查看。" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "举报提交失败。" },
      { status: 500 },
    );
  }
}
