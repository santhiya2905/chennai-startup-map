import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_LENGTHS = { name: 120, website: 300, tagline: 200, description: 1200, stage: 40, email: 180, jobs_url: 300 } as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.company_url === "string" && body.company_url.trim()) return NextResponse.json({ ok: true });

    const submission = Object.fromEntries(Object.entries(MAX_LENGTHS).map(([key, maximum]) => {
      const value = typeof body[key] === "string" ? body[key].trim().slice(0, maximum) : "";
      return [key, value];
    }));

    if (!submission.name || !submission.tagline) {
      return NextResponse.json({ error: "Company name and one-line description are required." }, { status: 400 });
    }

    const record = { id: randomUUID(), submittedAt: new Date().toISOString(), ...submission };
    const webhook = process.env.SUBMISSION_WEBHOOK_URL;

    if (webhook) {
      const response = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
      if (!response.ok) throw new Error("Submission webhook rejected the request");
    } else {
      const directory = path.join(process.cwd(), "data");
      await mkdir(directory, { recursive: true });
      await appendFile(path.join(directory, "submissions.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The submission could not be saved. Please try again." }, { status: 500 });
  }
}
