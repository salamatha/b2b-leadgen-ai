// server/routes/leadHunterAI.ts
import express from "express";
import OpenAI from "openai";
import { z } from "zod";
import { supabase } from "../db/supabase.ts";
import { huntCompaniesPeopleProfiles } from "../../worker/src/hunter/chainHunter.ts";
import { scrapeLinkedInSearch } from "../../worker/src/scrapers/linkedin.ts";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PlanSchema = z.object({
  intent: z.enum(["companies", "people", "jobs", "posts"]),
  query: z.string().min(1),
  location: z.string().optional(),
  needDecisionMakers: z.boolean(),
});

function buildUrl(plan: z.infer<typeof PlanSchema>) {
  const q = encodeURIComponent(plan.query);
  const qLoc = plan.location ? encodeURIComponent(`${plan.query} ${plan.location}`) : q;
  switch (plan.intent) {
    case "people": return `https://www.linkedin.com/search/results/people/?keywords=${qLoc}`;
    case "jobs":   return `https://www.linkedin.com/jobs/search/?keywords=${q}${plan.location ? `&location=${encodeURIComponent(plan.location)}` : ""}`;
    case "posts":  return `https://www.linkedin.com/search/results/content/?keywords=${qLoc}`;
    default:
    case "companies": return `https://www.linkedin.com/search/results/companies/?keywords=${qLoc}`;
  }
}

function fallbackParse(lastUser: string): z.infer<typeof PlanSchema> {
  const m = /(.+?)\s+in\s+([a-z0-9 ,._-]+)$/i.exec(lastUser.trim());
  const query = (m ? m[1] : lastUser).replace(/^(find|get|show|search|i want|i need)\b[:\s-]*/i, "").trim();
  const location = m ? m[2].trim() : undefined;
  const needDecisionMakers = /\b(decision\s*makers?|ceo|cto|founder|director|head|vp)\b/i.test(lastUser);
  return { intent: "companies", query, location, needDecisionMakers };
}

/** === Chat: clarify or confirm plan === */
router.post("/ai/chat", async (req, res) => {
  try {
    const { userId, messages } = req.body || {};
    if (!userId || !Array.isArray(messages)) {
      return res.status(400).json({ error: "userId and messages[] required" });
    }

    const system = `
You help users create a "Lead Hunter" plan for LinkedIn scraping.
Output JSON ONLY.

If ambiguous, ask ONE short follow-up: {"ask":"..."}.
Else, confirm a plan:
{"confirm":{"intent":"companies|people|jobs|posts","query":"...","location":"...?", "needDecisionMakers":true|false},"summary":"one short line"}
Intent rules: default to "companies" unless user explicitly requests people/jobs/posts.
Extract trailing "in <location>" if present.
Mark needDecisionMakers true if they mention decision makers or leadership titles.
`.trim();

    const userText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");
    const prompt = `
Given the conversation:
${userText}

Return JSON ONLY with either:
- {"ask":"<one short follow-up question>"} 
OR
- {"confirm":{"intent":"companies|people|jobs|posts","query":"...","location":"...?", "needDecisionMakers":true|false}, "summary":"<one-line summary>"}
`.trim();

    let parsed: any = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      });
      const raw = completion.choices[0]?.message?.content || "{}";
      parsed = JSON.parse(raw);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("429")) {
        const lastUser = messages.filter((m: any) => m.role === "user").pop()?.text || "";
        const plan = fallbackParse(lastUser);
        return res.json({
          type: "confirm",
          plan,
          summary: "Proceed with this plan? (AI quota exhausted; using local planner)",
        });
      }
      throw e;
    }

    if (parsed?.ask) return res.json({ type: "ask", message: String(parsed.ask) });

    if (parsed?.confirm) {
      const plan = PlanSchema.parse(parsed.confirm);
      const summary = String(parsed.summary || "Confirm this search?");
      return res.json({ type: "confirm", plan, summary });
    }

    const lastUser = messages.filter((m: any) => m.role === "user").pop()?.text || "";
    const plan = fallbackParse(lastUser);
    return res.json({ type: "confirm", plan, summary: "Proceed with this plan?" });
  } catch (e: any) {
    console.error("ai/chat error:", e);
    return res.status(500).json({ error: e.message || "ai/chat failed" });
  }
});

/** === Preview: run plan (chain for companies+decisionMakers, else single hop) === */
router.post("/ai/preview", async (req, res) => {
  try {
    const { userId, plan } = req.body || {};
    if (!userId || !plan) return res.status(400).json({ error: "userId and plan required" });

    const parsed = PlanSchema.parse(plan);

    try {
      if (parsed.intent === "companies" && parsed.needDecisionMakers) {
        const rows = await huntCompaniesPeopleProfiles({
          userId,
          query: parsed.query,
          location: parsed.location,
          companiesLimit: 5,
          peoplePerCompany: 5,
          headless: true,
        });

        await supabase.from("lead_hunter_queries").insert({
          user_id: userId,
          message: `AI-confirmed plan: ${JSON.stringify(parsed)}`,
          parsed: parsed as any,
          url_used: null,
          results_count: rows.length,
        });

        return res.json({ results: rows, mode: "chain" });
      }

      // single hop
      const url = buildUrl(parsed);
      const rows = await scrapeLinkedInSearch(url, userId, true, 120000);

      await supabase.from("lead_hunter_queries").insert({
        user_id: userId,
        message: `AI-confirmed plan: ${JSON.stringify(parsed)}`,
        parsed: parsed as any,
        url_used: url,
        results_count: rows.length,
      });

      return res.json({ results: rows.slice(0, 15), mode: "single", url });
    } catch (err: any) {
      if (err instanceof LinkedInSessionError || String(err?.message || "").includes("SESSION_INVALID")) {
        return res
          .status(401)
          .json({ error: "LinkedIn session expired", code: "LINKEDIN_SESSION_INVALID" });
      }
      throw err;
    }
  } catch (e: any) {
    console.error("ai/preview error:", e);
    return res.status(500).json({ error: e.message || "ai/preview failed" });
  }
});

export default router;
