import type { MetadataRoute } from "next";
import { getCompanies } from "@/lib/api";

const BASE_URL = "https://ai-insights.100xbetter.ai";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    route("", "daily", 1),
    route("/bets", "daily", 0.8),
    route("/categories", "daily", 0.7),
    route("/locations", "daily", 0.7),
    route("/roles", "daily", 0.6),
  ];

  const companies = await getCompanies({ days: 7 }).catch(() => []);
  const companyRoutes = companies.map((company: any) =>
    route(`/company/${company.slug}`, "daily", 0.7, now)
  );

  return [...staticRoutes, ...companyRoutes];
}

function route(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified = new Date()
) {
  return {
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}
