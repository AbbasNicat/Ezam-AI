# Multilingual travel agent integration

This backend contract supports Azerbaijani (`az`), Turkish (`tr`), and English (`en`). It interprets language and preserves constraints; the existing deterministic planner remains authoritative for inventory, prices, policy, arithmetic, feasibility, itinerary, and ranking.

## Environment

```env
OPENAI_API_KEY=server-only-secret
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Never expose the key through `NEXT_PUBLIC_*`. Without a key, after timeout, or after invalid model output, the same endpoints return a validated deterministic fallback with `source: "fallback"`.

## Interpret a request

`POST /api/agent/interpret`

```ts
const response = await fetch("/api/agent/interpret", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Başqa otel deyil, İstanbulda sakit və mərkəzə yaxın otel istəyirəm.",
    preferredLanguage: "az", // optional; overrides detection
    savedPreferences,
    companyPolicy,
  }),
});
const result: AgentInterpretation & { progress: AgentProgressEvent[] } = await response.json();
```

Bind `result.plannerInput` into existing request form values, but do not invent absent required fields. Render `clarificationQuestions` before planning. `warnings` communicates unsupported demo inventory and unverified Michelin preferences. `source` is diagnostic metadata.

## Regenerate with exclusion memory

`POST /api/agent/regenerate`

```ts
const result = await fetch("/api/agent/regenerate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    instruction: "Bu hoteli bəyənmədim, başqa birini tap.",
    preferredLanguage: "az",
    currentRequest,
    selectedPackage: { flightId: pkg.flight.id, hotelId: pkg.accommodation?.id },
    excludedOptionIds,
  }),
}).then((r) => r.json());
```

Persist the returned `excludedOptionIds`. `eligibleHotelIds` and `eligibleFlightIds` are stable IDs from the local catalog. The rejected hotel is omitted until exclusions are explicitly reset. If none remain, `error` is `NO_ALTERNATIVES`; do not reuse a rejected option silently.

## Localization and progress

- Fixed strings: `agentMessages` and `t()` from `lib/agent/i18n.ts`.
- Dynamic interpretation: response text from the agent endpoint.
- Progress contract: `AgentProgressEvent` and `planningStages()` from `lib/agent/progress.ts`.
- `simulation: true` means the stage is a UI/demo step rather than a real external inventory search. Current restaurant matching is marked this way.

Frontend animations may transition each stage through `pending`, `running`, `completed`, or `failed`. Do not describe local catalog enumeration as a live provider search.

## Security and limits

- Messages are limited to 4,000 characters; route bodies over 16 KB are rejected.
- The in-memory limiter allows 12 agent calls per source address per minute. For multi-instance production, replace it with a shared Vercel KV/Upstash limiter.
- OpenAI calls time out after 8 seconds, retry once, use JSON mode, and cap output at 900 tokens.
- No API key or raw provider error is returned or logged.

## Known limitations

- Demo inventory currently supports seeded routes to Istanbul, Tbilisi, and Dubai; Baku-as-destination requests can be understood but cannot be fulfilled from this catalog.
- The catalog has no verified Michelin restaurant attributes. The preference is preserved and disclosed, never fabricated.
- Dates written only as relative phrases are preserved as missing; the UI should ask for explicit dates.
- The regeneration endpoint returns eligible catalog IDs. The frontend should pass those exclusions to a later planner adapter or filter the catalog before calling `planTrip`.

## Optional live smoke test

Set `OPENAI_API_KEY` locally and send one request to `/api/agent/interpret`. Automated tests always inject mocked responses and spend no API credit.
