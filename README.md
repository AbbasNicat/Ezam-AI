# AtlasFlow AI

Corporate travel planning demo for the NeuroBridge Hackathon. An employee request becomes a policy check, up to three feasible packages, an itinerary and map, external booking search links, a simulated approval, and a finance CSV.

Prices are demo estimates. The app does not sell tickets or confirm bookings.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317) and choose **Launch Interactive Demo**. On `/demo`, load **Caspian Ventures** and choose **Generate Travel Plans**.

The core demo works with an empty `.env.local`. `LLM_API_KEY` and `LLM_MODEL` are optional and must stay server-side.

Other commands:

```bash
npm run typecheck
npm test
npm run build
npm start
```

## Deploy on Vercel

This environment had no Vercel token, so a public URL was not created.

1. Push this branch to GitHub.
2. Import the repository at [https://vercel.com/new](https://vercel.com/new).
3. Framework preset: Next.js. Root directory: repository root.
4. Add environment variables only if you want runtime model calls:
   - `LLM_API_KEY`
   - `LLM_BASE_URL` (optional, default `https://api.openai.com/v1`)
   - `LLM_MODEL`
5. Do not create any `NEXT_PUBLIC_` variable for the model key.
6. Deploy. The demo must open without sign-in.

CLI alternative after `npx vercel login`:

```bash
npx vercel
npx vercel --prod
```

## Demo data

Seeded routes are Baku to Istanbul, Tbilisi, and Dubai. The planning clock for notice rules is 9 October 2026. See `docs/DISCLOSURE.md`.
