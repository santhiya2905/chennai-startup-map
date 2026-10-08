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
    <div className="creator-portrait" style={{ "--avatar-color": color } as React.CSSProperties}>
        {photo && !failed
          ? <img src={photo} alt={name} onError={() => setFailed(true)} />
          : <span>{initial}</span>}
    </div>
  );
}

export default function CreatorsPage() {
  return (
    <main className="creators-page">
      <nav className="creators-nav" aria-label="Creators page navigation">
        <Link href="/" className="creators-brand">Chennai Startup Map<span aria-hidden="true">↗</span></Link>
        <span className="creators-nav-label">The people behind the map</span>
        <Link href="/" className="creators-back">Back to map <span aria-hidden="true">↗</span></Link>
      </nav>

      <section className="creators-stage" aria-labelledby="creators-title">
        <header className="creators-header">
          <p className="creators-eyebrow"><span aria-hidden="true" /> Built in Chennai. For Chennai.</p>
          <h1 id="creators-title" className="creators-title">CREATORS</h1>
        </header>
        <svg className="creators-ribbons" viewBox="0 0 1440 980" preserveAspectRatio="none" aria-hidden="true">
          <path className="creators-contour" d="M-80 730 C220 590 360 880 660 733 S1110 430 1500 635 M-80 755 C220 615 360 905 660 758 S1110 455 1500 660" />
        </svg>
        <div className="creators-grid">
        {creators.map((c) => (
          <a
            key={c.handle}
            href={c.linkedin}
            target="_blank"
            rel="noreferrer"
            className="creator-card"
            aria-label={`${c.name}, ${c.role} — view LinkedIn profile (opens in a new tab)`}
          >
            <span className="creator-card-number" aria-hidden="true">0{creators.indexOf(c) + 1} / Co-creator</span>
            <CreatorAvatar photo={c.photo} initial={c.initial} color={c.color} name={c.name} />
            <div className="creator-body">
              <h2 className="creator-name">{c.name}</h2>
              <p className="creator-role">{c.role} <span aria-hidden="true">·</span> Chennai Startup Map</p>
              <p className="creator-bio">{c.bio}</p>
            </div>
            <div className="creator-footer">
              <span className="creator-linkedin">
                Let’s connect <span>LinkedIn</span>
              </span>
              <span className="creator-arrow">↗</span>
            </div>
          </a>
        ))}
        </div>
        <div className="creators-caption"><span aria-hidden="true">↳</span><p>Two people. One shared curiosity.<br />A city full of builders.</p></div>
      </section>

      <footer className="creators-footer">
        <p className="creators-footer-heading">Made with care.<br /><em>For the people building here.</em></p>
        <div className="creators-footer-details">
          <p>Chennai Startup Map is an independent project built to spotlight the startups, founders, and builders shaping the city’s future.</p>
          <Link href="/submit">Know a company we should add? <span aria-hidden="true">↗</span></Link>
        </div>
      </footer>
    </main>
  );
}
