# AGENTS.md

# AtlasFlow AI — Hackathon Engineering Instructions

## 0. Mission

Build **AtlasFlow AI**, a polished, functional AI-powered corporate travel operations platform, from scratch during the NeuroBridge Hackathon on October 9, 2026.

**Hard deadline: October 9, 2026, 20:00 Asia/Baku.**

This is a time-critical hackathon. The goal is not a large production SaaS. The goal is a beautiful, reliable, demonstrable enterprise workflow with meaningful AI, measurable tests, and a publicly accessible Vercel URL.

### Product promise

Turn one employee travel request into:

1. A structured travel brief.
2. Corporate travel-policy validation.
3. Three optimized travel packages.
4. Flight and accommodation booking handoffs.
5. A mapped itinerary with tourist attractions.
6. Manager approval and an auditable decision.
7. A travel budget and expense report.

**The product must automate actions, not merely chat about travel.**

### Core differentiator

AtlasFlow AI handles **corporate travel plus optional personal tourism** while separating:

- Company-reimbursable expenses.
- Personal, non-reimbursable leisure expenses.

The planner must respect company policies, budget constraints, trip dates, meeting schedules, employee preferences, and approval rules.

## 1. Non-negotiable engineering principles

1. Ship a working deployed product before adding secondary features.
2. Prioritize reliability over feature quantity.
3. Implement the full happy path end to end.
4. No fake functionality disguised as working functionality.
5. Never claim real flight/hotel availability without a real provider.
6. Never claim a booking is completed unless a genuine booking API confirms it.
7. Clearly label synthetic catalog data and estimated prices.
8. Do not collect airline, hotel, Airbnb, banking, or third-party account passwords.
9. Do not build a custom authentication system.
10. Avoid premature infrastructure, queues, microservices, and complicated agents.
11. Use TypeScript strict mode, Zod validation, and clear interfaces.
12. Use a deterministic optimization engine for reliable calculations.
13. Use an LLM for natural-language interpretation, preference extraction, explanations, and intelligent exception handling.
14. Provide deterministic fallback behavior when the LLM API is unavailable.
15. Keep API secrets server-side.
16. Every major action must produce visible UI feedback.
17. No placeholder buttons, dead routes, or empty pages.
18. Use responsive design, but prioritize a laptop judge experience.
19. Make demo mode accessible without sign-up.
20. Deploy early and update incrementally.

## 2. Technology stack

### Required

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Zod
- React Hook Form
- Vercel
- Leaflet + React Leaflet for interactive maps
- OpenStreetMap tiles with visible attribution
- Local seeded JSON/TypeScript travel catalog

### Recommended

- Recharts for budget visualizations
- date-fns for dates
- Sonner for notifications
- Supabase only if the core experience is already functioning

### AI runtime

Implement an adapter that supports one server-side LLM provider via environment variables.

Important: **Using Grok inside Cursor for coding does not automatically provide a Grok API key to the deployed application.**

The app must run without an LLM key using deterministic demo behavior.

Possible adapter:

`lib/ai/provider.ts`

Interface:

- `parseTravelRequest(text, context)`
- `explainTravelPlan(plan, policy)`
- `suggestTripAdjustments(plan, policy)`

Do not depend on a specific unverified model identifier.

### Maps

Use Leaflet for the in-app interactive map.

Use Google Maps external directions links for navigation.

Do not require a Google Maps API key for the core demo.

Do not promise actual driving times or route geometry without a routing provider. A line connecting attractions is an itinerary visualization, not a verified road route.

### Authentication and persistence

**Priority 1:** A frictionless guest demo with localStorage persistence.

**Priority 2:** Supabase anonymous authentication and user-owned records if time permits.

**Priority 3:** Email sign-in or Google OAuth only after everything else is finished.

Do not expose a Supabase service-role key in the browser.

If Supabase is enabled, use Row Level Security and associate records with the authenticated user's ID.

Never implement an insecure shared public table where all anonymous visitors can read each other's travel data.

## 3. User personas

### Employee

Creates a travel request, selects a package, views the itinerary, and submits for approval.

### Travel manager

Reviews requests, approves/rejects them, and sees budget/policy details.

### Finance manager

Reviews corporate versus personal expenses and exports a travel cost report.

For the hackathon, these can be simulated as selectable **demo roles** without claiming production authentication.

## 4. Main product workflow

### Step A — Travel request

Collect:

- Employee name or demo identity
- Company
- Origin city
- Destination city
- Departure date
- Return date
- Number of travelers
- Total corporate budget
- Budget currency
- Travel purpose
- Meeting date/time, if any
- Preferred flight cabin
- Accommodation preference: hotel, apartment, or either
- Preferred accommodation level
- Personal tourism enabled/disabled
- Personal leisure budget
- Interests: history, food, architecture, shopping, nature, etc.
- Free-text special requirements

Show sensible defaults and a one-click demo scenario.

### Step B — AI request interpretation

Convert free text into structured requirements.

Example:

"I need to attend a client meeting in Istanbul next week. My company budget is 1800 AZN. I prefer a quiet hotel and want to visit museums after the meeting."

Expected output:

- Destination: Istanbul
- Purpose: client meeting
- Corporate budget: 1800 AZN
- Accommodation preference: quiet hotel
- Leisure interest: museums
- Tourism timing: outside meeting hours
- Missing information: dates if not supplied

The LLM may suggest structured preferences but cannot invent confirmed reservations, live fares, or policy rules.

Use Zod to validate the returned structure.

### Step C — Corporate policy engine

Define a company travel policy.

Fields:

- Maximum total corporate trip budget
- Allowed cabin classes
- Maximum accommodation cost per night
- Daily meal allowance
- Daily ground-transport allowance
- Minimum booking notice, if applicable
- Approval required above a specified amount
- Whether personal leisure is reimbursable
- Preferred suppliers, optional
- Hotel versus apartment restrictions, optional

Create a `PolicyEvaluation` object:

- `compliant`
- `violations`
- `warnings`
- `approvalRequired`
- `explanations`
- `suggestedFixes`

Hard violations must not be silently ignored.

Example:

"Business class is not permitted for this employee policy. Economy has been selected."

### Step D — Catalog retrieval

Use seeded travel inventory for the initial MVP.

Supported destinations for polished demonstrations:

- Istanbul
- Tbilisi
- Dubai

Include accurate-looking but explicitly synthetic catalog entries for:

- Flights
- Hotels
- Apartments
- Attractions
- Ground transport estimates
- Food estimates

Each catalog item must include:

- Stable ID
- Name
- City
- Category
- Price and currency
- Whether price is estimated
- Coordinates where relevant
- Booking or search URL, if supported
- Descriptive metadata
- Policy-relevant properties

Use static sample data with transparent labels such as "Demo fare estimate — not live availability."

Do not scrape travel websites.

Do not generate unsupported provider-specific deep links that imply a reservation has been found.

### Step E — Three-package optimization

Generate three distinct packages:

1. **Economy** — minimize corporate spending while satisfying hard constraints.
2. **Balanced** — optimize comfort, location, and price.
3. **Comfort** — maximize convenience and quality within the available corporate budget.

All packages must satisfy:

- Date compatibility
- Allowed cabin class
- Hotel nightly cap
- Corporate total budget
- Minimum essential trip requirements
- Meeting schedule
- Valid candidate combinations

If fewer than three feasible packages exist, show only feasible packages and explain why.

Never fabricate a compliant option.

### Cost model

`corporateTotal = flight + accommodation + groundTransport + meals + requiredBusinessCosts + corporateContingency`

`personalTotal = leisureActivities + personalShopping + personalLeisureTransport`

`overallTripTotal = corporateTotal + personalTotal`

Keep corporate and personal totals separate.

Show:

- Corporate budget
- Corporate estimated spending
- Corporate remaining budget
- Personal leisure spending
- Estimated total trip spending

Every cost line must have a category, amount, currency, and estimate flag.

### Optimization implementation

Do not rely on the LLM to perform financial arithmetic.

Implement deterministic candidate enumeration or a simple constrained search.

For each flight × accommodation combination:

1. Check dates and availability assumptions.
2. Evaluate policy.
3. Estimate total costs.
4. Reject hard-constraint violations.
5. Calculate a score using cost, comfort, location, and preference matching.
6. Rank feasible combinations.
7. Select diverse economy/balanced/comfort candidates.

Use explicit weights and deterministic tie-breaking.

Avoid three visually different cards with identical underlying itineraries.

If there are no feasible options, return a clear `NO_FEASIBLE_PLAN` result with actionable adjustments.

### Step F — Itinerary and tourism

Build a day-by-day schedule.

For business days:

- Respect meeting times.
- Avoid placing leisure activities during mandatory business commitments.
- Add practical travel buffers.

For leisure:

- Recommend attractions based on interests.
- Consider estimated admission cost.
- Consider opening hours only if supported by trusted data.
- Prefer geographically sensible groupings.
- Separate free attractions from paid attractions.
- Mark personal leisure costs as non-reimbursable by default.

For the demo, use curated attractions with known coordinates and clearly labeled estimated admission costs.

Do not invent live ticket prices or opening status.

### Step G — Booking handoff

Provide:

- "Search flights" external link
- "Find accommodation" external link
- "Open directions" external link

Track internal handoff status:

- `not_started`
- `ready_for_booking`
- `external_search_opened`
- `booking_confirmation_pending`
- `confirmed_by_user`

Never automatically mark `booked` when a link is clicked.

Real in-app booking is explicitly out of MVP scope.

### Step H — Approval workflow

Employee clicks **Submit for approval**.

Travel manager can:

- Approve
- Reject
- Request changes

Show an audit timeline:

- Request created
- Plan generated
- Policy evaluated
- Package selected
- Approval requested
- Decision recorded

Demo role switching is acceptable, but label it as demo simulation.

Approval actions must update application state and remain visible after refresh.

### Step I — Finance report

Generate:

- Corporate estimated costs by category
- Personal estimated costs by category
- Budget remaining
- Policy exceptions
- Approval status
- Booking handoff status

Provide CSV download.

Optional: printable HTML summary for browser Save as PDF.

Avoid implementing a complex PDF library before deployment.

## 5. Meaningful AI requirements

The app must not be a generic travel chatbot.

Use AI for:

1. Parsing ambiguous employee requests.
2. Inferring non-sensitive travel preferences from the user's own words.
3. Explaining trade-offs between packages.
4. Explaining policy exceptions in plain language.
5. Suggesting how to bring an over-budget trip into compliance.
6. Producing a concise manager-facing approval summary.

Use deterministic code for:

- Cost arithmetic
- Date checks
- Policy validation
- Package feasibility
- Budget calculations
- Package ranking
- State transitions

### Structured AI output

Use a strict schema.

Never trust raw model output directly.

If AI parsing fails:

- Log the failure server-side.
- Use form values and deterministic defaults.
- Show "Basic planning mode" if relevant.
- Do not crash.

If the model returns unsupported destinations, fares, coordinates, or bookings, reject those claims rather than adding them to the catalog.

## 6. Required UI routes

### `/`

Premium landing page.

Include:

- Clear value proposition
- Product preview
- "Launch live demo" CTA
- Brief enterprise automation explanation
- Trustworthy demo-data disclosure

### `/demo`

Primary application workspace.

Suggested desktop layout:

- Left: request form / workflow navigation
- Center: plan cards and itinerary
- Right: budget/policy insights or contextual panel

On smaller screens, use tabs or stacked sections.

### `/demo/plan`

Optional dedicated result page if convenient.

Show:

- Three package cards
- Cost comparison
- Policy status
- Itinerary
- Map
- Booking links
- Submit approval

### `/demo/operations`

Demo enterprise operations view.

Show:

- Pending requests
- Approval decisions
- Audit timeline
- Finance summary
- CSV export

If time is short, combine everything under `/demo` rather than building multiple pages.

## 7. Design system

Style direction:

**Premium B2B SaaS, modern travel intelligence, polished enough for a finalist demo.**

Visual principles:

- Clean light interface
- Deep navy typography
- Electric blue or teal accent
- Restrained gradients
- Rounded cards
- High-quality spacing
- Subtle shadows
- Elegant iconography
- Excellent typography
- Clear numerical hierarchy
- Strong status visibility
- Avoid generic chat UI

Important visual elements:

- Travel progress stepper
- Three package comparison cards
- Budget progress visualization
- Policy compliance indicators
- Interactive itinerary timeline
- Interactive map
- Approval activity timeline
- Booking handoff status

Use shadcn/ui components for consistent behavior.

### Package cards

Each package should show:

- Name
- Corporate total
- Personal leisure estimate
- Budget remaining
- Flight class
- Accommodation type
- Number of nights
- Hotel location
- Policy status
- AI explanation
- Select button

Highlight Balanced by default only if it is actually feasible.

### Map markers

Use distinctive icons/colors for:

- Airport
- Hotel
- Meeting location
- Museum
- Restaurant
- Tourist attraction
- Other itinerary stops

Clicking a marker should reveal name, category, schedule, and estimated cost when available.

Ensure the map works in production builds; use dynamic import with SSR disabled.

## 8. Suggested project structure

```text
app/
  page.tsx
  demo/
    page.tsx
  api/
    plan/
      route.ts
    ai/
      parse/
        route.ts
components/
  travel/
    travel-request-form.tsx
    trip-workspace.tsx
    package-comparison.tsx
    budget-breakdown.tsx
    policy-results.tsx
    itinerary-timeline.tsx
    travel-map.tsx
    approval-panel.tsx
    booking-handoff.tsx
    finance-report.tsx
lib/
  ai/
    provider.ts
    prompts.ts
    schemas.ts
  planning/
    planner.ts
    optimizer.ts
    policy-engine.ts
    itinerary.ts
    baseline.ts
lib/data/ flights, accommodations, attractions, policies, demo-scenarios
lib/storage/local-store.ts
lib/utils/ currency, dates, booking-links
types/travel.ts
tests/ planner, policy, scenarios
docs/TEST_RESULTS.md
docs/DISCLOSURE.md
AGENTS.md
PROJECT_BRIEF.md
README.md
```

Keep the structure flexible. Do not spend time creating unused abstraction layers.

## 9. Data types

Implement at least these TypeScript types:

### TravelRequest

- id, employeeName, companyName, origin, destination, departureDate, returnDate, travelerCount, corporateBudget, currency, purpose, meetings, cabinPreference, accommodationPreference, leisureEnabled, personalLeisureBudget, interests, specialRequirements

### CorporatePolicy

- id, companyName, allowedCabins, maxHotelNightly, dailyMealAllowance, dailyGroundTransportAllowance, approvalThreshold, leisureReimbursable, requiredApprovalRoles

### TravelOption

- id, type, name, provider, price, currency, estimated, startDate, endDate, location, attributes, externalUrl

### TripPackage

- id, tier, flight, accommodation, itinerary, costBreakdown, corporateTotal, personalTotal, remainingBudget, policyEvaluation, optimizationScore, explanation

### Approval

- requestId, status, approverRole, comment, decidedAt

### AuditEvent

- id, tripId, type, description, timestamp, actor

## 10. Testing and hackathon scoring

The judges assign 20/100 points to quality testing and baseline comparisons.

Testing is mandatory, not optional.

Create a baseline planner:

**Baseline:** Choose the cheapest flight and cheapest accommodation independently, then check constraints.

**AtlasFlow:** Constraint-aware, preference-aware optimization.

Measure:

- Percentage of plans within corporate budget
- Number of policy violations
- Percentage of feasible travel requests
- Preference satisfaction
- Total estimated cost
- Planner execution time
- Number of successfully completed workflow stages

Build at least 15–20 synthetic test scenarios.

Include:

1. Normal trip within budget
2. Budget too low
3. Business class prohibited
4. Hotel nightly cap exceeded
5. Personal leisure excluded from corporate reimbursement
6. Apartment preference
7. Hotel preference
8. Tight meeting schedule
9. Same-day travel
10. Invalid date range
11. Unsupported city
12. Missing optional preferences
13. No valid flight option
14. No valid accommodation
15. Multiple equally priced packages
16. Currency handling
17. Approval required
18. Approval not required
19. AI provider unavailable
20. Malformed AI response

Use Vitest if practical.

Write real test results to `docs/TEST_RESULTS.md`.

Never fabricate benchmark improvements.

## 11. Required demo scenario

Seed a compelling demo:

- Company: Caspian Ventures (fictional)
- Employee: Aylin M.
- Origin: Baku
- Destination: Istanbul
- Duration: 3 days
- Purpose: Client meeting
- Corporate budget: 1,800 AZN
- Cabin: Economy
- Accommodation: Hotel or apartment
- Interest: Museums and architecture
- Personal leisure budget: 200 AZN

The demo must show:

1. One-click request load.
2. AI interpretation.
3. Policy checks.
4. Three optimized packages, if feasible.
5. Package comparison.
6. Budget breakdown.
7. Mapped attractions.
8. Flight/hotel search handoff.
9. Manager approval.
10. Expense export.

Prices are synthetic estimates, not live offers.

## 12. Demo reliability

- The product must work with no login.
- The demo scenario must work with no LLM API key.
- Avoid depending on external inventory APIs.
- Avoid requiring paid map APIs.
- Add loading states.
- Add meaningful empty states.
- Add error boundaries where useful.
- Handle invalid inputs.
- Ensure the demo is usable in Chrome on a clean laptop.
- Ensure Vercel production deployment works.
- Keep one-click "Reset demo" functionality.
- Use deterministic data for judge reproducibility.

## 13. Security and honesty

Do not collect:

- Passport scans
- Payment card numbers
- Third-party booking credentials
- Airline account passwords
- Sensitive employee information unnecessary for the demo

No hardcoded secrets.

Use `.env.local` and Vercel environment variables.

Never expose an LLM key through `NEXT_PUBLIC_*`.

If booking links are external, show "Continue to provider."

If a manager approval is simulated, label it as "Demo approval workflow."

If prices are estimated, label them clearly.

If the application is not connected to a real GDS, do not claim it is.

## 14. Implementation priority

### P0 — Must ship

- Working Next.js app
- Polished UI
- Travel request form
- Demo scenario
- Policy engine
- Three-package planner
- Budget calculations
- Itinerary
- Interactive map
- External booking links
- Vercel deployment

### P1 — High value

- LLM request parsing
- AI explanations
- Manager approval
- Audit timeline
- Finance export
- Automated tests

### P2 — Optional

- Supabase persistence
- Receipt extraction
- Google OAuth
- Additional destinations
- More advanced optimization

### P3 — Do not build today

- WhatsApp integration
- Live airline ticket purchase
- Live hotel payment
- GDS integration
- CRM integration
- Complex multi-agent framework
- Custom authentication
- Real-time traffic prediction
- Visa automation
- Enterprise SSO

## 15. Timeboxing

Assume only a few hours remain before 20:00 Asia/Baku on October 9, 2026.

Ship the happy path before polish extras. Deploy as soon as the core demo works, then iterate.

## 16. Agent behavior

When implementing:

1. Read the spec completely.
2. Inspect the repository before editing.
3. Build in vertical slices.
4. Prioritize an end-to-end functional workflow.
5. Write code directly; do not spend excessive time explaining architecture.
6. Install only necessary packages.
7. Keep components small and typed.
8. Validate user inputs.
9. Avoid mock buttons.
10. Do not stop after scaffolding.
11. Run lint, typecheck, tests, and build whenever practical.
12. Fix build errors before adding new features.
13. Update README with setup and deployment instructions.
14. Record actual test outcomes.
15. Do not claim completion without verification.

When choosing between an impressive but fragile feature and a simple working feature, choose the working feature.

## 17. Definition of done

The project is complete only when:

- A stranger can open the Vercel URL (or, if deploy credentials are missing, `next build` succeeds and README has exact Vercel deploy steps).
- They can load a demo trip.
- They can generate valid travel packages.
- They can compare corporate costs.
- They can view the itinerary and map.
- They can follow booking search links.
- They can approve a selected trip in demo mode.
- They can download a finance CSV.
- The site clearly discloses estimated data.
- At least the critical test scenarios pass.
- The repository includes setup instructions.
- The app builds successfully for production.

**Build a working enterprise product demo, not a slideshow disguised as an application.**

Scaffold note: this repository may only contain a seeded README. Prefer the official `create-next-app` scaffold into a subdirectory (for example `tmp-scaffold`), then move generated files up to the repo root. Do not target `.` or `/workspace` with create-next-app. Use an uncommon dev port (not 3000, 5173, or 8080). shadcn/ui for primitives. Replace the seeded README with real setup and deploy instructions.
