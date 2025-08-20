import { chromium } from "playwright";
import fetch from "node-fetch";

// CHANGE THIS:
const USER_ID = "<your-user-uuid>";
const SERVER  = "http://localhost:3000"; // or your server URL

async function main() {
  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await context.newPage();

  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
  console.log("➡️  Log in to LinkedIn. Once you reach /feed, this script will save + upload.");

  // Simple watcher: wait up to ~3 min for a logged-in page
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(3000);
    const u = page.url();
    if (u.includes("/feed/") || u.includes("/in/") || u.includes("/mynetwork/")) {
      const storageState = await context.storageState();
      const res = await fetch(`${SERVER}/api/linkedin/session/${USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageState }),
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      console.log("✅ Uploaded storageState to server for user:", USER_ID);
      break;
    }
  }

  // Keep browser open so you can confirm; close manually if you like
  // await browser.close();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
