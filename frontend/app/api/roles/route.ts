import { NextRequest, NextResponse } from "next/server";
import { getRoles } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const result = await getRoles({
      days: params.get("days") ? Number(params.get("days")) : undefined,
      companySlug: params.get("company_slug") || undefined,
      category: params.get("category") || undefined,
      country: params.get("country") || undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
      offset: params.get("offset") ? Number(params.get("offset")) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load roles" },
      { status: 500 }
    );
  }
}
