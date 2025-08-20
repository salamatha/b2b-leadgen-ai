// worker/src/scrapers/linkedin.ts
import type { Page } from "playwright";
import { withLinkedIn, runTopBarSearch, ensureVertical } from "../utils/withLinkedIn.ts";

export type Vertical = "companies" | "people" | "jobs" | "posts";

const vertLabel: Record<Exclude<Vertical, "jobs" | "posts">, RegExp> = {
  companies: /Companies|Companies & Pages|Companies and Pages/i,
  people: /People/i,
};

function isSearchUrl(u: string) {
  return /linkedin\.com\/search\/results\//i.test(u);
}
function isHomeOrFeedUrl(u: string) {
  return /linkedin\.com\/(?:feed\/?$|$)/i.test(u);
}

/** Open a LinkedIn search using the stored session; falls back to UI search if bounced to home/feed. */
export async function scrapeLinkedInSearch(
  userId: string,
  query: string,
  vertical: Exclude<Vertical, "jobs" | "posts"> = "companies",
  debug = false
) {
  return withLinkedIn(
    userId,
    async (page: Page) => {
      await page.goto("https://www.linkedin.com/", { waitUntil: "domcontentloaded" });

      if (isHomeOrFeedUrl(page.url())) {
        await runTopBarSearch(page, query, debug);
        await ensureVertical(page, vertLabel[vertical], debug);
      } else if (isSearchUrl(page.url())) {
        await ensureVertical(page, vertLabel[vertical], debug);
      } else {
        const encoded = encodeURIComponent(query);
        const pathMap: Record<typeof vertical, string> = {
          companies: "companies",
          people: "people",
        };
        const target = `https://www.linkedin.com/search/results/${pathMap[vertical]}/?keywords=${encoded}`;
        await page.goto(target, { waitUntil: "domcontentloaded" });

        if (isHomeOrFeedUrl(page.url())) {
          await runTopBarSearch(page, query, debug);
          await ensureVertical(page, vertLabel[vertical], debug);
        }
      }

      await page.waitForTimeout(1000);
      const title = await page.title();
      const finalUrl = page.url();
      const preview = await page.evaluate(() => document.body.innerText.slice(0, 500));
      return { ok: true as const, title, finalUrl, preview };
    },
    { headless: true, timeoutMs: 35000, debug }
  );
}

/** Preview helper used by the API */
export async function previewSearch(
  userId: string,
  urlOrQuery: string,
  vertical: "companies" | "people"
) {
  return withLinkedIn(
    userId,
    async (page: Page) => {
      if (/^https?:\/\//i.test(urlOrQuery)) {
        await page.goto(urlOrQuery, { waitUntil: "domcontentloaded" });
      } else {
        await page.goto("https://www.linkedin.com/", { waitUntil: "domcontentloaded" });
        await runTopBarSearch(page, urlOrQuery);
        await ensureVertical(page, vertical === "companies" ? /Companies/i : /People/i);
      }

      const results =
        vertical === "companies" ? await parseCompanyCards(page) : await parsePeopleCards(page);

      return {
        ok: true as const,
        vertical,
        count: results.length,
        results: results.slice(0, 10),
        finalUrl: page.url(),
        title: await page.title(),
      };
    },
    { headless: true, timeoutMs: 35000 }
  );
}

/** Basic parsers (tolerant to old/new LI search UI) */
async function parseCompanyCards(page: Page) {
  const cards = await page.$$('.reusable-search__result-container, .entity-result');
  const out: any[] = [];
  for (const c of cards) {
    const name = await c.$eval('span[aria-hidden="true"], .entity-result__title-text a', el => el.textContent?.trim()).catch(() => null);
    const link = await c.$eval('a[href*="/company/"]', el => (el as HTMLAnchorElement).href).catch(() => null);
    const subtitle = await c.$eval('.entity-result__primary-subtitle, .t-12.t-black--light', el => el.textContent?.trim()).catch(() => null);
    if (name && link) out.push({ name, link, subtitle });
  }
  return out;
}

async function parsePeopleCards(page: Page) {
  const cards = await page.$$('.reusable-search__result-container, .entity-result');
  const out: any[] = [];
  for (const c of cards) {
    const name = await c.$eval('span[aria-hidden="true"]', el => el.textContent?.trim()).catch(() => null);
    const link = await c.$eval('a[href*="/in/"]', el => (el as HTMLAnchorElement).href).catch(() => null);
    const headline = await c.$eval('.entity-result__primary-subtitle, .entity-result__summary', el => el.textContent?.trim()).catch(() => null);
    if (name && link) out.push({ name, link, headline });
  }
  return out;
}
