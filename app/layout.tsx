import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
