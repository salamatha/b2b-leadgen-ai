import express from "express";
import { supabase } from "../db/supabase.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";
import { huntCompaniesPeopleProfiles } from "../../worker/src/hunter/chainHunter.ts";

const router = express.Router();

function cleanStart(msg: string) {
  return msg.replace(/^(find|show|get|i need|i want|please find|search)\b[:\s-]*/i, "").trim();
}
function parseMessage(message: string): { intent: "companies"|"people"|"jobs"|"posts"; query: string; location?: string; needDM: boolean } {
  const trimmed = cleanStart(message);
  const m = /(.+?)\s+in\s+([a-z0-9 ,._-]+)$/i.exec(trimmed);
  const base = m ? m[1] : trimmed;
  const location = m ? m[2].trim() : undefined;

  const low = base.toLowerCase();
  let intent: "companies"|"people"|"jobs"|"posts" = "companies";
  if (/(people|profiles|contacts)\b/.test(low)) intent = "people";
  else if (/\b(jobs?|hiring|openings)\b/.test(low)) intent = "jobs";
  else if (/\b(posts?|content)\b/.test(low)) intent = "posts";

  const needDM = /\bdecision\s+makers?\b/i.test(message) || /founders?|ceo|director|head\b/i.test(low);

  return { intent, query: base.trim(), location, needDM };
}

function buildUrl(intent: string, query: string, location?: string) {
  const q = encodeURIComponent(query);
  const qLoc = location ? encodeURIComponent(`${query} ${location}`) : q;
  switch (intent) {
    case "people": return `https://www.linkedin.com/search/results/people/?keywords=${qLoc}`;
    case "jobs":   return `https://www.linkedin.com/jobs/search/?keywords=${q}${location ? `&location=${encodeURIComponent(location)}` : ""}`;
    case "posts":  return `https://www.linkedin.com/search/results/content/?keywords=${qLoc}`;
    default:
    case "companies": return `https://www.linkedin.com/search/results/companies/?keywords=${qLoc}`;
  }
}

router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body || {};
    if (!userId || !message) return res.status(400).json({ error: "userId and message required" });

    const parsed = parseMessage(message);

    // If decision makers requested -> run 3-step flow
    if (parsed.intent === "companies" && parsed.needDM) {
      const enriched = await huntCompaniesPeopleProfiles({
        userId,
        query: parsed.query,
        location: parsed.location,
        companiesLimit: 5,
        peoplePerCompany: 5,
        headless: true,
      });

      await supabase.from("lead_hunter_queries").insert({
        user_id: userId,
        message,
        parsed: parsed as any,
        url_used: null,
        results_count: enriched.length,
      });

      return res.json({
        parsed,
        url: null,
        results: enriched,
      });
    }

    // Otherwise fall back to single-hop search preview
    const url = buildUrl(parsed.intent, parsed.query, parsed.location);
    const sample = await scrapeLinkedInSearch(url, userId, true, 120000);

    await supabase.from("lead_hunter_queries").insert({
      user_id: userId,
      message,
      parsed: parsed as any,
      url_used: url,
      results_count: sample.length,
    });

    return res.json({ parsed, url, results: sample.slice(0, 15) });
  } catch (e: any) {
    console.error("lead-hunter/chat error:", e);
    return res.status(500).json({ error: e.message || "chat failed" });
  }
});

router.post("/save-from-chat", async (req, res) => {
  try {
    const { userId, name, lastMessage } = req.body || {};
    if (!userId || !name || !lastMessage) return res.status(400).json({ error: "userId, name, lastMessage required" });

    const parsed = parseMessage(lastMessage);
    const url = buildUrl(parsed.intent, parsed.query, parsed.location);

    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: String(userId),
        name: String(name),
        type: String(parsed.intent),
        search_url: url,
        config: { query: parsed.query, location: parsed.location, from: "chat" },
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
