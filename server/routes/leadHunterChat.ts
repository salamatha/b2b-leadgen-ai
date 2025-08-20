import express from "express";
import { supabase } from "../db/supabase.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";
import { huntDecisionMakers } from "../../worker/src/hunter/hunterFlow.ts";

const router = express.Router();

/** Lightweight rule-based parser (you can swap with LLM later) */
function parseMessage(message: string): { type: "companies"|"people"|"jobs"|"posts"; keywords: string; location?: string } {
  const msg = message.toLowerCase().trim();

  // try to extract “… in <location>”
  let location: string | undefined;
  const inIdx = msg.lastIndexOf(" in ");
  if (inIdx > -1) {
    location = message.slice(inIdx + 4).trim();
  }

  // default intents
  let type: "companies"|"people"|"jobs"|"posts" = "companies";

  if (/(people|profiles|persons|contacts)\b/.test(msg)) type = "people";
  if (/\b(jobs?|hiring|openings)\b/.test(msg)) type = "jobs";
  if (/\b(posts?|content)\b/.test(msg)) type = "posts";

  // keywords = message minus "in <location>" tail
  const keywords = inIdx > -1 ? message.slice(0, inIdx).trim() : message.trim();
  return { type, keywords, location };
}

/** Build safe starter LinkedIn URLs (keep it simple & robust) */
function buildUrl(type: string, keywords: string, location?: string) {
  const q = encodeURIComponent(keywords.trim());
  const kwWithLoc = location ? encodeURIComponent(`${keywords.trim()} ${location.trim()}`) : q;

  switch (type) {
    case "people":
      return `https://www.linkedin.com/search/results/people/?keywords=${kwWithLoc}`;
    case "jobs":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}${location ? `&location=${encodeURIComponent(location.trim())}` : ""}`;
    case "posts":
      return `https://www.linkedin.com/search/results/content/?keywords=${kwWithLoc}`;
    default:
    case "companies":
      return `https://www.linkedin.com/search/results/companies/?keywords=${kwWithLoc}`;
  }
}

/**
 * POST /api/lead-hunter/chat
 * body: { userId: string, message: string, sessionId?: string }
 * - Parses message -> gets companies (or people) -> for companies, finds decision makers.
 */
router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body || {};
    if (!userId || !message) return res.status(400).json({ error: "userId and message required" });

    const parsed = parseMessage(message);

    // Step 1: scrape initial results
    const url = buildUrl(parsed.type, parsed.keywords, parsed.location);
    const baseResults = await scrapeLinkedInSearch(url, userId, true, 120000);

    // Step 2: if companies → look for decision makers for top matches
    let enriched: any[] = [];
    if (parsed.type === "companies") {
      // take first 5 companies to keep fast
      const companies = baseResults
        .map(r => ({ company: r.company || r.name || "", linkedin_url: r.linkedin_url }))
        .filter(x => x.company)
        .slice(0, 5);

      enriched = await huntDecisionMakers({
        userId,
        companies,
        location: parsed.location,
        headless: true,
        perCompany: 5, // how many people to fetch per company
      });
    } else if (parsed.type === "people") {
      // return people as-is (you can also enrich by visiting each profile)
      enriched = baseResults.slice(0, 15);
    } else {
      enriched = baseResults.slice(0, 15);
    }

    // optional: persist last chat query (for drafts/history)
    await supabase.from("lead_hunter_queries").insert({
      user_id: userId,
      message,
      parsed: parsed as any,
      url_used: url,
      results_count: enriched.length
    });

    return res.json({
      parsed,
      url,
      results: enriched,
    });
  } catch (e: any) {
    console.error("lead-hunter/chat error:", e);
    return res.status(500).json({ error: e.message || "chat failed" });
  }
});

/**
 * POST /api/lead-hunter/save-from-chat
 * body: { userId, name, lastMessage }
 * - parses message again, generates URL, saves in agents (Lead Hunter)
 */
router.post("/save-from-chat", async (req, res) => {
  try {
    const { userId, name, lastMessage } = req.body || {};
    if (!userId || !name || !lastMessage) return res.status(400).json({ error: "userId, name, lastMessage required" });

    const parsed = parseMessage(lastMessage);
    const url = buildUrl(parsed.type, parsed.keywords, parsed.location);

    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: String(userId),
        name: String(name),
        type: String(parsed.type),
        search_url: url,
        config: { keywords: parsed.keywords, location: parsed.location, from: "chat" },
      })
      .select("*")
      .maybeSingle();
    if (error) throw error;

    return res.json({ success: true, agent: data });
  } catch (e: any) {
    console.error("save-from-chat error:", e);
    return res.status(500).json({ error: e.message || "save-from-chat failed" });
  }
});

export default router;
