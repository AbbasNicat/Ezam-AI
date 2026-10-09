# PROJECT_BRIEF.md

# AtlasFlow AI

## AI-Powered Corporate Travel & Expense Automation

**Hackathon:** NeuroBridge Hackathon 2026  
**Track:** AI Enterprise Solutions  
**Deadline:** October 9, 2026, 20:00 Baku time  
**Status:** New project to be developed during the hackathon

## 1. Executive summary

AtlasFlow AI is an enterprise travel automation platform that transforms an employee's travel request into a policy-compliant, budget-optimized, approval-ready travel plan.

Instead of manually switching between flight websites, hotel platforms, company travel policies, spreadsheets, maps, and finance tools, employees and travel managers use one workspace.

The system generates three travel packages, checks corporate rules, creates a mapped itinerary, prepares booking handoffs, routes the plan for approval, and produces a finance-ready expense summary.

**One request. Three optimized options. One coordinated workflow.**

### Important scope distinction

The hackathon MVP does not issue airline tickets or charge hotel payments.

It automates planning, policy checks, decision-making, approvals, booking handoffs, and expense preparation.

Real booking and payment integrations are future enterprise integrations.

## 2. The user and the problem

### Primary customers

- Companies with employees traveling for meetings, conferences, sales, and supplier visits.
- Corporate travel departments.
- Travel managers.
- Finance and accounting teams.
- SMEs without dedicated travel management software.

### Local relevance

Potential Azerbaijani customer segments include:

- Banks and financial services
- Logistics and freight companies
- Energy companies
- Technology companies
- Export/import businesses
- Consulting firms
- Large holding companies

These are potential target segments, not verified claims about specific companies' current internal problems.

### The operational problem

A typical corporate trip may involve:

1. Employee requests travel.
2. Manager verifies business purpose.
3. Someone checks the travel budget.
4. Flights are researched.
5. Hotels or apartments are compared.
6. Corporate travel policy is checked.
7. Approval is requested.
8. Booking is completed externally.
9. The employee builds an itinerary.
10. Finance later reconciles expenses.

This is fragmented work.

Employees may choose options that exceed policy limits.

Travel managers may repeatedly compare the same information.

Finance teams may receive incomplete expense breakdowns.

Personal leisure expenses may be mixed with company expenses.

### The key question

Why should an employee manually coordinate multiple websites and departments when one AI-driven workflow can prepare the entire trip for approval?

## 3. Product vision

AtlasFlow AI is not another tourism chatbot.

It is an **AI travel operations workspace**.

The core object is a **Trip Request**, not a chat conversation.

Every trip progresses through a workflow:

**Request → Analyze → Optimize → Review → Approve → Book externally → Report**

The platform reduces fragmented manual coordination.

## 4. Product pillars

### Pillar A — Intelligent request intake

Employees can fill a form or describe the trip in natural language.

Example:

"I have a client meeting in Istanbul. I need to travel from Baku for three days. Budget is 1800 AZN. Economy flight. A quiet hotel near the center. I'd also like to see museums after work."

AI converts the request into structured constraints and preferences.

The employee can inspect and edit those values before planning.

### Pillar B — Corporate policy automation

AtlasFlow evaluates:

- Maximum budget
- Flight cabin restrictions
- Hotel price caps
- Approval requirements
- Reimbursable expense categories
- Business versus personal activities

Example:

The employee requests business class, but the company permits only economy.

AtlasFlow flags the conflict and offers a compliant economy alternative.

This is a business action, not just a warning.

### Pillar C — Budget-aware package generation

The planner builds three options:

**Economy**

- Lower estimated cost
- Essential comfort
- Maximum budget remaining

**Balanced**

- Better location and convenience
- Reasonable total cost
- Good preference matching

**Comfort**

- Best available convenience under policy
- Higher-quality accommodation where affordable
- Still respects corporate constraints

The system never claims a package is within budget when it is not.

If three valid packages cannot be found, it reports the limitation.

### Pillar D — Flight and accommodation workflow

The platform compares:

- Cabin class
- Estimated price
- Accommodation category
- Hotel versus apartment
- Location
- Length of stay
- Corporate policy fit

For the MVP, prices come from a clearly labeled demo catalog.

External search links help employees continue booking with providers.

No live inventory or confirmed reservation is implied.

### Pillar E — Tourism and itinerary planning

The employee can optionally add leisure interests.

The system recommends:

- Museums
- Historic landmarks
- Architecture
- Restaurants
- Shopping areas
- Parks and scenic attractions

Attractions are filtered by:

- Destination
- Interest
- Estimated admission cost
- Available free time
- Personal leisure budget
- Geographic proximity

The system avoids scheduling leisure activities over mandatory business meetings.

### Pillar F — Corporate versus personal expense separation

This is a central product differentiator.

For example:

- Flight: company expense
- Business hotel: company expense
- Ground transport to meeting: company expense
- Meals within policy: company expense
- Optional museum ticket: personal expense
- Optional shopping: personal expense

The final budget clearly separates these categories.

Company policy may override default classifications.

### Pillar G — Manager approval

Once an employee selects a package:

- The request is submitted.
- A manager sees the cost and policy summary.
- The manager approves, rejects, or requests changes.
- The decision appears in the audit timeline.

The MVP uses a clearly labeled simulated role-based approval flow.

### Pillar H — Finance-ready reporting

After approval, the system prepares:

- Expense categories
- Estimated corporate costs
- Personal expenses
- Remaining budget
- Policy compliance
- Approval history
- Booking handoff status

Finance can download CSV.

## 5. End-to-end demo narrative

### Demo setup

**Company:** Caspian Ventures — fictional demo company  
**Employee:** Aylin M.  
**Origin:** Baku  
**Destination:** Istanbul  
**Trip length:** Three days  
**Purpose:** Client meeting  
**Corporate budget:** 1,800 AZN  
**Flight:** Economy  
**Accommodation:** Hotel or apartment  
**Interests:** Museums, architecture  
**Personal leisure budget:** 200 AZN

### Scene 1 — Employee creates request

The employee opens AtlasFlow and loads the demo scenario.

The form is already populated.

The employee can modify budget, destination, accommodation, and interests.

### Scene 2 — AI understands intent

AtlasFlow interprets preferences and identifies relevant constraints.

It shows a structured summary.

### Scene 3 — Policy check

The system evaluates the company's travel policy.

It identifies any budget, cabin, accommodation, or approval restrictions.

### Scene 4 — Package generation

AtlasFlow creates Economy, Balanced, and Comfort packages using its constraint-aware planner.

Each card displays:

- Flight option
- Accommodation option
- Corporate estimated cost
- Personal estimated cost
- Budget remaining
- Compliance status
- AI explanation

### Scene 5 — Budget comparison

The employee compares the packages.

The budget visualization updates immediately when the selected package changes.

### Scene 6 — Itinerary

The system builds a three-day schedule.

Business commitments take priority.

Museum and sightseeing suggestions are placed in available leisure windows.

### Scene 7 — Map

An interactive map displays:

- Airport
- Hotel
- Meeting location
- Museums
- Tourist attractions

Markers use distinct icons.

Clicking a marker reveals information.

The employee can open Google Maps for directions.

### Scene 8 — Booking handoff

The employee clicks "Search flight" or "Find accommodation."

A relevant external provider search opens.

The internal status changes to "External search opened."

The platform does not claim a ticket was purchased.

### Scene 9 — Manager approval

The employee submits the selected package.

The manager demo role opens the request.

The manager sees the budget and policy summary and approves it.

The audit timeline records the decision.

### Scene 10 — Finance report

The finance view shows:

- Corporate total
- Personal leisure total
- Category breakdown
- Approval status

The user downloads a CSV report.

This is the full end-to-end demo.

## 6. Automation map

| Existing manual activity | AtlasFlow automation | User action remaining |
|---|---|---|
| Explain travel requirements | AI parses free text | Confirm extracted details |
| Check company policy | Automated rule evaluation | Review exceptions |
| Compare flight/hotel options | Constraint-based package optimizer | Select package |
| Calculate budget | Automatic cost breakdown | Review estimate |
| Organize leisure itinerary | Preference-aware scheduling | Adjust optional stops |
| Coordinate approval | In-app workflow and audit | Manager decision |
| Find booking website | External search handoff | Complete purchase externally |
| Prepare finance summary | Automatic CSV generation | Finance review |

## 7. Why AI is necessary

A conventional form can store travel information.

A calculator can add prices.

A map can display locations.

AtlasFlow combines these with AI-driven understanding and optimization.

### AI contribution

- Interprets flexible natural-language travel requests.
- Converts preferences into structured planning inputs.
- Explains trade-offs between options.
- Suggests changes to resolve policy or budget conflicts.
- Produces manager-facing summaries.

### Algorithmic intelligence

- Applies hard constraints.
- Evaluates candidate combinations.
- Optimizes price and convenience.
- Separates expense types.
- Handles infeasible requests.

The hybrid architecture is deliberate.

Financial and policy decisions must be reproducible.

Natural-language understanding and contextual explanations benefit from LLMs.

## 8. Why the three packages matter

The packages should not simply be three different prices.

They represent three enterprise decision strategies.

### Economy score

Prioritize:

- Low total cost
- Policy compliance
- Essential travel requirements

### Balanced score

Prioritize:

- Cost
- Accommodation location
- Comfort
- Employee preferences
- Schedule convenience

### Comfort score

Prioritize:

- Convenience
- Higher accommodation quality
- Lower travel friction
- Preference satisfaction

All packages must respect hard budget and policy constraints.

The planner must explain trade-offs.

## 9. Key screens

### Landing page

Hero:

**Corporate travel, planned and approved in one intelligent workflow.**

Subheading:

"AtlasFlow transforms employee travel requests into policy-compliant itineraries, optimized budgets, booking handoffs, and finance-ready reports."

CTA:

**Launch Interactive Demo**

### Travel request workspace

A premium form with:

- Trip basics
- Corporate budget
- Travel preferences
- Leisure interests
- Free-text AI input

CTA:

**Generate Travel Plans**

### Package comparison

Three premium cards:

- Economy
- Balanced
- Comfort

Each card includes cost, policy status, and selection.

### Trip intelligence dashboard

Shows:

- Budget usage
- Policy compliance
- Itinerary timeline
- Map
- Booking handoff links

### Operations dashboard

Shows:

- Pending approval
- Approved/rejected state
- Audit trail
- Expense export

## 10. Demo data strategy

### Initial destinations

- Istanbul
- Tbilisi
- Dubai

Why these?

They offer distinct trip costs, accommodations, and tourist itineraries suitable for demonstrating the product.

The MVP uses seeded data to ensure reproducibility.

### Data provenance

All seeded prices are synthetic estimates.

They are not live quotations.

Attraction coordinates should be curated and checked before release.

External search links are not confirmed bookings.

### Real integration roadmap

Future integrations may include:

- Airline and travel inventory providers
- Hotel reservation partners
- Corporate travel management platforms
- Expense management software
- Accounting software
- Payment providers
- Corporate SSO
- Messaging platforms

These are roadmap items, not MVP capabilities.

## 11. Competitive positioning

### General travel search engines

Strength:

- Live travel discovery
- Large supplier inventories

Gap AtlasFlow targets:

- Corporate policy
- Manager approval
- Personal/corporate expense separation
- Internal finance workflow

### Enterprise travel platforms

Strength:

- Mature corporate travel workflows
- Supplier integrations
- Expense management

AtlasFlow does not claim to outperform mature platforms.

Its prototype explores a simpler AI-first interface for smaller or regional companies and business-plus-leisure planning.

### Generic AI travel assistants

Strength:

- Flexible itinerary generation

Gap AtlasFlow targets:

- Deterministic budget enforcement
- Policy checks
- Approval states
- Auditable expense output

## 12. Originality and inspiration disclosure

AtlasFlow is inspired by the general enterprise travel automation problem demonstrated by projects such as Sendero.

It must be independently implemented from scratch during the hackathon.

Do not copy proprietary source code, designs, brand assets, or private datasets.

The distinctive product angle is:

**Corporate-policy-aware travel planning with explicit personal leisure separation and a transparent approval-to-finance workflow.**

The project should disclose conceptual inspiration and any libraries or templates used.

## 13. Business model hypothesis

Potential revenue model:

- Monthly subscription per company
- Pricing based on active traveling employees
- Optional per-trip processing fee
- Enterprise integration tier

Potential buyers:

- HR operations
- Finance operations
- Corporate travel managers
- Office administration

These are hypotheses requiring customer validation.

Do not present projected savings as verified results.

## 14. Value proposition and KPIs

### Primary business metric

**Manual travel coordination time per request**

### Secondary metrics

- Policy compliance rate
- Budget violation rate
- Percentage of feasible plans
- Number of manual workflow steps
- Time to produce a comparison
- Approval turnaround time
- Estimated corporate spend versus budget

### Testable hackathon claims

We can measure:

- How often the planner stays within budget.
- Whether hard policy rules are enforced.
- Whether the optimizer outperforms a cheapest-first baseline on constraint satisfaction.
- Whether the workflow can complete without errors.

We cannot honestly prove real company cost savings without real customer data.

## 15. Baseline evaluation

### Baseline

Select the cheapest flight and cheapest accommodation, then check policy.

### AtlasFlow approach

Filter candidates by constraints and optimize across cost, preferences, and convenience.

### Expected comparison

A naive cheapest-first planner may select individually cheap options that are unsuitable for the overall trip.

AtlasFlow aims to produce more feasible and policy-compliant packages.

Actual performance must be measured.

### Evaluation scenarios

- Low budget
- Strict hotel cap
- Economy-only travel
- Business class request
- Apartment preference
- Museum interest
- Multiple meetings
- No feasible plan
- Approval threshold
- Personal leisure spending
- Unsupported destination
- Missing information
- Invalid dates
- AI service unavailable
- Malformed AI response
- Normal valid travel request
- Expensive destination
- Multiple travelers
- Identical candidate prices
- Accommodation unavailable

Record real test outcomes.

## 16. Risk register

### Risk: Live travel inventory is difficult

Mitigation:

Use clearly disclosed seeded demo inventory and external booking handoffs.

### Risk: AI generates false prices

Mitigation:

Only deterministic catalog items supply prices.

### Risk: AI violates company policy

Mitigation:

Apply policy rules in code after AI interpretation.

### Risk: Budget calculations are wrong

Mitigation:

Use integer minor units or carefully controlled monetary arithmetic, plus unit tests.

### Risk: Maps break during deployment

Mitigation:

Use client-side dynamic import for Leaflet and curated coordinates.

### Risk: Authentication delays the build

Mitigation:

Guest demo first. Supabase later.

### Risk: Too many features remain incomplete

Mitigation:

Follow strict P0/P1/P2 priorities.

### Risk: Judges cannot access the demo

Mitigation:

Public Vercel URL, no login, seeded scenario, production verification.

## 17. Hackathon scoring strategy

### User value — 25 points

Demonstrate:

- A recognizable enterprise workflow
- Clear employee/manager/finance personas
- Reduced manual coordination
- Concrete operational output

### Working prototype and meaningful AI — 30 points

Demonstrate:

- Natural-language request interpretation
- Constraint-aware optimization
- Three real package outputs
- Policy automation
- Approval workflow
- Expense report

### Tests and baseline — 20 points

Demonstrate:

- Automated scenarios
- Baseline comparison
- Real test results
- Edge-case handling

### Feasibility — 15 points

Demonstrate:

- Practical architecture
- Honest API limitations
- Realistic integrations roadmap
- Clear target customers

### Originality — 10 points

Demonstrate:

- Corporate versus personal budget separation
- Business-plus-leisure planning
- Explainable travel-policy enforcement
- Approval-to-finance workflow

## 18. Hackathon submission content

### Track

AI Enterprise Solutions

### Title

**AtlasFlow AI — Corporate Travel Automation from Request to Approval**

### The user and the problem

"Companies coordinate employee business trips across fragmented flight, accommodation, approval, policy, and expense workflows. AtlasFlow AI turns a travel request into policy-compliant travel options, a budget-aware itinerary, booking handoffs, manager approval, and a finance-ready report. It reduces manual coordination while keeping corporate and personal expenses separate."

### Links

Insert actual deployed URLs only.

- Demo: `[VERCEL_URL]`
- Source code: `[GITHUB_URL]`
- Video: `[VIDEO_URL]`

Do not invent links.

### Demo link

Must be publicly accessible without sign-in.

Verify in a fresh browser session.

### Source code or export

Use a public repository if appropriate for the competition.

### Video — up to 2 minutes

Suggested script:

**0:00–0:15**

Introduce the corporate travel problem.

**0:15–0:30**

Load the Baku-to-Istanbul employee request.

**0:30–0:55**

Show AI interpretation, policy checks, and three packages.

**0:55–1:15**

Show the budget breakdown and interactive map.

**1:15–1:35**

Select a package, demonstrate booking handoff, and submit for approval.

**1:35–1:50**

Approve as manager and export finance report.

**1:50–2:00**

Show measured test results and the core enterprise value.

### Setup instructions

Example, to update with the actual repository:

1. Clone repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add optional server-side AI API key.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.
7. Click "Launch Interactive Demo".

The core demo must work without optional keys.

### Disclosure — models

List the actual models used for:

- Coding assistance
- Runtime AI interpretation
- AI explanations

If Grok is used only inside Cursor, state it as a development assistant, not as the application's runtime model.

### Disclosure — data

Disclose:

- Synthetic flight and hotel estimates
- Curated attraction catalog
- Fictional company and employee scenario
- Any external map or provider data

### Disclosure — components

Disclose:

- Next.js
- React
- Tailwind
- shadcn/ui
- Leaflet
- OpenStreetMap
- Supabase, if used
- Any starter template or UI kit

### Quality testing — what did you test, and what broke?

Do not submit a fabricated answer.

Fill this section after running tests.

Suggested structure:

"We tested [N] travel scenarios covering budget limits, policy restrictions, invalid dates, missing inventory, personal expense separation, approval flow, and AI fallback. We compared the constraint-aware planner against a cheapest-first baseline. The initial implementation failed on [actual issue]. We fixed it by [actual change]. Final results: [actual numbers]. Remaining limitations: demo inventory and external booking handoffs."

## 19. Pitch deck structure

Target: 7–8 slides.

### Slide 1 — Title

AtlasFlow AI

"One intelligent workflow for corporate travel."

### Slide 2 — Problem

Fragmented tools, manual coordination, policy violations, unclear expenses.

### Slide 3 — Solution

Request → AI analysis → optimized packages → approval → booking handoff → finance.

### Slide 4 — Product demo

Screenshots of request, packages, map, approval.

### Slide 5 — How the AI works

Natural-language interpretation + deterministic policy and budget optimizer.

### Slide 6 — Results

Real tests and baseline comparison.

### Slide 7 — Business potential

Target buyers, value proposition, integration roadmap.

### Slide 8 — Team and vision

Team, stack, deployment URL, future roadmap.

## 20. What success looks like

A judge should be able to open AtlasFlow, load a business trip, compare three realistic estimated plans, understand corporate policy compliance, view an itinerary, open booking search links, approve the plan, and export a finance report.

The judge should immediately understand:

**This is not an AI travel chatbot. It is a prototype of an automated corporate travel workflow.**

## 21. Final product principle

A small but functioning end-to-end automation system is stronger than an ambitious interface filled with unfinished integrations.

Build the complete workflow first.

Improve visual polish second.

Add optional integrations only after the demo is reliable.
