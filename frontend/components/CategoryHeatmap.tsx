type HeatmapRow = {
  category: string;
  total: number;
  companies: Record<string, number>;
};

type CategoryHeatmapProps = {
  companies: string[];
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

export function CategoryHeatmap({ companies, matrix }: CategoryHeatmapProps) {
  const maxCell = Math.max(
    ...matrix.flatMap((row) => companies.map((c) => row.companies[c] || 0)),
    1
  );

  // Shorten company names for column headers
  const shortName = (name: string) =>
    name.replace(" AI", "").replace("Microsoft", "MSFT");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
            <th className="py-3 pr-6 font-medium" style={{ minWidth: 160 }}>
              Category
            </th>
            {companies.map((company) => (
              <th
                key={company}
                className="px-2 py-3 text-center font-medium"
                style={{ minWidth: 72 }}
              >
                {shortName(company)}
              </th>
            ))}
            <th className="pl-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.category} className="border-t border-line">
              <td className="py-2 pr-6 font-medium text-ink">{row.category}</td>
              {companies.map((company) => {
                const count = row.companies[company] || 0;
                return (
                  <td key={company} className="px-2 py-2">
                    <div
                      className={`flex h-8 items-center justify-center rounded text-xs font-medium tabular-nums ${cellStyle(count, maxCell)}`}
                    >
                      {count > 0 ? count : "—"}
                    </div>
                  </td>
                );
              })}
              <td className="pl-4 py-2 text-right tabular-nums font-medium text-ink">
                {row.total.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
