import type { Metadata } from "next";
import { getCategoryMatrix } from "@/lib/api";

export const metadata: Metadata = {
  title: "AI Insights Embed",
  description: "Embed preview for AI hiring strategy signals.",
  robots: {
    index: false,
    follow: true,
  },
};

const FULL_APP_URL = "https://ai-insights.100xbetter.ai";

export default async function EmbedPage() {
  const days = 7;
  const heatmapData = await getCategoryMatrix({ days }).catch(() => ({
    companies: [],
    matrix: [],
  }));
  const heatmapCompanies = heatmapData.companies.slice(0, 7);
  const heatmapRows = heatmapData.matrix.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#f5f5f5] p-4 text-ink">
      <div className="mx-auto grid max-w-[1200px] gap-3">
        <section className="rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div>
              <h1 className="text-base font-semibold text-ink">
                Where each company is placing its bets
              </h1>
              <p className="mt-1 text-xs text-muted">
                Hiring concentration by company and category. Darker cells show the strongest current focus.
              </p>
            </div>
            <a
              className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:bg-selected"
              href={FULL_APP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open AI Insights
            </a>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line uppercase tracking-[0.08em] text-muted">
                  <th className="py-2 pr-4 font-medium">Company</th>
                  {heatmapRows.map((row: any) => (
                    <th className="px-1 py-2 text-center font-medium" key={row.category}>
                      {row.category}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-medium">Roles</th>
                </tr>
              </thead>
              <tbody>
                {heatmapCompanies.map((company: string) => {
                  const companyMax = Math.max(
                    ...heatmapRows.map((row: any) => row.companies[company] || 0),
                    1
                  );
                  const total = heatmapRows.reduce(
                    (sum: number, row: any) => sum + (row.companies[company] || 0),
                    0
                  );

                  return (
                    <tr className="border-t border-line" key={company}>
                      <td className="py-2 pr-4 font-medium text-ink">{shortCompany(company)}</td>
                      {heatmapRows.map((row: any) => {
                        const count = row.companies[company] || 0;
                        return (
                          <td className="px-1 py-1.5" key={row.category}>
                            <div
                              className={`flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums ${heatCellClass(count, companyMax)}`}
                            >
                              {count || "N/A"}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2 pl-3 text-right font-medium tabular-nums text-ink">
                        {total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}

function shortCompany(name: string) {
  return name.replace(" AI", "").replace("Microsoft", "MSFT");
}

function heatCellClass(count: number, max: number) {
  if (count === 0) return "bg-stone-50 text-subtle";
  const ratio = count / max;
  if (ratio < 0.25) return "bg-teal-50 text-teal-700";
  if (ratio < 0.5) return "bg-teal-100 text-teal-800";
  if (ratio < 0.75) return "bg-teal-200 text-teal-900";
  return "bg-teal-500 text-white";
}
