# Disclosure

## Models

- Coding assistance for this repository used Grok inside Cursor. That assistant is not the application's runtime model.
- Runtime interpretation is optional. If `LLM_API_KEY` and `LLM_MODEL` are set on the server, AtlasFlow calls an OpenAI-compatible chat endpoint. The key is never exposed with a `NEXT_PUBLIC_` variable.
- With no key, the app stays in basic planning mode: keyword extraction plus the deterministic policy engine, cost model, and package optimizer.

## Data

- Flight, hotel, apartment, meal, and ground-transport prices are synthetic demo estimates for Istanbul, Tbilisi, and Dubai.
- Attraction coordinates are curated public landmarks. Admission figures are estimates, not live ticket prices or opening status.
- Caspian Ventures and Aylin M. are fictional.
- Currency conversion uses fixed demo rates disclosed in the cost model.
- The map uses OpenStreetMap tiles and must keep their attribution. A straight itinerary is not a verified road route.
- External links open Google Flights search, Booking.com search, or Google Maps directions. They are not reservations.

## Components

- Next.js App Router, React, TypeScript, Tailwind CSS
- shadcn-style UI primitives (Radix, class-variance-authority)
- Zod and React Hook Form
- Leaflet and React Leaflet
- OpenStreetMap
- Recharts, date-fns, Lucide, Sonner
- Official `create-next-app` scaffold

Supabase, custom authentication, GDS, and payment providers are not part of this build.

## Inspiration

AtlasFlow is an independent hackathon implementation of the corporate travel problem. It does not copy proprietary source, design files, or private datasets. The product angle is policy-aware planning with corporate and personal expenses kept separate, then an approval-to-finance handoff.
