// worker/src/scrapers/linkedin.ts
import type { Page } from "playwright";
import withLinkedIn, {
  runTopBarSearch,
  ensureVertical,
  maybeAcceptCookies,
} from "../utils/withLinkedIn.ts";


export type Vertical = "companies" | "people" | "jobs" | "posts";

const vertLabel: Record<Exclude<Vertical, "jobs" | "posts">, RegExp> = {
  companies: /Companies|Companies & Pages|Companies and Pages/i,
  people: /People/i,
};

function isSearchUrl(u: string) { return /linkedin\.com\/search\/results\//i.test(u); }
function isHomeOrFeedUrl(u: string) { return /linkedin\.com\/(?:feed\/?$|$)/i.test(u); }
function isLoginOrCheckpoint(u: string) { return /\/uas\/login|\/checkpoint\//i.test(u); }
function isChromeErrorUrl(u: string) { return /^chrome-error:\/\//i.test(u) || /^about:blank$/i.test(u); }

/* ---------------- helpers: safe nav + warmup ---------------- */

async function gotoSafe(page: Page, url: string, debug = false) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("ERR_TOO_MANY_REDIRECTS")) {
      if (debug) console.log("[LI] gotoSafe redirect loop:", url);
      // Let caller decide next step; we don't throw here to allow fallbacks.
      return;
    }
    throw e;
  }
}

async function warmupFeed(page: Page, debug = false) {
  // Load feed first to stabilize cookies/session and to detect login
  await gotoSafe(page, "https://www.linkedin.com/feed/", debug);
  await maybeAcceptCookies(page);
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  const u = page.url();

  if (isLoginOrCheckpoint(u)) {
    throw new Error("Session invalid: redirected to login/checkpoint");
  }

  if (isChromeErrorUrl(u)) {
    // Retry from homepage — sometimes feed triggers chrome-error under AV/proxy
    if (debug) console.log("[LI] warmupFeed saw chrome-error/about:blank; retrying /");
    await gotoSafe(page, "https://www.linkedin.com/", debug);
    await maybeAcceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  }
}

/* ---------------- results waiting ---------------- */

const RESULTS_SELECTORS = [
  // Classic & reusable
  '[data-search-results-container]',
  '.search-results-container',
  '.reusable-search__result-container',
  '.search-results__list',
  'ul.reusable-search__entity-result-list',
  '.scaffold-finite-scroll',

  // New SERP shells (voyager-web)
  'main.search-scaffold-v2',
  '[data-test-search-results]',
  '[data-test-search-results-list]',
  '[data-test-search-vertical-nav]',
  '[data-view-name="search-results"]',
  'div.search-results-page',
  'section.search-results-container',

  // Generic fallbacks
  'main[role="main"]',
  'div[role="main"]',
];

async function waitForResults(page: Page, timeout = 20000) {
  const exists = async (sels: string[], t: number) => {
    await Promise.any(sels.map(sel => page.waitForSelector(sel, { timeout: t })));
  };

  const url = page.url();

  try {
    // 1) voyager shell presence
    await exists(
      [
        'meta[name="voyager-web/config/environment"]',
        ...RESULTS_SELECTORS,
      ],
      Math.min(10000, timeout)
    );

    // 2) let hydrate
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600);

    // 3) prefer visible rows
    try {
      await Promise.any(
        [
          'li.reusable-search__result-container',
          'li.search-results__result-item',
          '[data-urn^="urn:li:fsd_entityResult"]',
          '[data-test-search-result-item]',
        ].map(sel => page.waitForSelector(sel, { state: 'visible', timeout: 6000 }))
      );
      return true;
    } catch {
      // no visible rows yet — ok for preview
    }

    const title = (await page.title().catch(() => '')) || '';
    const onSearchUrl = /\/search\/results\//i.test(url);
    const hasShell = await page.$(
      [
        'main.search-scaffold-v2',
        '[data-test-search-results]',
        '[data-test-search-vertical-nav]',
        'div.search-results-page',
      ].join(',')
    );

    if (onSearchUrl && (hasShell || /search\s*\|\s*linkedin/i.test(title))) {
      return true;
    }

    // nudge
    await page.evaluate(() => window.scrollBy(0, 900)).catch(() => {});
    await page.waitForTimeout(500);
    const stillHasShell = await page.$(RESULTS_SELECTORS.join(','));
    if (onSearchUrl && stillHasShell) return true;

    throw new Error('All promises were rejected');
  } catch (e) {
    // If clearly on a search URL, don't fail preview
    const title = (await page.title().catch(() => '')) || '';
    if (/\/search\/results\//i.test(url) || /search\s*\|\s*linkedin/i.test(title)) return true;
    throw e;
  }
}

/* ---------------- URL builders ---------------- */

function buildVerticalUrl(vertical: "companies" | "people", keywords: string, origin: string = "GLOBAL_SEARCH_HEADER") {
  const kw = encodeURIComponent((keywords || " ").trim());
  const path = vertical === "people" ? "people" : "companies";
  return `https://www.linkedin.com/search/results/${path}/?keywords=${kw}&origin=${origin}`;
}
function buildAllUrl(keywords: string, origin: string = "GLOBAL_SEARCH_HEADER") {
  const kw = encodeURIComponent((keywords || " ").trim());
  return `https://www.linkedin.com/search/results/all/?keywords=${kw}&origin=${origin}`;
}

/* ---------------- open search with robust fallbacks ---------------- */

async function openSearchWithFallback(
  page: Page,
  vertical: "companies" | "people",
  keywords: string,
  debug = false
) {
  const directVertical = buildVerticalUrl(vertical, keywords);
  const directAll = buildAllUrl(keywords);

  const candidates = [
    directVertical,
    directAll,
    directVertical + "&sid=0",
    directAll + "&sid=0",
  ];

  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    if (debug) console.log(`[LI] direct try ${i + 1}/${candidates.length} → ${url}`);

    await gotoSafe(page, url, debug);

    await maybeAcceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    let u = page.url();

    // If Chrome error or blank, do UI-search fallback immediately
    if (isChromeErrorUrl(u)) {
      if (debug) console.log("[LI] chrome-error after direct try; UI fallback path");
      await warmupFeed(page, debug);
      await runTopBarSearch(page, keywords, debug);
      await ensureVertical(page, vertLabel[vertical], debug, keywords).catch(() => {});
      await waitForResults(page, 20000).catch(() => {});
      return;
    }

    if (isLoginOrCheckpoint(u)) throw new Error("Session invalid: redirected to login/checkpoint");

    // If we actually landed on a search page (not home/feed), enforce vertical and finish
    if (isSearchUrl(u) && !isHomeOrFeedUrl(u)) {
      await ensureVertical(page, vertLabel[vertical], debug, keywords).catch(() => {});
      await waitForResults(page, 20000).catch(() => {});
      return;
    }

    // tiny pause and try next candidate
    await page.waitForTimeout(400);
  }

  // FINAL fallbacks — go via ALL then UI search
  const finalAll = buildAllUrl(keywords, "SEARCH_HOME");
  if (debug) console.log("[LI] final ALL fallback →", finalAll);
  await gotoSafe(page, finalAll, debug);

  await maybeAcceptCookies(page);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

  if (isChromeErrorUrl(page.url())) {
    if (debug) console.log("[LI] chrome-error on final ALL → warmup + UI search");
  }

  await warmupFeed(page, debug);
  await runTopBarSearch(page, keywords, debug);
  await ensureVertical(page, vertLabel[vertical], debug, keywords).catch(() => {});
  await waitForResults(page, 20000).catch(() => {});
}

/* ---------------- Public: scrape + preview ---------------- */

export async function scrapeLinkedInSearch(
  userId: string,
  query: string,
  vertical: Exclude<Vertical, "jobs" | "posts"> = "companies",
  debug = false
) {
  return withLinkedIn(
    userId,
    async (_ctx, page: Page) => {
      try {
        // Warmup feed first to stabilize session and detect login issues early
        await warmupFeed(page, debug);

        if (/^https?:\/\//i.test(query)) {
          await gotoSafe(page, query, debug);
          await maybeAcceptCookies(page);
          await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

          let u = page.url();

          if (isChromeErrorUrl(u)) {
            if (debug) console.log("[LI] chrome-error on direct URL; switching to UI flow");
            const kw = new URL(query).searchParams.get("keywords") || "";
            await openSearchWithFallback(page, vertical, kw || " ", debug);
          } else if (isLoginOrCheckpoint(u)) {
            throw new Error("Session invalid: redirected to login/checkpoint");
          } else if (!isSearchUrl(u) || isHomeOrFeedUrl(u)) {
            const kw = new URL(query).searchParams.get("keywords") || "";
            await openSearchWithFallback(page, vertical, kw || " ", debug);
          }
        } else {
          // keywords path
          await openSearchWithFallback(page, vertical, query, debug);
        }

        await waitForResults(page, 20000);
        const title = await page.title();
        const finalUrl = page.url();
        const preview = await page.evaluate(() => document.body.innerText.slice(0, 1200)).catch(() => "");
        return { ok: true as const, title, finalUrl, preview };
      } catch (err: any) {
        // DIAGNOSTICS: capture state
        const title = await page.title().catch(() => "");
        const finalUrl = page.url();
        let htmlSnippet = "";
        try { htmlSnippet = await page.content(); htmlSnippet = htmlSnippet.slice(0, 3000); } catch {}
        try { await page.screenshot({ path: "li_preview_error.png", fullPage: true }).catch(() => {}); } catch {}
        const msg = err?.message || String(err);
        throw new Error(`scrapeLinkedInSearch failed: ${msg} | url=${finalUrl} | title=${title} | html[0..3000]=${htmlSnippet}`);
      }
    },
    // keep your existing withLinkedIn signature/opts
    { headless: true, timeoutMs: 70000, debug }
  );
}

export async function previewSearch(
  userId: string,
  urlOrQuery: string,
  vertical: "companies" | "people"
) {
  return withLinkedIn(
    userId,
    async (_ctx, page: Page) => {
      try {
        // Warmup feed first
        await warmupFeed(page, false);

        if (/^https?:\/\//i.test(urlOrQuery)) {
          // Try direct URL; tolerate redirect loops and chrome-error
          await gotoSafe(page, urlOrQuery, false);

          await maybeAcceptCookies(page);
          await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

          let u = page.url();

          if (isChromeErrorUrl(u) || isHomeOrFeedUrl(u) || !isSearchUrl(u)) {
            const kw = new URL(urlOrQuery).searchParams.get("keywords") || "";
            await openSearchWithFallback(page, vertical, kw || " ", false);
          } else if (isLoginOrCheckpoint(u)) {
            throw new Error("Session invalid: redirected to login/checkpoint");
          }
        } else {
          // Plain keywords
          await openSearchWithFallback(page, vertical, urlOrQuery, false);
        }

        await waitForResults(page, 20000);
        return {
          ok: true as const,
          vertical,
          finalUrl: page.url(),
          title: await page.title(),
          countHint: await page.$$eval(RESULTS_SELECTORS.join(","), els => els.length).catch(() => 0),
        };
      } catch (err: any) {
        const title = await page.title().catch(() => "");
        const finalUrl = page.url();
        let htmlSnippet = "";
        try { htmlSnippet = await page.content(); htmlSnippet = htmlSnippet.slice(0, 3000); } catch {}
        try { await page.screenshot({ path: "li_preview_error.png", fullPage: true }).catch(() => {}); } catch {}
        const msg = err?.message || String(err);
        throw new Error(`previewSearch failed: ${msg} | url=${finalUrl} | title=${title} | html[0..3000]=${htmlSnippet}`);
      }
    },
    { headless: true, timeoutMs: 70000 }
  );
}

export { default as withLinkedIn } from "../utils/withLinkedIn.ts";