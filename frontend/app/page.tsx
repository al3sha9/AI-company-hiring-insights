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
  getCategorySeniority,
  getUnusualSignals,
} from "@/lib/api";

type HomeProps = {
  searchParams: Promise<{
    company?: string;
    country?: string;
    range?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const filters = await searchParams;

  // Two-wave fetch: critical data first, enrichment second.
  // Prevents macOS socket saturation (EAGAIN/Errno 35) from 6 simultaneous
  // Supabase connections firing at once.
  const [apiCompanies, apiCategories, apiLocations] = await Promise.all([
    getCompanies(),
    getCategories(),
    getLocations(),
  ]);

  const [heatmapData, seniority, unusualSignals] = await Promise.all([
    getCategoryMatrix().catch(() => ({ companies: [], matrix: [] })),
    getCategorySeniority().catch(() => []),
    getUnusualSignals().catch(() => ({})),
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
    ? "Needs 2 scrapes 7+ days apart"
    : totalChange >= 0
    ? `+${totalChange} roles vs prior period`
    : `${totalChange} roles vs prior period`;

  const totalRolesChange =
    totalChange === 0 && !hasHistory
      ? "Refresh after 7+ days for change data"
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

  let rankedCompanies = [...apiCompanies]
    .sort((a, b) => b.change_pct - a.change_pct)
    .map((c: any) => ({
      slug: c.slug,
      name: c.name,
      openRoles: c.current_roles,
      wowChange: c.change_pct,
      topGrowingCategory: "Engineering",
      topHiringLocation: "Remote",
      signal: "Active",
    }));

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

  const countries = apiLocations.map((l: any) => l.country);

  // --- Suggestion 3: seniority lookup per category ---
  const seniorityMap = new Map(seniority.map((s: any) => [s.category, s]));
  const topCatSeniority = seniorityMap.get(topCategory.category) as
    | { senior_pct: number }
    | undefined;

  // --- Suggestion 2: Narrative insight card text ---
  const insight1 =
    topCategory.category !== "N/A"
      ? `${topCategory.category} leads with ${topCategory.growth} open roles across all ${apiCompanies.length} tracked companies.`
      : "Run the scraper to populate signals.";

  const insight2 =
    topCatSeniority && topCatSeniority.senior_pct > 0
      ? `${topCategory.category} hiring is ${topCatSeniority.senior_pct}% senior-level — a signal of committed capability building, not just headcount scaling.`
      : fastestGrowingCompany.name !== "N/A"
      ? `${fastestGrowingCompany.name} leads open role count with ${fastestGrowingCompany.current_roles} positions across all categories.`
      : "Run the scraper to populate signals.";

  const insight3 =
    topLocation.country !== "N/A"
      ? `${topLocation.country} is the top hiring destination with ${topLocation.roles} open roles. ${topLocation.topCompany} leads the region.`
      : "Run the scraper to populate signals.";

  return (
    <main className="mx-auto min-h-screen max-w-8xl px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      <header className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-2xl font-semibold tracking-normal text-ink">
              AI Hiring Signals
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
            Track where AI companies are hiring, what roles are growing, and
            what strategy it signals.
          </p>
          <p className="mt-2 text-xs text-subtle">
            Data last scraped {lastUpdated}.
          </p>
        </div>
        <FilterBar
          companies={apiCompanies.map((c: any) => ({
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
          label="Week-over-week change"
          value={
            hasHistory
              ? `${Number(weightedWowChange) >= 0 ? "+" : ""}${weightedWowChange}%`
              : "—"
          }
        />
        <MetricCard
          change={
            fastestGrowingCompany.change_pct > 0
              ? `+${fastestGrowingCompany.change_pct}% this period`
              : "Monitoring"
          }
          detail={`${fastestGrowingCompany.name} leads open role count this week.`}
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

      {/* --- Company table + Insight cards --- */}
      <section className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Who is hiring fastest?
              </h2>
              <p className="mt-1 text-xs text-muted">
                Ranked by 7-day open role growth.
              </p>
            </div>
            <span className="text-xs font-medium text-accent">
              Strategy signal first
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Open roles</th>
                  <th className="px-4 py-3 font-medium">WoW change</th>
                  <th className="px-4 py-3 font-medium">Top growing category</th>
                  <th className="px-4 py-3 font-medium">Top hiring location</th>
                  <th className="px-4 py-3 font-medium">Unusual signal</th>
                </tr>
              </thead>
              <tbody>
                {rankedCompanies.map((company, index) => (
                  <tr
                    className="border-b border-line last:border-0 hover:bg-selected/60"
                    key={company.slug}
                  >
                    <td className="px-4 py-3">
                      <Link
                        className="flex items-center gap-2.5 font-medium text-ink"
                        href={`/company/${company.slug}`}
                      >
                        <span className="w-5 text-xs text-subtle">
                          {index + 1}
                        </span>
                        <CompanyLogo name={company.name} size={20} slug={company.slug} />
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {company.openRoles === 0 ? (
                        <span className="rounded-full bg-selected px-2.5 py-1 text-xs text-muted">
                          Scraper pending
                        </span>
                      ) : (
                        <Link
                          className="font-medium text-ink underline-offset-4 hover:underline"
                          href={getRoleHref({ company: company.name })}
                        >
                          {company.openRoles}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-accent">
                      {company.wowChange >= 0 ? "+" : ""}
                      {company.wowChange}%
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
                    <td className="px-4 py-3">
                      <Link
                        className="text-muted underline-offset-4 hover:text-ink hover:underline"
                        href={getRoleHref({
                          company: company.name,
                          country: company.topHiringLocation,
                        })}
                      >
                        {company.topHiringLocation}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const sig = unusualSignals[company.slug];
                        return sig ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                              {sig.label}
                              <span className="font-normal opacity-70">({sig.count})</span>
                            </span>
                            <p className="mt-1 text-xs text-subtle">{sig.description}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-subtle">—</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suggestion 2: Narrative insight cards */}
        <aside className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <InsightCard
            href={getRoleHref({ category: topCategory.category })}
            label="What jumped this week"
            text={insight1}
          />
          <InsightCard
            href={getRoleHref({ category: topCategory.category })}
            label="Strongest signal"
            text={insight2}
          />
          <InsightCard
            href={getRoleHref({ country: topLocation.country })}
            label="Where the map is shifting"
            text={insight3}
          />
        </aside>
      </section>

      {/* --- Suggestion 4: Category × Company heatmap --- */}
      {heatmapData.matrix.length > 0 && (
        <section className="mt-4 rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Where each company is placing its bets
              </h2>
              <p className="mt-1 text-xs text-muted">
                Role concentration by category. Darker cell = more roles.
              </p>
            </div>
          </div>
          <div className="p-4">
            <CategoryHeatmap
              companies={heatmapData.companies}
              matrix={heatmapData.matrix}
            />
          </div>
        </section>
      )}

      {/* --- Category bars + Locations --- */}
      <section className="grid gap-4 py-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              Role categories growing fastest
            </h2>
            <div className="flex items-center gap-3 text-xs text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
                Senior
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-200" />
                Mid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-50 border border-teal-200" />
                Junior
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {apiCategories.map((item: any) => {
              const sen = seniorityMap.get(item.category) as
                | { senior: number; mid: number; junior: number; total: number }
                | undefined;
              const total = sen?.total || item.growth || 1;
              const seniorW = sen ? (sen.senior / total) * 100 : 0;
              const midW = sen ? (sen.mid / total) * 100 : 100;
              const juniorW = sen ? (sen.junior / total) * 100 : 0;
              return (
                <Link
                  className="grid grid-cols-[minmax(0,140px)_1fr_44px] items-center gap-3 text-sm sm:grid-cols-[160px_1fr_48px]"
                  href={getRoleHref({ category: item.category })}
                  key={item.category}
                >
                  <div className="truncate text-muted hover:text-ink">
                    {item.category}
                  </div>
                  {/* Suggestion 3: split bar */}
                  <div className="flex h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-2 bg-teal-500"
                      style={{ width: `${seniorW}%` }}
                    />
                    <div
                      className="h-2 bg-teal-200"
                      style={{ width: `${midW}%` }}
                    />
                    <div
                      className="h-2 bg-teal-50"
                      style={{ width: `${juniorW}%` }}
                    />
                  </div>
                  {/* Suggestion 1: count pill */}
                  <div className="text-right font-medium tabular-nums text-ink">
                    {item.growth}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">
            Top hiring locations
          </h2>
          <div className="mt-4 divide-y divide-line">
            {displayedLocations.map((location: any, index: number) => {
              const topCompany = apiCompanies.find(
                (company: any) => company.name === location.topCompany
              );
              return (
                <div
                  className="grid grid-cols-[22px_1fr_auto] items-center gap-3 py-2.5 text-sm"
                  key={location.country}
                >
                  <div className="text-xs text-subtle">{index + 1}</div>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        className="font-medium text-ink underline-offset-4 hover:underline"
                        href={getRoleHref({ country: location.country })}
                      >
                        {location.country}
                      </Link>
                      {topCompany ? (
                        <Link
                          className="text-xs text-muted hover:text-ink"
                          href={`/company/${topCompany.slug}`}
                        >
                          {location.topCompany}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted">
                          {location.topCompany}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-stone-100">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{
                          width: `${(location.roles / maxLocationRoles) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium tabular-nums text-ink">
                      {location.roles}
                    </div>
                  </div>
                </div>
              );
            })}
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

function InsightCard({
  href,
  label,
  text,
}: {
  href: string;
  label: string;
  text: string;
}) {
  return (
    <Link
      className="block rounded-lg border border-line bg-white p-4 shadow-hairline transition hover:border-stone-300 hover:bg-selected/50"
      href={href}
    >
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-ink">{text}</p>
    </Link>
  );
}
