import Link from "next/link";
import { CategoryHeatmap } from "@/components/CategoryHeatmap";
import { getCategoryMatrix, getCompanies } from "@/lib/api";

type BetsPageProps = {
  searchParams: Promise<{
    company?: string;
    country?: string;
    range?: string;
  }>;
};

export const metadata = {
  title: "Company Bets - AI Insights",
  description: "AI company hiring concentration by category.",
};

export default async function BetsPage({ searchParams }: BetsPageProps) {
  const filters = await searchParams;
  const days = filters.range === "30D" ? 30 : filters.range === "90D" ? 90 : 7;
  const allCompanies = await getCompanies({ days });
  const companySlug = allCompanies.find(
    (company: any) => company.name === filters.company
  )?.slug;
  const heatmapData = await getCategoryMatrix({
    days,
    companySlug,
    country: filters.country,
  });
  const dashboardParams = new URLSearchParams();
  if (filters.range) dashboardParams.set("range", filters.range);
  if (filters.company) dashboardParams.set("company", filters.company);
  if (filters.country) dashboardParams.set("country", filters.country);
  const dashboardHref = `/${dashboardParams.size ? `?${dashboardParams.toString()}` : ""}`;
  const activeFilters = [
    `${days}-day view`,
    filters.company,
    filters.country,
  ].filter(Boolean);
  const companyHrefs = Object.fromEntries(
    allCompanies.map((company: any) => [company.name, `/company/${company.slug}`])
  );

  return (
    <main className="mx-auto min-h-screen max-w-[1800px] px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      <header className="border-b border-line pb-5">
        <Link className="text-sm font-medium text-muted hover:text-ink" href={dashboardHref}>
          Back to dashboard
        </Link>
        <div className="mt-5">
          <h1 className="text-2xl font-semibold tracking-normal text-ink">
            Where each company is placing its bets
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Role concentration by category. Darker cell = more roles.
          </p>
          <p className="mt-1 text-xs text-subtle">{activeFilters.join(", ")}</p>
        </div>
      </header>

      <section className="mt-5 rounded-lg border border-line bg-white p-4 shadow-hairline">
        <CategoryHeatmap
          companies={heatmapData.companies}
          companyHrefs={companyHrefs}
          matrix={heatmapData.matrix}
        />
      </section>
    </main>
  );
}
