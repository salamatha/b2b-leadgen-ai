// worker/src/utils/withLinkedIn.ts
import fs from "fs";
import path from "path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { getLinkedInSession, saveLinkedInSession } from "../../../db/linkedinSession.ts";

/** Typed error your API can map to 401 and prompt reconnect */
export class LinkedInSessionError extends Error {
  code = "LINKEDIN_SESSION_INVALID";
  constructor(message = "LinkedIn session invalid") { super(message); this.name = "LinkedInSessionError"; }
}

/* ---------- Types ---------- */
type Cookie = {
  name: string; value: string; domain: string; path: string;
  expires?: number; httpOnly?: boolean; secure?: boolean;
  sameSite?: "Lax" | "None" | "Strict";
};
type StorageState = { cookies?: Cookie[]; origins?: any[] };

/* ---------- Small utils ---------- */
function isChromeError(u: string) {
  return /^chrome-error:\/\//i.test(u) || u === "about:blank";
}
function isLoginOrCheckpoint(u: string) {
  return /\/uas\/login|\/checkpoint\//i.test(u);
}
function userProfileDir(userId: string) {
  const base = path.join(process.cwd(), ".playwright", "profiles");
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return path.join(base, userId);
}

/* Normalize various DB shapes into a clean storage state (cookies only required) */
function normalizeState(raw: any): StorageState | null {
  if (!raw) return null;
  let obj: any = raw;
  if (typeof obj === "string") {
    try { obj = JSON.parse(obj); } catch { return null; }
  }
  obj = obj?.storage_state ?? obj?.session_json ?? obj;

  const cookies: Cookie[] = Array.isArray(obj?.cookies) ? obj.cookies : [];
  if (!cookies.length) return null;

  return {
    cookies: cookies
      .filter((c) => c?.name && c?.value)
      .map((c) => ({
        ...c,
        domain: c.domain?.startsWith(".") ? c.domain : (c.domain || ".linkedin.com"),
        path: c.path || "/",
        secure: c.secure ?? true,
        httpOnly: c.httpOnly ?? (c.name === "li_at"), // li_at is httpOnly=true in real browsers
        sameSite: (c.sameSite as any) || "None",
        expires: typeof c.expires === "number" ? c.expires : undefined, // seconds
      })),
    origins: Array.isArray(obj?.origins) ? obj.origins : [],
  };
}

/* Explicitly ensure li_at (+ optional JSESSIONID) exist in the context before nav */
async function enforceLiAt(context: BrowserContext, storage?: StorageState | null) {
  const cookies = storage?.cookies || [];
  const liAt = cookies.find(c => c.name === "li_at");
  if (!liAt?.value) return;

  // Clear linkedin.com cookies to avoid conflicts/duplicates
  const existing = await context.cookies("https://www.linkedin.com");
  if (existing.length) await context.clearCookies();

  const js = cookies.find(c => c.name === "JSESSIONID"); // optional

  const toAdd: any[] = [{
    name: "li_at",
    value: liAt.value,
    domain: ".linkedin.com",
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "None" as const,
    expires: typeof liAt.expires === "number" ? liAt.expires : undefined,
  }];
  if (js?.value) {
    toAdd.push({
      name: "JSESSIONID",
      value: js.value,
      domain: ".www.linkedin.com",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "None" as const,
      expires: typeof js.expires === "number" ? js.expires : undefined,
    });
  }
  await context.addCookies(toAdd);
}

/* Accept cookie banners when they show up */
export async function maybeAcceptCookies(page: Page) {
  try {
    const sel = [
      'button:has-text("Accept")',
      'button:has-text("I agree")',
      'button.artdeco-button--primary',
      '[data-test-global-alert-accept]',
    ].join(",");
    const btn = await page.$(sel);
    if (btn) await btn.click().catch(() => {});
  } catch {}
}

/**
 * PhantomBuster-style session wrapper:
 * - Persistent profile per user (survives restarts).
 * - Seeds li_at (and JSESSIONID if present) from DB cookies.
 * - Warms /feed to verify auth, then re-saves cookies (rolling).
 * - Supports callbacks of shape (page) or (ctx, page).
 */
export default async function withLinkedIn<T>(
  userId: string,
  fn: ((page: Page) => Promise<T>) | ((ctx: BrowserContext, page: Page) => Promise<T>),
  opts?: { headless?: boolean; timeoutMs?: number; debug?: boolean }
): Promise<T> {
  const headless = opts?.headless ?? true;
  const timeoutMs = opts?.timeoutMs ?? 60000;
  const debug = !!opts?.debug;

  const profileDir = userProfileDir(userId);
  const firstBoot = !fs.existsSync(path.join(profileDir, "Default"));

  let context: BrowserContext | null = null;

  try {
    // 1) persistent profile — real browser profile on disk
    context = await chromium.launchPersistentContext(profileDir, {
      headless,
      ignoreHTTPSErrors: true,
      viewport: { width: 1366, height: 860 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
      acceptDownloads: false,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure",
      ],
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(Math.min(timeoutMs, 30000));

    // 2) Seed cookies from DB if first run (or when we detect not logged in)
    const seedFromDB = async () => {
      const saved = await getLinkedInSession(userId).catch(() => null);
      const normalized = normalizeState(saved);
      if (normalized?.cookies?.length) {
        if (debug) console.log("[LI] Seeding cookies from DB");
        await enforceLiAt(context!, normalized);
      }
    };
    if (firstBoot) {
      if (debug) console.log("[LI] First boot for profile → will attempt DB seed");
      await seedFromDB();
    }

    // 3) Warmup /feed
    const warmup = async () => {
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" }).catch(() => {});
      await maybeAcceptCookies(page);
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      const u = page.url();
      if (isChromeError(u)) {
        await page.goto("https://www.linkedin.com/", { waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
      }
      if (isLoginOrCheckpoint(page.url())) {
        throw new LinkedInSessionError("Session invalid: redirected to login/checkpoint");
      }
    };

    try {
      await warmup();
    } catch (e) {
      // If we failed warmup, one re-seed attempt from DB then retry
      if (debug) console.log("[LI] Warmup failed → reseed from DB then retry once");
      await seedFromDB();
      await warmup(); // if this throws again, propagate
    }

    // 4) Rolling cookies back to DB (so you can move machines and keep session)
    try {
      const fresh = await context.storageState();
      await saveLinkedInSession(userId, fresh as any);
    } catch { /* non-fatal */ }

    // 5) Hand over to caller (supports (page) or (ctx,page))
    const out =
      (fn as any).length >= 2
        ? await (fn as (ctx: BrowserContext, page: Page) => Promise<T>)(context, page)
        : await (fn as (page: Page) => Promise<T>)(page);

    await context.close().catch(() => {});
    return out;
  } catch (err) {
    try { await context?.close(); } catch {}
    throw err;
  }
}

/* ---------- Helpers used by scrapers ---------- */
export async function runTopBarSearch(page: Page, q: string, debug = false) {
  await maybeAcceptCookies(page);

  try {
    await page.waitForSelector("header.global-nav, [data-test-global-nav-link], [data-test-global-nav]", {
      timeout: 8000,
    });
  } catch {}

  const toggles = [
    'button.global-nav__search-toggle',
    'button[aria-label*="Search"]',
    'button[aria-label*="Open search"]',
    '[data-test-global-nav-search-toggle]',
    '.search-global-typeahead__collapsed-search-button',
    'button[aria-haspopup="dialog"]',
  ];
  for (const sel of toggles) {
    const btn = await page.$(sel).catch(() => null);
    if (btn) { await btn.click().catch(() => {}); await page.waitForTimeout(250); }
  }

  const inputs = [
    'input[placeholder*="Search"][role="combobox"]',
    'input[aria-label="Search"]',
    'input[placeholder="Search"]',
    'input.search-global-typeahead__input',
    'input[role="combobox"]',
    '[data-id="typeahead-input"] input',
    'input[aria-controls*="typeahead"]',
    'input[aria-label*="Search for"]',
    'input[aria-label*="Search by keyword"]',
    'input[type="search"]',
    'div[role="search"] input',
  ];
  let sel: string | null = null;
  for (const s of inputs) { if (await page.$(s).catch(() => null)) { sel = s; break; } }

  if (!sel) {
    if (debug) console.log("[LI] no input found; fallback to /search/results/all");
    const fallback = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(q)}&origin=GLOBAL_SEARCH_HEADER`;
    await page.goto(fallback, { waitUntil: "domcontentloaded" });
    return;
  }

  await page.click(sel).catch(() => {});
  try { await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control"); } catch {}
  try { await page.keyboard.down("Meta"); await page.keyboard.press("A"); await page.keyboard.up("Meta"); } catch {}
  await page.keyboard.type(q, { delay: 15 });
  await page.keyboard.press("Enter");
}

export async function ensureVertical(page: Page, expectedLabel: RegExp, debug = false) {
  try {
    const candidates = [
      'button[role="tab"][data-search-vertical]',
      'a[role="tab"][data-test-search-vertical]',
      '[data-test-search-vertical-nav] button[role="tab"]',
      '[data-test-search-vertical-nav] a[role="tab"]',
      'nav[aria-label*="Search"] a[role="tab"]',
      'nav[aria-label*="Search"] button[role="tab"]',
      'button:has-text("People")','button:has-text("Companies")',
      'a:has-text("People")','a:has-text("Companies")',
    ];
    const tabs = await page.$(candidates.join(",")).catch(() => null);
    const all = tabs ? await page.$$(candidates.join(",")) : [];
    for (const t of all) {
      const txt = (await t.innerText().catch(() => "")) || "";
      if (expectedLabel.test(txt)) {
        await t.click().catch(() => {});
        await page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {});
        break;
      }
    }
  } catch (e) {
    if (debug) console.log("[LI] ensureVertical failed:", (e as any)?.message || e);
  }
}
