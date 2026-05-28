import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { CategoryHeatmap } from "@/components/CategoryHeatmap";
import { CompanyLogo } from "@/components/CompanyLogo";
import { getBriefing } from "@/lib/api";

type HomeProps = {
  searchParams: Promise<{
    company?: string;
    country?: string;
    range?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const filters = await searchParams;
  const briefing = await getBriefing();

  const lastUpdated = briefing.lastUpdated
    ? new Date(briefing.lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Not yet scraped";

  const companies = briefing.companies.map((company) => ({
    slug: company.slug,
    name: company.name,
  }));
  const countries = briefing.locations.map((location) => location.country);

  const strategicMoves = filters.company
    ? briefing.strategicMoves.filter((move) => move.company === filters.company)
    : briefing.strategicMoves;

  return (
    <main className="mx-auto min-h-screen max-w-8xl px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      <header className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-2xl font-semibold tracking-normal text-ink">
              AI Hiring Signals
            </h1>
            <a
              href="https://100xbetter.ai"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-subtle transition-colors hover:text-ink"
            >
              by 100xbetter.ai
            </a>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Strategy intelligence from the roles AI companies are actively
            hiring for.
          </p>
          <p className="mt-2 text-xs text-subtle">
            Data last scraped {lastUpdated}.
          </p>
        </div>
        <FilterBar companies={companies} countries={countries} />
      </header>

      <section className="py-5">
        <div className="rounded-lg border border-line bg-white p-5 shadow-hairline">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
            Competitive brief
          </div>
          <p className="mt-3 max-w-5xl text-lg leading-8 text-ink">
            {briefing.marketRead}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-muted">
              {briefing.summary.totalOpenRoles.toLocaleString()} active roles
            </span>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-muted">
              {briefing.summary.trackedCompanies} companies tracked
            </span>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-muted">
              Updated {lastUpdated}
            </span>
          </div>
        </div>
      </section>

      {/*
        Hidden for now: generic metric cards added noise for CEO/investor users.
        The brief and signal cards already cover what matters.
      <section className="grid gap-3 pb-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          change={
            briefing.summary.hasHistory
              ? `${briefing.summary.totalChange >= 0 ? "+" : ""}${briefing.summary.totalChange} roles`
              : "Needs 2 scrapes"
          }
          href="/roles"
          label="Total active roles"
          value={briefing.summary.totalOpenRoles.toLocaleString()}
        />
        <MetricCard
          change="Current mix"
          href={getRoleHref({ category: briefing.categories[0]?.category })}
          label="Momentum category"
          value={briefing.categories[0]?.category || "N/A"}
        />
        <MetricCard
          change={`${briefing.summary.topLocation.roles || 0} active roles`}
          href={getRoleHref({ country: briefing.summary.topLocation.country })}
          label="Top hiring location"
          value={briefing.summary.topLocation.country}
        />
        <MetricCard
          change={
            briefing.summary.hasHistory
              ? `${briefing.summary.weightedChangePct >= 0 ? "+" : ""}${briefing.summary.weightedChangePct}%`
              : "Not enough history"
          }
          label="Hiring momentum"
          value="Period change"
        />
      </section>
      */}

      {briefing.unusualCards.length > 0 && (
        <section className="pb-5">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-ink">
              Moves to watch
            </h2>
            <p className="mt-1 text-xs text-muted">
              Non-standard hiring patterns that may reveal competitor direction
              before announcements.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {briefing.unusualCards.slice(0, 3).map((signal) => (
              <article
                className="rounded-lg border border-line bg-white p-4 shadow-hairline"
                key={`${signal.slug}-${signal.label}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
                      {signal.company}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-ink">
                      {signal.label}
                    </h3>
                  </div>
                  <span className="max-w-[220px] rounded-full bg-amber-50 px-2.5 py-1 text-right text-xs font-medium text-amber-800">
                    {signal.evidence}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {signal.description}
                </p>
                <div className="mt-4 space-y-2">
                  {signal.examples.map((role) => (
                    <a
                      className="block truncate text-xs font-medium text-ink underline-offset-4 hover:underline"
                      href={role.sourceUrl}
                      key={role.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {role.title}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-line bg-white shadow-hairline">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Competitor moves
            </h2>
            <p className="mt-1 text-xs text-muted">
              What each company appears to be building toward, backed by role
              evidence.
            </p>
          </div>
          <span className="text-xs font-medium text-accent">
            Evidence first
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Move</th>
                <th className="px-4 py-3 font-medium">Evidence</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Why CEO cares</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {strategicMoves.map((move, index) => (
                <tr
                  className="border-b border-line last:border-0 hover:bg-selected/60"
                  key={move.slug}
                >
                  <td className="px-4 py-3">
                    <Link
                      className="flex items-center gap-2.5 font-medium text-ink"
                      href={`/company/${move.slug}`}
                    >
                      <span className="w-5 text-xs text-subtle">{index + 1}</span>
                      <CompanyLogo name={move.company} size={20} slug={move.slug} />
                      {move.company}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{move.move}</td>
                  <td className="px-4 py-3 text-muted">
                    <div>{move.evidence}</div>
                    {(move.evidenceExamples ?? []).length > 0 && (
                      <div className="mt-1 space-y-0.5 text-xs text-subtle">
                        {(move.evidenceExamples ?? []).slice(0, 2).map((example) => (
                          <div className="max-w-xs truncate" key={example}>
                            {example}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{move.changeLabel}</td>
                  <td className="max-w-md px-4 py-3 text-muted">
                    {move.investorRead}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                      {move.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {briefing.heatmap.matrix.length > 0 && (
        <section className="rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Company bet map
              </h2>
              <p className="mt-1 text-xs text-muted">
                Where AI companies are placing hiring concentration by
                category.
              </p>
            </div>
          </div>
          <div className="p-4">
            <CategoryHeatmap
              companies={briefing.heatmap.companies}
              matrix={briefing.heatmap.matrix}
            />
          </div>
        </section>
      )}

      {/*
        Hidden for now: category and geography tables are supporting data, not
        first-screen competitive intelligence. Bring back when they show deltas.
      <section className="grid gap-4 py-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">
            Category momentum
          </h2>
          <div className="mt-4 space-y-4">
            {briefing.categoryMomentum.map((item) => {
              const total = item.senior + item.mid + item.junior || item.count || 1;
              const seniorWidth = (item.senior / total) * 100;
              const midWidth = (item.mid / total) * 100;
              const juniorWidth = (item.junior / total) * 100;
              const countWidth = (item.count / maxCategoryCount) * 100;
              return (
                <Link
                  className="block"
                  href={getRoleHref({ category: item.category })}
                  key={item.category}
                >
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-ink">{item.category}</span>
                    <span className="tabular-nums text-muted">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-stone-100">
                    <div
                      className="flex h-2 overflow-hidden rounded-full"
                      style={{ width: `${countWidth}%` }}
                    >
                      <div className="h-2 bg-teal-500" style={{ width: `${seniorWidth}%` }} />
                      <div className="h-2 bg-teal-200" style={{ width: `${midWidth}%` }} />
                      <div className="h-2 bg-teal-50" style={{ width: `${juniorWidth}%` }} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {item.interpretation}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">
            Geographic expansion
          </h2>
          <div className="mt-4 divide-y divide-line">
            {displayedLocations.map((location, index) => (
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
                    <span className="text-xs text-muted">{location.topCompany}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-stone-100">
                    <div
                      className="h-1.5 rounded-full bg-accent"
                      style={{ width: `${(location.roles / maxLocationRoles) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right font-medium tabular-nums text-ink">
                  {location.roles}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      <footer className="border-t border-line py-5 text-xs leading-5 text-subtle">
        <a className="font-medium text-ink" href="#methodology" id="methodology">
          Methodology
        </a>
        : This product uses live data scraped from official company career
        pages. Categories and strategy signals are inferred and should be
        treated as directional, not official company statements.
      </footer>
    </main>
  );
}
