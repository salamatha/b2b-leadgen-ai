// frontend/pages/dashboard/settings.tsx
import { useEffect, useRef, useState } from "react";
import DashLayout from "../../components/DashLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function Settings() {
  // DashLayout only renders children after mount+auth, so localStorage is safe here
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // LinkedIn
  const [liConnected, setLiConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<NodeJS.Timer | null>(null);

  // SMTP
  const [smtp, setSmtp] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
    from_name: "",
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<string | null>(null);

  useEffect(() => {
    // Initial status check on load
    checkLI();
    // Optional: load existing SMTP if you have /api/smtp/get
    // void loadSmtp();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkLI = async () => {
    if (!userId) {
      setLiConnected(false);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/linkedin/status?userId=${encodeURIComponent(userId)}`);
      const j = await res.json();
      setLiConnected(!!j.connected);
    } catch {
      setLiConnected(false);
    } finally {
      setChecking(false);
    }
  };

  const openLinkedInLogin = async () => {
    if (!userId) return alert("Missing user session. Please sign in again.");

    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/linkedin/open-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // headless:false → open a visible window on the backend for first-time login
        body: JSON.stringify({ userId, headless: false }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Open login failed");

      alert("A browser opened on the backend. Complete LinkedIn login, then we'll auto-check status.");

      // Start polling status every 3s for up to 2 minutes
      let elapsed = 0;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        elapsed += 3000;
        await checkLI();
        if (liConnected || elapsed >= 120_000) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 3000);
    } catch (e: any) {
      alert(e.message || "Could not start LinkedIn login");
    } finally {
      setConnecting(false);
    }
  };

  // Optional: load SMTP if you’ve implemented /api/smtp/get on backend
  // const loadSmtp = async () => {
  //   try {
  //     const res = await fetch(`${API_BASE}/api/smtp/get?userId=${encodeURIComponent(userId || "")}`);
  //     if (!res.ok) return;
  //     const j = await res.json();
  //     if (j && j.data) setSmtp({ ...smtp, ...j.data });
  //   } catch {}
  // };

  const saveSmtp = async () => {
    if (!userId) return alert("Missing user session. Please sign in again.");
    setSavingSmtp(true);
    setSmtpMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/smtp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...smtp }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setSmtpMsg("SMTP saved.");
    } catch (e: any) {
      setSmtpMsg(e.message);
    } finally {
      setSavingSmtp(false);
    }
  };

  const testSmtp = async () => {
    if (!userId) return alert("Missing user session. Please sign in again.");
    setTestingSmtp(true);
    setSmtpMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/smtp/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          to: smtp.from_email || "you@example.com",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Test failed");
      setSmtpMsg("Test email sent.");
    } catch (e: any) {
      setSmtpMsg(e.message);
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <DashLayout>
      <h1 className="text-2xl font-serif text-brand-900 mb-6">Settings</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LinkedIn */}
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-2">LinkedIn Connection</h2>
          <p className="text-sm text-slate-600 mb-3">
            Connect your LinkedIn session once. We store an encrypted session to run scrapes.
          </p>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-secondary"
              onClick={checkLI}
              disabled={checking}
              title="Re-check connection status"
            >
              {checking ? "Checking..." : "Check status"}
            </button>

            <span className={`badge ${liConnected ? "badge-success" : "badge-danger"}`}>
              {liConnected === null ? "Unknown" : liConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              className="btn btn-primary"
              onClick={openLinkedInLogin}
              disabled={connecting}
              title="Open LinkedIn login on backend (first time)"
            >
              {connecting ? "Opening..." : "Connect / Reconnect"}
            </button>
          </div>
        </section>

        {/* SMTP */}
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-2">Email (SMTP)</h2>

          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="SMTP Host"
              value={smtp.host}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
            />
            <input
              className="input"
              placeholder="Port"
              type="number"
              value={smtp.port}
              onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) || 0 })}
            />
            <input
              className="input"
              placeholder="Username"
              value={smtp.username}
              onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={smtp.password}
              onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="From Email"
              value={smtp.from_email}
              onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="From Name"
              value={smtp.from_name}
              onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button className="btn btn-secondary" onClick={saveSmtp} disabled={savingSmtp}>
              {savingSmtp ? "Saving..." : "Save"}
            </button>
            <button className="btn" onClick={testSmtp} disabled={testingSmtp}>
              {testingSmtp ? "Testing..." : "Send test email"}
            </button>
          </div>

          {smtpMsg && <p className="text-sm mt-3">{smtpMsg}</p>}
        </section>
      </div>
    </DashLayout>
  );
}
