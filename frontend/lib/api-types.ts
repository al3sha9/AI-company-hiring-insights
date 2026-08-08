export type DashboardFilters = {
  days?: number;
  companySlug?: string;
  category?: string;
  country?: string;
  limit?: number;
  offset?: number;
};

export type RolesResponse = {
  roles: Array<{
    id: string;
    title: string;
    company: string;
    companySlug: string;
    category: string;
    location: string;
    country: string;
    seniority: string;
    workMode: string;
    sourceUrl: string;
    lastSeenAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
  facets: {
    company: Array<{ label: string; slug: string; count: number }>;
    category: Array<{ label: string; count: number }>;
    country: Array<{ label: string; count: number }>;
  };
};
