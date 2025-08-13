"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const res = await fetch("/api/leadgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">B2B LeadGen AI</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type your lead requirement..."
        className="border p-2 w-full mb-2"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white px-4 py-2"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {results && (
        <div className="mt-4">
          <p><strong>Search URL:</strong> {results.searchUrl}</p>
          <ul>
            {results.results?.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
