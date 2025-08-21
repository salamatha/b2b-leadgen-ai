// frontend/pages/dashboard/lead-hunter.tsx
import { useEffect, useRef, useState } from "react";
import DashLayout from "../../components/DashLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type Msg = { role: "user" | "assistant"; text: string };
type Plan = {
  intent: "companies" | "people" | "jobs" | "posts";
  query: string;
  location?: string;
  needDecisionMakers: boolean;
};
type Row = {
  company?: string;
  company_linkedin?: string;
  website?: string;
  name?: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
};

export default function LeadHunterChat() {
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Tell me what you’re hunting for.\nExample: “I want Liferay company in UAE with decision makers.”",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [preview, setPreview] = useState<Row[]>([]);
  const [runningPreview, setRunningPreview] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!userId) return alert("Please sign in again");
    const msg = input.trim();
    if (!msg) return;

    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setThinking(true);
    setPendingPlan(null);
    setPreview([]);

    try {
      // ✅ Send a single message string that the backend expects
      const res = await fetch(`${API_BASE}/api/lead-hunter/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: msg }),
      });

      const text = await res.text();
      let j: any = {};
      try { j = JSON.parse(text); } catch { j = { error: text }; }

      if (!res.ok) throw new Error(j.error || "Chat failed");

      // New backend shape: { parsed, url, results }
      if (j?.parsed) {
        const parsed = j.parsed as {
          type: "companies" | "people" | "jobs" | "posts";
          keywords: string;
          location?: string;
          wantDM: boolean;
        };

        const plan: Plan = {
          intent: parsed.type === "people" ? "people" : parsed.type === "jobs" ? "jobs" : parsed.type === "posts" ? "posts" : "companies",
          query: parsed.keywords || "",
          location: parsed.location || undefined,
          needDecisionMakers: !!parsed.wantDM,
        };
        setPendingPlan(plan);

        const locLabel = plan.location ? ` @ ${plan.location}` : "";
        const dmLabel = plan.needDecisionMakers ? " (decision makers)" : "";
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `Got it → ${plan.intent}: ${plan.query}${locLabel}${dmLabel}\nClick Preview to continue.` },
        ]);
        return;
      }

      // Legacy shape compatibility (if you keep returning { type: "ask" | "confirm" } somewhere)
      if (j.type === "ask") {
        setMessages((m) => [...m, { role: "assistant", text: j.message }]);
      } else if (j.type === "confirm") {
        setPendingPlan(j.plan);
        setMessages((m) => [...m, { role: "assistant", text: j.summary || "Confirm?" }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "I couldn't understand. Try again." },
        ]);
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const runPreview = async () => {
    if (!userId) return alert("Please sign in again");
    if (!pendingPlan) return;

    setRunningPreview(true);
    setPreview([]);

    try {
      // Backend /preview expects: { userId, mode, filtersOrQuery: { keywords } } or { userId, message }
      const mode = pendingPlan.intent === "people" ? "people" : "companies"; // (extend to jobs/posts later)
      const keywords = pendingPlan.location
        ? `${pendingPlan.query} ${pendingPlan.location}`
        : pendingPlan.query;

      const res = await fetch(`${API_BASE}/api/lead-hunter/ai/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mode, filtersOrQuery: { keywords } }),
      });

      const text = await res.text();
      let j: any = {};
      try { j = JSON.parse(text); } catch { j = { error: text }; }

      if (res.status === 401 && j?.code === "LINKEDIN_SESSION_INVALID") {
        alert("Your LinkedIn session has expired. Please reconnect it in Settings, then try again.");
        return;
      }
      if (!res.ok) throw new Error(j.error || "Preview failed");

      // New preview shape: { ok, mode, preview: { finalUrl, title, countHint } }
      const pv = j.preview || {};
      const link = pv.finalUrl ? `\n${pv.finalUrl}` : "";
      const count = typeof pv.countHint === "number" ? ` (count≈${pv.countHint})` : "";
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Preview ready for ${mode}${count}.${link}` },
      ]);

      // We don't have row extraction yet; keep table empty for now.
      setPreview([]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: `Preview error: ${e.message}` }]);
    } finally {
      setRunningPreview(false);
    }
  };

  const saveSearch = async () => {
    if (!pendingPlan) return alert("No plan to save. Ask me for a search first.");
    const name = prompt("Name this Lead Hunter:");
    if (!name) return;

    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.text || "";
      const res = await fetch(`${API_BASE}/api/lead-hunter/save-from-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, lastMessage: lastUserMsg }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      alert("Saved! You'll find it under your saved hunters.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DashLayout>
      <h1 className="text-2xl font-serif text-brand-900 mb-4">Lead Hunter</h1>

      {/* Chat card */}
      <div className="card p-4 flex flex-col h-[70vh] mb-6">
        <div className="flex-1 overflow-auto space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-3 py-2 rounded-lg ${
                m.role === "user" ? "ml-auto bg-brand-50 text-brand-900" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.text}
            </div>
          ))}
          {thinking && <div className="text-xs text-slate-500">Thinking…</div>}

          {pendingPlan && (
            <div className="mt-3">
              <div className="text-sm text-slate-700">
                <b>Plan:</b> {pendingPlan.intent} — {pendingPlan.query}
                {pendingPlan.location ? ` @ ${pendingPlan.location}` : ""}{" "}
                {pendingPlan.needDecisionMakers ? "(decision makers)" : ""}
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={runPreview} disabled={runningPreview}>
                  {runningPreview ? "Running Preview..." : "Preview"}
                </button>
                <button className="btn" onClick={saveSearch} disabled={runningPreview}>
                  Save
                </button>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1"
            placeholder='Try: "I want Liferay company in UAE with decision makers"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button className="btn btn-primary" onClick={send} disabled={thinking}>
            Send
          </button>
        </div>
      </div>

      {/* Preview below chat */}
      <div className="card p-0 overflow-auto">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Website</th>
              <th>Decision Maker</th>
              <th>Title</th>
              <th>LinkedIn</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {preview.length > 0 ? (
              preview.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-medium">{r.company || "-"}</div>
                    {r.company_linkedin && (
                      <a className="text-xs text-brand-900" href={r.company_linkedin} target="_blank" rel="noreferrer">
                        Company LI
                      </a>
                    )}
                  </td>
                  <td>
                    {r.website ? (
                      <a className="text-brand-900" href={r.website} target="_blank" rel="noreferrer">
                        {r.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : ("-")}
                  </td>
                  <td>{r.name || "-"}</td>
                  <td>{r.title || "-"}</td>
                  <td>
                    {r.linkedin_url ? (
                      <a className="text-brand-900" href={r.linkedin_url} target="_blank" rel="noreferrer">
                        Profile
                      </a>
                    ) : ("-")}
                  </td>
                  <td>{r.email || ""}</td>
                  <td>{r.phone || ""}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="p-6 text-center text-slate-500">No preview yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashLayout>
  );
}
