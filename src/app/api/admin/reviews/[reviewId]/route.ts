import { NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_EMAIL } from "@/lib/constants";
import { getCurrentUserProfile } from "@/lib/auth";
import { updateAdminReview } from "@/lib/data";

const updateReviewSchema = z.object({
  publishStatus: z.enum(["published", "hidden"]).optional(),
  moderatorRemark: z.string().max(500).nullable().optional(),
});

interface AdminReviewRouteProps {
  params: Promise<{ reviewId: string }>;
}

export async function PATCH(request: Request, { params }: AdminReviewRouteProps) {
  const user = await getCurrentUserProfile();
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ message: "无权访问。" }, { status: 403 });
  }

  const { reviewId } = await params;
  const parsed = updateReviewSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "更新参数不合法。" }, { status: 400 });
  }

  try {
    const review = await updateAdminReview(reviewId, parsed.data);
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "评论更新失败。" },
      { status: 500 },
    );
  }
}
