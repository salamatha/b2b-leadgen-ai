// worker/src/hunter/chainHunter.ts
import { chromium } from "playwright";
import type { BrowserContext, Page } from "playwright";
import { getLinkedInSession  } from "../../../db/linkedinSession.ts";

const isLoginOrCheckpoint = (url: string) =>
  url.includes("/uas/login") || url.includes("/checkpoint/");
const isHomepageOrFeed = (url: string) =>
  url === "https://www.linkedin.com/" || url.startsWith("https://www.linkedin.com/feed/");

type Vertical = "companies" | "people" | "jobs" | "posts";

type ChainArgs = {
  userId: string;
  query: string;
  location?: string;
  companiesLimit?: number;
  peoplePerCompany?: number;
  headless?: boolean;
  timeoutMs?: number;
};

export async function huntCompaniesPeopleProfiles(args: ChainArgs) {
  const {
    userId,
    query,
    location,
    companiesLimit = 5,
    peoplePerCompany = 5,
    headless = true,
    timeoutMs = 120000,
  } = args;

  const sessionStr = await getUserSession(userId);
  const storage = sessionStr ? JSON.parse(sessionStr) : undefined;
  if (!storage?.cookies?.length) {
    throw new LinkedInSessionError("No LinkedIn session in DB. Connect it in Settings.");
  }

  const browser = await chromium.launch({ headless });
  const context: BrowserContext = await browser.newContext({
    storageState: storage,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
    viewport: { width: 1366, height: 860 },
  });

  await context.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "media" || type === "font") return route.abort();
    route.continue();
  });

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(timeoutMs);
  page.setDefaultTimeout(timeoutMs);

  const out: any[] = [];

  try {
    // 1) Companies search (URL + UI fallback)
    const companiesUrl = buildCompaniesUrl(query, location);
    await hardGotoWithUI(page, companiesUrl, "companies", buildQuery(query, location), timeoutMs);

    const companyCards = await collectCards(page, [
      "[data-entity-result]",
      ".reusable-search__result-container",
      ".search-content__result",
    ]);
    const companies = extractCompanies(companyCards).slice(0, companiesLimit);

    // 2) For each company → people search
    for (const c of companies) {
      const peopleQ = `${c.name} ${location || ""}`.trim();
      const peopleUrl = buildPeopleUrl(peopleQ);
      await hardGotoWithUI(page, peopleUrl, "people", peopleQ, timeoutMs);

      const peopleCards = await collectCards(page, [
        "[data-entity-result]",
        ".reusable-search__result-container",
        ".search-content__result",
      ]);
      const people = extractPeople(peopleCards).slice(0, peoplePerCompany);

      for (const p of people) {
        out.push({
          company: c.name || "",
          company_linkedin: c.linkedin_url || "",
          website: "",
          name: p.name || "",
          title: p.title || "",
          linkedin_url: p.linkedin_url || "",
          email: "",
          phone: "",
        });
      }
    }

    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    return out;
  } catch (e) {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    throw e;
  }
}

function buildQuery(q: string, location?: string) {
  return location ? `${q} ${location}` : q;
}
function buildCompaniesUrl(query: string, location?: string) {
  const q = encodeURIComponent(buildQuery(query, location));
  return `https://www.linkedin.com/search/results/companies/?keywords=${q}`;
}
function buildPeopleUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://www.linkedin.com/search/results/people/?keywords=${q}`;
}

async function hardGotoWithUI(page: Page, targetUrl: string, vertical: Vertical, query: string, timeoutMs: number) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });

  if (isLoginOrCheckpoint(page.url())) {
    throw new LinkedInSessionError(
      `Redirected to login/checkpoint at ${page.url()} — session likely expired.`
    );
  }

  // If bounced to home/feed → run UI search
  if (isHomepageOrFeed(page.url())) {
    await uiSearchAndFilter(page, query, vertical, timeoutMs);
  }

  // confirm we see some results
  const ok = await waitForAny(page, [
    "[data-entity-result]",
    ".reusable-search__result-container",
    ".jobs-search-results__list-item",
    ".search-content__result",
  ], 20000);

  if (!ok) {
    // Scroll a bit and try again
    await resilientScroll(page, 1500);
    const ok2 = await waitForAny(page, [
      "[data-entity-result]",
      ".reusable-search__result-container",
      ".jobs-search-results__list-item",
      ".search-content__result",
    ], 15000);
    if (!ok2) {
      throw new Error(`Timeout waiting for results (tried selectors). URL: ${page.url()}`);
    }
  }
}

async function uiSearchAndFilter(page: Page, query: string, vertical: Vertical, timeoutMs: number) {
  if (!page.url().startsWith("https://www.linkedin.com/feed")) {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: timeoutMs });
  }
  if (isLoginOrCheckpoint(page.url())) {
    throw new LinkedInSessionError("Session expired before UI search.");
  }

  const inputSel = await firstVisible(page, [
    'input[placeholder*="Search"]',
    'input[aria-label="Search"]',
    'input.search-global-typeahead__input',
    'input[role="combobox"]',
  ], 8000);
  if (!inputSel) throw new Error("Could not find LinkedIn global search input.");

  await page.click(inputSel, { delay: 50 });
  await page.fill(inputSel, query, { timeout: 8000 });
  await page.keyboard.press("Enter");
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

  const verticalCandidates: Record<Vertical, string[]> = {
    companies: [
      'button[aria-label*="Companies"]',
      'button[role="tab"][data-search-vertical="COMPANIES"]',
      'a[role="tab"][data-test-search-vertical="COMPANIES"]',
      'button:has-text("Companies")',
      'a:has-text("Companies")',
    ],
    people: [
      'button[aria-label*="People"]',
      'button[role="tab"][data-search-vertical="PEOPLE"]',
      'a[role="tab"][data-test-search-vertical="PEOPLE"]',
      'button:has-text("People")',
      'a:has-text("People")',
    ],
    jobs: [
      'button[aria-label*="Jobs"]',
      'button[role="tab"][data-search-vertical="JOBS"]',
      'a[role="tab"][data-test-search-vertical="JOBS"]',
      'button:has-text("Jobs")',
      'a:has-text("Jobs")',
    ],
    posts: [
      'button[aria-label*="Posts"]',
      'button[role="tab"][data-search-vertical="CONTENT"]',
      'a[role="tab"][data-test-search-vertical="CONTENT"]',
      'button:has-text("Posts")',
      'a:has-text("Posts")',
    ],
  };

  const tabSel = await firstVisible(page, verticalCandidates[vertical], 8000);
  if (tabSel) {
    await page.click(tabSel).catch(() => {});
    await page.waitForLoadState("domcontentloaded", { timeout: 12000 });
  }
}

async function collectCards(page: Page, selectors: string[]) {
  await resilientScroll(page, 1200);
  await waitForAny(page, selectors, 5000).catch(() => {});
  return page.evaluate((sels: string[]) => {
    const uniq: Element[] = [];
    const lists: NodeListOf<Element>[] = sels.map((s) => document.querySelectorAll(s));
    lists.forEach((nl) => nl.forEach((el) => { if (!uniq.includes(el)) uniq.push(el); }));
    return uniq.map((el) => el.outerHTML);
  }, selectors);
}

function extractCompanies(cardsHTML: string[]) {
  return cardsHTML.map((html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const txt = (sel: string) =>
      (div.querySelector(sel)?.textContent || "").replace(/\s+/g, " ").trim();
    const a =
      (div.querySelector("a.app-aware-link") as HTMLAnchorElement) ||
      (div.querySelector("a") as HTMLAnchorElement);
    return {
      name:
        txt("span[aria-hidden='true']") ||
        txt(".entity-result__title-text") ||
        txt(".app-aware-link") ||
        "",
      linkedin_url: a?.href ? a.href.split("?")[0] : "",
    };
  }).filter((r) => r.name || r.linkedin_url);
}

function extractPeople(cardsHTML: string[]) {
  return cardsHTML.map((html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const txt = (sel: string) =>
      (div.querySelector(sel)?.textContent || "").replace(/\s+/g, " ").trim();
    const a =
      (div.querySelector("a.app-aware-link") as HTMLAnchorElement) ||
      (div.querySelector("a") as HTMLAnchorElement);
    return {
      name:
        txt("span[aria-hidden='true']") ||
        txt(".entity-result__title-text") ||
        "",
      title:
        txt(".entity-result__primary-subtitle") ||
        txt(".subline-level-1") ||
        "",
      linkedin_url: a?.href ? a.href.split("?")[0] : "",
    };
  }).filter((r) => r.name || r.linkedin_url);
}

async function firstVisible(page: Page, selectors: string[], perTimeout = 4000) {
  for (const sel of selectors) {
    try {
      const el = await page.waitForSelector(sel, { state: "visible", timeout: perTimeout });
      if (el) return sel;
    } catch {}
  }
  return null;
}

async function waitForAny(page: Page, selectors: string[], timeout: number) {
  try {
    await Promise.race(selectors.map((s) => page.waitForSelector(s, { state: "visible", timeout })));
    return true;
  } catch { return false; }
}

async function resilientScroll(page: Page, totalMs = 1200) {
  const step = 400, interval = 200, iter = Math.floor(totalMs / interval);
  for (let i = 0; i < iter; i++) {
    try {
      const u = page.url();
      if (isLoginOrCheckpoint(u)) throw new LinkedInSessionError("Session expired during scroll.");
      await page.evaluate((y) => window.scrollBy(0, y), step);
      await page.waitForTimeout(interval);
    } catch (err: any) {
      const m = String(err?.message || "");
      if (
        m.includes("Execution context was destroyed") ||
        m.includes("Most likely because of a navigation") ||
        m.includes("Target page, context or browser has been closed")
      ) break;
      else throw err;
    }
  }
}
