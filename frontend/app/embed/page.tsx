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
  const mobileRows = heatmapRows.slice(0, 4);

  return (
    <main className="h-[640px] overflow-hidden bg-[#f5f5f5] p-2 text-ink sm:h-[560px] sm:p-4">
      <div className="mx-auto flex h-full max-w-[1200px] flex-col">
        <section className="flex h-full flex-col rounded-lg border border-line bg-white shadow-hairline">
          <div className="flex shrink-0 flex-col gap-2 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3">
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-ink sm:text-base">
                Where each company is placing its bets
              </h1>
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-muted sm:mt-1 sm:text-xs sm:leading-5">
                Hiring concentration by company and category. Darker cells show the strongest current focus.
              </p>
            </div>
            <a
              className="w-fit shrink-0 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-selected sm:px-3 sm:py-2 sm:text-xs"
              href={FULL_APP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open AI Insights
            </a>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-2 sm:hidden">
            <table className="h-full w-full table-fixed border-collapse text-left text-[9px]">
              <thead>
                <tr className="h-8 border-b border-line uppercase tracking-[0.06em] text-muted">
                  <th className="w-[68px] py-1 pr-1 font-medium">Company</th>
                  {mobileRows.map((row: any) => (
                    <th className="px-0.5 py-1 text-center font-medium" key={row.category}>
                      {shortCategory(row.category)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapCompanies.map((company: string) => {
                  const companyMax = Math.max(
                    ...mobileRows.map((row: any) => row.companies[company] || 0),
                    1
                  );

                  return (
                    <tr className="h-[64px] border-t border-line" key={company}>
                      <td className="truncate py-1 pr-1 font-medium text-ink">
                        {shortCompany(company)}
                      </td>
                      {mobileRows.map((row: any) => {
                        const count = row.companies[company] || 0;
                        return (
                          <td className="px-0.5 py-0.5" key={row.category}>
                            <div
                              className={`flex h-8 items-center justify-center rounded text-[10px] font-medium tabular-nums ${heatCellClass(count, companyMax)}`}
                            >
                              {count || "N/A"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="hidden min-h-0 flex-1 overflow-hidden p-3 sm:block">
            <table className="h-full w-full min-w-[860px] border-collapse text-left text-xs">
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
                              className={`flex h-10 items-center justify-center rounded text-[12px] font-medium tabular-nums ${heatCellClass(count, companyMax)}`}
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

function shortCategory(name: string) {
  return name
    .replace("Software Engineering", "Software")
    .replace("Infrastructure", "Infra")
    .replace("Enterprise Sales", "Sales")
    .replace("Data Center & Energy", "Data Ctr")
    .replace("ML & AI Engineering", "ML/AI")
    .replace("Government & Defense", "Gov/Def")
    .replace("Frontend & Web Engineering", "Frontend")
    .replace("Backend Engineering", "Backend");
}

function heatCellClass(count: number, max: number) {
  if (count === 0) return "bg-stone-50 text-subtle";
  const ratio = count / max;
  if (ratio < 0.25) return "bg-teal-50 text-teal-700";
  if (ratio < 0.5) return "bg-teal-100 text-teal-800";
  if (ratio < 0.75) return "bg-teal-200 text-teal-900";
  return "bg-teal-500 text-white";
}
