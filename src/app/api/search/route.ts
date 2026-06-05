import { NextResponse, type NextRequest } from "next/server";

import { searchSite } from "@/lib/data";
import type { SearchSort } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") ?? "relevance") as SearchSort;
  const result = await searchSite(query, sort);

  return NextResponse.json(result);
}
