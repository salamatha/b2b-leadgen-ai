import { chromium } from "playwright";
import type { Browser, BrowserContext } from "playwright"; // <- type-only import
import { saveUserSession } from "../../../db/linkedinSession.ts";

export async function openLinkedInLoginAndSaveSession(userId: string, headless = false) {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await chromium.launch({ headless }); // headless:false to show window on dev
    context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
    console.log("⚠️ Complete LinkedIn login in the opened browser...");

    // Wait until user lands on an authenticated page
    await page.waitForURL(/linkedin\.com\/(feed|search|mynetwork|messaging|jobs|notifications)/, {
      timeout: 120000,
    });

    // Save storage state to DB (your column is storage_state)
    const storage = await context.storageState();
    await saveUserSession(userId, JSON.stringify(storage));
    console.log("✅ LinkedIn session saved for", userId);

    return { ok: true };
  } finally {
    if (browser) await browser.close();
  }
}
