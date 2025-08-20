// worker/src/scrapers/linkedin.ts
import type { Page } from "playwright";
import { withLinkedIn, runTopBarSearch, ensureVertical } from "../utils/withLinkedIn.ts";

export type Vertical = "companies" | "people" | "jobs" | "posts";

const vertLabel: Record<Vertical, RegExp> = {
  companies: /Companies|Companies & Pages|Companies and Pages/i,
  people: /People/i,
  jobs: /Jobs/i,
  posts: /Posts/i,
};

function isSearchUrl(u: string) {
  return /linkedin\.com\/search\/results\//i.test(u);
}
function isHomeOrFeedUrl(u: string) {
  return /linkedin\.com\/(?:feed\/?$|$)/i.test(u);
}

/** Public entry: open a search (or homepage fallback) using stored session. */
export async function scrapeLinkedInSearch(userId: string, query: string, vertical: Vertical = "companies", debug = false) {
  return withLinkedIn(userId, async (page: Page) => {
    // Start at root to minimize redirect chains
    await page.goto("https://www.linkedin.com/", { waitUntil: "domcontentloaded" });

    // If bounced to home/feed or root → use top-bar fallback
    if (isHomeOrFeedUrl(page.url())) {
      await runTopBarSearch(page, query, debug);
      await ensureVertical(page, vertLabel[vertical], debug);
    } else if (isSearchUrl(page.url())) {
      // If already in search UI, enforce vertical
      await ensureVertical(page, vertLabel[vertical], debug);
    } else {
      // Try a canonical search deep-link once
      const encoded = encodeURIComponent(query);
      const pathMap: Record<Vertical, string> = {
        companies: "companies",
        people: "people",
        jobs: "jobs",
        posts: "content",
      };
      const target = `https://www.linkedin.com/search/results/${pathMap[vertical]}/?keywords=${encoded}`;
      await page.goto(target, { waitUntil: "domcontentloaded" });

      if (isHomeOrFeedUrl(page.url())) {
        await runTopBarSearch(page, query, debug);
        await ensureVertical(page, vertLabel[vertical], debug);
      }
    }

    // small settle time
    await page.waitForTimeout(1000);

    // Return a tiny preview to confirm we landed correctly
    const title = await page.title();
    const finalUrl = page.url();
    const preview = await page.evaluate(() => document.body.innerText.slice(0, 500));

    return { ok: true as const, title, finalUrl, preview };
  }, { headless: true, timeoutMs: 35000, debug });
}
