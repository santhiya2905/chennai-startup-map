import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Chennai Startup Map — Startups in Chennai",
  description:
    "Explore Chennai's startup ecosystem across SaaS, AI, fintech, deeptech and more on an interactive map.",
  openGraph: {
    title: "Chennai Startup Map",
    description: "Discover the companies building from Chennai.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
          {children}
          <Analytics />
        </body>
    </html>
  );
}
