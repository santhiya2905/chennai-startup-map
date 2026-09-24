"use client";

import dynamic from "next/dynamic";
import Papa from "papaparse";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { RawStartup, Startup } from "./types";

const StartupMap = dynamic(() => import("./startup-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Drawing Chennai’s startup ecosystem…</div>,
});

const SECTOR_RULES = [
  ["AI & Data", /\b(ai|artificial intelligence|machine learning|data|analytics|computer vision)\b/i],
  ["SaaS", /saas|enterprise software|workflow|low-code|cloud/i],
  ["Fintech", /fintech|finance|banking|payments|wealth|insurance|credit|lending/i],
  ["Deeptech", /deeptech|robot|drone|space|semiconductor|defence|hardware|iot/i],
  ["Healthtech", /health|medical|biotech|pharma|wellness/i],
  ["Edtech", /education|edtech|learning/i],
  ["Consumer", /consumer|d2c|e-commerce|food|retail|fashion|travel/i],
  ["Mobility", /mobility|logistics|transport|automotive|ev\b/i],
] as const;

const AREA_RULES = [
  "Taramani",
  "Perungudi",
  "Guindy",
  "Nungambakkam",
  "Adyar",
  "Anna Nagar",
  "Porur",
  "Ambattur",
  "Velachery",
  "Thoraipakkam",
  "Sholinganallur",
  "OMR",
  "Chennai",
] as const;

type JobOpportunity = {
  id: string;
  company: string;
  title: string;
  area: string;
  category: string;
  level: string;
  posted: string;
  url: string;
  logoUrl: string;
};

function classifySector(value: string) {
  return SECTOR_RULES.find(([, matcher]) => matcher.test(value))?.[0] ?? "Other";
}

function classifyArea(value: string) {
  return AREA_RULES.find((area) => value.toLowerCase().includes(area.toLowerCase())) ?? "Other";
}

function toStartup(row: RawStartup, index: number): Startup {
  const lat = Number.parseFloat(row.Lat ?? "");
  const lng = Number.parseFloat(row.Long ?? "");
  return {
    id: `${(row.Company || "company").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    company: row.Company?.trim() || "Unnamed company",
    area: row.Area?.trim() || "Chennai",
    sector: row.Sector?.trim() || "Other",
    description: row["What they do"]?.trim() || "",
    founded: row.Founded?.trim() || "",
    founders: row.Founders?.trim() || "",
    teamSize: row["Team size"]?.trim() || "",
    funding: row.Funding?.trim() || "",
    careers: row["Careers page / hiring signals"]?.trim() || "",
    aiRelevance: row["AI-engineering relevance"]?.trim() || "",
    website: row.Website?.trim() || "",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    logoUrl: row["Logo URL"]?.trim() || "",
    source: row["Source link"]?.trim() || "",
  };
}

function safeHref(value: string) {
  const url = value.split(" | ")[0]?.trim();
  return /^https?:\/\//i.test(url) ? url : "";
}

function extractFirstUrl(value: string) {
  return value.match(/https?:\/\/[^\s;,|)]+/i)?.[0]?.replace(/[.]+$/, "") ?? "";
}

function inferJobCategory(value: string) {
  if (/machine learning|\bai\b|data scientist|data engineer|analytics/i.test(value)) return "Data & AI";
  if (/engineer|developer|software|technical|security|devops|backend|frontend/i.test(value)) return "Engineering";
  if (/product manager|product design/i.test(value)) return "Product";
  if (/design|creative|visual|ux|ui/i.test(value)) return "Design";
  if (/sales|business development|account executive|customer success/i.test(value)) return "Sales";
  if (/marketing|content|growth|brand/i.test(value)) return "Marketing";
  if (/finance|legal|people|talent|hr|operations/i.test(value)) return "Operations";
  return "Other";
}

function inferJobLevel(value: string) {
  if (/intern|graduate|fresher|entry.?level|0.?[–-].?2\s*years/i.test(value)) return "Entry level";
  if (/head|director|vp\b|vice president|principal/i.test(value)) return "Leadership";
  if (/senior|\bsr\b|lead|staff|5\+?\s*years/i.test(value)) return "Senior";
  if (/[2-4]\+?\s*years|2.?[–-].?5\s*years|mid.?level/i.test(value)) return "Mid level";
  return "All levels";
}

function inferJobTitle(value: string) {
  const plain = value
    .replace(/https?:\/\/[^\s;,|)]+/gi, "")
    .replace(/^(actively hiring|hiring signal|hiring|current first-party openings include|careers\/openings|careers|current openings)[:\s-]*/i, "")
    .split(/[.;|]/)[0]
    .trim();
  return plain && plain.length <= 110 ? plain : "View open roles";
}

function inferPosted(value: string) {
  const date = value.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2}\b/i)?.[0];
  if (date) return date;
  if (/current|actively|now|openings?/i.test(value)) return "Current signal";
  return "Listed in dataset";
}

export default function StartupExplorer() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [area, setArea] = useState("All areas");
  const [view, setView] = useState<"map" | "grid">("map");
  const [selected, setSelected] = useState<Startup | null>(null);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [jobCategory, setJobCategory] = useState("All functions");
  const [jobLevel, setJobLevel] = useState("All levels");
  const [jobPosted, setJobPosted] = useState("Any time");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(72);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    Papa.parse<RawStartup>("/data/startups.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => setStartups(data.map(toStartup).filter((item) => item.company !== "Unnamed company")),
      error: () => setError("The startup directory could not be loaded. Please refresh and try again."),
    });
  }, []);

  const filtered = useMemo(() => {
    return startups.filter((startup) => {
      const haystack = `${startup.company} ${startup.area} ${startup.sector} ${startup.description} ${startup.founders}`.toLowerCase();
      return (
        (!deferredQuery || haystack.includes(deferredQuery)) &&
        (sector === "All sectors" || classifySector(startup.sector) === sector) &&
        (area === "All areas" || classifyArea(startup.area) === area)
      );
    });
  }, [area, deferredQuery, sector, startups]);

  const mappedCount = filtered.filter((startup) => startup.lat != null && startup.lng != null).length;
  const activeFilters = Number(sector !== "All sectors") + Number(area !== "All areas");
  const jobs = useMemo<JobOpportunity[]>(() => startups
    .filter((startup) => startup.careers)
    .map((startup) => ({
      id: `job-${startup.id}`,
      company: startup.company,
      title: inferJobTitle(startup.careers),
      area: startup.area,
      category: inferJobCategory(startup.careers),
      level: inferJobLevel(startup.careers),
      posted: inferPosted(startup.careers),
      url: extractFirstUrl(startup.careers),
      logoUrl: startup.logoUrl,
    })), [startups]);
  const visibleJobs = useMemo(() => jobs.filter((job) => (
    (jobCategory === "All functions" || job.category === jobCategory) &&
    (jobLevel === "All levels" || job.level === jobLevel) &&
    (jobPosted === "Any time" || (jobPosted === "Current" ? job.posted === "Current signal" : job.posted !== "Current signal"))
  )), [jobCategory, jobLevel, jobPosted, jobs]);
  useEffect(() => setVisibleCount(72), [deferredQuery, sector, area]);

  function clearFilters() {
    setQuery("");
    setSector("All sectors");
    setArea("All areas");
  }

  return (
    <main className="explorer-shell">
      <header className="toolbar-wrap">
        <div className="toolbar">
          <a className="brand" href="#" aria-label="Chennai Startup Map home">
            <span className="brand-mark" aria-hidden="true"><i /></span>
            <span className="brand-copy"><b>Chennai</b><em> Startup Map</em></span>
          </a>

          <label className="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
            <input
              type="search"
              placeholder="Search companies, sectors, founders…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
          </label>

          <div className="toolbar-actions">
            <div className="view-toggle" aria-label="Choose view">
              <button className={view === "map" ? "active" : ""} onClick={() => { setJobsOpen(false); setView("map"); }}>Map</button>
              <button
                className={view === "grid" ? "active" : ""}
                onClick={() => {
                  setSelected(null);
                  setJobsOpen(false);
                  setView("grid");
                }}
              >
                Grid
              </button>
            </div>
            <button
              className={`jobs-button ${jobsOpen ? "active" : ""}`}
              onClick={() => {
                setSelected(null);
                setJobsOpen((open) => !open);
              }}
              aria-expanded={jobsOpen}
            >
              <span className="jobs-icon" aria-hidden="true">◆</span><b>{jobs.length.toLocaleString("en-IN")}</b><em> jobs</em>
            </button>
            <button className={`filter-toggle ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10m-7 6h4" /></svg>
              Filters {activeFilters > 0 && <span>{activeFilters}</span>}
            </button>
            <a className="submit-button" href="/submit">Add a company <span>↗</span></a>
          </div>

          <div className={`filter-row ${filtersOpen ? "open" : ""}`}>
            <select value={area} onChange={(event) => setArea(event.target.value)} aria-label="Filter by area">
              <option>All areas</option>
              {AREA_RULES.filter((item) => item !== "Chennai").map((item) => <option key={item}>{item}</option>)}
              <option>Other</option>
            </select>
            <select value={sector} onChange={(event) => setSector(event.target.value)} aria-label="Filter by sector">
              <option>All sectors</option>
              {SECTOR_RULES.map(([item]) => <option key={item}>{item}</option>)}
              <option>Other</option>
            </select>
            {(activeFilters > 0 || query) && <button className="clear-filters" onClick={clearFilters}>Reset</button>}
            <p><b>{filtered.length.toLocaleString("en-IN")}</b> companies · <b>{mappedCount.toLocaleString("en-IN")}</b> mapped</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="state-message"><h1>Something went wrong</h1><p>{error}</p></div>
      ) : startups.length === 0 ? (
        <div className="state-message"><span className="loader" /><p>Loading Chennai’s builders…</p></div>
      ) : view === "map" ? (
        <section className="map-view" aria-label="Map of Chennai startups">
          <StartupMap startups={filtered} selected={selected} onSelect={setSelected} />
          <div className="result-pill"><span className="pulse" /> <b>{filtered.length.toLocaleString("en-IN")}</b> companies found</div>
          <div className="by-pill">by S &amp; Y</div>
          <div className="map-key"><span>◆</span><p>Company locations</p></div>
          {filtered.length === 0 && <EmptyState onClear={clearFilters} />}
        </section>
      ) : (
        <section className="directory-view">
          <div className="directory-heading">
            <div><p className="eyebrow">The directory</p><h1>Companies building from Chennai.</h1></div>
            <p>{filtered.length.toLocaleString("en-IN")} companies across the city’s most ambitious sectors.</p>
          </div>
          {filtered.length === 0 ? <EmptyState onClear={clearFilters} /> : (
            <>
              <div className="startup-grid">
                {filtered.slice(0, visibleCount).map((startup) => (
                  <button className="startup-card" key={startup.id} onClick={() => { setSelected(startup); setView("map"); }}>
                    <CompanyLogo startup={startup} />
                    <div className="card-copy"><h2>{startup.company}</h2><p>{startup.description || startup.sector}</p></div>
                    <div className="card-meta"><span>{classifySector(startup.sector)}</span><span>{classifyArea(startup.area)}</span></div>
                    <span className="card-arrow">↗</span>
                  </button>
                ))}
              </div>
              {visibleCount < filtered.length && <button className="load-more" onClick={() => setVisibleCount((count) => count + 72)}>Show more companies</button>}
            </>
          )}
        </section>
      )}

      {selected && (
        <aside className="detail-panel" aria-label={`${selected.company} details`}>
          <button className="panel-close" onClick={() => setSelected(null)} aria-label="Close details">×</button>
          <div className="panel-top"><CompanyLogo startup={selected} /><p className="eyebrow">{classifySector(selected.sector)}</p><h2>{selected.company}</h2><p className="panel-location">⌖ {selected.area}</p></div>
          {selected.description && <p className="panel-description">{selected.description}</p>}
          {(selected.founded || selected.founders || selected.teamSize || selected.funding) && (
            <dl className="facts">
              {selected.founded && <><dt>Founded</dt><dd>{selected.founded}</dd></>}
              {selected.founders && <><dt>Founders</dt><dd>{selected.founders}</dd></>}
              {selected.teamSize && <><dt>Team size</dt><dd>{selected.teamSize}</dd></>}
              {selected.funding && <><dt>Funding</dt><dd>{selected.funding}</dd></>}
            </dl>
          )}
          <div className="panel-links">
            {safeHref(selected.website) && <a href={safeHref(selected.website)} target="_blank" rel="noreferrer">Visit website <span>↗</span></a>}
            {safeHref(selected.careers) && <a className="secondary" href={safeHref(selected.careers)} target="_blank" rel="noreferrer">Careers</a>}
          </div>
        </aside>
      )}

      {jobsOpen && (
        <>
          <button className="jobs-backdrop" onClick={() => setJobsOpen(false)} aria-label="Close jobs" />
          <section className="jobs-panel" aria-label="Startup jobs">
            <div className="jobs-heading">
              <div><p className="eyebrow">Chennai opportunities</p><h2>{jobs.length.toLocaleString("en-IN")} hiring signals</h2></div>
              <button onClick={() => setJobsOpen(false)} aria-label="Close jobs">×</button>
            </div>
            <p className="jobs-note">Calculated from careers pages and active hiring signals in the supplied startup dataset. Confirm availability on the linked company page.</p>
            <div className="job-filters">
              <select value={jobCategory} onChange={(event) => setJobCategory(event.target.value)} aria-label="Job function">
                <option>All functions</option>
                {["Engineering", "Data & AI", "Product", "Design", "Sales", "Marketing", "Operations", "Other"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={jobLevel} onChange={(event) => setJobLevel(event.target.value)} aria-label="Job level">
                <option>All levels</option>
                {["Entry level", "Mid level", "Senior", "Leadership"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={jobPosted} onChange={(event) => setJobPosted(event.target.value)} aria-label="Date posted">
                <option>Any time</option><option>Current</option><option>Dated</option>
              </select>
            </div>
            <div className="jobs-results"><b>{visibleJobs.length}</b> opportunities</div>
            <div className="jobs-list">
              {visibleJobs.map((job) => {
                const content = <><CompanyLogo startup={{ company: job.company, logoUrl: job.logoUrl }} /><div><h3>{job.company}</h3><p>{job.area}</p><span>{job.category}</span><span>{job.level}</span><span>{job.posted}</span></div><i>↗</i></>;
                return job.url ? <a key={job.id} className="job-card" href={job.url} target="_blank" rel="noreferrer">{content}</a> : <article key={job.id} className="job-card">{content}</article>;
              })}
              {visibleJobs.length === 0 && <div className="jobs-empty">No opportunities match these filters.</div>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function CompanyLogo({ startup }: { startup: Pick<Startup, "company" | "logoUrl"> }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="company-logo">
      {startup.logoUrl && !failed ? <img src={startup.logoUrl} alt="" onError={() => setFailed(true)} /> : <b>{startup.company.charAt(0)}</b>}
    </span>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return <div className="empty-state"><span>⌁</span><h2>No companies found</h2><p>Try a broader search or clear the active filters.</p><button onClick={onClear}>Clear filters</button></div>;
}
