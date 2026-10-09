# Figma visual parity

Compared the original export in `C:\Users\abbas\Downloads\src` with the Next.js screens on branch `figma-landing-fidelity`. This is a source comparison plus rendered checks of `/` at 1440×900 and 390×844. It is not a claim that every screen is pixel-perfect.

| Screen | Figma source | Next.js route | Status |
| --- | --- | --- | --- |
| Landing | `screens/Landing.tsx` | `/` | Faithfully ported in this branch. Desktop and mobile renders match the headline, grid, header, hero mockup, capability strip, and section structure. Hero prices stay the Figma illustrations (1,120 / 1,450 / 1,730 AZN), not planner output. |
| Individual onboarding | `screens/onboarding/Welcome.tsx`, `SignupPersonal.tsx`, `Preferences.tsx` | `/start` | Welcome cards and a two-step profile match the Figma structure. Password, Google, and Apple sign-in are omitted because this demo does not authenticate. |
| Business onboarding | `SignupBusiness.tsx`, `PolicySetup.tsx` | `/start?mode=business` | Company details and policy limits use the Figma step layout. Saved limits still feed the planner. Team invites and passwords are not implemented. |
| Individual dashboard | `screens/HomePersonal.tsx` | `/individual` | Layout follows the Figma home: greeting, trip prompt, saved cities, and budget card. A saved plan replaces the sample upcoming-trip card. Recommended-experience prices from the Figma file are omitted. |
| Business dashboard | `screens/AdminDashboard.tsx` | `/business` | Greeting, quick actions, and KPI cards follow the Figma admin home. Counts use the browser trip. Department bars are labeled as an illustrative sample. Invite employee is marked unavailable. |
| Travel request | `screens/Request.tsx`, `Planning.tsx` | `/individual/plan`, `/business/requests` | Partially adapted. Real request form and planner. Not the Figma request screen. |
| Package comparison | `screens/Packages.tsx` | Package area inside the workspace | Partially adapted. Cards come from `planTrip`, not the hard-coded Figma packages. |
| Itinerary | `screens/Itinerary.tsx`, `TripMap.tsx` | Itinerary and Leaflet map in the workspace | Partially adapted. Real schedule and OpenStreetMap. The Figma stylized map is used only inside the landing mockup. |
| Approvals | `screens/Approvals.tsx` | `/business/approvals` | Partially adapted. Real approve / reject / request-changes actions. |
| Finance | `screens/Finance.tsx` | `/business/expenses` | Partially adapted. Real CSV export. No fake PDF. |
| Settings | `screens/Settings.tsx` | `/business/policies` | Partially adapted. Saved policy limits feed the planner. Not the Figma settings screen. |

Production `https://ezamai.vercel.app` still serves the previous landing page. This branch has not been merged or deployed.
