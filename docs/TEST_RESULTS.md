# Test results

Command: `npm test -- --reporter=verbose`  
Runner: Vitest 3.2.4  
Date: 9 October 2026  
Result: **26 passed, 2 skipped, 0 failed** (2 files, 28 tests).

`npm run build` (Next.js 15.5.27, Turbopack) succeeded after these planner changes.

## Spec scenarios

| # | Scenario | Result |
|---|---|---|
| 1 | Normal trip within budget | Passed. Status `ok`. Tiers economy, balanced, comfort. Three distinct flight/stay pairs. Each corporate total ≤ 1,800 AZN and no hard violations. |
| 2 | Budget too low (80 AZN) | Passed. `NO_FEASIBLE_PLAN`, zero packages, suggested fix mentions budget. |
| 3 | Business class prohibited | Passed. Packages use economy or premium economy. Warning text includes "business" and "not permitted". |
| 4 | Hotel nightly cap exceeded | Passed. Cap set to 90 AZN (below the cheapest seeded Istanbul stay, 95 AZN). `NO_FEASIBLE_PLAN`. Default 280 AZN policy does not offer Bosphorus Grand (360 AZN). |
| 5 | Personal leisure excluded from reimbursement | Passed. Leisure lines are `personal`. Personal total is above 0. Corporate line items sum to the corporate total. |
| 6 | Apartment preference | Passed. Every package stay type is apartment. |
| 7 | Hotel preference | Passed. Every package stay type is hotel. |
| 8 | Tight meeting schedule | Passed. No attraction stops on 2026-10-21 when the meeting is 08:00–19:00. |
| 9 | Same-day travel | Passed. 0 nights, no accommodation line, corporate total ≤ 1,800 AZN. |
| 10 | Invalid date range | Passed. `INVALID_REQUEST`. |
| 11 | Unsupported city (Paris) | Passed. `NO_FEASIBLE_PLAN`. Fix names Istanbul, Tbilisi, or Dubai. |
| 12 | Missing optional preferences | Passed. Plan status `ok`. Personal total 0 when leisure is off. |
| 13 | No valid flight (origin Ganja) | Passed. `NO_FEASIBLE_PLAN`. Reason mentions flights. The seeded catalog has no Ganja flights. |
| 14 | No valid accommodation | **Skipped. Not in the seeded catalog.** Every seeded flight city (Istanbul, Tbilisi, Dubai) has at least one stay. |
| 15 | Multiple equally priced packages | **Skipped. Not in the seeded catalog.** Pairwise feasible Istanbul combinations produced 0 equal corporate totals. |
| 16 | Currency handling | Passed. 100 USD converts to 17,000 AZN cents (1 USD = 1.70 AZN). A 1,500 USD request returns USD estimates at or under 1,500 USD. |
| 17 | Approval required | Passed. Threshold 1 AZN. Every package has `approvalRequired`. |
| 18 | Approval not required | Passed. Threshold 1,000,000 AZN. No package requires approval. |
| 19 | AI provider unavailable | Passed. With `LLM_API_KEY` and `LLM_MODEL` unset, parse mode is `basic` and `usedModel` is false. Destination Istanbul was still extracted. |
| 20 | Malformed AI response | Passed. Payload `{ corporateBudget: "lots", destination: 12 }` failed schema validation. Fallback mode is `basic`. |

Scenarios 14 and 15 were not marked passed.

## Fixtures outside the seeded catalog

These passed as code-path checks. They are not seeded-catalog passes for scenarios 14 or 15.

- Stays removed from a catalog copy: `NO_FEASIBLE_PLAN`, and the suggested fix mentions accommodation.
- Two flights both priced at 500 AZN (`flt-a` and `flt-b`) with one stay: the economy package flight id is `flt-a`.

## Cheapest-first baseline

11 cases on the seeded catalog. Two of them change Caspian policy: accommodation restricted to apartments, and cabin restricted to premium economy. The cheapest seeded Istanbul stay is a hotel (Sultan Inn, 95 AZN) and the cheapest flight is economy (Pegasus, 430 AZN), so those two overrides make the cheapest pair illegal.

Printed summary from the run:

```json
{"atlas":{"name":"AtlasFlow","scenarios":11,"withPackage":9,"feasible":9,"withinBudget":9,"hardViolations":2,"preferenceTotal":3.5,"preferenceSamples":9,"estimatedCostAzn":7766.2,"durationMs":12.126406999999972},"baseline":{"name":"Cheapest-first","scenarios":11,"withPackage":11,"feasible":7,"withinBudget":10,"hardViolations":4,"preferenceTotal":4.25,"preferenceSamples":11,"estimatedCostAzn":8744.7,"durationMs":3.546034000000077}}
```

`summarize` adds `packages[0]` only. For AtlasFlow that is the economy package. The baseline always has one package. Totals are sums across different numbers of priced plans (9 vs 11), so the AZN sums are not a like-for-like savings figure.

Per-case log (`selected` AtlasFlow package is balanced when that tier exists):

| Case | Atlas status | Baseline status | Atlas corporate AZN | Baseline corporate AZN | Atlas preference | Baseline preference |
|---|---|---|---|---|---|---|
| normal | ok | ok | 1122.7 | 824 | 1 | 0.333 |
| apartment preference | ok | ok | 1122.7 | 824 | 1 | 0.25 |
| hotel preference | ok | ok | 1174.2 | 824 | 1 | 0.5 |
| business preference | ok | ok | 1122.7 | 824 | 0.667 | 0 |
| low budget | NO_FEASIBLE_PLAN | NO_FEASIBLE_PLAN | — | 824 | — | 0.333 |
| nightly cap 90 | NO_FEASIBLE_PLAN | NO_FEASIBLE_PLAN | — | 824 | — | 0.333 |
| usd budget | ok | ok | 1277.2 | 824 | 1 | 0.333 |
| same day | ok | ok | 690.1 | 504.7 | 1 | 1 |
| no optional prefs | ok | ok | 1122.7 | 824 | 1 | 0.5 |
| apartments only policy | ok | NO_FEASIBLE_PLAN | 1122.7 | 824 | 1 | 0.333 |
| premium economy only | ok | NO_FEASIBLE_PLAN | 1503.8 | 824 | 0.667 | 0.333 |

On this set, AtlasFlow produced a feasible plan in 9 of 11 cases and the cheapest-first baseline in 7 of 11. The two extra AtlasFlow feasible plans are the apartment-only policy and the premium-economy-only policy. On the default Caspian policy, the normal trip is feasible for both.

Where both return a plan, the logged AtlasFlow corporate estimate is higher than the cheapest pair. That is the balanced (or same-day comfort) package, not a claim that AtlasFlow spends less.

Baseline hard-violation count in the summary is 4. AtlasFlow's summary count is 2, and those two are the low-budget and nightly-cap cases, which returned no package. Baseline still prices the cheap pair on those cases, so "within budget" is 10/11 for baseline and 9/11 for AtlasFlow. A cheap pair can sit inside the money budget while failing cabin or stay-type rules.

The baseline loop took 3.55 ms and the AtlasFlow loop took 12.13 ms. This run does not show a speed advantage for AtlasFlow.

## Workflow stages

The demo record completed 8/8 checked stages: request created, plan generated, policy evaluated, package selected, itinerary present, flight handoff `external_search_opened`, approval `approved`, CSV contains `corporate_total` and `personal_total`. Opening the handoff did not set `confirmed_by_user`.
