import { chromium } from "playwright";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

/** Visit a public website and try to find emails/phones in homepage + contact/about pages */
export async function discoverEmailsAndPhones(website: string, opts?: { limit?: number }) {
  const limit = opts?.limit ?? 2;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119 Safari/537.36",
  });
  const page = await context.newPage();

  const toVisit = [website, `${website}/contact`, `${website}/contact-us`, `${website}/about`, `${website}/about-us`];

  const emails = new Set<string>();
  const phones = new Set<string>();

  try {
    for (const url of toVisit) {
      if (emails.size >= limit && phones.size >= limit) break;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        const html = await page.content();

        // Extract
        const eMatches = html.match(EMAIL_RE) || [];
        eMatches.forEach((e) => emails.add(e));

        const pMatches = html.match(PHONE_RE) || [];
        pMatches.forEach((p) => {
          const clean = p.replace(/\s+/g, " ").trim();
          if (clean.length >= 7) phones.add(clean);
        });
      } catch {
        // ignore page errors
      }
    }
  } finally {
    await browser.close();
  }

  return {
    emails: Array.from(emails).slice(0, limit),
    phones: Array.from(phones).slice(0, limit),
  };
}
