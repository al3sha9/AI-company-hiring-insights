import companiesJson from "@/data/companies.json";
import locationsJson from "@/data/locations.json";
import rolesJson from "@/data/roles.json";
import weeklyTrendsJson from "@/data/weeklyTrends.json";

export type Company = {
  name: string;
  slug: string;
  openRoles: number;
  wowChange: number;
  momChange: number;
  topGrowingCategory: string;
  topHiringLocation: string;
  signal: string;
  inferredStrategy: string;
  notableRole: string;
};

export type Role = {
  id?: string;
  company: string;
  title: string;
  category: string;
  location: string;
  country: string;
  datePosted: string;
  seniority: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  sourceUrl: string;
};

export type LocationSignal = {
  country: string;
  roles: number;
  growth: number;
  topCompany: string;
};

export type WeeklyTrend = {
  company: string;
  values: number[];
};

const roleCategories = [
  "Research",
  "Engineering",
  "Infrastructure",
  "Product",
  "Enterprise Sales",
  "Safety & Policy",
  "Robotics",
  "Data Center & Energy",
  "Government & Defense",
  "Operations",
  "Marketing"
];

const seniorities = ["Associate", "Mid-level", "Senior", "Staff", "Lead", "Principal"];
const workModes: Role["workMode"][] = ["Hybrid", "Onsite", "Remote"];

const careerUrls: Record<string, string> = {
  OpenAI: "https://openai.com/careers/search",
  Anthropic: "https://www.anthropic.com/jobs",
  "Google DeepMind": "https://deepmind.google/careers",
  "Meta AI": "https://www.metacareers.com/jobs",
  xAI: "https://x.ai/careers",
  "Microsoft AI": "https://jobs.careers.microsoft.com/global/en/search",
  Nvidia: "https://www.nvidia.com/en-us/about-nvidia/careers",
  Mistral: "https://mistral.ai/careers",
  Perplexity: "https://www.perplexity.ai/careers",
  CoreWeave: "https://www.coreweave.com/careers",
  "Tesla AI": "https://www.tesla.com/careers/search",
  "Figure AI": "https://www.figure.ai/careers"
};

const titleTemplates: Record<string, string[]> = {
  Research: [
    "Research Scientist",
    "Multimodal Evals Scientist",
    "Post-training Researcher",
    "Applied Research Engineer"
  ],
  Engineering: [
    "AI Software Engineer",
    "Model Serving Engineer",
    "Developer Platform Engineer",
    "Data Systems Engineer"
  ],
  Infrastructure: [
    "GPU Cluster Reliability Engineer",
    "Inference Systems Engineer",
    "Training Infrastructure Engineer",
    "Distributed Systems Engineer"
  ],
  Product: [
    "AI Product Manager",
    "Product Designer",
    "Consumer AI Product Lead",
    "Platform Product Manager"
  ],
  "Enterprise Sales": [
    "Enterprise Account Executive",
    "Solutions Architect",
    "Customer Engineering Lead",
    "Strategic Partnerships Manager"
  ],
  "Safety & Policy": [
    "AI Policy Lead",
    "Safety Evaluations Researcher",
    "Responsible AI Program Manager",
    "Trust and Safety Analyst"
  ],
  Robotics: [
    "Robotics Software Engineer",
    "Humanoid Manipulation Engineer",
    "Controls Engineer",
    "Robot Fleet Operations Lead"
  ],
  "Data Center & Energy": [
    "Data Center Operations Manager",
    "AI Factory Power Systems Lead",
    "Energy Procurement Manager",
    "Datacenter Systems Engineer"
  ],
  "Government & Defense": [
    "Government AI Solutions Lead",
    "Defense Partnerships Manager",
    "Public Sector Deployment Lead",
    "National Security Account Lead"
  ],
  Operations: [
    "Technical Program Manager",
    "Supply Chain Lead",
    "People Operations Partner",
    "Business Operations Analyst"
  ],
  Marketing: [
    "Product Marketing Manager",
    "Growth Marketing Lead",
    "Developer Relations Lead",
    "Communications Manager"
  ]
};

const locationPools: Record<string, Array<{ location: string; country: string }>> = {
  "United States": [
    { location: "San Francisco", country: "United States" },
    { location: "Palo Alto", country: "United States" },
    { location: "New York", country: "United States" },
    { location: "Seattle", country: "United States" },
    { location: "Austin", country: "United States" },
    { location: "Washington, DC", country: "United States" },
    { location: "Memphis", country: "United States" },
    { location: "Santa Clara", country: "United States" }
  ],
  "United Kingdom": [
    { location: "London", country: "United Kingdom" },
    { location: "Cambridge", country: "United Kingdom" },
    { location: "Oxford", country: "United Kingdom" }
  ],
  France: [
    { location: "Paris", country: "France" },
    { location: "Lyon", country: "France" }
  ],
  Singapore: [{ location: "Singapore", country: "Singapore" }],
  UAE: [
    { location: "Dubai", country: "UAE" },
    { location: "Abu Dhabi", country: "UAE" }
  ],
  India: [
    { location: "Bangalore", country: "India" },
    { location: "Hyderabad", country: "India" }
  ],
  Canada: [
    { location: "Toronto", country: "Canada" },
    { location: "Vancouver", country: "Canada" },
    { location: "Ottawa", country: "Canada" }
  ]
};

const categoryWeights: Record<string, Partial<Record<string, number>>> = {
  OpenAI: {
    "Enterprise Sales": 25,
    Infrastructure: 19,
    "Safety & Policy": 14,
    Research: 13,
    Engineering: 12,
    Product: 7,
    Operations: 6,
    "Government & Defense": 4
  },
  Anthropic: {
    "Safety & Policy": 24,
    "Enterprise Sales": 20,
    Research: 16,
    Engineering: 14,
    Infrastructure: 12,
    Product: 8,
    Operations: 4,
    Marketing: 2
  },
  "Google DeepMind": {
    Research: 26,
    Engineering: 20,
    Infrastructure: 16,
    Product: 13,
    "Safety & Policy": 10,
    Operations: 5,
    "Enterprise Sales": 5,
    Marketing: 3,
    "Government & Defense": 2
  },
  "Meta AI": {
    Product: 22,
    Engineering: 20,
    Research: 18,
    Infrastructure: 14,
    Marketing: 8,
    "Enterprise Sales": 7,
    "Safety & Policy": 6,
    Operations: 5
  },
  xAI: {
    Infrastructure: 32,
    Engineering: 20,
    Research: 14,
    Product: 11,
    Operations: 8,
    "Data Center & Energy": 7,
    "Enterprise Sales": 4,
    "Safety & Policy": 4
  },
  "Microsoft AI": {
    "Enterprise Sales": 25,
    Engineering: 18,
    Product: 16,
    Infrastructure: 13,
    "Safety & Policy": 10,
    "Government & Defense": 7,
    Research: 6,
    Marketing: 3,
    Operations: 2
  },
  Nvidia: {
    "Data Center & Energy": 28,
    Infrastructure: 22,
    Engineering: 17,
    "Government & Defense": 10,
    Research: 9,
    "Enterprise Sales": 7,
    Product: 4,
    Operations: 3
  },
  Mistral: {
    "Government & Defense": 22,
    "Enterprise Sales": 20,
    Research: 17,
    Engineering: 15,
    Product: 10,
    "Safety & Policy": 7,
    Marketing: 5,
    Operations: 4
  },
  Perplexity: {
    Product: 24,
    Engineering: 20,
    Marketing: 15,
    Research: 13,
    "Enterprise Sales": 10,
    Infrastructure: 8,
    Operations: 6,
    "Safety & Policy": 4
  },
  CoreWeave: {
    "Data Center & Energy": 32,
    Infrastructure: 25,
    Engineering: 14,
    Operations: 12,
    "Enterprise Sales": 7,
    Product: 4,
    "Government & Defense": 4,
    Marketing: 2
  },
  "Tesla AI": {
    Robotics: 30,
    Engineering: 20,
    Infrastructure: 12,
    Research: 10,
    "Data Center & Energy": 9,
    Product: 7,
    Operations: 7,
    "Safety & Policy": 5
  },
  "Figure AI": {
    Robotics: 36,
    Engineering: 18,
    Operations: 14,
    Product: 10,
    Infrastructure: 8,
    Research: 6,
    "Enterprise Sales": 5,
    Marketing: 3
  }
};

const countryWeights: Record<string, Partial<Record<string, number>>> = {
  OpenAI: {
    "United States": 66,
    "United Kingdom": 12,
    Canada: 8,
    Singapore: 5,
    India: 4,
    France: 3,
    UAE: 2
  },
  Anthropic: {
    "United States": 52,
    "United Kingdom": 24,
    Canada: 7,
    Singapore: 6,
    India: 5,
    France: 4,
    UAE: 2
  },
  "Google DeepMind": {
    "United Kingdom": 34,
    "United States": 32,
    India: 13,
    France: 8,
    Canada: 6,
    Singapore: 5,
    UAE: 2
  },
  "Meta AI": {
    "United States": 72,
    "United Kingdom": 8,
    India: 7,
    Canada: 5,
    Singapore: 4,
    France: 3,
    UAE: 1
  },
  xAI: {
    "United States": 84,
    "United Kingdom": 5,
    Canada: 4,
    India: 3,
    UAE: 2,
    Singapore: 1,
    France: 1
  },
  "Microsoft AI": {
    "United States": 48,
    India: 14,
    Singapore: 12,
    "United Kingdom": 9,
    Canada: 7,
    UAE: 6,
    France: 4
  },
  Nvidia: {
    "United States": 58,
    India: 12,
    Canada: 9,
    "United Kingdom": 7,
    Singapore: 6,
    France: 4,
    UAE: 4
  },
  Mistral: {
    France: 54,
    "United Kingdom": 15,
    "United States": 12,
    UAE: 7,
    Singapore: 5,
    Canada: 4,
    India: 3
  },
  Perplexity: {
    "United States": 70,
    Canada: 8,
    "United Kingdom": 7,
    India: 6,
    Singapore: 4,
    France: 3,
    UAE: 2
  },
  CoreWeave: {
    "United States": 68,
    UAE: 11,
    "United Kingdom": 7,
    Canada: 5,
    Singapore: 4,
    France: 3,
    India: 2
  },
  "Tesla AI": {
    "United States": 82,
    Canada: 5,
    India: 4,
    "United Kingdom": 4,
    France: 2,
    UAE: 2,
    Singapore: 1
  },
  "Figure AI": {
    "United States": 86,
    Canada: 4,
    "United Kingdom": 4,
    India: 2,
    France: 2,
    Singapore: 1,
    UAE: 1
  }
};

export const companies = companiesJson as Company[];
export const locations = locationsJson as LocationSignal[];
export const weeklyTrends = weeklyTrendsJson as WeeklyTrend[];

export const categoryGrowth = [
  { category: "Enterprise Sales", growth: 38 },
  { category: "Infrastructure", growth: 42 },
  { category: "Research", growth: 21 },
  { category: "Safety & Policy", growth: 29 },
  { category: "Robotics", growth: 47 },
  { category: "Product", growth: 24 },
  { category: "Data Center & Energy", growth: 51 },
  { category: "Government & Defense", growth: 33 }
];

const seedRoles = rolesJson as Role[];
export const roles = buildRoleInventory();

export const totalOpenRoles = companies.reduce(
  (sum, company) => sum + company.openRoles,
  0
);

export const weightedWowChange = Math.round(
  companies.reduce(
    (sum, company) => sum + company.openRoles * company.wowChange,
    0
  ) / totalOpenRoles
);

export const fastestGrowingCompany = [...companies].sort(
  (a, b) => b.wowChange - a.wowChange
)[0];

export const fastestGrowingCategory = [...categoryGrowth].sort(
  (a, b) => b.growth - a.growth
)[0];

export const biggestLocationSpike = [...locations].sort(
  (a, b) => b.growth - a.growth
)[0];

export function getCompany(slug: string) {
  return companies.find((company) => company.slug === slug);
}

export function getCompanyRoles(companyName: string) {
  return roles
    .filter((role) => role.company === companyName)
    .sort((a, b) => b.datePosted.localeCompare(a.datePosted));
}

export function getCompanyNotableRoles(companyName: string) {
  return seedRoles
    .filter((role) => role.company === companyName)
    .map((role, index) =>
      normalizeSeedRole(
        role,
        companies.find((company) => company.name === companyName)?.slug ??
          companyName.toLowerCase().replaceAll(" ", "-"),
        index
      )
    )
    .sort((a, b) => b.datePosted.localeCompare(a.datePosted));
}

export function getFilteredRoles(filters: {
  category?: string;
  company?: string;
  country?: string;
}) {
  return roles.filter((role) => {
    return (
      (!filters.company || role.company === filters.company) &&
      (!filters.category || role.category === filters.category) &&
      (!filters.country || role.country === filters.country)
    );
  });
}

export function getRoleHref(filters: {
  category?: string;
  company?: string;
  country?: string;
}) {
  const params = new URLSearchParams();

  if (filters.company) {
    params.set("company", filters.company);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.country) {
    params.set("country", filters.country);
  }

  return `/roles${params.size ? `?${params.toString()}` : ""}`;
}

export function getCompanyTrend(companyName: string) {
  return weeklyTrends.find((trend) => trend.company === companyName);
}

export function summarizeRoles(
  companyRoles: Role[],
  key: "company" | "country" | "category"
) {
  const counts = companyRoles.reduce<Record<string, number>>((acc, role) => {
    acc[role[key]] = (acc[role[key]] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function buildRoleInventory() {
  return companies.flatMap((company) => {
    const normalizedSeeds = seedRoles
      .filter((role) => role.company === company.name)
      .map((role, index) => normalizeSeedRole(role, company.slug, index));

    const remainingCount = company.openRoles - normalizedSeeds.length;
    const generatedRoles = Array.from({ length: remainingCount }, (_, index) =>
      createGeneratedRole(company, index + normalizedSeeds.length)
    );

    return [...normalizedSeeds, ...generatedRoles].sort((a, b) =>
      b.datePosted.localeCompare(a.datePosted)
    );
  });
}

function normalizeSeedRole(role: Role, companySlug: string, index: number): Role {
  return {
    ...role,
    id: `${companySlug}-seed-${index + 1}`,
    sourceUrl: getCareerUrl(role.company, role.title, index)
  };
}

function createGeneratedRole(company: Company, index: number): Role {
  const category = pickWeighted(categoryWeights[company.name], index);
  const country = pickWeighted(countryWeights[company.name], index * 3 + 2);
  const locationOptions = locationPools[country] ?? locationPools["United States"];
  const location = locationOptions[index % locationOptions.length];
  const templates = titleTemplates[category] ?? titleTemplates.Engineering;
  const title = `${templates[index % templates.length]}${index > 20 ? ` ${Math.floor(index / templates.length)}` : ""}`;

  return {
    id: `${company.slug}-${index + 1}`,
    company: company.name,
    title,
    category,
    location: location.location,
    country: location.country,
    datePosted: getMockDate(index),
    seniority: seniorities[index % seniorities.length],
    workMode: workModes[index % workModes.length],
    sourceUrl: getCareerUrl(company.name, title, index)
  };
}

function pickWeighted(weights: Partial<Record<string, number>>, seed: number) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + (weight ?? 0), 0);
  let cursor = ((seed * 17 + 11) % total) + 1;

  for (const [label, weight] of entries) {
    cursor -= weight ?? 0;
    if (cursor <= 0) {
      return label;
    }
  }

  return entries[0]?.[0] ?? roleCategories[0];
}

function getMockDate(index: number) {
  const day = 6 - (index % 28);
  const date = new Date(Date.UTC(2026, 4, day));
  return date.toISOString().slice(0, 10);
}

function getCareerUrl(companyName: string, title: string, index: number) {
  const baseUrl = careerUrls[companyName] ?? "https://example.com/careers";
  const query = new URLSearchParams({
    query: title,
    role: String(index + 1)
  });

  return `${baseUrl}?${query.toString()}`;
}
