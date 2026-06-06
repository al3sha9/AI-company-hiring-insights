import type { Metadata } from "next";
import {
  getCategories,
  getCategoryMatrix,
  getCompanies,
  getLocations,
  getRoles,
  getUnusualSignals,
} from "@/lib/api";

export const metadata: Metadata = {
  title: "AI Insights Embed",
  description: "Embed preview for AI hiring strategy signals.",
  robots: {
    index: false,
    follow: true,
  },
};

const FULL_APP_URL = "https://ai-insights.100xbetter.ai";

type Signal = {
  label: string;
  count: number;
  description: string;
  evidence: string[];
};

export default async function EmbedPage() {
  const days = 7;
  const [companies, categories, locations, heatmapData, unusualSignals, rolesPage] =
    await Promise.all([
      getCompanies({ days }).catch(() => []),
      getCategories({ days }).catch(() => []),
      getLocations({ days }).catch(() => []),
      getCategoryMatrix({ days }).catch(() => ({ companies: [], matrix: [] })),
      getUnusualSignals({ days }).catch(() => ({} as Record<string, Signal>)),
      getRoles({ days, limit: 6, offset: 0 }).catch(() => ({
        roles: [],
        total: 0,
        limit: 6,
        offset: 0,
        hasMore: false,
        nextOffset: null,
        facets: { company: [], category: [], country: [] },
      })),
    ]);

  const topCompanies = [...companies]
    .sort((a: any, b: any) => b.current_roles - a.current_roles)
    .slice(0, 5);
  const topCategories = categories.slice(0, 5);
  const topLocations = locations.slice(0, 5);
  const heatmapCompanies = heatmapData.companies.slice(0, 7);
  const heatmapRows = heatmapData.matrix.slice(0, 6);
  const maxCategory = Math.max(...topCategories.map((item: any) => item.growth), 1);
  const maxLocation = Math.max(...topLocations.map((item: any) => item.roles), 1);

  const signals = topCompanies
    .map((company: any) => ({
      company,
      signal: unusualSignals[company.slug],
    }))
    .filter((item: any) => item.signal)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#f5f5f5] p-4 text-ink">
      <div className="mx-auto grid max-w-[1200px] gap-3">
        <section className="rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h1 className="text-base font-semibold text-ink">
                Where each company is placing its bets
              </h1>
              <p className="mt-1 text-xs text-muted">
                Hiring concentration by company and category. Darker cells show the strongest current focus.
              </p>
            </div>
            <a
              className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:bg-selected"
              href={FULL_APP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open AI Insights
            </a>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line uppercase tracking-[0.08em] text-muted">
                  <th className="py-2 pr-4 font-medium">Company</th>
                  {heatmapRows.map((row: any) => (
                    <th className="px-1 py-2 text-center font-medium" key={row.category}>
                      {row.category}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-medium">Roles</th>
                </tr>
              </thead>
              <tbody>
                {heatmapCompanies.map((company: string) => {
                  const companyMax = Math.max(
                    ...heatmapRows.map((row: any) => row.companies[company] || 0),
                    1
                  );
                  const total = heatmapRows.reduce(
                    (sum: number, row: any) => sum + (row.companies[company] || 0),
                    0
                  );

                  return (
                    <tr className="border-t border-line" key={company}>
                      <td className="py-2 pr-4 font-medium text-ink">{shortCompany(company)}</td>
                      {heatmapRows.map((row: any) => {
                        const count = row.companies[company] || 0;
                        return (
                          <td className="px-1 py-1.5" key={row.category}>
                            <div
                              className={`flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums ${heatCellClass(count, companyMax)}`}
                            >
                              {count || "N/A"}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2 pl-3 text-right font-medium tabular-nums text-ink">
                        {total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_0.9fr_1.1fr]">
          <Panel title="Company signal detection">
            <div className="grid gap-2">
              {signals.length ? (
                signals.map(({ company, signal }: any) => (
                  <div className="rounded-md bg-stone-50 px-3 py-2" key={company.slug}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-ink">{company.name}</div>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        {signal.count} roles
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-ink">{signal.label}</div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                      {signal.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-subtle">No unusual signals available yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Filtered role explorer">
            <div className="divide-y divide-line">
              {rolesPage.roles.slice(0, 4).map((role: any) => (
                <a
                  className="block py-2 hover:bg-selected/50"
                  href={role.sourceUrl || FULL_APP_URL}
                  key={role.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="truncate text-xs font-medium text-ink">{role.title}</div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted">
                    <span className="truncate">
                      {role.company} · {role.category}
                    </span>
                    <span className="shrink-0">{role.country}</span>
                  </div>
                </a>
              ))}
            </div>
          </Panel>

          <Panel title="Trend view">
            <div className="grid gap-3 sm:grid-cols-3">
              <TrendList
                items={topCompanies.slice(0, 4).map((company: any) => ({
                  label: company.name,
                  value: company.current_roles,
                }))}
                title="Company"
              />
              <TrendList
                items={topCategories.slice(0, 4).map((category: any) => ({
                  label: category.category,
                  value: category.growth,
                  max: maxCategory,
                }))}
                title="Category"
              />
              <TrendList
                items={topLocations.slice(0, 4).map((location: any) => ({
                  label: location.country,
                  value: location.roles,
                  max: maxLocation,
                }))}
                title="Location"
              />
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 shadow-hairline">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function TrendList({
  items,
  title,
}: {
  items: Array<{ label: string; value: number; max?: number }>;
  title: string;
}) {
  const max = Math.max(...items.map((item) => item.max || item.value), 1);

  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">
        {title}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-muted">{item.label}</span>
              <span className="font-medium tabular-nums text-ink">
                {item.value.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-1.5 rounded-full bg-teal-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortCompany(name: string) {
  return name.replace(" AI", "").replace("Microsoft", "MSFT");
}

function heatCellClass(count: number, max: number) {
  if (count === 0) return "bg-stone-50 text-subtle";
  const ratio = count / max;
  if (ratio < 0.25) return "bg-teal-50 text-teal-700";
  if (ratio < 0.5) return "bg-teal-100 text-teal-800";
  if (ratio < 0.75) return "bg-teal-200 text-teal-900";
  return "bg-teal-500 text-white";
}
