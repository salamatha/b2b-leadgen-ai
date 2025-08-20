// worker/src/ai/searchPlan.ts
export type CompanyFilters = {
  keywords?: string;
  locations?: string[];
  headcount?: [number, number] | null;
  industry?: string[];
};

export type PeopleFilters = {
  roles?: string[];
  company?: string;
  locations?: string[];
};

export function buildLinkedInCompanySearchURL(f: CompanyFilters): string {
  const params = new URLSearchParams();
  if (f.keywords) params.set("keywords", f.keywords.trim());
  return `https://www.linkedin.com/search/results/companies/?${params.toString()}`;
}

export function buildLinkedInPeopleSearchURL(f: PeopleFilters): string {
  const params = new URLSearchParams();
  const kw = [...(f.roles || []), f.company || ""].filter(Boolean).join(" ");
  if (kw) params.set("keywords", kw);
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}
