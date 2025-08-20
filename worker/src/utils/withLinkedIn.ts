// worker/src/utils/withLinkedIn.ts
import { chromium } from "playwright";
import { getLinkedInSession } from "../../../db/linkedinSession.ts";

export type LiOpts = { headless?: boolean; timeoutMs?: number; debug?: boolean };

export async function withLinkedIn<T>(
  userId: string,
  fn: (page: import("playwright").Page) => Promise<T>,
  opts: LiOpts = {}
): Promise<T> {
  const storageState = await getLinkedInSession(userId);
  if (!storageState) throw new Error(`No LinkedIn session stored for user_id=${userId}`);

  const browser = await chromium.launch({ headless: opts.headless ?? true });
  const context = await browser.newContext({
    storageState,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
    viewport: { width: 1366, height: 860 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(opts.timeoutMs ?? 30000);

  try {
    return await fn(page);
  } finally {
    try { await context.close(); } catch {}
    try { await browser.close(); } catch {}
  }
}

/** Helpers for homepage bounce + vertical enforcement */
export async function runTopBarSearch(page: any, q: string, debug = false) {
  const input =
    (await page.$('input[placeholder*="Search"][role="combobox"]')) ||
    (await page.$('input[aria-label="Search"]')) ||
    (await page.$('input[placeholder="Search"]'));
  if (!input) throw new Error("Top search input not found");
  await input.click({ delay: 50 });
  await page.keyboard.type(q, { delay: 20 });
  await page.keyboard.press("Enter");
  if (debug) console.log("[LI] search typed:", q);
  await page.waitForSelector(
    '[data-search-results-container], .search-results-container, .reusable-search__result-container, .search-results__list',
    { timeout: 15000 }
  );
}

export async function ensureVertical(page: any, label: RegExp, debug = false) {
  const tabs = await page.$$("a,button");
  for (const t of tabs) {
    const txt = (await t.innerText()).trim();
    if (label.test(txt)) {
      if (debug) console.log("[LI] click vertical:", txt);
      await t.click();
      await page.waitForTimeout(700);
      await page.waitForSelector(
        '[data-search-results-container], .search-results-container, .reusable-search__result-container, .search-results__list',
        { timeout: 15000 }
      );
      return;
    }
  }
  throw new Error(`Vertical tab not found: ${label}`);
}
