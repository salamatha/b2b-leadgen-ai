export default function Product() {
  const features = [
    { h: "Agent builder", p: "Create reusable LinkedIn search agents for People/Jobs/Companies." },
    { h: "Session connect", p: "Log in once; we reuse secure storage state per user." },
    { h: "Enrichment", p: "Bring your provider (Apollo/Lusha/Custom) or default public enrichment." },
    { h: "Outreach", p: "AI-written email & LinkedIn messaging, with your custom options." },
    { h: "Scheduling", p: "Run agents hourly/daily/weekly, export CSV automatically." },
    { h: "Scalable", p: "Multi-tenant ready, robust queues, and CSV/JSON exports." },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {features.map((f) => (
        <div key={f.h} className="card p-6">
          <div className="text-lg font-semibold">{f.h}</div>
          <p className="mt-2 text-slate-600">{f.p}</p>
        </div>
      ))}
    </div>
  );
}
