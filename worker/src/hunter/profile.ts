import type { BrowserContext, Page } from "playwright";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

export async function scrapeLinkedInProfile(context: BrowserContext, profileUrl: string, timeoutMs = 45000) {
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);
  try {
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });

    // If Contact info link exists, open it
    const contactSel = 'a[href*="/detail/contact-info/"], a:has-text("Contact info"), button:has-text("Contact info")';
    const hasContact = await page.$(contactSel);
    let emails: string[] = [];
    let phones: string[] = [];
    let websites: string[] = [];

    if (hasContact) {
      await Promise.race([
        page.click(contactSel).catch(() => null),
        page.waitForTimeout(300),
      ]);
      // Modal content container variants
      const modalSel = [
        ".pv-contact-info", "div[role='dialog']", ".artdeco-modal__content"
      ];
      for (const sel of modalSel) {
        const ok = await page.$(sel);
        if (ok) {
          const html = await ok.innerHTML();
          const em = html.match(EMAIL_RE) || [];
          const ph = html.match(PHONE_RE) || [];
          emails = dedupe(em).slice(0, 3);
          phones = dedupe(ph.map((p) => p.replace(/\s+/g, " ").trim())).slice(0, 3);
          websites = Array.from(new Set(
            (html.match(/https?:\/\/[^\s"'<]+/gi) || [])
              .map((u) => u.replace(/["'<>()]+$/g, ""))
          )).slice(0, 5);
          break;
        }
      }
    }

    // Basic profile meta
    const name = (await page.locator("h1").first().textContent()).trim();
    const headline = (await textOrEmpty(page, ".pv-text-details__left-panel .text-body-medium"));
    const currentCompany = await textOrEmpty(page, ".pv-entity__secondary-title, .pv-entity__company-summary-info h2, .pv-top-card--experience-list li strong");

    return {
      name,
      headline,
      currentCompany,
      linkedin_url: profileUrl,
      emails,
      phones,
      websites,
    };
  } catch (e) {
    return {
      name: "",
      headline: "",
      currentCompany: "",
      linkedin_url: profileUrl,
      emails: [],
      phones: [],
      websites: [],
      error: (e as Error).message,
    };
  } finally {
    await page.close();
  }
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function textOrEmpty(page: Page, selector: string) {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: "attached", timeout: 1000 }).catch(() => null);
    const t = await el.textContent();
    return (t || "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
