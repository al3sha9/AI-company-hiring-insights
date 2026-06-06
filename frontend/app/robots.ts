import type { MetadataRoute } from "next";

const BASE_URL = "https://ai-insights.100xbetter.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/embed"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
