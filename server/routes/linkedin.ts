// server/routes/linkedin.ts
import express from "express";
import { chromium } from "playwright";
import jwt from "jsonwebtoken";

import { getUserSession, saveUserSession, deleteUserSession } from "../../db/linkedinSession.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";
import { supabase } from "../db/supabase.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// ---- simple JWT middleware ----
function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.uid, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ---- GET /api/linkedin/status ----
router.get("/status", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const sess = await getUserSession(userId);
  res.json({ connected: !!sess });
});

// ---- POST /api/linkedin/connect ----
// Opens a visible browser. Log in to LinkedIn; session will be saved.
router.post("/connect", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  res.json({ success: true, message: "Launching browser for LinkedIn login…" });

  (async () => {
    const browser = await chromium.launch({
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
    });
    try {
      const context = await browser.newContext();
      context.setDefaultTimeout(90_000);
      const page = await context.newPage();

      await page.goto("https://www.linkedin.com/login", {
        waitUntil: "networkidle",
        timeout: 60_000,
      });

      // wait up to 2 minutes for a successful login (li_at or feed visible)
      const started = Date.now();
      let loggedIn = false;
      while (Date.now() - started < 120_000) {
        const url = page.url();

        if (/^https:\/\/www\.linkedin\.com\/(feed|m\/|messaging|me)/.test(url)) {
          const nav = await page.$("nav, header, [data-test-global-nav]");
          if (nav) {
            loggedIn = true;
            break;
          }
        }

        const cookies = await context.cookies();
        const hasLiAt = cookies.some(
          (c) => c.name === "li_at" && c.value && c.value.length > 10
        );
        if (hasLiAt) {
          try {
            await page.goto("https://www.linkedin.com/feed/", {
              waitUntil: "domcontentloaded",
            });
          } catch {}
          const isCheckpoint = page.url().includes("/checkpoint/");
          if (!isCheckpoint) {
            loggedIn = true;
            break;
          }
        }

        await page.waitForTimeout(1500);
      }

      const storage = await context.storageState();
      await saveUserSession(userId, JSON.stringify(storage));
      console.log(`✅ LinkedIn storageState saved for user ${userId} (loggedIn=${loggedIn})`);
    } catch (e) {
      console.error("LinkedIn connect error:", e);
    } finally {
      await browser.close();
    }
  })();
});

// ---- POST /api/linkedin/logout ----
router.post("/logout", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  await deleteUserSession(userId);
  res.json({ success: true, message: "LinkedIn session removed." });
});

// ---- POST /api/linkedin/scrape ----
router.post("/scrape", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { url, headless } = req.body as { url?: string; headless?: boolean };
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const rows = await scrapeLinkedInSearch(url, userId, headless ?? true);

    if (rows.length) {
      // Prepare base payload
      const base = rows.map((r: any) => ({
        user_id: userId,
        source_type: r.source_type || "unknown",
        name: r.name || null,
        title: r.title || null,
        company: r.company || null,
        location: r.location || null,      // <- new column (may not exist in older schemas)
        linkedin_url: r.linkedin_url || null,
        email: r.email || null,
        phone: r.phone || null,
      }));

      // Try insert with full payload first
      let { error } = await supabase.from("leads").insert(base);
      if (error) {
        console.error("leads insert error:", error.message);

        // If schema is missing 'location', retry without it
        if (/location/i.test(error.message)) {
          const fallback = base.map(({ location, ...rest }) => rest);
          const res2 = await supabase.from("leads").insert(fallback);
          if (res2.error) {
            console.error("leads insert error (fallback):", res2.error.message);
          } else {
            console.log(`Inserted ${fallback.length} leads (fallback without location).`);
          }
        }
      } else {
        console.log(`Inserted ${rows.length} leads.`);
      }
    }

    res.json({ success: true, count: rows.length, data: rows });
  } catch (e: any) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;
