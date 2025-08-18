This package adds a full Settings module (LinkedIn, SMTP, Enrichment, Profile).

Files:
- server/routes/profile.ts
- server/routes/enrichment.ts
- server/index.update_hint_settings.txt (copy these lines into server/index.ts)
- frontend/pages/dashboard/settings.tsx
- sql/settings_schema.sql (run in Supabase)

Steps:
1) Extract to your project root (overwrite when prompted).
2) Run SQL in Supabase: sql/settings_schema.sql
3) Open server/index.ts and add routes per server/index.update_hint_settings.txt
4) Restart server and frontend.
5) Visit /dashboard/settings
