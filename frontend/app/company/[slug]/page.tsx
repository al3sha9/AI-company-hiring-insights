import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkline } from "@/components/Sparkline";
import {
  getCompanyNotableRoles,
  getRoleHref,
} from "@/lib/data";
import { getCompanies, getCompany } from "@/lib/api";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
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
      title: `${company.name} - AI Hiring Signals`,
      description: "Active hiring pattern"
    };
  } catch (e) {
    return {
      title: "Company not found"
    };
  }
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  
  let company;
  try {
    company = await getCompany(slug);
  } catch (e) {
    notFound();
  }

  const notableRoles = getCompanyNotableRoles(company.name);
  
  const trendValues = company.snapshots.map((s: any) => s.total_open_roles);
  const locations = company.countries.map((c: any) => ({ label: c.country, count: c.count }));
  const categories = company.categories.map((c: any) => ({ label: c.category, count: c.count }));
  
  const maxLocationCount = Math.max(...locations.map((item: any) => item.count), 1);
  const maxCategoryCount = Math.max(...categories.map((item: any) => item.count), 1);
  
  const currentOpenRoles = trendValues.length > 0 ? trendValues[trendValues.length - 1] : 0;
  const previousOpenRoles = trendValues.length > 1 ? trendValues[0] : currentOpenRoles;
  const wowChange = previousOpenRoles > 0 ? Math.round(((currentOpenRoles - previousOpenRoles) / previousOpenRoles) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <Link className="text-sm font-medium text-muted hover:text-ink" href="/">
          Back to dashboard
        </Link>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-ink">
              {company.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Inferred strategy:{" "}
              <span className="font-medium text-ink">
                Active hiring
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              12-week open roles trend
            </div>
            <div className="mt-3 h-24">
              {trendValues.length > 0 ? <Sparkline values={trendValues} /> : null}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 py-5 sm:grid-cols-3">
        <Stat label="Open roles" value={currentOpenRoles.toLocaleString()} />
        <Stat label="WoW change" value={`+${wowChange}%`} />
        <Stat label="MoM change" value={`+${wowChange}%`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">Location breakdown</h2>
          <div className="mt-4 space-y-3">
            {locations.map((item) => (
              <MiniBar
                href={getRoleHref({
                  company: company.name,
                  country: item.label
                })}
                key={item.label}
                label={item.label}
                max={maxLocationCount}
                value={item.count}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <h2 className="text-base font-semibold text-ink">Category breakdown</h2>
          <div className="mt-4 space-y-3">
            {categories.map((item) => (
              <MiniBar
                href={getRoleHref({
                  category: item.label,
                  company: company.name
                })}
                key={item.label}
                label={item.label}
                max={maxCategoryCount}
                value={item.count}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Latest notable roles
              </h2>
              <p className="mt-1 text-xs text-muted">
                Click a title to open the company careers site.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
              Active
            </span>
          </div>
          <div className="mt-4 divide-y divide-line">
            {notableRoles.map((role) => (
              <div className="py-3" key={role.id ?? `${role.company}-${role.title}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <a
                      className="font-medium text-ink underline-offset-4 hover:underline"
                      href={role.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {role.title}
                    </a>
                    <div className="mt-1 text-xs text-muted">
                      {role.category} · {role.seniority}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted">
                    <div>{role.location}</div>
                    <div className="mt-1">{role.workMode}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-4 shadow-hairline">
        <h2 className="text-base font-semibold text-ink">Hiring signal</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {company.name} is showing a clear{" "}
          <span className="font-medium text-ink">Active</span> pattern:
          hiring is most visible in {categories[0]?.label || 'Engineering'},
          with the strongest location signal in {locations[0]?.label || 'Remote'}.
          Notable new role: {notableRoles[0]?.title || 'N/A'}.
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white shadow-hairline">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">
              All {company.name} roles
            </h2>
          </div>
          <Link
            className="shrink-0 text-xs font-medium text-accent hover:text-ink"
            href={getRoleHref({ company: company.name })}
          >
            Open filtered view
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Seniority</th>
              </tr>
            </thead>
            <tbody>
              {company.roles?.map((role: any, idx: number) => (
                <tr className="border-b border-line last:border-0 hover:bg-stone-50/70" key={idx}>
                  <td className="px-4 py-3 font-medium">
                    <a href={role.source_url} target="_blank" rel="noreferrer" className="text-ink hover:underline">
                      {role.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted">{role.category}</td>
                  <td className="px-4 py-3 text-muted">{role.location || role.country || "Unknown"}</td>
                  <td className="px-4 py-3 text-muted">{role.seniority}</td>
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
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function MiniBar({
  href,
  label,
  max,
  value
}: {
  href: string;
  label: string;
  max: number;
  value: number;
}) {
  return (
    <Link className="block text-sm" href={href}>
      <div className="flex items-center justify-between gap-4">
        <span className="truncate text-muted hover:text-ink">{label}</span>
        <span className="font-medium tabular-nums text-ink">{value}</span>
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
