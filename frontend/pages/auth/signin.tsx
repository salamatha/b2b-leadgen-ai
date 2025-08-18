import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.replace("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const text = await res.text(); // read as text first (more robust)
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          `Server did not return JSON (status ${res.status}). Body: ${text.slice(0, 120)}`
        );
      }

      if (!res.ok) throw new Error(json.error || `Login failed (status ${res.status})`);

      // Persist and redirect
      localStorage.setItem("token", json.token);
      localStorage.setItem("userId", json.userId);

      // Hard navigation ensures all auth-driven UI updates
      window.location.href = "/dashboard";
    } catch (e: any) {
      setErrMsg(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container py-12">
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-2xl font-serif text-brand-900 mb-2">Sign in</h1>
        <p className="text-sm text-slate-600 mb-6">
          Welcome back. Enter your credentials to continue.
        </p>

        {errMsg && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
            {errMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            className="input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            minLength={6}
          />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-sm text-slate-600 mt-4">
          Don’t have an account?{" "}
          <Link href="/auth/signup" className="text-brand-900 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
