import express from "express";
import { supabase } from "../db/supabase.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";

const router = express.Router();

/**
 * POST /api/lead-hunter/generate-url
 * body: { type: "people"|"jobs"|"posts"|"companies", keywords: string, location?: string }
 */
router.post("/generate-url", async (req, res) => {
  try {
    const { type, keywords, location } = req.body || {};
    if (!type || !keywords) return res.status(400).json({ error: "type and keywords are required" });

    const q = encodeURIComponent(keywords.trim());
    const loc = location ? encodeURIComponent(location.trim()) : "";

    let url = "";
    switch (type) {
      case "people":
        // simple people search
        url = `https://www.linkedin.com/search/results/people/?keywords=${q}${loc ? `&origin=GLOBAL_SEARCH_HEADER&geo=${loc}` : ""}`;
        break;
      case "jobs":
        url = `https://www.linkedin.com/jobs/search/?keywords=${q}${loc ? `&location=${loc}` : ""}`;
        break;
      case "posts":
        url = `https://www.linkedin.com/search/results/content/?keywords=${q}`;
        break;
      case "companies":
        url = `https://www.linkedin.com/search/results/companies/?keywords=${q}`;
        break;
      default:
        return res.status(400).json({ error: "Unknown type" });
    }
    return res.json({ url });
  } catch (e: any) {
    console.error("generate-url error:", e);
    return res.status(500).json({ error: e.message || "generate-url failed" });
  }
});

/**
 * POST /api/lead-hunter/preview
 * body: { userId, type, keywords, location }
 * - builds url, scrapes a small sample (limit internally)
 */
router.post("/preview", async (req, res) => {
  try {
    const { userId, type, keywords, location } = req.body || {};
    if (!userId || !type || !keywords) return res.status(400).json({ error: "userId, type, keywords required" });

    // Generate URL first (same logic as above)
    const q = encodeURIComponent(String(keywords).trim());
    const loc = location ? encodeURIComponent(String(location).trim()) : "";
    let url = "";
    switch (type) {
      case "people":
        url = `https://www.linkedin.com/search/results/people/?keywords=${q}${loc ? `&origin=GLOBAL_SEARCH_HEADER&geo=${loc}` : ""}`;
        break;
      case "jobs":
        url = `https://www.linkedin.com/jobs/search/?keywords=${q}${loc ? `&location=${loc}` : ""}`;
        break;
      case "posts":
        url = `https://www.linkedin.com/search/results/content/?keywords=${q}`;
        break;
      case "companies":
        url = `https://www.linkedin.com/search/results/companies/?keywords=${q}`;
        break;
      default:
        return res.status(400).json({ error: "Unknown type" });
    }

    // scrape sample
    const results = await scrapeLinkedInSearch(url, String(userId), true);
    // return only first 10 to preview
    return res.json({ url, sample: results.slice(0, 10) });
  } catch (e: any) {
    console.error("preview error:", e);
    return res.status(500).json({ error: e.message || "preview failed" });
  }
});

/**
 * POST /api/lead-hunter/save
 * body: { userId, name, type, keywords, location }
 * - generates url and saves an "agent" row (reusing your agents table)
 */
router.post("/save", async (req, res) => {
  try {
    const { userId, name, type, keywords, location } = req.body || {};
    if (!userId || !name || !type || !keywords) {
      return res.status(400).json({ error: "userId, name, type, keywords required" });
    }

    const q = encodeURIComponent(String(keywords).trim());
    const loc = location ? encodeURIComponent(String(location).trim()) : "";
    let url = "";
    switch (type) {
      case "people":
        url = `https://www.linkedin.com/search/results/people/?keywords=${q}${loc ? `&origin=GLOBAL_SEARCH_HEADER&geo=${loc}` : ""}`;
        break;
      case "jobs":
        url = `https://www.linkedin.com/jobs/search/?keywords=${q}${loc ? `&location=${loc}` : ""}`;
        break;
      case "posts":
        url = `https://www.linkedin.com/search/results/content/?keywords=${q}`;
        break;
      case "companies":
        url = `https://www.linkedin.com/search/results/companies/?keywords=${q}`;
        break;
      default:
        return res.status(400).json({ error: "Unknown type" });
    }

    // upsert new agent row in "agents" table
    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: String(userId),
        name: String(name),
        type: String(type),
        search_url: url,
        config: { keywords, location }, // keep original terms
      })
      .select("*")
      .maybeSingle();
    if (error) throw error;

    return res.json({ success: true, agent: data });
  } catch (e: any) {
    console.error("save error:", e);
    return res.status(500).json({ error: e.message || "save failed" });
  }
});

/**
 * GET /api/lead-hunter/list?userId=...
 */
router.get("/list", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return res.json({ agents: data || [] });
  } catch (e: any) {
    console.error("list error:", e);
    return res.status(500).json({ error: e.message || "list failed" });
  }
});

/**
 * POST /api/lead-hunter/run
 * body: { userId, agentId }
 * - scrapes with agent.search_url and inserts into "leads"
 */
router.post("/run", async (req, res) => {
  try {
    const { userId, agentId } = req.body || {};
    if (!userId || !agentId) return res.status(400).json({ error: "userId and agentId required" });

    const { data: agent, error: aerr } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();
    if (aerr) throw aerr;
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const results = await scrapeLinkedInSearch(agent.search_url, String(userId), true);

    let inserted = 0;
    for (const r of results) {
      const { error: ierr } = await supabase
        .from("leads")
        .upsert(
          {
            user_id: String(userId),
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
    return res.json({ success: true, inserted });
  } catch (e: any) {
    console.error("run error:", e);
    return res.status(500).json({ error: e.message || "run failed" });
  }
});

export default router;
