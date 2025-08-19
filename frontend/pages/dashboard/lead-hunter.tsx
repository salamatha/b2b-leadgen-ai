import { useEffect, useState } from "react";
import DashLayout from "../../components/DashLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type HunterType = "people" | "jobs" | "posts" | "companies";

export default function LeadHunter() {
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [name, setName] = useState("");
  const [type, setType] = useState<HunterType>("people");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState("");

  // load saved agents
  useEffect(() => {
    (async () => {
      if (!userId) return;
      const res = await fetch(`${API_BASE}/api/lead-hunter/list?userId=${encodeURIComponent(userId)}`);
      const j = await res.json();
      setAgents(j.agents || []);
    })();
  }, [userId]);

  const generateUrl = async () => {
    if (!keywords) return alert("Enter keywords");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/lead-hunter/generate-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, keywords, location }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to generate");
      setUrl(j.url);
    } catch (e: any) {
      alert(e.message || "Failed to generate");
    } finally {
      setBusy(false);
    }
  };

  const doPreview = async () => {
    if (!userId) return alert("Not signed in");
    if (!keywords) return alert("Enter keywords");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/lead-hunter/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, keywords, location }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Preview failed");
      setUrl(j.url);
      setPreview(j.sample || []);
    } catch (e: any) {
      alert(e.message || "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  const saveAgent = async () => {
    if (!userId) return alert("Not signed in");
    if (!name || !keywords) return alert("Name and keywords are required");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/lead-hunter/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, type, keywords, location }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setAgents((prev) => [j.agent, ...prev]);
      setAgentId(j.agent.id);
      alert("Saved!");
    } catch (e: any) {
      alert(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const runNow = async () => {
    if (!userId) return alert("Not signed in");
    if (!agentId) return alert("Pick a saved Lead Hunter");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/lead-hunter/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, agentId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Run failed");
      alert(`Run completed: inserted ${j.inserted} leads`);
    } catch (e: any) {
      alert(e.message || "Run failed");
    } finally {
      setBusy(false);
    }
  };

  const downloadCSV = () => {
    if (!agentId) return alert("Pick a saved Lead Hunter");
    const url = `${API_BASE}/api/export/leads.csv?userId=${encodeURIComponent(userId || "")}&agentId=${encodeURIComponent(agentId)}`;
    window.open(url, "_blank");
  };

  return (
    <DashLayout>
      <h1 className="text-2xl font-serif text-brand-900 mb-6">Lead Hunter</h1>

      {/* Builder */}
      <div className="card p-5 mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          <input className="input" placeholder="Name (e.g., SaaS Founders India)"
                 value={name} onChange={(e)=>setName(e.target.value)} />
          <select className="input" value={type} onChange={(e)=>setType(e.target.value as HunterType)}>
            <option value="people">People</option>
            <option value="jobs">Jobs</option>
            <option value="posts">Posts</option>
            <option value="companies">Companies</option>
          </select>
          <input className="input" placeholder="Keywords (e.g., SaaS founder B2B)"
                 value={keywords} onChange={(e)=>setKeywords(e.target.value)} />
          <input className="input" placeholder="Location (optional)"
                 value={location} onChange={(e)=>setLocation(e.target.value)} />
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn" onClick={generateUrl} disabled={busy}>Generate URL</button>
          <button className="btn btn-secondary" onClick={doPreview} disabled={busy}>Preview</button>
          <button className="btn btn-primary" onClick={saveAgent} disabled={busy}>Save Lead Hunter</button>
        </div>

        {url && (
          <p className="text-xs text-slate-600 mt-3 break-all">
            <span className="font-medium">URL:</span> {url}
          </p>
        )}
      </div>

      {/* Saved hunters & actions */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3">
          <select className="input max-w-xs" value={agentId} onChange={(e)=>setAgentId(e.target.value)}>
            <option value="">Select saved Lead Hunter</option>
            {agents.map((a)=> <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={runNow} disabled={!agentId || busy}>Run Now</button>
          <button className="btn" onClick={downloadCSV} disabled={!agentId}>Download CSV</button>
        </div>
      </div>

      {/* Preview results */}
      <div className="card p-0 overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Title</th><th>Company</th><th>LinkedIn</th><th>Email</th><th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i)=>(
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.title}</td>
                <td>{r.company}</td>
                <td><a className="text-brand-900" href={r.linkedin_url} target="_blank" rel="noreferrer">Profile</a></td>
                <td>{r.email || ""}</td>
                <td>{r.phone || ""}</td>
              </tr>
            ))}
            {preview.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No preview yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashLayout>
  );
}
