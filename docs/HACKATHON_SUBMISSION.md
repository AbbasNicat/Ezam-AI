# AtlasFlow AI — Hackathon Submission

## Project description

AtlasFlow AI turns a travel request into three constraint-aware packages, a mapped itinerary, booking handoffs, an auditable approval decision, and a finance-ready cost report. It supports both personal planning and corporate travel operations in one demo-ready product.

## User problem and solution

Travelers and companies coordinate flights, stays, budgets, policy, maps, approvals, and expenses across disconnected tools. AtlasFlow provides one workflow that interprets requirements, applies deterministic constraints, compares feasible options, and carries the selected plan through handoff and reporting.

## Key features

- Individual and Business workspace onboarding.
- Natural-language request interpretation with deterministic fallback.
- Economy, Balanced, and Comfort package optimization.
- Corporate budget, cabin, hotel-cap, and approval-policy enforcement.
- Corporate and personal leisure expense separation.
- Day-by-day itinerary and OpenStreetMap-based Leaflet map.
- Honest external flight, accommodation, and directions handoffs.
- Simulated manager approval with a persistent audit trail.
- Finance CSV export.

## Technical architecture

- Next.js App Router, React, strict TypeScript, and Tailwind CSS.
- Zod and React Hook Form for validated inputs.
- Deterministic candidate enumeration for money, feasibility, ranking, and policy rules.
- Optional OpenAI-compatible server-side adapter for language interpretation.
- Seeded TypeScript catalog for repeatable hackathon demonstrations.
- localStorage for guest profile and workflow persistence.
- Leaflet, React Leaflet, and OpenStreetMap for map visualization.
- Vitest scenario and baseline tests.

## AI/model disclosure

Runtime AI is optional and configured with server-side environment variables. Without a key, AtlasFlow uses deterministic keyword extraction and continues through the complete planning workflow. The LLM does not supply prices, perform financial arithmetic, invent policy, or confirm bookings.

## Synthetic-data disclosure

Flight, accommodation, meal, ground-transport, and attraction prices are synthetic estimates. Caspian Ventures and Aylin M. are fictional. External links are search or directions handoffs, not reservations. The map line is an itinerary visualization, not verified road routing.

## Testing summary

The suite covers normal travel, low budgets, prohibited cabins, hotel caps, personal reimbursement separation, stay preferences, tight meetings, same-day travel, invalid dates, unsupported cities, missing inventory, currencies, approval thresholds, unavailable AI, malformed model output, baseline comparison, and the end-to-end workflow. The latest verified baseline before this milestone was 26 passing tests with 2 intentionally skipped.

## Known limitations

- Seeded catalog rather than live airline or hotel inventory.
- No ticket purchase, hotel payment, GDS, traffic routing, or production authentication.
- Demo role switching and browser-local persistence.
- Optional runtime AI requires separately configured server environment variables.

## Links

- GitHub: <https://github.com/AbbasNicat/Ezam-AI>
- Demo: <https://ezamai.vercel.app>

## Two-minute demo script

**0:00–0:15 — Problem.** Corporate travel is fragmented across search, policy, approvals, maps, and spreadsheets. AtlasFlow makes it one workflow.

**0:15–0:30 — Two audiences.** Show the Individual and Business choices. Enter the Business workspace and review the company policy limits.

**0:30–0:50 — Request and intelligence.** Load the Caspian Ventures scenario, show the structured brief, and generate plans without requiring an AI key.

**0:50–1:10 — Three packages.** Compare Economy, Balanced, and Comfort. Point out budget remaining, policy status, and the separate personal leisure estimate.

**1:10–1:28 — Itinerary and map.** Show the client meeting protected from sightseeing, then show mapped airport, stay, meeting, and attraction markers.

**1:28–1:43 — Honest booking handoff.** Open the flight or stay search and explain that AtlasFlow records the handoff without claiming a booking.

**1:43–1:55 — Approval and finance.** Submit as Employee, approve as Travel manager, show the audit trail, and download the finance CSV.

**1:55–2:00 — Evidence.** Close with the automated scenario tests, deterministic optimizer, GitHub repository, and public demo URL.

## Pitch deck outline

1. **AtlasFlow AI** — One intelligent workflow for travel.
2. **The problem** — Fragmented planning, policy risk, unclear personal versus corporate spend.
3. **The solution** — Request → optimize → itinerary → handoff → approval → finance.
4. **Two experiences** — Individual planning and Business operations.
5. **How intelligence works** — LLM interpretation plus deterministic policy and financial logic.
6. **Live product** — Package comparison, map, approval, and CSV screenshots.
7. **Measured quality** — Scenario suite and cheapest-first baseline comparison.
8. **Business potential** — SMEs, finance operations, travel teams, and future inventory integrations.
