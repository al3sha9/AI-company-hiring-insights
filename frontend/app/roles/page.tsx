import Link from "next/link";
import { RoleTable } from "@/components/RoleTable";
import { getRoles, type LiveRole } from "@/lib/api";
import { getRoleHref } from "@/lib/data";

type RolesPageProps = {
  searchParams: Promise<{
    category?: string;
    company?: string;
    country?: string;
  }>;
};

export const metadata = {
  title: "Evidence - AI Hiring Signals",
  description: "Verify the open roles behind AI company strategy signals."
};

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const filters = await searchParams;
  const filteredRoles = await getRoles(filters);
  const companyBreakdown = summarizeRoles(filteredRoles, "company");
  const categoryBreakdown = summarizeRoles(filteredRoles, "category");
  const locationBreakdown = summarizeRoles(filteredRoles, "country");
  const activeFilters = [
    filters.company && `Company: ${filters.company}`,
    filters.category && `Category: ${filters.category}`,
    filters.country && `Country: ${filters.country}`
  ].filter(Boolean);

  return (
    <main className="mx-auto min-h-screen max-w-8xl px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      <header className="border-b border-line pb-5">
        <Link className="text-sm font-medium text-muted hover:text-ink" href="/">
          Back to dashboard
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-ink">
              Evidence table
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              {activeFilters.length
                ? activeFilters.join(" · ")
                : "Live scraped roles behind the strategy signals, filtered for the current active hiring window."}
            </p>
          </div>
          <Link
            className="w-fit rounded-lg border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:bg-selected"
            href="/roles"
          >
            Clear filters
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
        <Stat label="Matching roles" value={filteredRoles.length.toLocaleString()} />
        <Stat
          label="Companies"
          value={new Set(filteredRoles.map((role) => role.company)).size.toString()}
        />
        <Stat
          label="Categories"
          value={new Set(filteredRoles.map((role) => role.category)).size.toString()}
        />
        <Stat
          label="Countries"
          value={new Set(filteredRoles.map((role) => role.country)).size.toString()}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Breakdown
          activeFilters={filters}
          items={companyBreakdown}
          kind="company"
          title="By company"
        />
        <Breakdown
          activeFilters={filters}
          items={categoryBreakdown}
          kind="category"
          title="By category"
        />
        <Breakdown
          activeFilters={filters}
          items={locationBreakdown}
          kind="country"
          title="By location"
        />
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white shadow-hairline">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Roles behind the signals</h2>
            <p className="mt-1 text-xs text-muted">
              Click any role title to verify the source listing on the company careers page.
            </p>
          </div>
          <span className="text-xs font-medium text-accent">
            {filteredRoles.length.toLocaleString()} roles
          </span>
        </div>
        <RoleTable roles={filteredRoles} />
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

function Breakdown({
  activeFilters,
  items,
  kind,
  title
}: {
  activeFilters: {
    category?: string;
    company?: string;
    country?: string;
  };
  items: Array<{ label: string; count: number }>;
  kind: "category" | "company" | "country";
  title: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const filters = {
            ...activeFilters,
            [kind]: item.label
          };

          return (
            <Link
              className="block text-sm"
              href={getRoleHref(filters)}
              key={item.label}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="truncate text-muted hover:text-ink">
                  {item.label}
                </span>
                <span className="font-medium tabular-nums text-ink">
                  {item.count}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-stone-100">
                <div
                  className="h-1.5 rounded-full bg-accent"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function summarizeRoles(
  roles: LiveRole[],
  key: "company" | "country" | "category"
) {
  const counts = roles.reduce<Record<string, number>>((acc, role) => {
    const value = role[key] || "Unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
