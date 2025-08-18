import { chromium } from "playwright";
import type { BrowserContext, Page } from "playwright";
import { getUserSession } from "../../../db/linkedinSession.ts";

export interface LinkedInProfile {
  name: string;
  title: string;
  company: string;
  linkedin_url: string;
  email?: string;
  phone?: string;
  location?: string;
  source_type?: "people" | "jobs" | "companies" | "posts" | "unknown";
}

const PEOPLE_SEL = "[data-entity-result]";
const JOBS_SELS = [
  ".jobs-search-results__list-item",
  "li[data-occludable-job-id]",
  "li.scaffold-layout__list-item",
  ".job-card-container",
];
const COMPANIES_SELS = [
  ".reusable-search__entity-result-list .entity-result",
  ".entity-result",
];

export async function scrapeLinkedInSearch(
  url: string,
  userId: string,
  headless = true
): Promise<LinkedInProfile[]> {
  const browser = await chromium.launch({ headless, args: ["--disable-blink-features=AutomationControlled"] });
  let context: BrowserContext | undefined;

  try {
    const saved = await getUserSession(userId);
    if (!saved) throw new Error("No LinkedIn session found. Connect LinkedIn first.");

    context = await browser.newContext({ storageState: JSON.parse(saved) });
    context.setDefaultTimeout(90000);
    const page = await context.newPage();

    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
    if (page.url().includes("/login") || page.url().includes("/checkpoint/")) {
      throw new Error("Saved session invalid/expired. Disconnect and connect again.");
    }

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await dismissCookieBanner(page);
    if (page.url().includes("/checkpoint/")) {
      throw new Error("LinkedIn checkpoint detected. Reconnect your session.");
    }

    const kind = await waitForResults(page, 45000);
    await autoScroll(page);

    let rows: LinkedInProfile[] = [];
    if (kind === "people") rows = await scrapePeople(page);
    else if (kind === "jobs") rows = await scrapeJobs(page);
    else if (kind === "companies") rows = await scrapeCompanies(page);
    else {
      rows = await scrapePeople(page);
      if (!rows.length) rows = await scrapeJobs(page);
      if (!rows.length) rows = await scrapeCompanies(page);
    }

    if (!rows.length) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await autoScroll(page);
      const kind2 = await waitForResults(page, 30000);
      if (kind2 === "people") rows = await scrapePeople(page);
      else if (kind2 === "jobs") rows = await scrapeJobs(page);
      else if (kind2 === "companies") rows = await scrapeCompanies(page);
    }

    await browser.close();
    return rows;
  } catch (err) {
    try { await browser.close(); } catch {}
    throw err;
  }
}

async function waitForResults(page: Page, timeoutMs: number): Promise<"people"|"jobs"|"companies"|"unknown"> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const peopleCount = await page.$$eval(PEOPLE_SEL, els => els.length).catch(() => 0);
    if (peopleCount > 0) return "people";

    for (const sel of JOBS_SELS) {
      const jobsCount = await page.$$eval(sel, els => els.length).catch(() => 0);
      if (jobsCount > 0) return "jobs";
    }
    for (const sel of COMPANIES_SELS) {
      const compCount = await page.$$eval(sel, els => els.length).catch(() => 0);
      if (compCount > 0) return "companies";
    }
    await page.waitForTimeout(500);
  }
  throw new Error(
    `Timeout waiting for results (tried: PEOPLE=${PEOPLE_SEL}, JOBS=${JOBS_SELS.join(" | ")}, COMPANIES=${COMPANIES_SELS.join(" | ")})`
  );
}

async function dismissCookieBanner(page: Page) {
  try {
    const selectors = [
      'button[aria-label="Accept cookies"]',
      'button[aria-label="Allow all cookies"]',
      'button:has-text("Accept")',
      'button:has-text("Allow")',
    ];
    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) { await btn.click({ delay: 50 }); await page.waitForTimeout(300); break; }
    }
  } catch {}
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let total = 0;
      const step = 600;
      const timer = setInterval(() => {
        const sh = document.body.scrollHeight;
        window.scrollBy(0, step);
        total += step;
        if (total >= sh) { clearInterval(timer); resolve(); }
      }, 400);
    });
  });
}

async function scrapePeople(page: Page): Promise<LinkedInProfile[]> {
  return await page.evaluate(() => {
    const out: LinkedInProfile[] = [];
    const cards = document.querySelectorAll("[data-entity-result]");
    cards.forEach((card) => {
      const name = (card.querySelector("span[aria-hidden='true']")?.textContent || "").trim();
      const title = (card.querySelector(".entity-result__primary-subtitle, .t-14.t-black")?.textContent || "").trim();
      const company = (card.querySelector(".entity-result__secondary-subtitle")?.textContent || "").trim();
      const loc = (card.querySelector(".entity-result__secondary-subtitle.t-14.t-normal")?.textContent || "").trim();
      const linkEl = card.querySelector("a.app-aware-link") as HTMLAnchorElement | null;
      const linkedin_url = linkEl ? linkEl.href.split("?")[0] : "";
      out.push({ name, title, company, location: loc, linkedin_url, email: "", phone: "", source_type: "people" });
    });
    return out;
  });
}

async function scrapeJobs(page: Page): Promise<LinkedInProfile[]> {
  return await page.evaluate((JOBS_SELS: string[]) => {
    const out: LinkedInProfile[] = [];
    let nodes: Element[] = [];
    for (const sel of JOBS_SELS) {
      nodes = Array.from(document.querySelectorAll(sel));
      if (nodes.length) break;
    }
    nodes.forEach((node) => {
      const root = node as HTMLElement;
      const linkEl =
        (root.querySelector("a[href*='/jobs/view/']") ||
         root.closest("li")?.querySelector("a[href*='/jobs/view/']")) as HTMLAnchorElement | null;

      const name = (root.querySelector(".base-search-card__title, .job-card-list__title")?.textContent || "").trim();
      const company = (root.querySelector(".base-search-card__subtitle, .job-card-container__company-name")?.textContent || "").trim();
      const location = (root.querySelector(".job-search-card__location, .job-card-container__metadata-item")?.textContent || "").trim();
      const title = (root.querySelector(".base-search-card__metadata")?.textContent || "").trim();
      const linkedin_url = linkEl ? linkEl.href.split("?")[0] : "";
      out.push({ name, title, company, location, linkedin_url, email: "", phone: "", source_type: "jobs" });
    });
    return out;
  }, JOBS_SELS);
}

async function scrapeCompanies(page: Page): Promise<LinkedInProfile[]> {
  return await page.evaluate((COMPANIES_SELS: string[]) => {
    const out: LinkedInProfile[] = [];
    let nodes: Element[] = [];
    for (const sel of COMPANIES_SELS) {
      nodes = Array.from(document.querySelectorAll(sel));
      if (nodes.length) break;
    }
    nodes.forEach((card) => {
      const company = (card.querySelector(".entity-result__title-text a")?.textContent || "").trim();
      const linkEl = card.querySelector(".entity-result__title-text a") as HTMLAnchorElement | null;
      const linkedin_url = linkEl ? linkEl.href.split("?")[0] : "";
      const desc = (card.querySelector(".entity-result__primary-subtitle")?.textContent || "").trim();
      out.push({ name: company, title: desc, company, linkedin_url, email: "", phone: "", source_type: "companies" });
    });
    return out;
  }, COMPANIES_SELS);
}
