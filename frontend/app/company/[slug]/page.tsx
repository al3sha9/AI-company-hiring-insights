import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleTable } from "@/components/RoleTable";
import { Sparkline } from "@/components/Sparkline";
import {
  companies,
  getCompany,
  getCompanyNotableRoles,
  getCompanyRoles,
  getRoleHref,
  getCompanyTrend,
  summarizeRoles
} from "@/lib/data";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = getCompany(slug);

  if (!company) {
    return {
      title: "Company not found"
    };
  }

  return {
    title: `${company.name} - AI Hiring Signals`,
    description: company.inferredStrategy
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = getCompany(slug);

  if (!company) {
    notFound();
  }

  const companyRoles = getCompanyRoles(company.name);
  const notableRoles = getCompanyNotableRoles(company.name);
  const trend = getCompanyTrend(company.name);
  const locations = summarizeRoles(companyRoles, "country");
  const categories = summarizeRoles(companyRoles, "category");
  const maxLocationCount = Math.max(...locations.map((item) => item.count), 1);
  const maxCategoryCount = Math.max(...categories.map((item) => item.count), 1);

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
                {company.inferredStrategy}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              12-week open roles trend
            </div>
            <div className="mt-3 h-24">
              {trend ? <Sparkline values={trend.values} /> : null}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 py-5 sm:grid-cols-3">
        <Stat label="Open roles" value={company.openRoles.toLocaleString()} />
        <Stat label="WoW change" value={`+${company.wowChange}%`} />
        <Stat label="MoM change" value={`+${company.momChange}%`} />
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
              {company.signal}
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
          <span className="font-medium text-ink">{company.signal}</span> pattern:
          hiring is most visible in {company.topGrowingCategory.toLowerCase()},
          with the strongest location signal in {company.topHiringLocation}.
          Notable new role: {company.notableRole}.
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white shadow-hairline">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">
              All {company.name} roles
            </h2>
            <p className="mt-1 text-xs text-muted">
              Mock inventory behind the {company.openRoles.toLocaleString()} prototype
              open roles count.
            </p>
          </div>
          <Link
            className="shrink-0 text-xs font-medium text-accent hover:text-ink"
            href={getRoleHref({ company: company.name })}
          >
            Open filtered view
          </Link>
        </div>
        <RoleTable roles={companyRoles} />
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
