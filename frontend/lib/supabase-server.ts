import "server-only";

const API_CACHE_OPTIONS = { next: { revalidate: 3600, tags: ["ai-insights-api"] } };
const PAGE_SIZE = 1000;

export type Filter = {
  column: string;
  op: "eq" | "gte" | "lte";
  value: string | number;
};

type SelectOptions = {
  columns?: string;
  filters?: Filter[];
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
  cache?: RequestInit;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return {
    restUrl: `${url.replace(/\/$/, "")}/rest/v1`,
    serviceRoleKey: key,
  };
}

export async function supabaseSelect<T>(
  table: string,
  {
    columns = "*",
    filters = [],
    orderBy,
    ascending = true,
    limit,
    offset,
    cache = API_CACHE_OPTIONS,
  }: SelectOptions = {}
): Promise<T[]> {
  const { restUrl, serviceRoleKey } = getSupabaseConfig();
  const params = new URLSearchParams();
  params.set("select", columns);

  for (const filter of filters) {
    params.set(filter.column, `${filter.op}.${filter.value}`);
  }

  if (orderBy) {
    params.set("order", `${orderBy}.${ascending ? "asc" : "desc"}`);
  }
  if (typeof limit === "number") {
    params.set("limit", limit.toString());
  }
  if (typeof offset === "number") {
    params.set("offset", offset.toString());
  }

  const response = await fetch(`${restUrl}/${table}?${params.toString()}`, {
    ...cache,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase query failed for ${table}: ${response.status} ${message}`);
  }

  return response.json();
}

export async function supabaseSelectAll<T>(
  table: string,
  options: Omit<SelectOptions, "limit" | "offset">
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const batch = await supabaseSelect<T>(table, {
      ...options,
      limit: PAGE_SIZE,
      offset,
    });
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return rows;
}

export async function latestScrapeAt(): Promise<string | null> {
  const rows = await supabaseSelect<{ scraped_at: string }>("role_snapshots", {
    columns: "scraped_at",
    orderBy: "scraped_at",
    ascending: false,
    limit: 1,
  });
  return rows[0]?.scraped_at ?? null;
}

export function scrapeWindowCutoff(scrapedAt: string): string {
  const parsed = new Date(scrapedAt);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(parsed.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

export { API_CACHE_OPTIONS };
