import { useState } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000"; // change if your server runs elsewhere

export default function SignUp() {
  const [fullName, setFullName] = useState(""); // optional if your DB has full_name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const body: any = { email, password };
      // Only send full_name if your DB has the column (recommended).
      if (fullName.trim()) body.full_name = fullName.trim();

      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); }
      catch { throw new Error(`Server did not return JSON (status ${res.status}). Body: ${text.slice(0,80)}`); }

      if (!res.ok) throw new Error(json.error || `Signup failed (status ${res.status})`);

      // Success → store and go to dashboard
      localStorage.setItem("token", json.token);
      localStorage.setItem("userId", json.userId);
      window.location.href = "/dashboard";
    } catch (e: any) {
      alert(e.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container py-12">
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-2xl font-serif text-brand-900 mb-2">Create account</h1>
        <p className="text-sm text-slate-600 mb-6">
          Start your free trial. No credit card required.
        </p>
        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            className="input"
            placeholder="Full name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
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
            autoComplete="new-password"
            required
            minLength={6}
          />
          <input
            type="password"
            className="input"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="text-sm text-slate-600 mt-4">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-brand-900 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
