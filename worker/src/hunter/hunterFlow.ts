import { scrapeLinkedInSearch } from "../scrapers/linkedin.ts";
import { discoverEmailsAndPhones } from "../scrapers/webEmailFinder.ts";

type CompanyIn = { company: string; linkedin_url?: string };

const DM_TITLES = [
  "Founder", "Co-Founder", "CEO", "Chief Executive", "Director", "Head",
  "VP", "Vice President", "CTO", "CIO", "CMO", "COO", "Owner", "Managing Director",
];

function buildPeopleKeywords(company: string, location?: string) {
  const roles = DM_TITLES.join(" OR ");
  const base = `${company} (${roles})`;
  return location ? `${base} ${location}` : base;
}

export async function huntDecisionMakers(opts: {
  userId: string;
  companies: CompanyIn[];
  location?: string;
  headless?: boolean;
  perCompany?: number;
}) {
  const { userId, companies, location, headless = true, perCompany = 5 } = opts;

  const out: any[] = [];
  for (const c of companies) {
    const keywords = buildPeopleKeywords(c.company, location);

    const peopleUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
    const people = await scrapeLinkedInSearch(peopleUrl, userId, headless, 90000);

    // keep top N candidates
    const top = people
      .filter(p => p.name || p.title)
      .slice(0, perCompany);

    // Try to guess website from company name: we'll use simple google-like pattern later,
    // but here we try visiting LinkedIn company page or the first profile that has website in text.
    // As a simple starter, we won't browse LinkedIn company page; we'll attempt public website enrichment by name.
    const website = await tryGuessWebsiteFromName(c.company);

    // For each person, try to discover emails/phones from website (public)
    for (const person of top) {
      let email = person.email || "";
      let phone = person.phone || "";

      if (website && (!email || !phone)) {
        const found = await discoverEmailsAndPhones(website, { limit: 1 });
        if (found?.emails?.length) email = email || found.emails[0];
        if (found?.phones?.length) phone = phone || found.phones[0];
      }

      out.push({
        company: c.company,
        company_linkedin: c.linkedin_url || "",
        website: website || "",
        name: person.name || "",
        title: person.title || "",
        linkedin_url: person.linkedin_url || "",
        email,
        phone,
      });
    }
  }
  return out;
}

// Very naive website guesser you can improve later
async function tryGuessWebsiteFromName(name: string): Promise<string | null> {
  // heuristic: use common TLDs and remove spaces
  const stem = name.toLowerCase().replace(/[^\w]+/g, "");
  const candidates = [`https://www.${stem}.com`, `https://www.${stem}.io`, `https://www.${stem}.co`];
  // We could check status codes with fetch, but Playwright is already used elsewhere.
  // Keep it simple: return first candidate; enrichment will fail gracefully if not reachable.
  return candidates[0];
}
