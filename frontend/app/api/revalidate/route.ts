import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const API_CACHE_TAG = "ai-insights-api";

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret && token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(API_CACHE_TAG, "max");

  return NextResponse.json({ ok: true, revalidated: API_CACHE_TAG });
}
