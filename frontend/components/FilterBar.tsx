"use client";

import { useRouter, useSearchParams } from "next/navigation";

type FilterBarProps = {
  companies: Array<{ slug: string; name: string }>;
  countries: string[];
};

export function FilterBar({ companies, countries }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCompany = searchParams.get("company") || "";
  const currentCountry = searchParams.get("country") || "";
  const currentRange = searchParams.get("range") || "7D";

  function pushParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
        {["7D", "30D", "90D"].map((range) => (
          <button
            className={
              currentRange === range
                ? "bg-ink px-3 py-2 text-xs font-medium text-white"
                : "px-3 py-2 text-xs font-medium text-muted hover:bg-stone-50"
            }
            key={range}
            type="button"
            onClick={() => pushParam("range", range)}
          >
            {range}
          </button>
        ))}
      </div>

      <select
        aria-label="Company filter"
        className="h-9 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink outline-none"
        value={currentCompany}
        onChange={(e) => pushParam("company", e.target.value)}
      >
        <option value="">All companies</option>
        {companies.map((company) => (
          <option key={company.slug} value={company.name}>
            {company.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Location filter"
        className="h-9 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink outline-none"
        value={currentCountry}
        onChange={(e) => pushParam("country", e.target.value)}
      >
        <option value="">All locations</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </div>
  );
}
