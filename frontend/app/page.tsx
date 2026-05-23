import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import {
  biggestLocationSpike,
  getRoleHref,
} from "@/lib/data";
import { getCompanies, getCategories, getLocations } from "@/lib/api";

const lastUpdated = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

export default async function Home() {
  const apiCompanies = await getCompanies();
  
  // Compute overall metrics
  const totalOpenRoles = apiCompanies.reduce((acc: number, c: any) => acc + c.current_roles, 0);
  const previousOpenRoles = apiCompanies.reduce((acc: number, c: any) => acc + c.previous_roles, 0);
  const totalChange = totalOpenRoles - previousOpenRoles;
  const weightedWowChange = previousOpenRoles > 0 ? ((totalChange / previousOpenRoles) * 100).toFixed(1) : 0;
  
  // Find fastest growing
  const fastestGrowingCompany = [...apiCompanies].sort((a, b) => b.change_pct - a.change_pct)[0] || apiCompanies[0] || { name: 'N/A', slug: '', change_pct: 0 };

  const rankedCompanies = [...apiCompanies].sort(
    (a, b) => b.change_pct - a.change_pct
  ).map(c => ({
    slug: c.slug,
    name: c.name,
    openRoles: c.current_roles,
    wowChange: c.change_pct,
    momChange: c.change_pct, // API only gives wow right now
    topGrowingCategory: "Engineering", // placeholder
    topHiringLocation: "Remote", // placeholder
    signal: "Active", // placeholder
  }));

  const apiCategories = await getCategories();
  const maxCategoryGrowth = Math.max(...apiCategories.map((item) => item.growth), 1);
  const fastestGrowingCategory = apiCategories[0] || { category: 'N/A', growth: 0 };

  const apiLocations = await getLocations();
  const maxLocationRoles = Math.max(...apiLocations.map((location) => location.roles), 1);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal text-ink">
              AI Hiring Signals
            </h1>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            Track where AI companies are hiring, what roles are growing, and what
            strategy it signals.
          </p>
          <p className="mt-2 text-xs text-muted">
            Prototype data last updated {lastUpdated}. Not live career-page counts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
            {["7D", "30D", "90D"].map((range) => (
              <button
                className={
                  range === "7D"
                    ? "bg-ink px-3 py-2 text-xs font-medium text-white"
                    : "px-3 py-2 text-xs font-medium text-muted hover:bg-stone-50"
                }
                key={range}
                type="button"
              >
                {range}
              </button>
            ))}
          </div>
          <select
            aria-label="Company filter"
            className="h-9 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink outline-none"
            defaultValue="All companies"
          >
            <option>All companies</option>
            {apiCompanies.map((company: any) => (
              <option key={company.slug}>{company.name}</option>
            ))}
          </select>
          <select
            aria-label="Location filter"
            className="h-9 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink outline-none"
            defaultValue="All locations"
          >
            <option>All locations</option>
            {apiLocations.map((location) => (
              <option key={location.country}>{location.country}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          change="Available after second scrape run"
          detail="Tracked across 12 major AI companies."
          href="/roles"
          label="Total open roles"
          value={totalOpenRoles.toLocaleString()}
        />
        <MetricCard
          change="Available after second scrape run"
          detail="Momentum is concentrated in infra, data center, and robotics."
          label="Week-over-week change"
          value={`+${weightedWowChange}%`}
        />
        <MetricCard
          change="Available after second scrape run"
          detail={`${fastestGrowingCompany.name} is expanding fastest this week.`}
          href={`/company/${fastestGrowingCompany.slug}`}
          label="Fastest growing company"
          value={fastestGrowingCompany.name}
        />
        <MetricCard
          change="Available after second scrape run"
          detail="Growth points to capacity constraints becoming strategic."
          href={getRoleHref({ category: fastestGrowingCategory.category })}
          label="Fastest growing role"
          value={fastestGrowingCategory.category}
        />
        <MetricCard
          change="Available after second scrape run"
          detail={`${biggestLocationSpike.topCompany} is driving the sharpest country move.`}
          href={getRoleHref({ country: biggestLocationSpike.country })}
          label="Biggest location spike"
          value={biggestLocationSpike.country}
        />
      </section>

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
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Open roles</th>
                  <th className="px-4 py-3 font-medium">WoW change</th>
                  <th className="px-4 py-3 font-medium">MoM change</th>
                  <th className="px-4 py-3 font-medium">Top growing category</th>
                  <th className="px-4 py-3 font-medium">Top hiring location</th>
                  <th className="px-4 py-3 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {rankedCompanies.map((company, index) => (
                  <tr
                    className="border-b border-line last:border-0 hover:bg-stone-50/70"
                    key={company.slug}
                  >
                    <td className="px-4 py-3">
                      <Link
                        className="flex items-center gap-3 font-medium text-ink"
                        href={`/company/${company.slug}`}
                      >
                        <span className="w-5 text-xs text-muted">
                          {index + 1}
                        </span>
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {company.openRoles === 0 ? (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-muted">Scraper pending</span>
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
                      +{company.wowChange}%
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink">
                      +{company.momChange}%
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-muted underline-offset-4 hover:text-ink hover:underline"
                        href={getRoleHref({
                          category: company.topGrowingCategory,
                          company: company.name
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
                          country: company.topHiringLocation
                        })}
                      >
                        {company.topHiringLocation}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                        {company.signal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <InsightCard
            href="#"
            label="Biggest spike this week"
            text="Available after second scrape run"
          />
          <InsightCard
            href="#"
            label="Most unusual new role"
            text="Available after second scrape run"
          />
          <InsightCard
            href="#"
            label="Geography shift"
            text="Available after second scrape run"
          />
        </aside>
      </section>

      <section className="grid gap-4 py-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">
            Role categories growing fastest
          </h2>
          <div className="mt-4 space-y-3">
            {apiCategories.map((item) => (
              <Link
                className="grid grid-cols-[150px_1fr_48px] items-center gap-3 text-sm"
                href={getRoleHref({ category: item.category })}
                key={item.category}
              >
                <div className="truncate text-muted hover:text-ink">
                  {item.category}
                </div>
                <div className="h-2 rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(item.growth / maxCategoryGrowth) * 100}%` }}
                  />
                </div>
                <div className="text-right font-medium tabular-nums text-ink">
                  {item.growth}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">Top hiring locations</h2>
          <div className="mt-4 divide-y divide-line">
            {apiLocations.map((location, index) => (
              (() => {
                const topCompany = apiCompanies.find(
                  (company: any) => company.name === location.topCompany
                );

                return (
              <div
                className="grid grid-cols-[22px_1fr_auto] items-center gap-3 py-2.5 text-sm"
                key={location.country}
              >
                <div className="text-xs text-muted">{index + 1}</div>
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
                        width: `${(location.roles / maxLocationRoles) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums text-ink">
                    {location.roles}
                  </div>
                  <div className="text-xs tabular-nums text-accent">
                    -
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-5 text-xs leading-5 text-muted">
        <a className="font-medium text-ink" href="#methodology" id="methodology">
          Methodology
        </a>
        : This prototype currently uses mock data to demonstrate the product
        experience. Production data should be collected from official company
        career pages or their underlying job-board APIs. Categories and strategy
        signals are inferred and should be treated as directional, not official
        company statements.
      </footer>
    </main>
  );
}

function InsightCard({
  href,
  label,
  text
}: {
  href: string;
  label: string;
  text: string;
}) {
  return (
    <Link
      className="block rounded-lg border border-line bg-white p-4 shadow-hairline transition hover:border-stone-300 hover:bg-stone-50/50"
      href={href}
    >
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold leading-7 text-ink">{text}</p>
    </Link>
  );
}
