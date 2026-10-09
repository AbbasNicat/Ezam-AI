# Figma frontend integration map

The Figma AI export is a Vite/React presentation layer with local screen switching and synthetic data. AtlasFlow remains a Next.js App Router application; the visual language and navigation patterns are adapted while existing domain services remain authoritative.

| Figma screen/component | AtlasFlow route | Real data/service | Integration status |
| --- | --- | --- | --- |
| Landing | `/` | Product disclosures and demo scenario | Existing content retained with the shared visual tokens |
| Welcome and personal onboarding | `/start?mode=personal` | `workspace-profile.ts` local persistence | Connected |
| Business signup and policy setup | `/start?mode=business`, `/business/policies` | `WorkspaceProfile`, `policyForWorkspace` | Connected; saved changes affect new plans |
| Personal home/request/packages/itinerary | `/individual`, `/individual/plan`, `/individual/trips` | Request form, AI fallback/API, deterministic planner, itinerary, map, booking handoff | Connected |
| Admin dashboard/request queue | `/business`, `/business/requests` | Persisted `TripRecord` and planner state | Connected as one cohesive operational workspace |
| Packages | Business and individual workspace package area | `planTrip`, `selectPackage` | Connected |
| Approvals | `/business/approvals` | `submitForApproval`, `decideApproval`, audit events | Connected |
| Finance | `/business/expenses` | `buildFinanceCsv` | Connected |
| App shell | All individual/business routes | Next.js route navigation and persisted workspace identity | Connected and responsive |

Not imported from the Figma export: its hard-coded travel packages, approval requests, finance figures, fake PDF action, Vite screen state machine, and static map data. AtlasFlow does not claim live inventory, completed booking, payment, or PDF generation.
