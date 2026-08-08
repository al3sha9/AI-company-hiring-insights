type SignalRole = {
  company_slug?: string;
  title?: string;
};

type Direction = {
  keywords: string[];
  label: string;
  description: string;
};

const DIRECTIONS: Record<string, Direction> = {
  anthropic: {
    keywords: ["research", "infrastructure", "ml systems", "reinforcement learning", "applied ai architect"],
    label: "Reinvesting in research and infrastructure",
    description:
      "Research and infrastructure now outweigh enterprise sales in Anthropic's hiring mix. The company is putting more capacity into model development and deployment systems",
  },
  openai: {
    keywords: ["forward deployed", "deployment", "solutions engineer", "account director", "government", "customer success"],
    label: "Scaling enterprise deployment",
    description:
      "Sales and operations grew while research hiring stayed flat. OpenAI is adding the deployment, government, and customer teams needed to put its models into production",
  },
  perplexityai: {
    keywords: ["enterprise", "customer success", "forward deployed", "monetization", "partnerships", "applied ai"],
    label: "Moving into enterprise AI",
    description:
      "Research and enterprise roles now lead Perplexity's hiring mix. The company is expanding search into paid workplace products and customer deployments",
  },
  xai: {
    keywords: ["data center", "datacenter", "physical infrastructure", "facilities", "electrical", "power", "memphis"],
    label: "Prioritizing compute capacity",
    description:
      "Data center and energy roles now nearly match software hiring. xAI is adding the physical capacity needed to train and run Grok",
  },
  coreweave: {
    keywords: ["account", "field engineer", "solution architect", "data center", "power procurement", "cloud", "sales"],
    label: "Commercializing its AI cloud",
    description:
      "Overall hiring is flat, but infrastructure and enterprise sales grew. CoreWeave is putting more people into selling and operating its cloud capacity",
  },
  mistral: {
    keywords: ["deployment strategist", "forward deployed", "applied ai", "solution architect"],
    label: "Building an AI deployment consultancy",
    description:
      "Mistral is building a large customer-facing deployment team that competes with Accenture and PwC for enterprise AI implementation work",
  },
  nvidia: {
    keywords: ["data center", "datacenter", "ai infrastructure", "dgx cloud", "power", "ai networking", "cloud infrastructure"],
    label: "Competing in AI infrastructure",
    description:
      "Nvidia continues to hire across data centers, power, networking, and DGX Cloud. It is building more of the AI compute stack and competing with hyperscalers such as Amazon and Google",
  },
  amazonagi: {
    keywords: ["data quality", "quality auditor", "data services", "data associate", "training specialist", "human feedback"],
    label: "Scaling AGI data operations",
    description:
      "Amazon AGI is building a large human-feedback operation for model training, evaluation, and data quality",
  },
};

export function buildCompanySignals(roles: SignalRole[]) {
  const titlesByCompany = new Map<string, string[]>();
  for (const role of roles) {
    if (!role.company_slug || !role.title) continue;
    const titles = titlesByCompany.get(role.company_slug) || [];
    titles.push(role.title);
    titlesByCompany.set(role.company_slug, titles);
  }

  return Object.fromEntries(
    Array.from(titlesByCompany.entries()).flatMap(([slug, titles]) => {
      const direction = DIRECTIONS[slug];
      if (!direction) return [];

      const matches = titles.filter((title) => {
        const lowered = title.toLowerCase();
        return direction.keywords.some((keyword) => lowered.includes(keyword));
      });
      if (matches.length < 2) return [];

      const evidence = Array.from(new Set(matches))
        .sort((a, b) => {
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          const aScore = direction.keywords.filter((keyword) => aLower.includes(keyword)).length;
          const bScore = direction.keywords.filter((keyword) => bLower.includes(keyword)).length;
          return bScore - aScore || a.length - b.length || a.localeCompare(b);
        })
        .slice(0, 3);

      return [[slug, {
        label: direction.label,
        count: matches.length,
        description: direction.description,
        evidence,
      }]];
    })
  );
}
