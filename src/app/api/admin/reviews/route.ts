import { NextResponse } from "next/server";

import { ADMIN_EMAIL } from "@/lib/constants";
import { getCurrentUserProfile } from "@/lib/auth";
import { getAdminReviews } from "@/lib/data";

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ message: "无权访问。" }, { status: 403 });
  }

  const reviews = await getAdminReviews();
  return NextResponse.json(reviews);
}
