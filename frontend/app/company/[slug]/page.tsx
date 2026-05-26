import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkline } from "@/components/Sparkline";
import { CompanyLogo } from "@/components/CompanyLogo";
import { getRoleHref } from "@/lib/data";
import { getCompanies, getCompany } from "@/lib/api";

type CompanyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const companies = await getCompanies();
  return companies.map((company: any) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: CompanyPageProps) {
  const { slug } = await params;
  try {
    const company = await getCompany(slug);
    return {
      title: `${company.name} - AI Insights`,
      description: `Hiring signal analysis for ${company.name}.`,
    };
  } catch {
    return { title: "Company not found" };
  }
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;

  let company: any;
  try {
    company = await getCompany(slug);
  } catch {
    notFound();
  }

  const roles: any[] = company.roles || [];
  const trendValues: number[] = company.snapshots.map((s: any) => s.total_open_roles);
  const locations = company.countries.map((c: any) => ({ label: c.country, count: c.count }));
  const categories = company.categories.map((c: any) => ({ label: c.category, count: c.count }));

  const maxLocationCount = Math.max(...locations.map((i: any) => i.count), 1);
  const maxCategoryCount = Math.max(...categories.map((i: any) => i.count), 1);
  const totalCategoryRoles = categories.reduce((acc: number, c: any) => acc + c.count, 0) || 1;
  const totalLocationRoles = locations.reduce((acc: number, l: any) => acc + l.count, 0) || 1;

  const currentOpenRoles = trendValues.at(-1) ?? 0;
  const previousOpenRoles = trendValues.length > 1 ? trendValues[0] : currentOpenRoles;
  const wowChange =
    previousOpenRoles > 0
      ? Math.round(((currentOpenRoles - previousOpenRoles) / previousOpenRoles) * 100)
      : 0;

  // Work mode breakdown
  const workModeCounts: Record<string, number> = {};
  for (const role of roles) {
    const mode = role.work_mode || "Unknown";
    workModeCounts[mode] = (workModeCounts[mode] || 0) + 1;
  }
  const workModeEntries = Object.entries(workModeCounts).sort((a, b) => b[1] - a[1]);

  // Seniority breakdown
  const SENIOR = new Set(["Senior", "Staff", "Lead", "Principal", "Director"]);
  const JUNIOR = new Set(["Junior", "Associate", "Entry", "Intern"]);
  let seniorCount = 0, midCount = 0, juniorCount = 0;
  for (const role of roles) {
    const s = role.seniority || "";
    if (SENIOR.has(s)) seniorCount++;
    else if (JUNIOR.has(s)) juniorCount++;
    else midCount++;
  }
  const total = roles.length || 1;
  const seniorPct = Math.round((seniorCount / total) * 100);
  const midPct = Math.round((midCount / total) * 100);
  const juniorPct = Math.round((juniorCount / total) * 100);

  // Top 5 most recent roles from real API data
  const recentRoles = [...roles]
    .sort((a, b) => (b.last_seen_at || "").localeCompare(a.last_seen_at || ""))
    .slice(0, 5);

  // Signal label + narrative
  const signalLabel = seniorPct > 55 ? "Build" : seniorPct > 35 ? "Scale" : "Growth";
  const signalVerb =
    seniorPct > 55 ? "capability building" : seniorPct > 35 ? "scaling known bets" : "broad growth hiring";
  const topCategory = categories[0]?.label || "Engineering";
  const topCategoryPct = Math.round(((categories[0]?.count || 0) / totalCategoryRoles) * 100);
  const topLocation = locations[0]?.label || "US";
  const topLocationPct = Math.round(((locations[0]?.count || 0) / totalLocationRoles) * 100);
  const remotePct =
    roles.length > 0 ? Math.round(((workModeCounts["Remote"] || 0) / roles.length) * 100) : 0;

  const narrative =
    roles.length > 0
      ? `${company.name} is concentrating ${topCategoryPct}% of open roles in ${topCategory}, with ${topLocationPct}% of positions based in ${topLocation}. ${seniorPct}% of roles are senior-level, a signal of ${signalVerb}.${remotePct > 0 ? ` ${remotePct}% of roles are offered remotely.` : ""}`
      : "Run the scraper to generate a hiring signal for this company.";

  return (
    <main className="mx-auto min-h-screen max-w-8xl px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      {/* Header */}
      <header className="border-b border-line pb-5">
        <Link className="text-sm font-medium text-muted hover:text-ink" href="/">
          Back to dashboard
        </Link>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <CompanyLogo name={company.name} size={36} slug={slug} />
              <h1 className="text-2xl font-semibold tracking-normal text-ink">
                {company.name}
              </h1>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                {signalLabel}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{narrative}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Open roles trend
            </div>
            <div className="mt-3 h-24">
              {trendValues.length > 0 ? (
                <Sparkline values={trendValues} />
              ) : (
                <div className="flex h-full items-center text-xs text-subtle">
                  No snapshot data yet
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
        <Stat label="Open roles" value={currentOpenRoles.toLocaleString()} />
        <Stat
          label="WoW change"
          value={trendValues.length > 1 ? `${wowChange >= 0 ? "+" : ""}${wowChange}%` : "N/A"}
        />
        <Stat label="Roles on record" value={roles.length.toLocaleString()} />
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
            Work mode
          </div>
          <div className="mt-3 space-y-1.5">
            {workModeEntries.length > 0 ? (
              workModeEntries.map(([mode, count]) => (
                <div key={mode} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{mode}</span>
                  <span className="font-medium tabular-nums text-ink">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-subtle">N/A</span>
            )}
          </div>
        </div>
      </section>

      {/* Seniority split bar */}
      {roles.length > 0 && (
        <div className="mb-4 rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Seniority mix
            </div>
            <div className="flex items-center gap-4 text-xs text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
                Senior {seniorPct}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-200" />
                Mid {midPct}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-stone-200" />
                Junior {juniorPct}%
              </span>
            </div>
          </div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${seniorPct}%` }} />
            <div className="h-full bg-teal-200 transition-all" style={{ width: `${midPct}%` }} />
            <div className="h-full bg-stone-200 transition-all" style={{ width: `${juniorPct}%` }} />
          </div>
        </div>
      )}

      {/* Location + Category + Latest roles */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">Location breakdown</h2>
          <div className="mt-4 space-y-3">
            {locations.map((item: any) => (
              <MiniBar
                href={getRoleHref({ company: company.name, country: item.label })}
                key={item.label}
                label={item.label}
                max={maxLocationCount}
                pct={Math.round((item.count / totalLocationRoles) * 100)}
                value={item.count}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">Category breakdown</h2>
          <div className="mt-4 space-y-3">
            {categories.map((item: any) => (
              <MiniBar
                href={getRoleHref({ category: item.label, company: company.name })}
                key={item.label}
                label={item.label}
                max={maxCategoryCount}
                pct={Math.round((item.count / totalCategoryRoles) * 100)}
                value={item.count}
              />
            ))}
          </div>
        </div>

        {/* Latest roles - real API data, no more mock */}
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Latest roles</h2>
              <p className="mt-1 text-xs text-muted">
                Most recently seen. Click to open careers page.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
              {signalLabel}
            </span>
          </div>
          <div className="mt-4 divide-y divide-line">
            {recentRoles.length > 0 ? (
              recentRoles.map((role: any, idx: number) => (
                <div className="py-3" key={`${role.source_url}-${idx}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <a
                        className="font-medium text-ink underline-offset-4 hover:underline"
                        href={role.source_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {role.title}
                      </a>
                      <div className="mt-1 text-xs text-muted">
                        {role.category}
                        {role.seniority ? ` · ${role.seniority}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-subtle">
                      <div>{role.location || role.country || ""}</div>
                      {role.work_mode && <div className="mt-0.5">{role.work_mode}</div>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-3 text-xs text-subtle">
                No roles on record yet. Run the scraper.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Full roles table */}
      <section className="mt-4 rounded-lg border border-line bg-white shadow-hairline">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">All {company.name} roles</h2>
            <p className="mt-1 text-xs text-muted">{roles.length} roles on record</p>
          </div>
          <Link
            className="shrink-0 text-xs font-medium text-accent hover:text-ink"
            href={getRoleHref({ company: company.name })}
          >
            Open filtered view
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Seniority</th>
                <th className="px-4 py-3 font-medium">Work mode</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role: any, idx: number) => (
                <tr
                  className="border-b border-line last:border-0 hover:bg-selected/60"
                  key={idx}
                >
                  <td className="px-4 py-3 font-medium">
                    <a
                      className="text-ink underline-offset-4 hover:underline"
                      href={role.source_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {role.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted">{role.category || "N/A"}</td>
                  <td className="px-4 py-3 text-muted">
                    {role.location || role.country || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-muted">{role.seniority || "N/A"}</td>
                  <td className="px-4 py-3 text-muted">{role.work_mode || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function MiniBar({
  href,
  label,
  max,
  pct,
  value,
}: {
  href: string;
  label: string;
  max: number;
  pct: number;
  value: number;
}) {
  return (
    <Link className="block text-sm" href={href}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-muted hover:text-ink">{label}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs tabular-nums text-subtle">{pct}%</span>
          <span className="w-8 text-right font-medium tabular-nums text-ink">{value}</span>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-stone-100">
        <div
          className="h-1.5 rounded-full bg-accent"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </Link>
  );
}
