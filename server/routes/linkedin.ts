// server/routes/linkedin.ts
import fs from "fs";
import path from "path";
import express from "express";
import { chromium } from "playwright";
import {
  getLinkedInSession,
  saveLinkedInSession,
  deleteLinkedInSession,
} from "../../db/linkedinSession.ts";
import withLinkedIn, { LinkedInSessionError } from "../../worker/src/utils/withLinkedIn.ts";

const router = express.Router();

/* ----------------------------- helpers ----------------------------- */

function isClosed(obj: { isClosed?: () => boolean } | null | undefined) {
  try { return !!obj?.isClosed?.(); } catch { return true; }
}

function userProfileDir(userId: string) {
  const base = path.join(process.cwd(), ".playwright", "profiles");
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return path.join(base, userId);
}

/* ----------------------------- session CRUD ----------------------------- */

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
    // also clear the persistent profile on disk (keeps behavior predictable)
    const dir = userProfileDir(req.params.userId);
    try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
});

/* ----------------------------- connection status ----------------------------- */

/**
 * GET /api/linkedin/status?userId=...
 * Validates by warming to /feed using the same persistent flow as scrapers.
 */
router.get("/status", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ ok: false, error: "userId required" });

  try {
    await withLinkedIn(
      userId,
      async (_ctx, page) => {
        await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
      },
      { headless: true, timeoutMs: 30000, debug: true }
    );

    return res.json({ ok: true, connected: true });
  } catch (e: any) {
    if (e instanceof LinkedInSessionError) {
      return res.json({ ok: true, connected: false, reason: "redirected_to_login" });
    }
    return res.json({ ok: true, connected: false, reason: "playwright_error", detail: e?.message });
  }
});

/* ----------------------------- open-login (headful) ----------------------------- */

/**
 * POST /api/linkedin/open-login
 * body: { userId }
 * Launches a persistent Chromium for this user, navigates to LinkedIn login,
 * and saves cookies once the user reaches feed/profile.
 */
router.post("/open-login", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, error: "userId required" });

  const profileDir = userProfileDir(userId);

  // Run headful *persistent* so session sticks for future runs
  const ctx = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1366, height: 860 },
    ignoreHTTPSErrors: true,
    args: ["--start-maximized"],
  });

  try {
    const page = await ctx.newPage();
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

    // background watcher to save on success
    (async () => {
      try {
        for (let i = 0; i < 120; i++) {
          if (isClosed(ctx)) break;
          await page.waitForTimeout(2500).catch(() => {});
          const u = page.url();
          if (/linkedin\.com\/(feed|in|mynetwork)\//i.test(u)) {
            const fresh = await ctx.storageState();
            await saveLinkedInSession(userId, fresh as any);
            break;
          }
        }
      } catch (err) {
        // just log, don't fail the request
        // eslint-disable-next-line no-console
        console.error("open-login watcher error:", err);
      }
    })();

    res.json({ ok: true, message: "Browser opened. Complete login, then run /api/linkedin/status" });
  } catch (e: any) {
    try { await ctx.close(); } catch {}
    res.status(500).json({ ok: false, error: e.message || "open-login failed" });
  }
});

/* ----------------------------- manual cookie (optional) ----------------------------- */

/**
 * POST /api/linkedin/manual-cookie
 * body: { userId: string, li_at: string, jsessionid?: string }
 * Lets you paste cookies like PhantomBuster; we build a minimal storage_state and save it.
 */
router.post("/manual-cookie", async (req, res) => {
  try {
    const { userId, li_at, jsessionid } = req.body || {};
    if (!userId || !li_at) return res.status(400).json({ ok: false, error: "userId and li_at required" });

    const cookies: any[] = [
      {
        name: "li_at",
        value: String(li_at),
        domain: ".linkedin.com",
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "None" as const,
      },
    ];
    if (jsessionid) {
      cookies.push({
        name: "JSESSIONID",
        value: String(jsessionid),
        domain: ".www.linkedin.com",
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "None" as const,
      });
    }

    const storage_state = { cookies, origins: [] };
    await saveLinkedInSession(String(userId), storage_state);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "manual-cookie failed" });
  }
});

/* ----------------------------- force-logout ----------------------------- */

/** POST /api/linkedin/force-logout  body: { userId } */
router.post("/force-logout", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, error: "userId required" });

  try {
    await deleteLinkedInSession(userId);
    // also remove the persistent profile so next connect is clean
    const dir = userProfileDir(userId);
    try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "force-logout failed" });
  }
});

export default router;
