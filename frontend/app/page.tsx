import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { FilterBar } from "@/components/FilterBar";
import { CategoryHeatmap } from "@/components/CategoryHeatmap";
import { CompanyLogo } from "@/components/CompanyLogo";
import { getRoleHref } from "@/lib/data";
import {
  getCompanies,
  getCategories,
  getLocations,
  getCategoryMatrix,
  getUnusualSignals,
} from "@/lib/api";

type HomeProps = {
  searchParams: Promise<{
    company?: string;
    country?: string;
    range?: string;
  }>;
};

type UnusualSignal = {
  label: string;
  count: number;
  description: string;
  evidence: string[];
};

export default async function Home({ searchParams }: HomeProps) {
  const filters = await searchParams;
  const days = filters.range === "30D" ? 30 : filters.range === "90D" ? 90 : 7;
  const rangeLabel = `${days}-day`;

  // Two-wave fetch: critical data first, enrichment second.
  // Prevents macOS socket saturation (EAGAIN/Errno 35) from 6 simultaneous
  // Supabase connections firing at once.
  const allCompanies = await getCompanies({ days });
  const companySlug = allCompanies.find(
    (company: any) => company.name === filters.company
  )?.slug;
  const dashboardFilters = { days, companySlug, country: filters.country };
  const [apiCompanies, apiCategories, apiLocations, allLocations] = await Promise.all([
    getCompanies(dashboardFilters),
    getCategories(dashboardFilters),
    getLocations(dashboardFilters),
    getLocations({ days }),
  ]);

  const [heatmapData, unusualSignals] = await Promise.all([
    getCategoryMatrix(dashboardFilters).catch(() => ({ companies: [], matrix: [] })),
    getUnusualSignals(dashboardFilters).catch(() => ({} as Record<string, UnusualSignal>)),
  ]);


  // --- Overall metrics ---
  const totalOpenRoles = apiCompanies.reduce(
    (acc: number, c: any) => acc + c.current_roles,
    0
  );
  const previousOpenRoles = apiCompanies.reduce(
    (acc: number, c: any) => acc + c.previous_roles,
    0
  );
  const totalChange = totalOpenRoles - previousOpenRoles;
  const hasHistory = apiCompanies.some(
    (c: any) => c.previous_roles !== c.current_roles || c.change !== 0
  );
  const weightedWowChange =
    previousOpenRoles > 0
      ? ((totalChange / previousOpenRoles) * 100).toFixed(1)
      : 0;

  const wowChangeLabel = !hasHistory
    ? `Needs 2 scrapes ${days}+ days apart`
    : totalChange >= 0
    ? `+${totalChange} roles vs prior period`
    : `${totalChange} roles vs prior period`;

  const totalRolesChange =
    totalChange === 0 && !hasHistory
      ? `Refresh after ${days}+ days for change data`
      : totalChange > 0
      ? `+${totalChange} since last period`
      : totalChange < 0
      ? `${totalChange} since last period`
      : "No change since last scrape";

  const lastUpdated =
    apiCompanies.length > 0 && apiCompanies[0].scraped_at
      ? new Date(apiCompanies[0].scraped_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : "Not yet scraped";

  // --- Sorted / derived ---
  const fastestGrowingCompany =
    [...apiCompanies].sort((a, b) => b.change_pct - a.change_pct)[0] ||
    apiCompanies[0] || { name: "N/A", slug: "", change_pct: 0, current_roles: 0 };

  // Build top category per company from heatmap data (most roles in any single category)
  const topCategoryByCompany: Record<string, string> = {};
  for (const row of heatmapData.matrix) {
    for (const companyName of heatmapData.companies) {
      const count = row.companies[companyName] || 0;
      if (count === 0) continue;
      const currentCat = topCategoryByCompany[companyName];
      const currentCount = currentCat
        ? (heatmapData.matrix.find((r) => r.category === currentCat)?.companies[companyName] || 0)
        : 0;
      if (count > currentCount) topCategoryByCompany[companyName] = row.category;
    }
  }

  let rankedCompanies = [...apiCompanies]
    .map((c: any) => ({
      slug: c.slug,
      name: c.name,
      openRoles: c.current_roles,
      wowChange: c.change_pct,
      topGrowingCategory: topCategoryByCompany[c.name] || "Software Engineering",
      topHiringLocation: c.top_hiring_location || "N/A",
      signal: "Active",
    }))
    .sort((a, b) => {
      const aSignal = unusualSignals[a.slug]?.count || 0;
      const bSignal = unusualSignals[b.slug]?.count || 0;
      return bSignal - aSignal || b.wowChange - a.wowChange;
    });

  if (filters.company) {
    rankedCompanies = rankedCompanies.filter((c) => c.name === filters.company);
  }

  const topCategory = apiCategories[0] || { category: "N/A", growth: 0 };
  const maxCategoryGrowth = Math.max(
    ...apiCategories.map((item: any) => item.growth),
    1
  );

  const topLocation = apiLocations[0] || {
    country: "N/A",
    roles: 0,
    topCompany: "N/A",
  };
  const maxLocationRoles = Math.max(
    ...apiLocations.map((l: any) => l.roles),
    1
  );

  const displayedLocations = filters.country
    ? apiLocations.filter((l: any) => l.country === filters.country)
    : apiLocations;

  const countries = allLocations.map((l: any) => l.country);
  const detailParams = new URLSearchParams();
  if (filters.range) detailParams.set("range", filters.range);
  if (filters.company) detailParams.set("company", filters.company);
  if (filters.country) detailParams.set("country", filters.country);
  const detailQuery = detailParams.size ? `?${detailParams.toString()}` : "";
  const betsHref = `/bets${detailQuery}`;

  return (
    <main className="mx-auto min-h-screen max-w-8xl px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      <header className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-2xl font-semibold tracking-normal text-ink">
              AI Insights
            </h1>
            <a 
              href="https://100xbetter.ai" 
              target="_blank" 
              rel="noreferrer" 
              className="text-sm font-medium text-subtle hover:text-ink transition-colors"
            >
              by 100xbetter.ai
            </a>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Tracking AI companies strategies through their hiring data
          </p>
          <p className="mt-2 text-xs text-subtle">
            Data last scraped {lastUpdated}.
          </p>
        </div>
        <FilterBar
          companies={allCompanies.map((c: any) => ({
            slug: c.slug,
            name: c.name,
          }))}
          countries={countries}
        />
      </header>

      {/* --- Metric cards (Suggestions 3 & 5) --- */}
      <section className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          change={totalRolesChange}
          detail={`Tracked across ${apiCompanies.length} AI companies.`}
          href="/roles"
          label="Total open roles"
          value={totalOpenRoles.toLocaleString()}
        />
        <MetricCard
          change={wowChangeLabel}
          detail="Momentum is concentrated in infra, data center, and robotics."
          label={`${rangeLabel} change`}
          value={
            hasHistory
              ? `${Number(weightedWowChange) >= 0 ? "+" : ""}${weightedWowChange}%`
              : "N/A"
          }
        />
        <MetricCard
          change={
            fastestGrowingCompany.change_pct > 0
              ? `+${fastestGrowingCompany.change_pct}% this period`
              : "Monitoring"
          }
          detail={`${fastestGrowingCompany.name} leads open role count for this view.`}
          href={`/company/${fastestGrowingCompany.slug}`}
          label="Fastest growing company"
          value={fastestGrowingCompany.name}
        />
        {/* Suggestion 5: Momentum category replaces Fastest growing role */}
        <MetricCard
          change={
            topCategory.growth > 0
              ? `${topCategory.growth} open roles`
              : "Monitoring"
          }
          detail="The single category with the most active hiring right now."
          href={getRoleHref({ category: topCategory.category })}
          label="Momentum category"
          value={topCategory.category}
        />
        <MetricCard
          change={
            topLocation.roles > 0
              ? `${topLocation.roles} open roles`
              : "Monitoring"
          }
          detail={`${topLocation.topCompany} is the top hiring company here.`}
          href={getRoleHref({ country: topLocation.country })}
          label="Top hiring location"
          value={topLocation.country}
        />
      </section>

      {/* --- Where each company is placing its bets heatmap --- */}
      {heatmapData.matrix.length > 0 && (
        <section className="rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Where each company is placing its bets
              </h2>
              <p className="mt-1 text-xs text-muted">
                Role concentration by category. Darker cell = more roles.
              </p>
            </div>
            <Link className="shrink-0 text-xs font-medium text-accent hover:text-ink" href={betsHref}>
              Show all
            </Link>
          </div>
          <div className="p-4">
            <CategoryHeatmap
              companies={heatmapData.companies}
              matrix={heatmapData.matrix.slice(0, 8)}
            />
          </div>
        </section>
      )}

      {/* --- Company table --- */}
      <section className="mt-6">
        <div className="rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Surprising signals by company
              </h2>
              <p className="mt-1 text-xs text-muted">
                Unusual hiring patterns and what they may reveal.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Surprising signal</th>
                  <th className="px-4 py-3 font-medium">Evidence</th>
                  <th className="px-4 py-3 font-medium">What it may mean</th>
                  <th className="px-4 py-3 font-medium">Top category</th>
                  <th className="px-4 py-3 font-medium">{rangeLabel} change</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                </tr>
              </thead>
              <tbody>
                {rankedCompanies.map((company) => (
                  <tr
                    className="border-b border-line last:border-0 hover:bg-selected/60"
                    key={company.slug}
                  >
                    <td className="px-4 py-3">
                      <Link
                        className="flex items-center gap-2.5 font-medium text-ink"
                        href={`/company/${company.slug}`}
                      >
                        <CompanyLogo name={company.name} size={20} slug={company.slug} />
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const sig = unusualSignals[company.slug];
                        return sig ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            {sig.label}
                            <span className="font-normal opacity-70">({sig.count})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-subtle">
                            No unusual pattern detected yet
                          </span>
                        );
                      })()}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs leading-5 text-muted">
                      {unusualSignals[company.slug]?.evidence?.length ? (
                        unusualSignals[company.slug].evidence.join(", ")
                      ) : (
                        <span className="text-subtle">N/A</span>
                      )}
                    </td>
                    <td className="max-w-sm px-4 py-3 text-xs leading-5 text-muted">
                      {unusualSignals[company.slug]?.description || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-muted underline-offset-4 hover:text-ink hover:underline"
                        href={getRoleHref({
                          category: company.topGrowingCategory,
                          company: company.name,
                        })}
                      >
                        {company.topGrowingCategory}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-accent">
                      {company.wowChange >= 0 ? "+" : ""}
                      {company.wowChange}%
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {company.openRoles === 0 ? (
                        <span className="text-xs text-subtle">Pending</span>
                      ) : (
                        <Link
                          className="text-muted underline-offset-4 hover:text-ink hover:underline"
                          href={getRoleHref({ company: company.name })}
                        >
                          {company.openRoles}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mohamed's Read - commented out, re-enable when ready
        <aside>
          <MohamedsRead />
        </aside>
        */}
      </section>



      {/* --- Category bars + Locations --- */}
      <section className="grid gap-4 py-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              Role categories growing fastest
            </h2>
            <Link className="shrink-0 text-xs font-medium text-accent hover:text-ink" href={`/categories${detailQuery}`}>
              Show all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {apiCategories.slice(0, 8).map((item: any) => {
              return (
                <Link
                  className="grid grid-cols-[minmax(0,140px)_1fr_44px] items-center gap-3 text-sm sm:grid-cols-[160px_1fr_48px]"
                  href={getRoleHref({ category: item.category })}
                  key={item.category}
                >
                  <div className="truncate text-muted hover:text-ink">
                    {item.category}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-2 bg-teal-500"
                      style={{ width: `${(item.growth / maxCategoryGrowth) * 100}%` }}
                    />
                  </div>
                  <div className="text-right font-medium tabular-nums text-ink">
                    {item.growth}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              Top hiring locations
            </h2>
            <Link className="shrink-0 text-xs font-medium text-accent hover:text-ink" href={`/locations${detailQuery}`}>
              Show all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {displayedLocations.slice(0, 8).map((location: any) => (
              <Link
                className="grid grid-cols-[minmax(0,140px)_1fr_44px] items-center gap-3 text-sm sm:grid-cols-[160px_1fr_48px]"
                href={getRoleHref({ country: location.country })}
                key={location.country}
              >
                <div className="truncate text-muted hover:text-ink">
                  {location.country}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-2 bg-teal-500"
                    style={{
                      width: `${(location.roles / maxLocationRoles) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-right font-medium tabular-nums text-ink">
                  {location.roles}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      <footer className="border-t border-line py-5 text-xs leading-5 text-subtle">
        <a className="font-medium text-ink" href="#methodology" id="methodology">
          Methodology
        </a>
        : This prototype uses live data scraped from official company career
        pages. Categories and strategy signals are inferred and should be
        treated as directional, not official company statements.
      </footer>
    </main>
  );
}

function MohamedsRead() {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-hairline h-full">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-line pb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          M
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
            Mohamed&#39;s Read
          </div>
          <p className="mt-0.5 text-xs text-subtle">
            My personal take on what the hiring data actually signals.
          </p>
        </div>
      </div>

      {/* Opinion body */}
      <div className="mt-4 space-y-3 text-sm leading-6 text-ink">
        <p>
          The surge in senior engineering roles isn&#39;t just headcount. It&#39;s a bet on compound capability. When companies like OpenAI and Anthropic hire at the senior level, they&#39;re not filling seats, they&#39;re assembling the people who will define their next 3 years of product.
        </p>
        <p>
          The US concentration makes sense right now, but watch for it to shift. Compute costs and regulatory pressure are going to push more infra roles toward regions with favorable energy policy, including Canada, the Nordics, and the Gulf.
        </p>
        <p className="text-subtle">
          Updated manually · May 2025
        </p>
      </div>
    </div>
  );
}
