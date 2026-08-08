import { NextResponse } from "next/server";
import { latestScrapeAt } from "@/lib/supabase-server";

export async function GET() {
  const startedAt = Date.now();

  try {
    const scrapedAt = await latestScrapeAt();
    return NextResponse.json({
      ok: Boolean(scrapedAt),
      status: scrapedAt ? 200 : 503,
      scrapedAt,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown warm-up error",
        durationMs: Date.now() - startedAt,
      },
      { status: 502 }
    );
  }
}
