import "server-only";

import { type DashboardFilters, type RolesResponse } from "@/lib/api-types";
import { buildCompanySignals } from "@/lib/company-signals";
import {
  API_CACHE_OPTIONS,
  type Filter,
  latestScrapeAt,
  scrapeWindowCutoff,
  supabaseSelect,
  supabaseSelectAll,
} from "@/lib/supabase-server";

type CompanyRow = {
  slug: string;
  name: string;
};

type RoleRow = {
  id?: string;
  title?: string;
  company_slug?: string;
  category?: string;
  location?: string;
  country?: string;
  seniority?: string;
  work_mode?: string;
  source_url?: string;
  last_seen_at?: string;
};

type SnapshotRow = {
  company_slug: string;
  scraped_at: string;
  total_open_roles: number;
};

type CompanySummaryRow = {
  slug: string;
  name: string;
  current_roles: number;
  previous_roles: number;
  change: number;
  change_pct: number;
  scraped_at: string;
  top_hiring_location: string;
};

type SignalRow = {
  slug: string;
  label: string | null;
  count: number;
  description: string | null;
  evidence: string[] | null;
  top_category: string | null;
};

type MatrixRow = {
  scraped_at: string;
  company_slug: string;
  company_name: string;
  category: string;
  count: number;
};

type LocationRow = {
  scraped_at: string;
  country: string;
  roles: number;
  top_company: string;
};

const NO_STORE = { cache: "no-store" as const };

function targetDateForDays(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

async function getCompaniesLookup() {
  const companies = await supabaseSelect<CompanyRow>("companies", {
    columns: "slug,name",
    orderBy: "name",
  });
  const bySlug = new Map(companies.map((company) => [company.slug, company.name]));
  const byName = new Map(companies.map((company) => [company.name, company.slug]));
  return { companies, bySlug, byName };
}

async function getLatestContext() {
  const scrapedAt = await latestScrapeAt();
  if (!scrapedAt) {
    throw new Error("No scrape snapshots found.");
  }
  return {
    scrapedAt,
    cutoff: scrapeWindowCutoff(scrapedAt),
  };
}

async function fetchCurrentRoles(filters: DashboardFilters = {}, columns = "*") {
  const { cutoff } = await getLatestContext();
  const roleFilters: Filter[] = [{ column: "last_seen_at", op: "gte", value: cutoff }];
  if (filters.companySlug) {
    roleFilters.push({ column: "company_slug", op: "eq" as const, value: filters.companySlug });
  }
  if (filters.country) {
    roleFilters.push({ column: "country", op: "eq" as const, value: filters.country });
  }
  if (filters.category) {
    roleFilters.push({ column: "category", op: "eq" as const, value: filters.category });
  }

  return supabaseSelectAll<RoleRow>("roles", {
    columns,
    filters: roleFilters,
    orderBy: "last_seen_at",
    ascending: false,
  });
}

async function fetchLatestSummaries(scrapedAt: string) {
  try {
    const rows = await supabaseSelect<CompanySummaryRow>("company_summaries", {
      columns: "slug,name,current_roles,previous_roles,change,change_pct,scraped_at,top_hiring_location",
      filters: [{ column: "scraped_at", op: "eq", value: scrapedAt }],
    });
    return new Map(rows.map((row) => [row.slug, row]));
  } catch {
    return new Map<string, CompanySummaryRow>();
  }
}

async function fetchLatestSignals(scrapedAt: string) {
  try {
    const rows = await supabaseSelect<SignalRow>("company_signals", {
      columns: "slug,label,count,description,evidence,top_category",
      filters: [{ column: "scraped_at", op: "eq", value: scrapedAt }],
    });
    return new Map(rows.map((row) => [row.slug, row]));
  } catch {
    return new Map<string, SignalRow>();
  }
}

async function fetchLatestMatrix(scrapedAt: string) {
  try {
    return await supabaseSelect<MatrixRow>("category_matrix_snapshots", {
      columns: "scraped_at,company_slug,company_name,category,count",
      filters: [{ column: "scraped_at", op: "eq", value: scrapedAt }],
    });
  } catch {
    return [];
  }
}

async function fetchLatestLocations(scrapedAt: string) {
  try {
    return await supabaseSelect<LocationRow>("location_summaries", {
      columns: "scraped_at,country,roles,top_company",
      filters: [{ column: "scraped_at", op: "eq", value: scrapedAt }],
      orderBy: "roles",
      ascending: false,
    });
  } catch {
    return [];
  }
}

async function fetchSnapshots(companySlug?: string) {
  return supabaseSelect<SnapshotRow>("role_snapshots", {
    columns: "company_slug,scraped_at,total_open_roles",
    filters: companySlug ? [{ column: "company_slug", op: "eq", value: companySlug }] : [],
    orderBy: "scraped_at",
    ascending: false,
    limit: companySlug ? 100 : 500,
  });
}

function pickPreviousSnapshot(snapshots: SnapshotRow[], days: number) {
  const latest = snapshots[0];
  if (!latest) return null;
  const target = targetDateForDays(days);
  const older = snapshots.slice(1);
  if (older.length === 0) return latest;

  let closest = older[0];
  let closestDistance = Math.abs(new Date(closest.scraped_at).getTime() - target);
  for (const snapshot of older.slice(1)) {
    const distance = Math.abs(new Date(snapshot.scraped_at).getTime() - target);
    if (distance < closestDistance) {
      closest = snapshot;
      closestDistance = distance;
    }
  }
  return closest;
}

function normalizeRole(role: RoleRow, companyNames: Map<string, string>) {
  const slug = role.company_slug || "";
  return {
    id: role.id || role.source_url || `${slug}-${role.title || "untitled"}`,
    title: role.title || "Untitled role",
    company: companyNames.get(slug) || slug,
    companySlug: slug,
    category: role.category || "Uncategorized",
    location: role.location || "",
    country: role.country || "Unknown",
    seniority: role.seniority || "N/A",
    workMode: role.work_mode || "N/A",
    sourceUrl: role.source_url || "",
    lastSeenAt: role.last_seen_at || "",
  };
}

export async function getCompanies(filters: DashboardFilters = {}) {
  const days = filters.days || 7;
  const latestContext = await getLatestContext();
  const [{ companies }, currentRoles, summaries, snapshots] = await Promise.all([
    getCompaniesLookup(),
    filters.country ? fetchCurrentRoles(filters, "company_slug,country") : Promise.resolve([]),
    fetchLatestSummaries(latestContext.scrapedAt),
    fetchSnapshots(),
  ]);

  const snapshotsByCompany = new Map<string, SnapshotRow[]>();
  for (const snapshot of snapshots) {
    const list = snapshotsByCompany.get(snapshot.company_slug) || [];
    list.push(snapshot);
    snapshotsByCompany.set(snapshot.company_slug, list);
  }

  const roleCounts = new Map<string, number>();
  for (const role of currentRoles) {
    const slug = role.company_slug || "";
    roleCounts.set(slug, (roleCounts.get(slug) || 0) + 1);
  }

  return companies
    .filter((company) => !filters.companySlug || company.slug === filters.companySlug)
    .map((company) => {
      const companySnapshots = snapshotsByCompany.get(company.slug) || [];
      const latestSnapshot = companySnapshots[0];
      const previousSnapshot = pickPreviousSnapshot(companySnapshots, days);
      const summary = summaries.get(company.slug);
      const currentRolesCount = filters.country
        ? roleCounts.get(company.slug) || 0
        : summary?.current_roles ?? latestSnapshot?.total_open_roles ?? 0;
      let previousRolesCount = filters.country
        ? currentRolesCount
        : previousSnapshot?.total_open_roles ?? currentRolesCount;

      if (previousRolesCount > 0 && currentRolesCount / previousRolesCount >= 4) {
        previousRolesCount = currentRolesCount;
      }

      const change = currentRolesCount - previousRolesCount;
      const changePct = previousRolesCount > 0 ? Number(((change / previousRolesCount) * 100).toFixed(1)) : 0;
      const topHiringLocation = filters.country
        ? filters.country
        : summary?.top_hiring_location || "N/A";

      return {
        slug: company.slug,
        name: company.name,
        current_roles: currentRolesCount,
        previous_roles: previousRolesCount,
        change,
        change_pct: changePct,
        scraped_at: latestSnapshot?.scraped_at || summary?.scraped_at || null,
        top_hiring_location: topHiringLocation,
      };
    });
}

export async function getCompany(slug: string, filters: DashboardFilters = {}) {
  const [companiesLookup, snapshots, roles] = await Promise.all([
    getCompaniesLookup(),
    supabaseSelect<SnapshotRow>("role_snapshots", {
      columns: "scraped_at,total_open_roles,company_slug",
      filters: [{ column: "company_slug", op: "eq", value: slug }],
      orderBy: "scraped_at",
      ascending: true,
      limit: 100,
    }),
    fetchCurrentRoles({ ...filters, companySlug: slug }),
  ]);

  const company = companiesLookup.companies.find((entry) => entry.slug === slug);
  if (!company) {
    throw new Error("Company not found");
  }

  const categories = new Map<string, number>();
  const countries = new Map<string, number>();
  for (const role of roles) {
    const category = role.category || "Uncategorized";
    const country = role.country || "Unknown";
    categories.set(category, (categories.get(category) || 0) + 1);
    countries.set(country, (countries.get(country) || 0) + 1);
  }

  return {
    slug: company.slug,
    name: company.name,
    snapshots,
    categories: Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    countries: Array.from(countries.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count),
    roles: roles
      .sort((a, b) => (b.last_seen_at || "").localeCompare(a.last_seen_at || ""))
      .slice(0, 50),
  };
}

export async function getCategories(filters: DashboardFilters = {}) {
  const { scrapedAt } = await getLatestContext();

  if (!filters.country) {
    const matrix = await fetchLatestMatrix(scrapedAt);
    if (matrix.length > 0) {
      const counts = new Map<string, number>();
      for (const row of matrix) {
        if (filters.companySlug && row.company_slug !== filters.companySlug) continue;
        counts.set(row.category, (counts.get(row.category) || 0) + row.count);
      }
      return Array.from(counts.entries())
        .map(([category, growth]) => ({ category, growth }))
        .sort((a, b) => b.growth - a.growth);
    }
  }

  const roles = await fetchCurrentRoles(filters, "category");
  const counts = new Map<string, number>();
  for (const role of roles) {
    const category = role.category || "Uncategorized";
    counts.set(category, (counts.get(category) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, growth]) => ({ category, growth }))
    .sort((a, b) => b.growth - a.growth);
}

export async function getLocations(filters: DashboardFilters = {}) {
  const { scrapedAt } = await getLatestContext();

  if (!filters.companySlug) {
    const locations = await fetchLatestLocations(scrapedAt);
    if (locations.length > 0) {
      return locations
        .filter((row) => !filters.country || row.country === filters.country)
        .map((row) => ({
          country: row.country,
          roles: row.roles,
          growth: 0,
          topCompany: row.top_company,
        }))
        .sort((a, b) => b.roles - a.roles);
    }
  }

  const { bySlug } = await getCompaniesLookup();
  const roles = await fetchCurrentRoles(filters, "company_slug,country");
  const counts = new Map<string, { roles: number; topCompany: string; topCount: number }>();
  const companyCountryCounts = new Map<string, number>();

  for (const role of roles) {
    const country = role.country || "Unknown";
    const companySlug = role.company_slug || "";
    const key = `${country}::${companySlug}`;
    companyCountryCounts.set(key, (companyCountryCounts.get(key) || 0) + 1);
  }

  for (const role of roles) {
    const country = role.country || "Unknown";
    const companySlug = role.company_slug || "";
    const current = counts.get(country) || { roles: 0, topCompany: "N/A", topCount: 0 };
    const nextRoles = current.roles + 1;
    const sameCompanyCount = companyCountryCounts.get(`${country}::${companySlug}`) || 0;
    counts.set(country, {
      roles: nextRoles,
      topCompany: sameCompanyCount > current.topCount ? bySlug.get(companySlug) || companySlug : current.topCompany,
      topCount: Math.max(current.topCount, sameCompanyCount),
    });
  }

  return Array.from(counts.entries())
    .map(([country, data]) => ({
      country,
      roles: data.roles,
      growth: 0,
      topCompany: data.topCompany,
    }))
    .sort((a, b) => b.roles - a.roles);
}

export async function getCategoryMatrix(filters: DashboardFilters = {}) {
  const { companies, bySlug } = await getCompaniesLookup();
  const { scrapedAt } = await getLatestContext();

  if (!filters.country) {
    const matrixRows = await fetchLatestMatrix(scrapedAt);
    if (matrixRows.length > 0) {
      const companyNames = companies
        .filter((company) => !filters.companySlug || company.slug === filters.companySlug)
        .map((company) => company.name);
      const rows = new Map<string, { category: string; total: number; companies: Record<string, number> }>();

      for (const entry of matrixRows) {
        if (filters.companySlug && entry.company_slug !== filters.companySlug) continue;
        const row = rows.get(entry.category) || {
          category: entry.category,
          total: 0,
          companies: Object.fromEntries(companyNames.map((name) => [name, 0])),
        };
        row.total += entry.count;
        row.companies[entry.company_name] = entry.count;
        rows.set(entry.category, row);
      }

      return {
        companies: companyNames,
        matrix: Array.from(rows.values()).sort((a, b) => b.total - a.total),
      };
    }
  }

  const roles = await fetchCurrentRoles(filters, "company_slug,category");
  const matrix = new Map<string, { category: string; total: number; companies: Record<string, number> }>();
  const companyNames = companies
    .filter((company) => !filters.companySlug || company.slug === filters.companySlug)
    .map((company) => company.name);

  for (const role of roles) {
    const category = role.category || "Uncategorized";
    const companyName = bySlug.get(role.company_slug || "") || "Unknown";
    const row = matrix.get(category) || {
      category,
      total: 0,
      companies: Object.fromEntries(companyNames.map((name) => [name, 0])),
    };
    row.total += 1;
    row.companies[companyName] = (row.companies[companyName] || 0) + 1;
    matrix.set(category, row);
  }

  return {
    companies: companyNames,
    matrix: Array.from(matrix.values()).sort((a, b) => b.total - a.total),
  };
}

export async function getCategorySeniority(filters: DashboardFilters = {}) {
  const roles = await fetchCurrentRoles(filters, "category,seniority");
  const senior = new Set(["Senior", "Staff", "Lead", "Principal", "Director"]);
  const junior = new Set(["Junior", "Associate", "Entry", "Intern"]);
  const breakdown = new Map<string, { senior: number; mid: number; junior: number }>();

  for (const role of roles) {
    const category = role.category || "Uncategorized";
    const bucket = breakdown.get(category) || { senior: 0, mid: 0, junior: 0 };
    const level = role.seniority || "";
    if (senior.has(level)) bucket.senior += 1;
    else if (junior.has(level)) bucket.junior += 1;
    else bucket.mid += 1;
    breakdown.set(category, bucket);
  }

  return Array.from(breakdown.entries())
    .map(([category, counts]) => {
      const total = counts.senior + counts.mid + counts.junior;
      return {
        category,
        total,
        senior: counts.senior,
        mid: counts.mid,
        junior: counts.junior,
        senior_pct: total > 0 ? Math.round((counts.senior / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getUnusualSignals(filters: DashboardFilters = {}) {
  const roles = await fetchCurrentRoles(filters, "company_slug,title");
  return buildCompanySignals(roles);
}

export async function getRoles(filters: DashboardFilters = {}): Promise<RolesResponse> {
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const [{ bySlug }, allMatchingRoles, pageRoles] = await Promise.all([
    getCompaniesLookup(),
    fetchCurrentRoles(filters, "company_slug,category,country"),
    (async () => {
      const { cutoff } = await getLatestContext();
      const queryFilters: Filter[] = [{ column: "last_seen_at", op: "gte", value: cutoff }];
      if (filters.companySlug) {
        queryFilters.push({ column: "company_slug", op: "eq" as const, value: filters.companySlug });
      }
      if (filters.country) {
        queryFilters.push({ column: "country", op: "eq" as const, value: filters.country });
      }
      if (filters.category) {
        queryFilters.push({ column: "category", op: "eq" as const, value: filters.category });
      }
      return supabaseSelect<RoleRow>("roles", {
        columns: "*",
        filters: queryFilters,
        orderBy: "last_seen_at",
        ascending: false,
        limit,
        offset,
        cache: NO_STORE,
      });
    })(),
  ]);

  const companyCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();

  for (const role of allMatchingRoles) {
    const companySlug = role.company_slug || "Unknown";
    const category = role.category || "Uncategorized";
    const country = role.country || "Unknown";
    companyCounts.set(companySlug, (companyCounts.get(companySlug) || 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  }

  const roles = pageRoles.map((role) => normalizeRole(role, bySlug));
  const total = allMatchingRoles.length;
  const nextOffset = offset + roles.length;

  return {
    roles,
    total,
    limit,
    offset,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
    facets: {
      company: Array.from(companyCounts.entries())
        .map(([slug, count]) => ({
          label: bySlug.get(slug) || slug,
          slug,
          count,
        }))
        .sort((a, b) => b.count - a.count),
      category: Array.from(categoryCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      country: Array.from(countryCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

export { API_CACHE_OPTIONS };
