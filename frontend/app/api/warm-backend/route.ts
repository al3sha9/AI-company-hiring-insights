import { NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VERCEL
    ? "https://ai-company-hiring-insights.vercel.app"
    : "http://localhost:8000");

export async function GET() {
  const startedAt = Date.now();

  try {
    const response = await fetch(`${API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({
      ok: response.ok,
      status: response.status,
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
