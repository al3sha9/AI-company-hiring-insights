const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getCompanies() {
  const res = await fetch(`${API_URL}/companies`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export async function getCompany(slug: string) {
  const res = await fetch(`${API_URL}/company/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch company details");
  return res.json();
}

export async function getCategories() {
  const companies = await getCompanies();
  const categoryMap = new Map<string, number>();
  
  for (const comp of companies) {
    try {
      const details = await getCompany(comp.slug);
      for (const cat of details.categories || []) {
        categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.count);
      }
    } catch(e) {
      // Ignore errors for individual companies
    }
  }
  
  const result = Array.from(categoryMap.entries()).map(([category, growth]) => ({
    category,
    growth,
  }));
  
  return result.sort((a, b) => b.growth - a.growth);
}

export async function getLocations() {
  const companies = await getCompanies();
  const locationMap = new Map<string, number>();
  
  for (const comp of companies) {
    try {
      const details = await getCompany(comp.slug);
      for (const loc of details.countries || []) {
        locationMap.set(loc.country, (locationMap.get(loc.country) || 0) + loc.count);
      }
    } catch(e) {
      // Ignore errors for individual companies
    }
  }
  
  const result = Array.from(locationMap.entries()).map(([country, roles]) => ({
    country,
    roles,
    growth: 0, 
    topCompany: "Various" 
  }));
  
  return result.sort((a, b) => b.roles - a.roles);
}
