This pack fixes:
- Agents link showing when logged out
- Sign in button still showing after login
- Sign out only visible on dashboard

What it adds/updates:
- frontend/lib/auth.tsx        -> global AuthProvider + useAuth()
- frontend/pages/_app.tsx      -> wraps app with AuthProvider
- frontend/components/Header.tsx -> top bar with Sign in/Sign up/Sign out logic
- frontend/components/DashNav.tsx -> uses useAuth, hides on public routes
- frontend/pages/index.tsx     -> example using Header

How to apply:
1) Extract to your project root (overwrite existing files when asked).
2) Ensure public pages (/, /auth/*, /pricing, etc.) include <Header /> at the top.
   Private pages (dashboard, agents) should keep using your DashLayout (which may also render Header globally if you prefer).
3) Restart frontend:  cd frontend && npm run dev

Sign in flow tips:
- After your backend returns a token + userId on /auth/signin, call:
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
  Then router.push("/dashboard"). The UI will update automatically.
