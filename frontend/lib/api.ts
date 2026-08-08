import { type DashboardFilters, type RolesResponse } from "@/lib/api-types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VERCEL
    ? "https://ai-company-hiring-insights.vercel.app"
    : "http://localhost:8000");
const API_CACHE_OPTIONS = { next: { revalidate: 3600, tags: ["ai-insights-api"] } };
const API_CACHE_VERSION = "2026-08-08-1";

function withFilters(path: string, filters: DashboardFilters = {}) {
  const params = new URLSearchParams();
  params.set("_v", API_CACHE_VERSION);
  if (filters.days) params.set("days", filters.days.toString());
  if (filters.companySlug) params.set("company_slug", filters.companySlug);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.offset) params.set("offset", filters.offset.toString());
  return `${API_URL}${path}?${params.toString()}`;
}

async function getJson<T>(path: string, filters: DashboardFilters, errorMessage: string) {
  const response = await fetch(withFilters(path, filters), API_CACHE_OPTIONS);
  if (!response.ok) throw new Error(errorMessage);
  return response.json() as Promise<T>;
}

export function getCompanies(filters: DashboardFilters = {}) {
  return getJson<any[]>("/companies", filters, "Failed to fetch companies");
}

export function getCompany(slug: string, filters: DashboardFilters = {}) {
  return getJson<any>(`/company/${slug}`, filters, "Failed to fetch company details");
}

export async function getCategories(filters: DashboardFilters = {}) {
  const companies = await getCompanies(filters);
  const details = await Promise.all(
    companies.map((company: any) => getCompany(company.slug, filters).catch(() => null))
  );
  const counts = new Map<string, number>();
  for (const company of details) {
    for (const category of company?.categories || []) {
      counts.set(category.category, (counts.get(category.category) || 0) + category.count);
    }
  }
  return Array.from(counts, ([category, growth]) => ({ category, growth })).sort(
    (a, b) => b.growth - a.growth
  );
}

export async function getLocations(filters: DashboardFilters = {}) {
  const companies = await getCompanies(filters);
  const details = await Promise.all(
    companies.map((company: any) =>
      getCompany(company.slug, filters)
        .then((data) => ({ data, name: company.name }))
        .catch(() => null)
    )
  );
  const counts = new Map<string, { roles: number; topCompany: string; topCount: number }>();
  for (const company of details) {
    if (!company) continue;
    for (const location of company.data.countries || []) {
      const current = counts.get(location.country);
      if (!current) {
        counts.set(location.country, {
          roles: location.count,
          topCompany: company.name,
          topCount: location.count,
        });
        continue;
      }
      current.roles += location.count;
      if (location.count > current.topCount) {
        current.topCompany = company.name;
        current.topCount = location.count;
      }
    }
  }
  return Array.from(counts, ([country, data]) => ({
    country,
    roles: data.roles,
    growth: 0,
    topCompany: data.topCompany,
  })).sort((a, b) => b.roles - a.roles);
}

export function getCategoryMatrix(filters: DashboardFilters = {}) {
  return getJson<{
    companies: string[];
    matrix: Array<{ category: string; total: number; companies: Record<string, number> }>;
  }>("/category-matrix", filters, "Failed to fetch category matrix");
}

export function getCategorySeniority(filters: DashboardFilters = {}) {
  return getJson<Array<{
    category: string;
    total: number;
    senior: number;
    mid: number;
    junior: number;
    senior_pct: number;
  }>>("/categories/seniority", filters, "Failed to fetch category seniority");
}

export async function getUnusualSignals(filters: DashboardFilters = {}) {
  const response = await fetch(withFilters("/unusual-signals", filters), API_CACHE_OPTIONS);
  if (!response.ok) {
    return {} as Record<string, {
      label: string;
      count: number;
      description: string;
      evidence: string[];
    }>;
  }
  return response.json() as Promise<Record<string, {
    label: string;
    count: number;
    description: string;
    evidence: string[];
  }>>;
}

export function getRoles(filters: DashboardFilters = {}) {
  return getJson<RolesResponse>("/roles", filters, "Failed to fetch roles");
}

export { API_CACHE_OPTIONS };
