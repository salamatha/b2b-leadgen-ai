// server/routes/linkedin.ts
import express, { Router } from "express";
import { chromium } from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import {
  getLinkedInSession,
  saveLinkedInSession,
  deleteLinkedInSession,
} from "../../db/linkedinSession.ts";

const router: Router = express.Router();

function isClosed(obj: { isClosed?: () => boolean } | null | undefined) {
  try { return !!obj?.isClosed?.(); } catch { return true; }
}

/** GET /api/linkedin/session/:userId */
router.get("/session/:userId", async (req, res) => {
  try {
    const state = await getLinkedInSession(req.params.userId);
    res.json({ ok: true, exists: !!state });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
});

/** PUT /api/linkedin/session/:userId  body: { storageState: PlaywrightJSON } */
router.put("/session/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let storageState = req.body?.storageState;
    if (!storageState) return res.status(400).json({ ok: false, error: "storageState is required" });

    if (typeof storageState === "string") {
      try { storageState = JSON.parse(storageState); }
      catch { return res.status(400).json({ ok: false, error: "storageState must be JSON or JSON string" }); }
    }

    await saveLinkedInSession(userId, storageState);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
});

/** DELETE /api/linkedin/session/:userId */
router.delete("/session/:userId", async (req, res) => {
  try {
    await deleteLinkedInSession(req.params.userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
});

/** GET /api/linkedin/status?userId=...  (validates session by loading feed) */
router.get("/status", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const storageState = await getLinkedInSession(userId);
    if (!storageState) return res.json({ connected: false, reason: "no_storage_state" });

    const browser: Browser = await chromium.launch({ headless: true });
    const context: BrowserContext = await browser.newContext({ storageState });

    let connected = false;
    let reason = "unknown";

    try {
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(30000);
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });

      const url = page.url();
      if (url.includes("/uas/login") || url.includes("/checkpoint/")) {
        connected = false;
        reason = "redirected_to_login";
      } else {
        const ok = await page.$("header.global-nav, .scaffold-finite-scroll, [data-test-global-nav-link]");
        connected = !!ok;
        reason = connected ? "ok" : "no_feed_selector";
      }
    } catch {
      connected = false;
      reason = "playwright_error";
    } finally {
      try { await context.close(); } catch {}
      try { await browser.close(); } catch {}
    }

    return res.json({ connected, reason });
  } catch (e: any) {
    console.error("status error:", e);
    return res.status(500).json({ error: e.message || "status failed" });
  }
});

/** POST /api/linkedin/open-login  body: { userId } (GUI login on host; auto-saves storageState) */
router.post("/open-login", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    try {
      browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--start-maximized"] });
    } catch {
      browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
    }
    context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
    page = await context.newPage();

    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

    // Background watcher to save storageState after successful login
    (async () => {
      try {
        for (let i = 0; i < 60; i++) {
          if (isClosed(page) || isClosed(context) || isClosed(browser)) break;
          await page!.waitForTimeout(3000);
          if (isClosed(page) || isClosed(context) || isClosed(browser)) break;

          const u = page!.url();
          if (u.includes("/feed/") || u.includes("/mynetwork/") || u.includes("/in/")) {
            try {
              const storage = await context!.storageState();
              await saveLinkedInSession(userId, storage);
            } catch (err) {
              console.error("open-login save session error:", err);
            }
            break;
          }
        }
      } catch (err) {
        console.error("open-login watcher error:", err);
      }
    })();

    return res.json({
      ok: true,
      message: "If no window appears on this host, run the local login script and upload to /api/linkedin/session/:userId.",
    });
  } catch (e: any) {
    console.error("open-login error:", e);
    return res.status(500).json({ error: e.message || "open-login failed" });
  }
});

/** POST /api/linkedin/force-logout  body: { userId } */
router.post("/force-logout", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    await deleteLinkedInSession(userId);
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("force-logout error:", e);
    return res.status(500).json({ error: e.message || "force-logout failed" });
  }
});

export default router;
