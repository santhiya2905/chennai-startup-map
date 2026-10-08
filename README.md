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

The map currently supports search, area and sector filters, circular logo clustering, a grid directory, company detail panels, dataset-backed jobs filtering, mobile layouts, and records without coordinates (available through grid/search).

## Startup submissions

The **Add a company** button opens `/submit`. Company name, website, one-line description and submitter email are required. The API sends all submitted details to **shivaani2905@gmail.com** through Resend, with the submitter's email as the reply-to address. The form shows success only after Resend accepts the email; acceptance does not guarantee inbox delivery.

To enable delivery:

1. Create a [Resend account](https://resend.com) and [verify a sender domain](https://resend.com/docs/dashboard/domains/introduction).
2. Create a sending API key and set `RESEND_API_KEY` in `.env.local` for local use and in your deployment's environment settings for production.
3. Set `SUBMISSION_EMAIL_FROM` to an address on your verified domain, such as `Chennai Startup Map <submissions@yourdomain.com>`.
4. Restart the local server or redeploy the site after changing these settings, then submit a test company and check the recipient's inbox and Resend delivery logs.

For an initial test, `onboarding@resend.dev` can send only to the email address associated with your Resend account. To test delivery to the recipient above using that sender, the Resend account must use `shivaani2905@gmail.com`.

Neither setting is exposed to the browser. When email is unconfigured or rejected, the API returns an error and the form retains the entered details. This replaces the previous local-file/webhook submission flow, so production no longer depends on writing to the deployment's filesystem.

## Production

```bash
npm run build
npm start
```
