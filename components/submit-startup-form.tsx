"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SubmitStatus = "idle" | "submitting" | "done" | "error";

export default function SubmitStartupForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function submitStartup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
      form.reset();
      setStatus("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="submit-page">
      <section className="submit-card">
        <Link className="submit-back" href="/">← Back to map</Link>
        <div className="submit-brand"><span className="brand-mark" aria-hidden="true"><i /></span><b>Chennai Startup Map</b></div>
        {status === "done" ? (
          <div className="submit-success">
            <span>✓</span>
            <h1>Thanks for the submission.</h1>
            <p>We’ll review the company details before adding it to the map.</p>
            <button onClick={() => setStatus("idle")}>Submit another startup</button>
          </div>
        ) : (
          <>
            <h1>Submit a startup</h1>
            <p className="submit-intro">Know a Chennai startup that should be on the map? Fill in what you know. Only the company name and one-line description are required.</p>
            <form className="submit-form" onSubmit={submitStartup}>
              <label className="honeypot" aria-hidden="true">Company URL<input name="company_url" tabIndex={-1} autoComplete="off" /></label>
              <FormField label="Company name" required><input name="name" required maxLength={120} /></FormField>
              <FormField label="Website"><input name="website" type="url" placeholder="https://…" /></FormField>
              <FormField label="One-line description" hint="What they do, in a sentence" required><input name="tagline" required maxLength={200} /></FormField>
              <FormField label="More details" hint="Founders, location, sector, funding or anything useful"><textarea name="description" rows={4} maxLength={1200} /></FormField>
              <div className="submit-form-grid">
                <FormField label="Stage"><select name="stage" defaultValue=""><option value="" disabled>Select a stage…</option>{["Bootstrapped", "Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Public", "Acquired"].map((stage) => <option key={stage}>{stage}</option>)}</select></FormField>
                <FormField label="Your email"><input name="email" type="email" placeholder="you@example.com" /></FormField>
              </div>
              <FormField label="Hiring?" hint="Link to your careers page or active job listings"><input name="jobs_url" type="url" placeholder="https://yourcompany.com/careers" maxLength={300} /></FormField>
              {status === "error" && <p className="submit-error" role="alert">{message}</p>}
              <button className="submit-form-button" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Submitting…" : "Submit startup"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

function FormField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="form-field"><span>{label}{required && <b> *</b>}{hint && <em> — {hint}</em>}</span>{children}</label>;
}
