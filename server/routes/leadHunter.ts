// server/routes/leadHunter.ts
import express from "express";
import { supabase } from "../db/supabase.ts";
import {
  previewSearch,
  scrapeLinkedInSearch,
  type Vertical as ScrapeVertical,
} from "../../worker/src/scrapers/linkedin.ts";
import { huntDecisionMakers } from "../../worker/src/hunter/hunterFlow.ts";

const router = express.Router();

type Vertical = "companies" | "people" | "jobs" | "posts";

/* ----------------------------- helpers ----------------------------- */

function cleanKeywords(msg: string) {
  let s = msg.trim();
  s = s.replace(/^(find|show|get|i need|i want|please find|search)\b[:\s-]*/i, "");
  s = s.replace(/\b(with|including)\s+decision\s+makers?$/i, "").trim();
  s = s.replace(/\s+/g, " ");
  return s;
}

function parseMessage(message: string): {
  type: Vertical;
  keywords: string;
  location?: string;
  wantDM: boolean;
} {
  const msg = message.toLowerCase().trim();

  // Detect "with decision makers" first
  const wantDM = /\bdecision\s+makers?\b/i.test(message);
  let cleaned = message.replace(/\bwith decision makers?\b/i, "").trim();

  // Extract "in <location>" only (stop at decision makers already removed)
  let location: string | undefined;
  const m = /(.+?)\s+in\s+([a-z0-9 ,._-]+)$/i.exec(cleaned);
  const baseText = m ? m[1] : cleaned;
  if (m) location = m[2].trim();

  // Detect type
  let type: Vertical = "companies";
  if (/(people|profiles|persons|contacts)\b/.test(msg)) type = "people";
  if (/\b(jobs?|hiring|openings)\b/.test(msg)) type = "jobs";
  if (/\b(posts?|content)\b/.test(msg)) type = "posts";

  const keywords = cleanKeywords(baseText);
  return { type, keywords, location, wantDM };
}


function buildUrl(type: Vertical, keywords: string, location?: string) {
  const kw = keywords.trim();
  const kwWithLoc = location ? `${kw} ${location.trim()}` : kw;
  const q = encodeURIComponent(kw);
  const qWithLoc = encodeURIComponent(kwWithLoc);

  switch (type) {
    case "people":
      return `https://www.linkedin.com/search/results/people/?keywords=${qWithLoc}`;
    case "jobs":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}${location ? `&location=${encodeURIComponent(location.trim())}` : ""}`;
    case "posts":
      return `https://www.linkedin.com/search/results/content/?keywords=${qWithLoc}`;
    default:
    case "companies":
      // no origin param → fewer homepage bounces
      return `https://www.linkedin.com/search/results/companies/?keywords=${qWithLoc}`;
  }
}

const toScrapeVertical = (v: Vertical): Exclude<ScrapeVertical, "jobs" | "posts"> =>
  v === "people" ? "people" : "companies";

/* ----------------------------- diagnostics ----------------------------- */

router.get("/ping", (_req, res) => {
  res.json({ ok: true, route: "lead-hunter", tip: "POST /preview or /chat" });
});

/* ----------------------------- /preview ----------------------------- */
/**
 * POST /api/lead-hunter/preview
 * Body option A: { userId, mode: "companies"|"people", filtersOrQuery: { keywords: string } }
 * Body option B: { userId, message: "find fintech in india" }
 */
async function handlePreview(req: express.Request, res: express.Response) {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ ok: false, error: "userId required" });

    // Accept either (mode + filtersOrQuery) or (message)
    let mode: "companies" | "people" = "companies";
    let urlOrQuery = "";

    if (req.body?.message) {
      const parsed = parseMessage(String(req.body.message));
      mode = parsed.type === "people" ? "people" : "companies";
      urlOrQuery = parsed.location ? `${parsed.keywords} ${parsed.location}` : parsed.keywords;
    } else {
      mode = req.body?.mode === "people" ? "people" : "companies";
      const foq = req.body?.filtersOrQuery;
      if (typeof foq === "string") {
        urlOrQuery = foq;
      } else if (foq && typeof foq === "object" && foq.keywords) {
        urlOrQuery = String(foq.keywords);
      } else if (foq && typeof foq === "object" && foq.url && /^https?:\/\//i.test(foq.url)) {
        urlOrQuery = String(foq.url);
      } else {
        return res.status(400).json({ ok: false, error: "filtersOrQuery.keywords or message required" });
      }
    }

    // Preview (handles URL vs query, homepage bounce, redirect loops)
    const preview = await previewSearch(userId, urlOrQuery, mode);
    return res.json({ ok: true, mode, preview });
  } catch (e: any) {
    console.error("lead-hunter/preview error:", e);
    return res.status(500).json({ ok: false, error: e.message || "preview failed" });
  }
}

/* ----------------------------- /chat ----------------------------- */
/**
 * POST /api/lead-hunter/chat
 * Body: { userId, message }
 */
// tolerant /chat handler: accepts aliases for userId and message
// server/routes/leadHunter.ts — replace only the handleChat function
// server/routes/leadHunter.ts — replace ONLY this function
async function handleChat(req: express.Request, res: express.Response) {
  try {
    const b = (req.body ?? {}) as Record<string, any>;
    const q = (req.query ?? {}) as Record<string, any>;
    const h = req.headers;

    // Accept common aliases for userId
    const userId = String(
      b.userId ?? b.userid ?? b.user_id ?? q.userId ?? q.userid ?? q.user_id ?? h["x-user-id"] ?? ""
    ).trim();

    // --- NEW: derive message from various shapes ---
    let message = String(b.message ?? b.text ?? b.query ?? b.q ?? q.message ?? q.text ?? q.query ?? q.q ?? "").trim();

    // If a chat transcript is provided, take the latest non-empty "user" message
    if ((!message || message.length < 2) && Array.isArray(b.messages)) {
      // Prefer the last item with role === "user"; fall back to last item with a "text" or "content" field
      const msgs = b.messages as Array<any>;
      const lastUser = [...msgs].reverse().find(m => (m?.role || "").toLowerCase() === "user" && (m?.text || m?.content || "").trim().length > 0);
      const lastAny  = [...msgs].reverse().find(m => (m?.text || m?.content || "").trim().length > 0);
      const pick = lastUser ?? lastAny;
      if (pick) {
        message = String(pick.text ?? pick.content ?? "").trim();
      }
    }

    if (!userId || !message) {
      return res.status(400).json({
        error: "userId and message required",
        hint: {
          expected: { userId: "UUID", message: "find companies fintech in india" },
          alsoAccepted: {
            userId: ["userId", "userid", "user_id", "x-user-id header"],
            message: ["message", "text", "query", "q", "messages[].text/content (latest user)"]
          }
        }
      });
    }

    // Parse the natural language into type/keywords/location
    const parsed = parseMessage(message);
    const url = buildUrl(parsed.type as any, parsed.keywords, parsed.location);

    // Resilient scrape → preview-like shape
    const vertical: "companies" | "people" = parsed.type === "people" ? "people" : "companies";
    const base = await scrapeLinkedInSearch(userId, url, vertical, true);

    const baseResults = [{ title: base.title, url: base.finalUrl, preview: base.preview }];

    let enriched: any[] = [];
    if (parsed.type === "companies" && parsed.wantDM) {
      const companies = baseResults
        .map((r) => ({ company: r.title || "", linkedin_url: r.url }))
        .filter((x) => x.company)
        .slice(0, 5);

      enriched = await huntDecisionMakers({
        userId,
        companies,
        location: parsed.location,
        headless: true,
        perCompany: 5,
      });
    } else {
      enriched = baseResults;
    }

    // best-effort persistence
    try {
      await supabase.from("lead_hunter_queries").insert({
        user_id: userId,
        message,
        parsed: parsed as any,
        url_used: url,
        results_count: enriched.length,
      });
    } catch (err) {
      console.warn("lead_hunter_queries insert warning:", err);
    }

    return res.json({ parsed, url, results: enriched });
  } catch (e: any) {
    console.error("lead-hunter/chat error:", e);
    return res.status(500).json({ error: e.message || "chat failed" });
  }
}



/* ----------------------------- /save-from-chat ----------------------------- */

async function handleSaveFromChat(req: express.Request, res: express.Response) {
  try {
    const { userId, name, lastMessage } = req.body || {};
    if (!userId || !name || !lastMessage)
      return res.status(400).json({ error: "userId, name, lastMessage required" });

    const parsed = parseMessage(String(lastMessage));
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
}

/* ----------------------------- routes ----------------------------- */

// Primary
router.post("/preview", handlePreview);
router.post("/chat", handleChat);
router.post("/save-from-chat", handleSaveFromChat);

// Aliases used by some UIs (fixes "Not Found")
router.post("/ai/preview", handlePreview);
router.post("/ai/chat", handleChat);
router.post("/ai/save-from-chat", handleSaveFromChat);

export default router;
