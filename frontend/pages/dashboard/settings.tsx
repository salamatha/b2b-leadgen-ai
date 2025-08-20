import { useEffect, useState } from "react";
import DashLayout from "../../components/DashLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function Settings() {
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [status, setStatus] = useState<{connected: boolean|null, reason?: string}>({ connected: null });
  const [checking, setChecking] = useState(false);

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

  useEffect(() => { if (userId) checkLI(); }, [userId]);

  const checkLI = async () => {
    if (!userId) return;
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/linkedin/status?userId=${userId}`);
      const j = await res.json();
      setStatus({ connected: !!j.connected, reason: j.reason });
    } catch {
      setStatus({ connected: false, reason: "request_failed" });
    } finally {
      setChecking(false);
    }
  };

  const openLinkedInLogin = async () => {
    if (!userId) return;
    await fetch(`${API_BASE}/api/linkedin/open-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    alert("A browser opened on the backend host. Complete LinkedIn login (2FA, etc). Then click 'Check status'.");
  };

  const forceLogout = async () => {
    if (!userId) return;
    if (!confirm("This will clear your saved LinkedIn cookies. Continue?")) return;
    await fetch(`${API_BASE}/api/linkedin/force-logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setStatus({ connected: false, reason: "cleared" });
    alert("Cleared. Now click Connect / Reconnect and log in again.");
  };

  const saveSmtp = async () => {
    if (!userId) return;
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
    if (!userId) return;
    setTestingSmtp(true);
    setSmtpMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/smtp/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, to: smtp.from_email || "you@example.com" }),
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
            <button className="btn btn-secondary" onClick={checkLI} disabled={checking}>
              {checking ? "Checking..." : "Check status"}
            </button>
            <span className={`badge ${status.connected ? "badge-success" : "badge-danger"}`}>
              {status.connected === null ? "—" : status.connected ? "Connected" : "Not connected"}
            </span>
            {!status.connected && status.reason && (
              <span className="text-xs text-slate-500">({status.reason})</span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" onClick={openLinkedInLogin}>
              Connect / Reconnect
            </button>
            <button className="btn" onClick={forceLogout}>Force logout (clear cookies)</button>
          </div>
        </section>

        {/* SMTP */}
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-2">Email (SMTP)</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="SMTP Host"
              value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
            <input className="input" placeholder="Port" type="number"
              value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) || 0 })} />
            <input className="input" placeholder="Username"
              value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} />
            <input className="input" placeholder="Password" type="password"
              value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} />
            <input className="input col-span-2" placeholder="From Email"
              value={smtp.from_email} onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })} />
            <input className="input col-span-2" placeholder="From Name"
              value={smtp.from_name} onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })} />
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
