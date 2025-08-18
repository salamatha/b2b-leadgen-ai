Next Steps Pack
=================

Includes:
- Settings page
- Leads page
- LinkedIn routes (status, run stub)
- Export routes (CSV)

Usage:
------
1. Copy frontend/pages/dashboard/*.tsx into your frontend project.
2. Copy server/routes/*.ts into your server project.
3. Ensure server/index.ts mounts these routes:
     app.use("/api/linkedin", linkedinRoutes);
     app.use("/api/export", exportRoutes);
4. Restart backend and frontend.
5. Visit /dashboard/settings and /dashboard/leads.
