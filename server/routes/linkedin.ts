import express from "express";
import { getUserSession, saveUserSession } from "../../db/linkedinSession.ts";
import { openLinkedInLoginAndSaveSession } from "../../worker/src/auth/linkedinLogin.ts";
import { supabase } from "../db/supabase.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";

const router = express.Router();

/** GET /api/linkedin/status?userId=...  -> { connected: boolean } */
router.get("/status", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });

    const sessionStr = await getUserSession(userId);
    if (!sessionStr) return res.json({ connected: false });

    let parsed: any = null;
    try { parsed = JSON.parse(sessionStr); } catch {}
    const ok = parsed && Array.isArray(parsed.cookies) && parsed.cookies.length > 0;
    return res.json({ connected: !!ok });
  } catch (e: any) {
    console.error("status error:", e);
    return res.status(500).json({ error: e.message || "status failed" });
  }
});

/** POST /api/linkedin/open-login  { userId, headless?: boolean }
router.post("/open-login", async (req, res) => {
  try {
    const { userId, headless } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });

    const result = await openLinkedInLoginAndSaveSession(userId, headless ?? false);
    return res.json(result);
  } catch (e: any) {
    console.error("open-login error:", e);
    return res.status(500).json({ error: e.message || "open-login failed" });
  }
}); */

router.post("/open-login", async (req, res) => {
  try {
    const userId = String((req.body?.userId || "")).trim();
    const headless = !!req.body?.headless;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const result = await openLinkedInLoginAndSaveSession(userId, headless);
    res.json(result);
  } catch (e: any) {
    console.error("open-login error:", e);
    res.status(500).json({ error: e.message || "open-login failed" });
  }
});

/** POST /api/linkedin/save-session  { userId, storageStateJson }  -> manual fallback */
router.post("/save-session", async (req, res) => {
  try {
    const { userId, storageStateJson } = req.body || {};
    if (!userId || !storageStateJson) {
      return res.status(400).json({ error: "userId and storageStateJson required" });
    }

    // validate JSON has cookies
    let parsed: any = null;
    try { parsed = JSON.parse(storageStateJson); } catch {
      return res.status(400).json({ error: "storageStateJson is not valid JSON" });
    }
    if (!Array.isArray(parsed.cookies) || parsed.cookies.length === 0) {
      return res.status(400).json({ error: "No cookies found in storageStateJson" });
    }

    await saveUserSession(userId, JSON.stringify(parsed));
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("save-session error:", e);
    return res.status(500).json({ error: e.message || "save-session failed" });
  }
});

/** POST /api/linkedin/run  { agentId, userId } -> scrape and upsert leads */
router.post("/run", async (req, res) => {
  try {
    const { agentId, userId } = req.body as { agentId: string; userId: string };
    if (!agentId || !userId) return res.status(400).json({ error: "agentId and userId required" });

    const { data: agent, error: aerr } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();
    if (aerr) throw aerr;
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const results = await scrapeLinkedInSearch(agent.search_url, userId, true);

    let inserted = 0;
    for (const r of results) {
      const { error: ierr } = await supabase
        .from("leads")
        .upsert(
          {
            user_id: userId,
            agent_id: agentId,
            name: r.name || null,
            title: r.title || null,
            company: r.company || null,
            linkedin_url: r.linkedin_url || null,
            email: r.email || null,
            phone: r.phone || null,
          },
          { onConflict: "linkedin_url" }
        );
      if (!ierr) inserted++;
    }

    res.json({ success: true, inserted });
  } catch (e: any) {
    console.error("linkedin/run error:", e);
    res.status(500).json({ error: e.message || "run failed" });
  }
});

export default router;
