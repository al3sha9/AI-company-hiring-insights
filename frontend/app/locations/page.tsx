import Link from "next/link";
import { getCompanies, getLocations } from "@/lib/api";
import { getRoleHref } from "@/lib/data";

type LocationsPageProps = {
  searchParams: Promise<{
    company?: string;
    country?: string;
    range?: string;
  }>;
};

export const metadata = {
  title: "Hiring Locations - AI Insights",
  description: "AI company hiring concentration by location.",
};

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const filters = await searchParams;
  const days = filters.range === "30D" ? 30 : filters.range === "90D" ? 90 : 7;
  const allCompanies = await getCompanies({ days });
  const companySlug = allCompanies.find(
    (company: any) => company.name === filters.company
  )?.slug;
  const locations = await getLocations({ days, companySlug, country: filters.country });
  const maxLocationRoles = Math.max(...locations.map((location: any) => location.roles), 1);
  const dashboardParams = new URLSearchParams();
  if (filters.range) dashboardParams.set("range", filters.range);
  if (filters.company) dashboardParams.set("company", filters.company);
  if (filters.country) dashboardParams.set("country", filters.country);
  const dashboardHref = `/${dashboardParams.size ? `?${dashboardParams.toString()}` : ""}`;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-5 sm:px-6 lg:px-10">
      <header className="border-b border-line pb-5">
        <Link className="text-sm font-medium text-muted hover:text-ink" href={dashboardHref}>
          Back to dashboard
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-ink">
          Top hiring locations
        </h1>
        <p className="mt-2 text-sm text-muted">{days}-day view</p>
      </header>

      <section className="mt-5 rounded-lg border border-line bg-white p-4 shadow-hairline">
        <div className="space-y-4">
          {locations.map((location: any) => (
            <Link
              className="grid grid-cols-[minmax(0,180px)_1fr_56px] items-center gap-3 text-sm"
              href={getRoleHref({ country: location.country })}
              key={location.country}
            >
              <div className="truncate text-muted hover:text-ink">{location.country}</div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-2 bg-teal-500"
                  style={{ width: `${(location.roles / maxLocationRoles) * 100}%` }}
                />
              </div>
              <div className="text-right font-medium tabular-nums text-ink">
                {location.roles}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
