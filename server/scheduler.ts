import cron from "node-cron";
import { supabase } from "./db/supabase.ts";
import { scrapeLinkedInSearch } from "../worker/src/scrapers/linkedin.ts";
import { getLinkedInSession  } from "../db/linkedinSession.ts";

async function runAgentOnce(userId: string, agentId: string) {
  const { data: agent, error: aerr } = await supabase
    .from("agents").select("*").eq("id", agentId).eq("user_id", userId).maybeSingle();
  if (aerr || !agent) throw new Error(aerr?.message || "Agent not found");

  const { data: runRow, error: rerr } = await supabase
    .from("runs").insert({ user_id: userId, agent_id: agentId, status: "running", started_at: new Date().toISOString() })
    .select("*").single();
  if (rerr) throw new Error(rerr.message);

  try {
    const sess = await getUserSession(userId);
    if (!sess) throw new Error("LinkedIn not connected");

    const results = await scrapeLinkedInSearch(agent.search_url, userId, true);

    if (Array.isArray(results) && results.length) {
      const base = results.map((r: any) => ({
        user_id: userId,
        source_type: r.source_type || "unknown",
        name: r.name || null,
        title: r.title || null,
        company: r.company || null,
        location: r.location || null,
        linkedin_url: r.linkedin_url || null,
        email: r.email || null,
        phone: r.phone || null,
      }));
      const ins = await supabase.from("leads").insert(base);
      if (ins.error) {
        if (/location/i.test(ins.error.message)) {
          const fallback = base.map(({ location, ...rest }) => rest);
          const res2 = await supabase.from("leads").insert(fallback);
          if (res2.error) throw new Error(res2.error.message);
        } else {
          throw new Error(ins.error.message);
        }
      }
    }

    await supabase.from("runs").update({
      status: "success",
      finished_at: new Date().toISOString(),
    }).eq("id", runRow.id);
  } catch (e: any) {
    await supabase.from("runs").update({
      status: "failed", error: String(e.message || e), finished_at: new Date().toISOString()
    }).eq("id", runRow.id);
  }
}

export function startScheduler() {
  const tasks: Record<string, cron.ScheduledTask> = {};

  async function load() {
    const { data, error } = await supabase.from("schedules").select("*").eq("active", true);
    if (error) { console.error("Scheduler load error:", error.message); return; }
    const active = data || [];
    const seen = new Set<string>();

    for (const s of active) {
      const key = `${s.id}:${s.cron}`;
      seen.add(key);
      if (!tasks[key]) {
        try {
          tasks[key] = cron.schedule(s.cron, () => {
            runAgentOnce(s.user_id, s.agent_id).catch(err => console.error("runAgentOnce error:", err));
          });
          tasks[key].start();
          console.log(`⏰ schedule ${key} started`);
        } catch (e) {
          console.error("Invalid cron:", s.cron, e);
        }
      }
    }

    Object.keys(tasks).forEach((k) => {
      if (!seen.has(k)) {
        tasks[k].stop();
        delete tasks[k];
        console.log(`⏹ schedule ${k} stopped`);
      }
    });
  }

  load();
  setInterval(load, 60_000);
}
