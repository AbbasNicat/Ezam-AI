# Figma visual parity

Compared the original export in `C:\Users\abbas\Downloads\src` with the Next.js screens on branch `figma-landing-fidelity`. This is a source comparison plus rendered checks of `/` at 1440×900 and 390×844. It is not a claim that every screen is pixel-perfect.

| Screen | Figma source | Next.js route | Status |
| --- | --- | --- | --- |
| Landing | `screens/Landing.tsx` | `/` | Faithfully ported in this branch. Desktop and mobile renders match the headline, grid, header, hero mockup, capability strip, and section structure. Hero prices stay the Figma illustrations (1,120 / 1,450 / 1,730 AZN), not planner output. |
| Individual onboarding | `screens/onboarding/Welcome.tsx`, `SignupPersonal.tsx`, `Preferences.tsx` | `/start` | Welcome cards and a two-step profile match the Figma structure. Password, Google, and Apple sign-in are omitted because this demo does not authenticate. |
| Business onboarding | `SignupBusiness.tsx`, `PolicySetup.tsx` | `/start?mode=business` | Company details and policy limits use the Figma step layout. Saved limits still feed the planner. Team invites and passwords are not implemented. |
| Individual dashboard | `screens/HomePersonal.tsx` | `/individual` | Layout follows the Figma home: greeting, trip prompt, saved cities, and budget card. A saved plan replaces the sample upcoming-trip card. Recommended-experience prices from the Figma file are omitted. |
| Business dashboard | `screens/AdminDashboard.tsx` | `/business` | Greeting, quick actions, and KPI cards follow the Figma admin home. Counts use the browser trip. Department bars are labeled as an illustrative sample. Invite employee is marked unavailable. |
| Travel request | `screens/Request.tsx`, `Planning.tsx` | `/individual/plan`, `/business/requests`, `/demo` | Figma section numbering, field geometry, accommodation tabs, interest pills, AI instruction panel, sticky action bar, heading hierarchy, and responsive two-column shell are ported. Form values submit to the real parser and deterministic planner. |
| Package comparison | `screens/Packages.tsx` | Result state on `/individual/plan`, `/individual/trips`, `/business/requests` | Figma three-card hierarchy and selected/recommended treatment are restored at desktop, with two cards at tablet and one on mobile. Values are real `planTrip` output, not Figma sample totals. |
| Itinerary | `screens/Itinerary.tsx`, `TripMap.tsx` | Result state on the trip routes | Dedicated itinerary/map content column restored. The real generated schedule and Leaflet/OpenStreetMap coordinates remain authoritative. |
| Approvals | `screens/Approvals.tsx` | `/business/approvals` | Dedicated route composition with real submit/approve/reject/request-changes state and persisted audit timeline. |
| Finance | `screens/Finance.tsx` | `/business/expenses` | Dedicated finance composition with real corporate/personal totals and CSV export. No fake PDF action. |
| Settings | `screens/Settings.tsx` | `/business/policies` | Partially adapted. Saved policy limits feed the planner. Not the Figma settings screen. |

Production `https://ezamai.vercel.app` still serves the previous landing page. This branch has not been merged or deployed.

## 2026-10-09 completion verification

- Rendered locally at 1440×900, 1280×800, 768×1024, and 390×844.
- Verified the one-click sample request produces three real feasible packages, the selected package itinerary, Leaflet map, booking handoffs, and approval action.
- No browser console warnings or errors were observed during the tested flow.
- `npm run typecheck`: passed.
- `npm run lint`: passed with two existing `no-img-element` warnings in the Figma landing port.
- `npm test`: 26 passed, 2 skipped.
- `npm run build`: passed with the stable Next.js builder. Turbopack was removed from the build script after its Windows package-resolution failure.

Remaining source-level differences are intentional or unsupported: Figma's fake authentication/password flows, fake PDF export, hard-coded packages and financial figures, and stylized route geometry are not used. The standalone Figma `Team` and complete `Settings` presentations do not yet have one-to-one App Router pages; the supported business policy settings route remains connected to the real policy engine.
