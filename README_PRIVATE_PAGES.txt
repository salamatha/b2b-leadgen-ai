This pack adds/updates:
- server/routes/{smtp.ts,outreach.ts,agents.ts,schedules.ts}
- server/scheduler.ts  (node-cron loader)
- frontend/components/{DashNav.tsx,DashLayout.tsx}
- frontend/pages/dashboard/{index.tsx,agents.tsx,settings.tsx,outreach.tsx}
- server/index.update_hint.txt

Steps:
1) Copy these files into your project preserving paths.
2) In /server run:  npm i nodemailer node-cron
3) Update server/index.ts using server/index.update_hint.txt lines.
4) In Supabase run SQL to create tables (agents, smtp_credentials, outreach_messages, runs, schedules).
5) Restart server:  npx ts-node server/index.ts
6) Open /dashboard in the browser.
