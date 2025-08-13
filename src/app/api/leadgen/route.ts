// src/app/api/leadgen/route.ts
import { NextResponse } from "next/server";
import { chromium } from "playwright";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.0,
    }),
  });
  const json = await res.json();
  return json; // raw JSON for debugging
}

function extractJsonFromText(text: string) {
  // Try direct parse, then fallback to pulling the first {...} block
  try { return JSON.parse(text); } catch (e) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = (body.query || "").trim();
    if (!query) return NextResponse.json({ error: "No query provided" }, { status: 400 });

    // Prompt that strongly requests JSON
    const prompt = `
You are a URL-generator. Convert this user request into 1-3 search URLs that a headless browser can visit to find B2B leads.
User request: "${query}"

Return JSON only, no extra text. Format:
{ "search_urls": ["https://www.google.com/search?q=...","https://www.bing.com/search?q=..."], "filters": {"role":"", "industry":"", "location":""} }
`;

    // 1) Call OpenAI
    const aiRaw = await callOpenAI(prompt);
    console.log("OpenAI raw response:", JSON.stringify(aiRaw, null, 2));

    // Extract text content returned by model
    const content = aiRaw?.choices?.[0]?.message?.content ?? aiRaw?.choices?.[0]?.text ?? "";
    console.log("OpenAI content:", content);

    // 2) Try to parse JSON from model output
    let parsed = extractJsonFromText(content);

    // 3) Fallback: if parsed missing or search_urls empty, build a direct Google URL
    let searchUrl = parsed?.search_urls?.[0] ?? `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    // 4) Optional: run Playwright locally to fetch anchors from the search page (quick proof)
    let anchors: Array<{ href: string; text: string }> = [];
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      // give JS a moment to render
      await page.waitForTimeout(1000);
      anchors = await page.$$eval("a", (els) =>
        els.map((a) => ({ href: (a as HTMLAnchorElement).href, text: (a as HTMLAnchorElement).innerText.slice(0,200) }))
      );
      await browser.close();
    } catch (pwErr) {
      if (pwErr instanceof Error) {
    console.warn("Playwright fetch error (ok to ignore in serverless env):", pwErr.message);
  } else {
    console.warn("Playwright fetch error (ok to ignore in serverless env):", pwErr);
  }
    }

    return NextResponse.json({ ok: true, searchUrl, parsed, anchors });
  } catch (err: any) {
    console.error("Handler error:", err);
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
  }
}
