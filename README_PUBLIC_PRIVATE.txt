This package contains public and private pages setup.

Public (no login required):
- Home (/)
- Services (/services)
- About (/about)
- Pricing (/pricing)

Private (requires login, redirects to /auth/signin if not logged in):
- Dashboard (/dashboard)
- Agents (/agents)

Steps:
1. Extract into project root.
2. Ensure `_app.tsx` wraps with AuthProvider and Header.
3. Restart frontend with `npm run dev`.
