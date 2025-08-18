import { useEffect, useState } from "react";
import DashLayout from "../../components/DashLayout";

type Agent = { id: string; name: string; search_url: string; type: string };

function AgentsInner() {
  const [token, setToken] = useState<string|null>(null);
  const [items, setItems] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [search_url, setUrl] = useState("");
  const [type, setType] = useState("auto");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { window.location.href="/auth/signin"; return; }
    setToken(t); load(t);
  }, []);

  const load = async (t?: string) => {
    const tok = t || token; if (!tok) return;
    const res = await fetch("http://localhost:4000/api/agents", { headers:{Authorization:`Bearer ${tok}`}});
    const json = await res.json(); if (json.success) setItems(json.data);
  };

  const add = async () => {
    if (!token) return;
    const res = await fetch("http://localhost:4000/api/agents", {
      method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ name, search_url, type }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.error||"Add failed");
    setName(""); setUrl(""); setType("auto"); load();
  };

  const del = async (id: string) => {
    if (!token) return;
    await fetch(`http://localhost:4000/api/agents/${id}`, {
      method:"DELETE", headers:{ Authorization:`Bearer ${token}` }
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-brand-900">Agents</h1>
      <div className="card p-6 space-y-3">
        <div className="grid md:grid-cols-4 gap-3">
          <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
          <select className="input" value={type} onChange={e=>setType(e.target.value)}>
            <option value="auto">Auto-detect</option>
            <option value="people">People</option>
            <option value="jobs">Jobs</option>
            <option value="companies">Companies</option>
            <option value="posts">Posts</option>
          </select>
          <input className="input md:col-span-2" placeholder="LinkedIn search URL" value={search_url} onChange={e=>setUrl(e.target.value)}/>
        </div>
        <button onClick={add} className="btn btn-primary">Add Agent</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead className="bg-slate-50">
            <tr><th>Name</th><th>Type</th><th>URL</th><th></th></tr>
          </thead>
        <tbody>
          {items.map(a=>(
            <tr key={a.id} className="hover:bg-slate-50/60">
              <td>{a.name}</td>
              <td>{a.type}</td>
              <td className="truncate max-w-[500px]"><a className="text-brand-900 hover:underline" href={a.search_url} target="_blank">Open</a></td>
              <td><button onClick={()=>del(a.id)} className="btn btn-secondary">Delete</button></td>
            </tr>
          ))}
          {items.length===0 && <tr><td colSpan={4} className="px-3 py-10 text-center text-slate-500">No agents yet.</td></tr>}
        </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <DashLayout>
      <AgentsInner />
    </DashLayout>
  );
}
