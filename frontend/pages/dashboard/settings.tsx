import { useEffect, useState } from "react";
import DashLayout from "../../components/DashLayout";

type Enrichment = { id: string; provider: string; api_key?: string; account_id?: string; active: boolean };

export default function SettingsPage() {
  return (
    <DashLayout>
      <SettingsInner />
    </DashLayout>
  );
}

function SettingsInner() {
  const [token, setToken] = useState<string|null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { window.location.href="/auth/signin"; return; }
    setToken(t);
    // jump to anchor if provided
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(()=>el.scrollIntoView({behavior:"smooth"}), 50);
    }
  }, []);

  if (!token) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-serif text-brand-900">Settings</h1>
      <LinkedInCard token={token} />
      <SMTPCard token={token} />
      <EnrichmentCard token={token} />
      <ProfileCard token={token} />
    </div>
  );
}

/* ---------------- LinkedIn ---------------- */

function LinkedInCard({ token }: { token: string }) {
  const [connected, setConnected] = useState<boolean|null>(null);
  const [polling, setPolling] = useState(false);

  const refresh = async () => {
    const res = await fetch("http://localhost:4000/api/linkedin/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setConnected(!!json.connected);
  };

  useEffect(() => { refresh(); }, []);

  const connect = async () => {
    await fetch("http://localhost:4000/api/linkedin/connect", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    alert("A browser opened on the server. Log in to LinkedIn.\nWe'll check every 3s for up to 60s.");
    setPolling(true);
    const started = Date.now();
    const timer = setInterval(async ()=>{
      await refresh();
      if (connected) { clearInterval(timer); setPolling(false); }
      else if (Date.now() - started > 60000) { clearInterval(timer); setPolling(false); alert("Still not connected. Try again."); }
    }, 3000);
  };

  const disconnect = async () => {
    await fetch("http://localhost:4000/api/linkedin/logout", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    await refresh();
    alert("Disconnected LinkedIn.");
  };

  return (
    <div className="card p-6 space-y-3" id="linkedin">
      <div className="flex items-center justify-between">
        <div className="font-semibold">LinkedIn Connection</div>
        <span className={`badge ${connected ? "badge-success" : "badge-danger"}`}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <div className="flex gap-3">
        <button onClick={connect} className="btn btn-primary" disabled={polling}>Connect</button>
        <button onClick={disconnect} className="btn btn-secondary">Disconnect</button>
        <button onClick={refresh} className="btn btn-secondary">Refresh</button>
      </div>
      <p className="text-xs text-slate-500">
        We store an encrypted browser session that keeps you signed in. You can disconnect anytime.
      </p>
    </div>
  );
}

/* ---------------- SMTP ---------------- */

function SMTPCard({ token }: { token: string }) {
  const [form, setForm] = useState({
    host: "", port: 587, secure: false,
    username: "", password: "",
    from_name: "", from_email: ""
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:4000/api/smtp", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) setForm(json.data);
    })();
  }, [token]);

  const save = async () => {
    const res = await fetch("http://localhost:4000/api/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.success) return alert(json.error || "Save failed");
    alert("SMTP saved");
  };

  return (
    <div className="card p-6 space-y-3" id="smtp">
      <div className="font-semibold">Email (SMTP)</div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="input" placeholder="Host" value={form.host} onChange={e=>setForm({...form,host:e.target.value})}/>
        <input className="input" placeholder="Port" type="number" value={form.port} onChange={e=>setForm({...form,port:Number(e.target.value)})}/>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.secure} onChange={e=>setForm({...form,secure:e.target.checked})}/>
          Use SSL/TLS (465). Off for 587.
        </label>
        <div />
        <input className="input" placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <input className="input" placeholder="From name" value={form.from_name||""} onChange={e=>setForm({...form,from_name:e.target.value})}/>
        <input className="input" placeholder="From email" value={form.from_email} onChange={e=>setForm({...form,from_email:e.target.value})}/>
      </div>
      <button onClick={save} className="btn btn-primary">Save</button>
    </div>
  );
}

/* ---------------- Enrichment (Apollo/Lusha/…) ---------------- */

function EnrichmentCard({ token }: { token: string }) {
  const [items, setItems] = useState<Enrichment[]>([]);
  const [form, setForm] = useState({ provider: "apollo", api_key: "", account_id: "", active: true });

  const load = async () => {
    const res = await fetch("http://localhost:4000/api/enrichment", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success) setItems(json.data || []);
  };

  useEffect(()=>{ load(); }, [token]);

  const add = async () => {
    const res = await fetch("http://localhost:4000/api/enrichment", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.success) return alert(json.error || "Save failed");
    setForm({ provider: "apollo", api_key: "", account_id: "", active: true });
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`http://localhost:4000/api/enrichment/${id}`, {
      method: "PUT",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active }),
    });
    load();
  };

  const del = async (id: string) => {
    await fetch(`http://localhost:4000/api/enrichment/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  return (
    <div className="card p-6 space-y-4" id="enrichment">
      <div className="font-semibold">Email/Contact Enrichment Providers</div>
      <div className="grid md:grid-cols-4 gap-3">
        <select className="input" value={form.provider} onChange={e=>setForm({...form, provider: e.target.value})}>
          <option value="apollo">Apollo</option>
          <option value="lusha">Lusha</option>
          <option value="others">Other</option>
        </select>
        <input className="input" placeholder="API key (if required)" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})}/>
        <input className="input" placeholder="Account ID (optional)" value={form.account_id} onChange={e=>setForm({...form,account_id:e.target.value})}/>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>
          Active
        </label>
      </div>
      <button className="btn btn-primary" onClick={add}>Add Provider</button>

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead className="bg-slate-50"><tr><th>Provider</th><th>Account</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">No providers added.</td></tr>}
            {items.map(it=>(
              <tr key={it.id} className="hover:bg-slate-50/60">
                <td className="capitalize">{it.provider}</td>
                <td className="truncate max-w-[400px]">{it.account_id || "-"}</td>
                <td>
                  <button className={`badge ${it.active?"badge-success":"badge-danger"}`} onClick={()=>toggle(it.id, !it.active)}>
                    {it.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td><button className="btn btn-secondary" onClick={()=>del(it.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        If you leave providers empty, the scraper will only use public web data for enrichment.
      </p>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function ProfileCard({ token }: { token: string }) {
  const [form, setForm] = useState({ full_name:"", company:"", website:"", timezone:"", locale:"" });

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:4000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const { full_name, company, website, timezone, locale } = json.data;
        setForm({ full_name: full_name||"", company: company||"", website: website||"", timezone: timezone||"", locale: locale||"" });
      }
    })();
  }, [token]);

  const save = async () => {
    const res = await fetch("http://localhost:4000/api/profile", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.success) return alert(json.error || "Save failed");
    alert("Profile saved");
  };

  return (
    <div className="card p-6 space-y-3" id="profile">
      <div className="font-semibold">Personal & Company Details</div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="input" placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>
        <input className="input" placeholder="Company" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/>
        <input className="input" placeholder="Website" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/>
        <input className="input" placeholder="Timezone (e.g. Asia/Kolkata)" value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}/>
        <input className="input" placeholder="Locale (e.g. en-IN)" value={form.locale} onChange={e=>setForm({...form,locale:e.target.value})}/>
      </div>
      <button onClick={save} className="btn btn-primary">Save</button>
    </div>
  );
}
