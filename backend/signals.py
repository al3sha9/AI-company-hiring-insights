from typing import Iterable


COMPANY_DIRECTIONS: dict[str, dict] = {
    "anthropic": {
        "keywords": [
            "research", "infrastructure", "ml systems", "reinforcement learning",
            "applied ai architect",
        ],
        "label": "Reinvesting in research and infrastructure",
        "description": "Research and infrastructure now outweigh enterprise sales in Anthropic's hiring mix. The company is putting more capacity into model development and deployment systems",
    },
    "openai": {
        "keywords": [
            "forward deployed", "deployment", "solutions engineer", "account director",
            "government", "customer success",
        ],
        "label": "Scaling enterprise deployment",
        "description": "Sales and operations grew while research hiring stayed flat. OpenAI is adding the deployment, government, and customer teams needed to put its models into production",
    },
    "perplexityai": {
        "keywords": [
            "enterprise", "customer success", "forward deployed", "monetization",
            "partnerships", "applied ai",
        ],
        "label": "Moving into enterprise AI",
        "description": "Research and enterprise roles now lead Perplexity's hiring mix. The company is expanding search into paid workplace products and customer deployments",
    },
    "xai": {
        "keywords": [
            "data center", "datacenter", "physical infrastructure", "facilities",
            "electrical", "power", "memphis",
        ],
        "label": "Prioritizing compute capacity",
        "description": "Data center and energy roles now nearly match software hiring. xAI is adding the physical capacity needed to train and run Grok",
    },
    "coreweave": {
        "keywords": [
            "account", "field engineer", "solution architect", "data center",
            "power procurement", "cloud", "sales",
        ],
        "label": "Commercializing its AI cloud",
        "description": "Overall hiring is flat, but infrastructure and enterprise sales grew. CoreWeave is putting more people into selling and operating its cloud capacity",
    },
    "mistral": {
        "keywords": [
            "deployment strategist", "forward deployed", "applied ai", "solution architect",
        ],
        "label": "Building an AI deployment consultancy",
        "description": "Mistral is building a large customer-facing deployment team that competes with Accenture and PwC for enterprise AI implementation work",
    },
    "nvidia": {
        "keywords": [
            "data center", "datacenter", "ai infrastructure", "dgx cloud", "power",
            "ai networking", "cloud infrastructure",
        ],
        "label": "Competing in AI infrastructure",
        "description": "Nvidia continues to hire across data centers, power, networking, and DGX Cloud. It is building more of the AI compute stack and competing with hyperscalers such as Amazon and Google",
    },
    "amazonagi": {
        "keywords": [
            "data quality", "quality auditor", "data services", "data associate",
            "training specialist", "human feedback",
        ],
        "label": "Scaling AGI data operations",
        "description": "Amazon AGI is building a large human-feedback operation for model training, evaluation, and data quality",
    },
}


PATTERNS: list[dict] = [
    {
        "keywords": ["tutor", "math", "biolog", "chemist", "physic", "earth sci", "geolog", "astro"],
        "label": "Training AI on science",
        "description": "Hiring scientists to teach the model, betting on scientific reasoning as a competitive edge",
    },
    {
        "keywords": [
            "annotator", "labeler", "data label", "rater", "content reviewer",
            "quality auditor", "data quality", "data services", "data associate", "training specialist",
        ],
        "label": "Building better training data",
        "description": "More human reviewers means a smarter model, investing in quality, not just speed",
        "by_company": {
            "amazonagi": {
                "label": "Scaling AGI data operations",
                "description": "Amazon AGI is hiring data quality, auditing, and training roles, signaling a large human feedback operation behind model improvement",
            },
        },
    },
    {
        "keywords": ["red team", "redteam", "adversarial", "jailbreak", "safety evaluator"],
        "label": "Testing for weaknesses",
        "description": "Finding flaws before enterprise clients do, reducing liability and unlocking bigger deals",
    },
    {
        "keywords": [
            "ethicist", "responsible ai", "trust & safety", "trust and safety",
            "content policy", "community policy",
        ],
        "label": "Avoiding regulatory trouble",
        "description": "Building guardrails needed to scale without getting fined or shut down",
    },
    {
        "keywords": [
            "policy", "government affairs", "regulatory affairs",
            "public affairs", "legislation", "government relation",
        ],
        "label": "Going after government contracts",
        "description": "Government AI contracts are among the largest deals available, and this is the sales team for that",
    },
    {
        "keywords": [
            "deployment strategist", "forward deployed", "sovereign institution",
            "critical and sovereign", "ai4engineering", "applied ai",
        ],
        "label": "Building an AI deployment consultancy",
        "description": "Hiring deployment strategists and forward-deployed AI engineers signals a services layer around model implementation",
        "by_company": {
            "anthropic": {
                "label": "Pushing Claude into enterprises",
                "description": "Anthropic is hiring applied AI architects and industry account roles, signaling a stronger push to turn Claude into deployed enterprise workflows",
            },
            "openai": {
                "label": "Embedding AI inside customers",
                "description": "OpenAI is hiring forward-deployed and deployment engineers, signaling hands-on enterprise and government implementation, not just API access",
            },
            "perplexityai": {
                "label": "Taking AI search into enterprise workflows",
                "description": "Perplexity is hiring applied AI and enterprise experience roles, signaling a move from consumer search toward workplace deployment",
            },
            "mistral": {
                "label": "Building an AI deployment consultancy",
                "description": "Mistral is hiring deployment strategists and forward-deployed AI engineers, signaling a services layer around its models that competes with Accenture and PwC for enterprise AI implementation",
            },
        },
    },
    {
        "keywords": ["lawyer", "attorney", "legal counsel", "general counsel", "compliance", "legal advisor"],
        "label": "Legal expansion",
        "description": "Scaling legal capacity, a prerequisite for large enterprise deals and regulated markets",
    },
    {
        "keywords": [
            "data center", "datacenter", "ai infrastructure", "dgx cloud",
            "cluster", "facilities", "site reliability", "power",
            "mechanical engineer", "electrical engineer", "hvac",
        ],
        "label": "Competing in AI infrastructure",
        "description": "Data center, power, and AI infrastructure roles signal a move beyond chips into full-stack AI compute, competing with hyperscalers like Amazon and Google",
        "by_company": {
            "coreweave": {
                "label": "Expanding AI cloud capacity",
                "description": "CoreWeave is hiring data center, power, and infrastructure roles, signaling continued expansion of the physical cloud capacity AI labs depend on",
            },
        },
    },
    {
        "keywords": [
            "filmmaker", "cinematograph", "video producer", "creative director",
            "concept artist", "animator", "storyboard", "photographer",
        ],
        "label": "Expanding into video and image AI",
        "description": "Hiring creatives to build visual AI means moving beyond text into a much bigger market",
    },
    {
        "keywords": ["doctor", "physician", "nurse", "clinical", "radiolog", "patholog"],
        "label": "Entering healthcare",
        "description": "Hiring doctors and clinicians points toward healthcare AI, a market with strong pricing and high switching costs",
    },
    {
        "keywords": ["economist", "economic research", "market design", "welfare"],
        "label": "Pricing and monetization strategy",
        "description": "Hiring economists to design how they charge signals serious work on revenue models",
    },
    {
        "keywords": ["alignment", "interpretab", "mechanistic", "scalable oversight"],
        "label": "Betting on long-term AI safety",
        "description": "Deep research into keeping AI predictable and under control signals how seriously they take what comes next",
    },
    {
        "keywords": ["robotics", "mechatronics", "actuator", "embodied", "manipulation"],
        "label": "Moving AI into the physical world",
        "description": "Robots and hardware expand the company from software into physical products with high barriers to copy",
    },
    {
        "keywords": ["pilot", "aviation", "aerospace", "flight"],
        "label": "Defense and simulation",
        "description": "Aviation hires point to government defense contracts or building physical-world simulation data",
    },
]


def build_company_signals(roles: Iterable[dict]) -> dict[str, dict]:
    company_titles: dict[str, list[tuple[str, str]]] = {}
    for role in roles:
        slug = role.get("company_slug") or ""
        title = role.get("title") or ""
        company_titles.setdefault(slug, []).append((title, title.lower()))

    result: dict[str, dict] = {}
    for slug, titles in company_titles.items():
        company_direction = COMPANY_DIRECTIONS.get(slug)
        if company_direction:
            direction_keywords = company_direction["keywords"]
            direction_matches = [
                original
                for original, lowered in titles
                if any(keyword in lowered for keyword in direction_keywords)
            ]
            if len(direction_matches) >= 2:
                evidence = sorted(
                    set(direction_matches),
                    key=lambda title: (
                        -sum(keyword in title.lower() for keyword in direction_keywords),
                        len(title),
                        title,
                    ),
                )[:3]
                result[slug] = {
                    "label": company_direction["label"],
                    "count": len(direction_matches),
                    "description": company_direction["description"],
                    "evidence": evidence,
                }
                continue

        best: dict | None = None
        for pattern in PATTERNS:
            keywords = pattern["keywords"]
            matched = [
                original
                for original, lowered in titles
                if any(keyword in lowered for keyword in keywords)
            ]
            if len(matched) < 2:
                continue
            if best is not None and len(matched) <= best["count"]:
                continue

            company_override = pattern.get("by_company", {}).get(slug, {})
            evidence = sorted(
                set(matched),
                key=lambda title: (
                    -sum(keyword in title.lower() for keyword in keywords if keyword != "tutor"),
                    -sum(keyword in title.lower() for keyword in keywords),
                    len(title),
                    title,
                ),
            )[:3]
            best = {
                "label": company_override.get("label", pattern["label"]),
                "count": len(matched),
                "description": company_override.get("description", pattern["description"]),
                "evidence": evidence,
            }

        if best:
            result[slug] = best

    return result
