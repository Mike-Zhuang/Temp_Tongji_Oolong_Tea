import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

interface SiteAssetRouteProps {
  params: Promise<{ assetName: string }>;
}

export async function GET(_request: NextRequest, { params }: SiteAssetRouteProps) {
  const { assetName } = await params;
  const safeName = assetName.endsWith(".jpg") ? assetName : `${assetName}.jpg`;
  const filePath = path.join(
    process.cwd(),
    "supabase",
    "storage",
    "site-assets",
    safeName,
  );

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "资源不存在" }, { status: 404 });
  }
}
