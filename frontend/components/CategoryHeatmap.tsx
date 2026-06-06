import Link from "next/link";

type HeatmapRow = {
  category: string;
  total: number;
  companies: Record<string, number>;
};

type CategoryHeatmapProps = {
  companies: string[];
  companyHrefs?: Record<string, string>;
  matrix: HeatmapRow[];
};

function cellStyle(count: number, max: number): string {
  if (count === 0) return "text-subtle";
  const r = count / max;
  if (r < 0.15) return "bg-teal-50 text-teal-700";
  if (r < 0.35) return "bg-teal-100 text-teal-800";
  if (r < 0.55) return "bg-teal-200 text-teal-900";
  if (r < 0.75) return "bg-teal-300 text-teal-900";
  return "bg-teal-500 text-white";
}

export function CategoryHeatmap({ companies, companyHrefs = {}, matrix }: CategoryHeatmapProps) {
  // Shorten company names for column headers
  const shortName = (name: string) =>
    name.replace(" AI", "").replace("Microsoft", "MSFT");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
            <th className="py-3 pr-6 font-medium" style={{ minWidth: 160 }}>
              Company
            </th>
            {matrix.map((row) => (
              <th
                key={row.category}
                className="px-2 py-3 text-center font-medium"
                style={{ minWidth: 72 }}
              >
                {row.category}
              </th>
            ))}
            <th className="pl-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const total = matrix.reduce(
              (sum, row) => sum + (row.companies[company] || 0),
              0
            );
            const companyMax = Math.max(
              ...matrix.map((row) => row.companies[company] || 0),
              1
            );
            return (
              <tr key={company} className="border-t border-line">
                <td className="py-2 pr-6 font-medium text-ink">
                  {companyHrefs[company] ? (
                    <Link
                      className="underline-offset-4 hover:text-accent hover:underline"
                      href={companyHrefs[company]}
                    >
                      {shortName(company)}
                    </Link>
                  ) : (
                    shortName(company)
                  )}
                </td>
                {matrix.map((row) => {
                  const count = row.companies[company] || 0;
                  return (
                    <td key={row.category} className="px-2 py-2">
                      <div
                        className={`flex h-8 items-center justify-center rounded text-xs font-medium tabular-nums ${cellStyle(count, companyMax)}`}
                      >
                        {count > 0 ? count : "N/A"}
                      </div>
                    </td>
                  );
                })}
                <td className="pl-4 py-2 text-right tabular-nums font-medium text-ink">
                  {total.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
