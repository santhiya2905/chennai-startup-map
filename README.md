# Chennai Startup Map

An interactive Next.js directory for Chennai's startup ecosystem, inspired by the interaction model of Bangalore Startup Map.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

The checked-in dataset lives at `public/data/startups.csv`. To refresh it from the shared Google Sheet:

```bash
npm run sync-data
```

The map currently supports search, area and sector filters, circular logo clustering, a Chennai-area startup heatmap, a grid directory, company detail panels, dataset-backed jobs filtering, mobile layouts, and records without coordinates (available through grid/search).

## Startup submissions

The **Add a company** button opens `/submit`. In local or self-hosted environments, accepted submissions are appended to `data/submissions.jsonl` (ignored by Git). For serverless production, configure `SUBMISSION_WEBHOOK_URL` to a Google Apps Script, automation webhook, or database-backed endpoint that accepts JSON submissions.

## Production

```bash
npm run build
npm start
```
