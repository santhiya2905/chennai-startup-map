export type Startup = {
  id: string;
  company: string;
  area: string;
  sector: string;
  description: string;
  founded: string;
  founders: string;
  teamSize: string;
  funding: string;
  careers: string;
  aiRelevance: string;
  website: string;
  lat: number | null;
  lng: number | null;
  logoUrl: string;
  source: string;
};

export type RawStartup = {
  Company?: string;
  Area?: string;
  Sector?: string;
  "What they do"?: string;
  Founded?: string;
  Founders?: string;
  "Team size"?: string;
  Funding?: string;
  "Careers page / hiring signals"?: string;
  "AI-engineering relevance"?: string;
  Website?: string;
  Lat?: string;
  Long?: string;
  "Logo URL"?: string;
  "Source link"?: string;
};
