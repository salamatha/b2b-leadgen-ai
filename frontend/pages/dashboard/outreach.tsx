import { useState } from "react";
import DashLayout from "../../components/DashLayout";

function OutreachInner() {
  const [to_email, setTo] = useState("");
  const [subject, setSubj] = useState("Quick question for {{company}}");
  const [body, setBody] = useState("<p>Hi {{name}},</p><p>We help teams like {{company}} …</p>");

  const send = async () => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href="/auth/signin");
    const res = await fetch("http://localhost:4000/api/outreach/send", {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ to_email, subject, body }),
    });
    const json = await res.json();
    if (!json.success) alert(json.error || "Failed"); else alert("Sent!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-brand-900">Outreach (Email)</h1>
      <div className="card p-6 space-y-3">
        <input className="input" placeholder="To email" value={to_email} onChange={e=>setTo(e.target.value)}/>
        <input className="input" placeholder="Subject" value={subject} onChange={e=>setSubj(e.target.value)}/>
        <textarea className="input" rows={10} placeholder="HTML body" value={body} onChange={e=>setBody(e.target.value)}/>
        <div className="text-xs text-slate-500">Tip: use placeholders like <code>{`{{name}}`}</code> and <code>{`{{company}}`}</code>.</div>
        <button onClick={send} className="btn btn-primary">Send</button>
      </div>
    </div>
  );
}

export default function OutreachPage() {
  return (
    <DashLayout>
      <OutreachInner />
    </DashLayout>
  );
}
