
# b2b-leadgen-ai - Scaffold (minimal)

This zip contains a minimal scaffold for the B2B Lead Generation SaaS described in the project document.
It includes:
- frontend/ : minimal Next.js placeholders and a stub /api/chat endpoint
- worker/ : Playwright worker stub that scrapes a URL and logs output
- scripts/setup_db.sql : SQL to create minimal tables in Supabase
- infra/ : minimal vercel.json example

Next steps:
1. Fill in frontend UI (chat, agents, lead table)
2. Implement /api/chat to call OpenAI and create enrichment_jobs in Supabase
3. Implement worker polling logic to pick up jobs, scrape, call OpenAI parse, and insert leads
4. Add security for API keys and deploy to Vercel + Render

See the 'B2b-leadgen-ai-scaffold' document in the conversation for the full plan and SQL schema.
