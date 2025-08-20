// worker/src/hunter/chainHunter.ts
import { scrapeLinkedInSearch } from "../scrapers/linkedin.ts";

export type Vertical = "companies" | "people";

export type HuntArgs = {
  userId: string;
  /** LinkedIn search query text OR a full LinkedIn search URL */
  query: string;
  /** Which vertical to open for the preview/scrape */
  vertical?: Vertical; // default: "companies"
  debug?: boolean;
};

/**
 * Orchestrator entry:
 * - Runs a single-hop LinkedIn search using the stored session.
 * - Uses the scraper's built-in UI fallback (handles / and /feed bounces).
 * - Returns a small preview payload ({ ok, title, finalUrl, preview }).
 *
 * Extend this later to do multi-hop (companies → people → profiles) and to
 * persist results into the DB after parsing.
 */
export async function huntCompaniesPeopleProfiles({
  userId,
  query,
  vertical = "companies",
  debug = false,
}: HuntArgs) {
  const res = await scrapeLinkedInSearch(userId, query, vertical, debug);
  return res;
}
