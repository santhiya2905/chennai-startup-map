"use client";

import { useState } from "react";
import Link from "next/link";

const creators = [
  {
    name: "Santhiya KJ",
    handle: "@santhiya-kj",
    role: "Co-creator",
    initial: "S",
    color: "#9665bd",
    linkedin: "https://www.linkedin.com/in/santhiya-kj",
    photo: "https://media.licdn.com/dms/image/v2/D5603AQEM_q_xvJS8gA/profile-displayphoto-crop_800_800/B56ZffI5PPHUAI-/0/1751795341954?e=1792627200&v=beta&t=Y1taFuA0xpsjptaqfuqFeFRS3NI4Dybia0p1UeVY0Q8",
    bio: "Building at the intersection of community and tech. Co-created Chennai Startup Map to surface the builders shaping Chennai's future.",
  },
  {
    name: "Yogeshwar CM",
    handle: "@yogeshwar-cm",
    role: "Co-creator",
    initial: "Y",
    color: "#7c3aed",
    linkedin: "https://www.linkedin.com/in/yogeshwar-cm",
    photo: "https://media.licdn.com/dms/image/v2/D5603AQETYf28k_2MRw/profile-displayphoto-scale_200_200/B56ZyaELTaG4AY-/0/1772111313835?e=2147483647&v=beta&t=hVy2A-EHXv89BDGEHtIga0_WgT8wANIU-81xOkWO6kw",
    bio: "Passionate about the startup ecosystem and connecting founders, engineers, and ideas across Chennai.",
  },
];

function CreatorAvatar({ photo, initial, color, name }: { photo: string; initial: string; color: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="creator-avatar-wrap" style={{ "--avatar-color": color } as React.CSSProperties}>
      <div className="creator-avatar-ring" />
      <div className="creator-avatar">
        {photo && !failed
          ? <img src={photo} alt={name} onError={() => setFailed(true)} />
          : <span>{initial}</span>}
      </div>
    </div>
  );
}

export default function CreatorsPage() {
  return (
    <main className="creators-page">
      <div className="creators-bg" aria-hidden="true" />

      <Link href="/" className="creators-back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
        Back to map
      </Link>

      <header className="creators-header">
        <p className="creators-eyebrow">The people behind it</p>
        <h1 className="creators-title">Made with care,<br />for People.</h1>
        <p className="creators-subtitle">
          Chennai Startup Map is an independent project built to spotlight the startups, founders, and builders shaping the city's future.
        </p>
      </header>

      <div className="creators-grid">
        {creators.map((c) => (
          <a
            key={c.handle}
            href={c.linkedin}
            target="_blank"
            rel="noreferrer"
            className="creator-card"
          >
            <div className="creator-glow" style={{ background: c.color }} aria-hidden="true" />
            <CreatorAvatar photo={c.photo} initial={c.initial} color={c.color} name={c.name} />
            <div className="creator-body">
              <p className="creator-role">{c.role}</p>
              <h2 className="creator-name">{c.name}</h2>
              <p className="creator-bio">{c.bio}</p>
            </div>
            <div className="creator-footer">
              <span className="creator-linkedin">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                View on LinkedIn
              </span>
              <span className="creator-arrow">↗</span>
            </div>
          </a>
        ))}
      </div>

      <footer className="creators-footer-note">
        <span className="brand-mark-sm">C</span>
        Chennai Startup Map · Open to contributions
      </footer>
    </main>
  );
}
