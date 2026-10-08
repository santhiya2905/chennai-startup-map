import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_LENGTHS = { name: 120, website: 300, tagline: 200, description: 1200, stage: 40, email: 180, jobs_url: 300 } as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please provide valid company details." }, { status: 400 });
    }
    if (typeof body.company_url === "string" && body.company_url.trim()) return NextResponse.json({ ok: true });

    const submission = Object.fromEntries(Object.entries(MAX_LENGTHS).map(([key, maximum]) => {
      const value = typeof body[key] === "string" ? body[key].trim().slice(0, maximum) : "";
      return [key, value];
    }));

    if (!submission.name || !submission.website || !submission.tagline || !submission.email) {
      return NextResponse.json({ error: "Company name, website, one-line description and your email are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    try {
      const website = new URL(submission.website);
      if (!["http:", "https:"].includes(website.protocol)) throw new Error("Invalid website protocol");
    } catch {
      return NextResponse.json({ error: "Please enter a valid website URL starting with http:// or https://." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.SUBMISSION_EMAIL_FROM;
    if (!apiKey || !from) {
      console.error("Submission email is not configured: RESEND_API_KEY and SUBMISSION_EMAIL_FROM are required.");
      return NextResponse.json({ error: "Submissions are temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const record = { id: randomUUID(), submittedAt: new Date().toISOString(), ...submission };
    const text = [
      "New company submission — Chennai Startup Map",
      `Company name: ${submission.name}`,
      `Website: ${submission.website}`,
      `One-line description: ${submission.tagline}`,
      `More details: ${submission.description || "Not provided"}`,
      `Stage: ${submission.stage || "Not provided"}`,
      `Submitter email: ${submission.email}`,
      `Hiring link: ${submission.jobs_url || "Not provided"}`,
      `Submitted at: ${record.submittedAt}`,
      `Submission ID: ${record.id}`,
    ].join("\n\n");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: ["shivaani2905@gmail.com"],
        reply_to: submission.email,
        subject: `New company submission: ${submission.name.replace(/[\r\n]/g, " ")}`,
        text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.id !== "string" || !result.id) {
      console.error("Submission email rejected by provider", { status: response.status });
      return NextResponse.json({ error: "The submission could not be emailed. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Please provide valid company details." }, { status: 400 });
    }
    console.error("Submission email request failed", { error: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "The submission could not be emailed. Please try again." }, { status: 500 });
  }
}
