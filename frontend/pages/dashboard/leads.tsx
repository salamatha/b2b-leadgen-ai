import { useState } from "react";

export default function LeadsPage() {
  const [results, setResults] = useState<any[]>([]);

  const runNow = async () => {
    const res = await fetch("http://localhost:4000/api/linkedin/run", { method: "POST" });
    const data = await res.json();
    setResults(data);
  };

  const downloadCSV = () => {
    window.location.href = "http://localhost:4000/api/export/leads.csv";
  };

  return (
    <main className="container py-12">
      <h1 className="text-2xl font-bold mb-6">Leads</h1>
      <button onClick={runNow} className="btn btn-primary mr-2">Run Now</button>
      <button onClick={downloadCSV} className="btn btn-secondary">Download CSV</button>
      <ul className="mt-6 space-y-2">
        {results.map((r, i) => <li key={i} className="border p-2">{JSON.stringify(r)}</li>)}
      </ul>
    </main>
  );
}
