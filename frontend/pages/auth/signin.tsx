import { useState } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000"; // change if your server runs elsewhere

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text(); // read as text first (debug-friendly)
      let json: any;
      try { json = JSON.parse(text); }
      catch { throw new Error(`Server did not return JSON (status ${res.status}). Body: ${text.slice(0,80)}`); }

      if (!res.ok) throw new Error(json.error || `Login failed (status ${res.status})`);

      localStorage.setItem("token", json.token);
      localStorage.setItem("userId", json.userId);
      window.location.href = "/dashboard";
    } catch (e: any) {
      alert(e.message || "Login failed");
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
