/** Slug → public domain used to fetch the Clearbit logo */
export const COMPANY_DOMAINS: Record<string, string> = {
  anthropic: "anthropic.com",
  openai: "openai.com",
  perplexityai: "perplexity.ai",
  xai: "x.ai",
  coreweave: "coreweave.com",
  mistral: "mistral.ai",
  nvidia: "nvidia.com",
  amazonagi: "amazon.science",
  googledeepmind: "deepmind.google",
  metaai: "meta.com",
  microsoftai: "microsoft.com",
};

export function getLogoUrl(slug: string): string | null {
  const domain = COMPANY_DOMAINS[slug];
  if (!domain) return null;
  // logo.dev image API - optionally authenticated via NEXT_PUBLIC_LOGO_DEV_TOKEN
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  return token
    ? `https://img.logo.dev/${domain}?token=${token}`
    : `https://img.logo.dev/${domain}`;
}
