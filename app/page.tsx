"use client";

import { useEffect, useMemo, useState } from "react";

type SiteResult = {
  site: string;
  results: Array<{ title: string; url: string; snippet: string }>; 
  error?: string;
};

const STORAGE_KEY = "part-search-agent:sites";

function normalizeSite(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function Page() {
  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [siteInput, setSiteInput] = useState("");
  const [sites, setSites] = useState<string[]>(["digikey.com", "mouser.com"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SiteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSites(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
    } catch {}
  }, [sites]);

  const query = useMemo(() => {
    const tokens = [partName, partNumber].map(t => t.trim()).filter(Boolean);
    return tokens.join(" ");
  }, [partName, partNumber]);

  async function onSearch() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partName, partNumber, sites }),
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = (await res.json()) as { results: SiteResult[] };
      setResults(data.results);
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function addSite() {
    const normalized = normalizeSite(siteInput);
    if (!normalized) return;
    if (!sites.includes(normalized)) {
      setSites([...sites, normalized]);
    }
    setSiteInput("");
  }

  function removeSite(site: string) {
    setSites(sites.filter(s => s !== site));
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Part name (e.g., Resistor 10k)"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Part number (e.g., RC0603FR-0710KL)"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
          />
        </div>
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Add website domain (e.g., example.com)"
            value={siteInput}
            onChange={(e) => setSiteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSite();
            }}
          />
          <button className="btn" onClick={addSite}>Add website</button>
          <button className="btn" onClick={onSearch} disabled={!query || sites.length === 0 || loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          {sites.map((site) => (
            <span key={site} className="site-pill">
              {site}
              <button aria-label={`Remove ${site}`} onClick={() => removeSite(site)}>?</button>
            </span>
          ))}
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          Results are scoped per site using public web search. Edit the site list to target specific vendors or docs.
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <strong>Query:</strong> {query || <span className="small">Enter part name and/or number</span>}
          </div>
          <div className="small">Press <span className="kbd">Enter</span> to add sites</div>
        </div>
        {error && <div className="result" style={{ borderColor: "#8b2b2b", background: "#1a0f19" }}>{error}</div>}
        {!error && results && results.length === 0 && (
          <div className="small">No results found.</div>
        )}
        {!error && results && results.length > 0 && (
          <div className="site-results">
            {results.map((group) => (
              <div key={group.site} style={{ marginBottom: 16 }}>
                <div className="badge">{group.site}</div>
                {group.error && (
                  <div className="small" style={{ color: "#ff8e8e", marginTop: 8 }}>Error: {group.error}</div>
                )}
                {group.results.length > 0 ? (
                  <div className="grid" style={{ marginTop: 8 }}>
                    {group.results.map((r, idx) => (
                      <div className="result" key={r.url + idx}>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</div>
                        </a>
                        <div className="small" style={{ marginBottom: 6 }}>{r.url}</div>
                        <div className="small">{r.snippet}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small" style={{ marginTop: 8 }}>No results on this site.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
