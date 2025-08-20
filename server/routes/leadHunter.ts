import express from "express";
import { supabase } from "../db/supabase.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";
import { huntDecisionMakers } from "../../worker/src/hunter/hunterFlow.ts";

const router = express.Router();

function cleanKeywords(msg: string) {
  // remove common “command” words and trailing phrases
  let s = msg.trim();
  s = s.replace(/^(find|show|get|i need|i want|please find|search)\b[:\s-]*/i, "");
  s = s.replace(/\b(with|including)\s+decision\s+makers?$/i, "").trim();
  s = s.replace(/\s+/g, " ");
  return s;
}

function parseMessage(message: string): { type: "companies"|"people"|"jobs"|"posts"; keywords: string; location?: string; wantDM: boolean } {
  const msg = message.toLowerCase().trim();

  // extract trailing "in <location>"
  let location: string | undefined;
  const m = /(.+?)\s+in\s+([a-z0-9 ,._-]+)$/i.exec(message);
  const baseText = m ? m[1] : message;
  if (m) location = m[2].trim();

  let type: "companies"|"people"|"jobs"|"posts" = "companies";
  if (/(people|profiles|persons|contacts)\b/.test(msg)) type = "people";
  if (/\b(jobs?|hiring|openings)\b/.test(msg)) type = "jobs";
  if (/\b(posts?|content)\b/.test(msg)) type = "posts";

  const wantDM = /\bdecision\s+makers?\b/i.test(message);

  const keywords = cleanKeywords(baseText);
  return { type, keywords, location, wantDM };
}

function buildUrl(type: string, keywords: string, location?: string) {
  const q = encodeURIComponent(keywords.trim());
  const kwWithLoc = location ? encodeURIComponent(`${keywords.trim()} ${location.trim()}`) : q;
  switch (type) {
    case "people":    return `https://www.linkedin.com/search/results/people/?keywords=${kwWithLoc}`;
    case "jobs":      return `https://www.linkedin.com/jobs/search/?keywords=${q}${location ? `&location=${encodeURIComponent(location.trim())}` : ""}`;
    case "posts":     return `https://www.linkedin.com/search/results/content/?keywords=${kwWithLoc}`;
    default:
    case "companies": return `https://www.linkedin.com/search/results/companies/?keywords=${kwWithLoc}`;
  }
}

router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body || {};
    if (!userId || !message) return res.status(400).json({ error: "userId and message required" });

    const parsed = parseMessage(message);
    const url = buildUrl(parsed.type, parsed.keywords, parsed.location);

    // scrape initial page with tolerant scraper
    const baseResults = await scrapeLinkedInSearch(url, userId, true, 120000);

    let enriched: any[] = [];
    if (parsed.type === "companies" && parsed.wantDM) {
      const companies = baseResults
        .map(r => ({ company: r.company || r.name || "", linkedin_url: r.linkedin_url }))
        .filter(x => x.company)
        .slice(0, 5);

      enriched = await huntDecisionMakers({
        userId,
        companies,
        location: parsed.location,
        headless: true,
        perCompany: 5,
      });
    } else {
      enriched = baseResults.slice(0, 15);
    }

    await supabase.from("lead_hunter_queries").insert({
      user_id: userId,
      message,
      parsed: parsed as any,
      url_used: url,
      results_count: enriched.length,
    });

    return res.json({ parsed, url, results: enriched });
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
