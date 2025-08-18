Leadgen SaaS (Supabase + Guest Site + Auth + LinkedIn Session + Scrape)
========================================================================

Extract this ZIP into your project ROOT. It will create/overwrite these paths:

schema/schema.sql
server/index.ts
server/db/supabase.ts
server/routes/auth.ts
server/routes/linkedin.ts
db/linkedinSession.ts
worker/src/scrapers/linkedin.ts
frontend/components/NavBar.tsx
frontend/components/Footer.tsx
frontend/pages/_app.tsx
frontend/pages/index.tsx
frontend/pages/about.tsx
frontend/pages/product.tsx
frontend/pages/services.tsx
frontend/pages/pricing.tsx
frontend/pages/auth/signin.tsx
frontend/pages/auth/signup.tsx
frontend/pages/dashboard/index.tsx

Server env (.env):
  SUPABASE_URL=your-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  JWT_SECRET=some_long_random_string

Run order:
  1) Supabase -> run schema/schema.sql
  2) npm i express body-parser cors playwright bcryptjs jsonwebtoken @supabase/supabase-js dotenv
     npm i -D ts-node typescript @types/express @types/jsonwebtoken
  3) npx ts-node server/index.ts
  4) (cd frontend && npm run dev)

Go to http://localhost:3000/
Sign up -> Dashboard -> Connect LinkedIn -> Scrape -> Download CSV.
Sessions + leads are saved in Supabase.
