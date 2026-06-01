const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VERCEL
    ? "https://ai-company-hiring-insights.vercel.app"
    : "http://localhost:8000");

export type DashboardFilters = {
  days?: number;
  companySlug?: string;
  country?: string;
};

function withFilters(path: string, filters: DashboardFilters = {}) {
  const params = new URLSearchParams();
  if (filters.days) params.set("days", filters.days.toString());
  if (filters.companySlug) params.set("company_slug", filters.companySlug);
  if (filters.country) params.set("country", filters.country);
  return `${API_URL}${path}${params.size ? `?${params.toString()}` : ""}`;
}

export async function getCompanies(filters: DashboardFilters = {}) {
  const res = await fetch(withFilters("/companies", filters), { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export async function getCompany(slug: string, filters: DashboardFilters = {}) {
  const res = await fetch(withFilters(`/company/${slug}`, filters), { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch company details");
  return res.json();
}

export async function getCategories(filters: DashboardFilters = {}) {
  const companies = await getCompanies(filters);

  // Fetch all company details in parallel (was sequential N+1 before)
  const allDetails = await Promise.all(
    companies.map((comp: any) => getCompany(comp.slug, filters).catch(() => null))
  );

  const categoryMap = new Map<string, number>();
  for (const details of allDetails) {
    if (!details) continue;
    for (const cat of details.categories || []) {
      categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.count);
    }
  }

  const result = Array.from(categoryMap.entries()).map(([category, growth]) => ({
    category,
    growth,
  }));

  return result.sort((a, b) => b.growth - a.growth);
}

export async function getLocations(filters: DashboardFilters = {}) {
  const companies = await getCompanies(filters);

  // Fetch all company details in parallel (was sequential N+1 before)
  const allDetails = await Promise.all(
    companies.map((comp: any) =>
      getCompany(comp.slug, filters)
        .then((details) => ({ details, compName: comp.name }))
        .catch(() => null)
    )
  );

  const locationMap = new Map<string, { roles: number; topCompany: string; topCount: number }>();

  for (const entry of allDetails) {
    if (!entry) continue;
    const { details, compName } = entry;
    for (const loc of details.countries || []) {
      const existing = locationMap.get(loc.country);
      if (!existing) {
        locationMap.set(loc.country, { roles: loc.count, topCompany: compName, topCount: loc.count });
      } else {
        existing.roles += loc.count;
        if (loc.count > existing.topCount) {
          existing.topCompany = compName;
          existing.topCount = loc.count;
        }
      }
    }
  }

  const result = Array.from(locationMap.entries()).map(([country, data]) => ({
    country,
    roles: data.roles,
    growth: 0,
    topCompany: data.topCompany,
  }));

  return result.sort((a, b) => b.roles - a.roles);
}

export async function getCategoryMatrix(filters: DashboardFilters = {}) {
  const res = await fetch(withFilters("/category-matrix", filters), { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch category matrix");
  return res.json() as Promise<{
    companies: string[];
    matrix: Array<{ category: string; total: number; companies: Record<string, number> }>;
  }>;
}

export async function getCategorySeniority(filters: DashboardFilters = {}) {
  const res = await fetch(withFilters("/categories/seniority", filters), { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch category seniority");
  return res.json() as Promise<Array<{
    category: string; total: number;
    senior: number; mid: number; junior: number; senior_pct: number;
  }>>;
}

export async function getUnusualSignals(filters: DashboardFilters = {}) {
  const res = await fetch(withFilters("/unusual-signals", filters), { cache: 'no-store' });
  if (!res.ok) return {} as Record<string, { label: string; count: number; description: string; evidence: string[] }>;
  return res.json() as Promise<Record<string, { label: string; count: number; description: string; evidence: string[] }>>;
}
