import Link from "next/link";
import { getCategories, getCompanies } from "@/lib/api";
import { getRoleHref } from "@/lib/data";

type CategoriesPageProps = {
  searchParams: Promise<{
    company?: string;
    country?: string;
    range?: string;
  }>;
};

export const metadata = {
  title: "Role Categories - AI Insights",
  description: "AI company hiring concentration by role category.",
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const filters = await searchParams;
  const days = filters.range === "30D" ? 30 : filters.range === "90D" ? 90 : 7;
  const allCompanies = await getCompanies({ days });
  const companySlug = allCompanies.find(
    (company: any) => company.name === filters.company
  )?.slug;
  const categories = await getCategories({ days, companySlug, country: filters.country });
  const maxCategoryGrowth = Math.max(...categories.map((item: any) => item.growth), 1);
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
          Role categories growing fastest
        </h1>
        <p className="mt-2 text-sm text-muted">{days}-day view</p>
      </header>

      <section className="mt-5 rounded-lg border border-line bg-white p-4 shadow-hairline">
        <div className="space-y-4">
          {categories.map((item: any) => (
            <Link
              className="grid grid-cols-[minmax(0,180px)_1fr_56px] items-center gap-3 text-sm"
              href={getRoleHref({ category: item.category })}
              key={item.category}
            >
              <div className="truncate text-muted hover:text-ink">{item.category}</div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-2 bg-teal-500"
                  style={{ width: `${(item.growth / maxCategoryGrowth) * 100}%` }}
                />
              </div>
              <div className="text-right font-medium tabular-nums text-ink">
                {item.growth}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
