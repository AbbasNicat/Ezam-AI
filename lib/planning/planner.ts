import { cityProfile } from "@/lib/data/catalog";
import { demoCatalog } from "@/lib/data/catalog";
import { policyForCompany } from "@/lib/data/policies";
import { accommodationSearchUrl, flightSearchUrl } from "@/lib/utils/booking-links";
import { DEMO_CLOCK_ISO, nightsBetween, parseDateOnly } from "@/lib/utils/dates";
import { formatMoney, sameCity } from "@/lib/utils";
import {
  centsToMajor,
  fromAznCents,
  majorToAznCents,
  majorToCents,
} from "@/lib/utils/money";
import { buildItinerary, scheduleAttractions } from "@/lib/planning/itinerary";
import type {
  CabinClass,
  Catalog,
  CorporatePolicy,
  CostLine,
  FlightItem,
  PackageTier,
  PlanResult,
  PolicyEvaluation,
  PolicyViolation,
  StayItem,
  TravelOption,
  TravelRequest,
  TripPackage,
} from "@/types/travel";

const CONTINGENCY_PERCENT = 3;
const LEVEL_RANK = { budget: 1, standard: 2, premium: 3 } as const;

export interface PlanInput {
  request: TravelRequest;
  policy?: CorporatePolicy;
  catalog?: Catalog;
  now?: string;
  mode?: "basic" | "ai";
  interpretationNotes?: string[];
}

interface Candidate {
  flight: FlightItem;
  stay: StayItem | null;
  nights: number;
  days: number;
  rooms: number;
  corporateAznCents: number;
  personalAznCents: number;
  lines: CostLine[];
  comfortScore: number;
  economyRank: number;
  balancedScore: number;
  preferenceScore: number;
  locationScore: number;
  attractionsTrimmed: boolean;
}

function cabinLabel(cabin: CabinClass): string {
  return cabin.replaceAll("_", " ");
}

function comboKey(candidate: Pick<Candidate, "flight" | "stay">): string {
  return `${candidate.flight.id}|${candidate.stay?.id ?? "none"}`;
}

function wantsQuiet(request: TravelRequest): boolean {
  return /quiet/i.test(request.specialRequirements);
}

function preferenceScore(
  request: TravelRequest,
  flight: FlightItem,
  stay: StayItem | null,
): number {
  const checks: number[] = [flight.cabin === request.cabinPreference ? 1 : 0];
  if (stay && request.accommodationPreference !== "either") {
    checks.push(stay.kind === request.accommodationPreference ? 1 : 0);
  }
  if (stay && wantsQuiet(request)) {
    checks.push(stay.quiet ? 1 : 0);
  }
  if (stay) {
    checks.push(stay.level === request.accommodationLevel ? 1 : 0);
  }
  const total = checks.reduce((sum, value) => sum + value, 0);
  return checks.length === 0 ? 1 : total / checks.length;
}

function comfortScore(flight: FlightItem, stay: StayItem | null, pref: number): number {
  return (
    (stay ? LEVEL_RANK[stay.level] * 100 : 40) +
    flight.comfort * 40 +
    (stay?.locationScore ?? 5) * 15 +
    (stay?.quiet ? 20 : 0) +
    (flight.stops === 0 ? 25 : 0) +
    pref * 30
  );
}

function distribute(aznCents: number[], currency: TravelRequest["currency"]): number[] {
  const target = fromAznCents(
    aznCents.reduce((sum, value) => sum + value, 0),
    currency,
  );
  const raw = aznCents.map((value) => fromAznCents(value, currency));
  const drift = target - raw.reduce((sum, value) => sum + value, 0);
  if (raw.length > 0) raw[raw.length - 1] = (raw[raw.length - 1] ?? 0) + drift;
  return raw;
}

function pushLine(
  lines: Array<Omit<CostLine, "amount" | "amountAzn"> & { aznCents: number }>,
  line: Omit<CostLine, "amount" | "amountAzn"> & { aznCents: number },
) {
  lines.push(line);
}

function materialize(
  raw: Array<Omit<CostLine, "amount" | "amountAzn"> & { aznCents: number }>,
  currency: TravelRequest["currency"],
): CostLine[] {
  const amounts = distribute(
    raw.map((line) => line.aznCents),
    currency,
  );
  return raw.map((line, index) => ({
    id: line.id,
    category: line.category,
    label: line.label,
    amount: centsToMajor(amounts[index] ?? 0),
    amountAzn: centsToMajor(line.aznCents),
    currency,
    estimated: true,
    payer: line.payer,
  }));
}

function explainPackage(
  tier: PackageTier,
  request: TravelRequest,
  policy: CorporatePolicy,
  candidate: Candidate,
): string {
  const lead = {
    economy:
      "Economy minimizes the estimated corporate spend while keeping the trip inside hard policy limits.",
    balanced:
      "Balanced spends more of the corporate budget for a better location and a closer match to the stated preferences.",
    comfort:
      "Comfort takes the highest-convenience flight and stay that still fit the corporate budget and cabin rules.",
  }[tier];
  const corporate = formatMoney(centsToMajor(fromAznCents(candidate.corporateAznCents, request.currency)), request.currency);
  const personal = formatMoney(centsToMajor(fromAznCents(candidate.personalAznCents, request.currency)), request.currency);
  const approval =
    candidate.corporateAznCents > majorToAznCents(policy.approvalThreshold, policy.currency)
      ? `Manager approval is required because the corporate estimate is above ${formatMoney(policy.approvalThreshold, policy.currency)}.`
      : `This corporate estimate is at or below the ${formatMoney(policy.approvalThreshold, policy.currency)} approval threshold.`;
  const stay = candidate.stay
    ? `${candidate.stay.name} (${candidate.stay.kind}, ${candidate.nights} night${candidate.nights === 1 ? "" : "s"})`
    : "No overnight stay.";
  return `${lead} Corporate estimate ${corporate}. Personal leisure estimate ${personal}, kept out of reimbursement. ${candidate.flight.name}. ${stay} ${approval}`;
}

function flightOption(flight: FlightItem, request: TravelRequest, totalAznCents: number): TravelOption {
  return {
    id: flight.id,
    type: "flight",
    name: flight.name,
    provider: flight.provider,
    price: centsToMajor(fromAznCents(totalAznCents, request.currency)),
    currency: request.currency,
    estimated: true,
    startDate: request.departureDate,
    endDate: request.returnDate,
    location: { lat: flight.airportLat, lng: flight.airportLng, label: flight.airportName },
    city: flight.destination,
    externalUrl: flightSearchUrl(request),
    attributes: {
      cabin: flight.cabin,
      stops: flight.stops,
      comfort: flight.comfort,
      origin: flight.origin,
      pricePerTravelerAzn: flight.priceAzn,
      estimateLabel: "Demo fare estimate — not live availability",
    },
  };
}

function stayOption(stay: StayItem, request: TravelRequest, totalAznCents: number, nights: number): TravelOption {
  return {
    id: stay.id,
    type: stay.kind,
    name: stay.name,
    provider: stay.provider,
    price: centsToMajor(fromAznCents(totalAznCents, request.currency)),
    currency: request.currency,
    estimated: true,
    startDate: request.departureDate,
    endDate: request.returnDate,
    location: { lat: stay.lat, lng: stay.lng, label: stay.name },
    city: stay.city,
    externalUrl: accommodationSearchUrl(request),
    attributes: {
      kind: stay.kind,
      level: stay.level,
      quiet: stay.quiet,
      nightlyAzn: stay.nightlyAzn,
      nights,
      neighborhood: stay.neighborhood,
      locationScore: stay.locationScore,
      estimateLabel: "Demo rate estimate — not live availability",
    },
  };
}

function evaluateCandidate(input: {
  request: TravelRequest;
  policy: CorporatePolicy;
  candidate: Candidate;
  tier: PackageTier;
}): PolicyEvaluation {
  const { request, policy, candidate, tier } = input;
  const warnings: PolicyViolation[] = [];
  const explanations: string[] = [];
  if (!policy.allowedCabins.includes(request.cabinPreference)) {
    warnings.push({
      code: "cabin_downgraded",
      severity: "warning",
      message: `${cabinLabel(request.cabinPreference)} is not permitted for this employee policy. ${cabinLabel(candidate.flight.cabin)} has been selected.`,
      suggestedFix: `Choose one of: ${policy.allowedCabins.map(cabinLabel).join(", ")}.`,
    });
  }
  const approvalRequired =
    candidate.corporateAznCents > majorToAznCents(policy.approvalThreshold, policy.currency);
  if (approvalRequired) {
    warnings.push({
      code: "approval_required",
      severity: "warning",
      message: `Corporate estimate exceeds the ${policy.approvalThreshold} ${policy.currency} approval threshold.`,
      suggestedFix: "Submit the package for travel-manager approval, or choose a lower tier.",
    });
  }
  if (candidate.attractionsTrimmed) {
    warnings.push({
      code: "leisure_trimmed",
      severity: "warning",
      message: "Some paid attractions were left off the itinerary so personal leisure stays inside its own budget.",
      suggestedFix: "Raise the personal leisure budget or drop a paid stop.",
    });
  }
  if (!policy.leisureReimbursable && candidate.personalAznCents > 0) {
    explanations.push("Personal leisure is not reimbursable under this policy and is excluded from the corporate total.");
  }
  explanations.push(explainPackage(tier, request, policy, candidate));
  return {
    compliant: true,
    violations: [],
    warnings,
    approvalRequired,
    explanations,
    suggestedFixes: warnings.map((warning) => warning.suggestedFix),
  };
}

function buildCandidate(input: {
  request: TravelRequest;
  policy: CorporatePolicy;
  catalog: Catalog;
  flight: FlightItem;
  stay: StayItem | null;
  nights: number;
  days: number;
}): Candidate | null {
  const { request, policy, catalog, flight, stay, nights, days } = input;
  const city = cityProfile(catalog, request.destination);
  const mealCap = majorToAznCents(policy.dailyMealAllowance, policy.currency);
  const groundCap = majorToAznCents(policy.dailyGroundTransportAllowance, policy.currency);
  const mealDaily = Math.min(majorToCents(city?.mealDailyAzn ?? 35), mealCap);
  const groundDaily = Math.min(majorToCents(city?.groundDailyAzn ?? 15), groundCap);
  const rooms = stay ? Math.ceil(request.travelerCount / stay.occupancy) : 0;
  const flightCents = majorToCents(flight.priceAzn) * request.travelerCount;
  const stayCents = stay ? majorToCents(stay.nightlyAzn) * nights * rooms : 0;
  const mealCents = mealDaily * days * request.travelerCount;
  const groundCents = groundDaily * days * request.travelerCount;
  const base = flightCents + stayCents + mealCents + groundCents;
  const contingency = Math.round((base * CONTINGENCY_PERCENT) / 100);

  const scheduled = scheduleAttractions({ request, flight, stay, catalog });
  const personalCents = scheduled.reduce(
    (sum, item) => sum + majorToCents(item.attraction.admissionAzn),
    0,
  );
  const matchedCount = catalog.attractions.filter((item) => {
    if (item.city.toLowerCase() !== request.destination.trim().toLowerCase()) return false;
    if (request.interests.length === 0) return true;
    const tags = item.interests.map((interest) => interest.toLowerCase());
    return request.interests.some((interest) => tags.includes(interest.toLowerCase()));
  }).length;
  const attractionsTrimmed = request.leisureEnabled && scheduled.length < Math.min(matchedCount, 3);

  const raw: Array<Omit<CostLine, "amount" | "amountAzn"> & { aznCents: number }> = [];
  pushLine(raw, {
    id: `flight-${flight.id}`,
    category: "flight",
    label: `${flight.name} · ${request.travelerCount} traveler${request.travelerCount === 1 ? "" : "s"}`,
    payer: "corporate",
    currency: request.currency,
    estimated: true,
    aznCents: flightCents,
  });
  if (stay && stayCents > 0) {
    pushLine(raw, {
      id: `stay-${stay.id}`,
      category: "accommodation",
      label: `${stay.name} · ${nights} night${nights === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"}`,
      payer: "corporate",
      currency: request.currency,
      estimated: true,
      aznCents: stayCents,
    });
  }
  pushLine(raw, {
    id: "ground",
    category: "ground_transport",
    label: "Ground transport allowance",
    payer: "corporate",
    currency: request.currency,
    estimated: true,
    aznCents: groundCents,
  });
  pushLine(raw, {
    id: "meals",
    category: "meals",
    label: "Meals within daily allowance",
    payer: "corporate",
    currency: request.currency,
    estimated: true,
    aznCents: mealCents,
  });
  pushLine(raw, {
    id: "contingency",
    category: "contingency",
    label: "Corporate contingency (3%)",
    payer: "corporate",
    currency: request.currency,
    estimated: true,
    aznCents: contingency,
  });
  for (const item of scheduled) {
    const payer = policy.leisureReimbursable ? "corporate" : "personal";
    pushLine(raw, {
      id: `leisure-${item.attraction.id}`,
      category: item.attraction.category === "shopping" ? "shopping" : "leisure",
      label: item.attraction.name,
      payer,
      currency: request.currency,
      estimated: true,
      aznCents: majorToCents(item.attraction.admissionAzn),
    });
  }

  const corporateAznCents =
    flightCents +
    stayCents +
    mealCents +
    groundCents +
    contingency +
    (policy.leisureReimbursable ? personalCents : 0);
  const personalAznCents = policy.leisureReimbursable ? 0 : personalCents;
  const pref = preferenceScore(request, flight, stay);
  const location = stay?.locationScore ?? 5;
  const comfort = comfortScore(flight, stay, pref);
  return {
    flight,
    stay,
    nights,
    days,
    rooms,
    corporateAznCents,
    personalAznCents,
    lines: materialize(raw, request.currency),
    comfortScore: comfort,
    economyRank: corporateAznCents,
    balancedScore: 0,
    preferenceScore: pref,
    locationScore: location,
    attractionsTrimmed,
  };
}

type RejectReason =
  | "cabin"
  | "nightly_cap"
  | "budget"
  | "policy_budget"
  | "stay_type"
  | "preference"
  | "notice";

function rejection(input: {
  request: TravelRequest;
  policy: CorporatePolicy;
  flight: FlightItem;
  stay: StayItem | null;
  nights: number;
  corporateAznCents: number;
  now: string;
}): RejectReason | null {
  const { request, policy, flight, stay, nights, corporateAznCents, now } = input;
  const notice = policy.minBookingNoticeDays ?? 0;
  const departure = parseDateOnly(request.departureDate);
  const clock = parseDateOnly(now);
  if (departure && clock && notice > 0) {
    const daysUntil = Math.round((departure.getTime() - clock.getTime()) / 86_400_000);
    if (daysUntil < notice) return "notice";
  }
  if (!policy.allowedCabins.includes(flight.cabin)) return "cabin";
  if (stay && request.accommodationPreference !== "either" && stay.kind !== request.accommodationPreference) {
    return "preference";
  }
  if (
    stay &&
    policy.accommodationRestriction &&
    policy.accommodationRestriction !== "either" &&
    stay.kind !== policy.accommodationRestriction
  ) {
    return "stay_type";
  }
  if (stay && majorToCents(stay.nightlyAzn) > majorToAznCents(policy.maxHotelNightly, policy.currency)) {
    return "nightly_cap";
  }
  if (corporateAznCents > majorToAznCents(request.corporateBudget, request.currency)) return "budget";
  if (
    policy.maxCorporateBudget !== undefined &&
    corporateAznCents > majorToAznCents(policy.maxCorporateBudget, policy.currency)
  ) {
    return "policy_budget";
  }
  if (nights > 0 && !stay) return "preference";
  return null;
}

function hardViolations(input: {
  request: TravelRequest;
  policy: CorporatePolicy;
  flight: FlightItem;
  stay: StayItem | null;
  corporateAznCents: number;
  now: string;
}): PolicyViolation[] {
  const { request, policy, flight, stay, corporateAznCents, now } = input;
  const violations: PolicyViolation[] = [];
  const notice = policy.minBookingNoticeDays ?? 0;
  const departure = parseDateOnly(request.departureDate);
  const clock = parseDateOnly(now);
  if (departure && clock && notice > 0) {
    const daysUntil = Math.round((departure.getTime() - clock.getTime()) / 86_400_000);
    if (daysUntil < notice) {
      violations.push({
        code: "notice",
        severity: "hard",
        message: `Departure is inside the ${notice}-day booking notice window.`,
        suggestedFix: `Move departure to at least ${notice} day(s) after ${now}.`,
      });
    }
  }
  if (!policy.allowedCabins.includes(flight.cabin)) {
    violations.push({
      code: "cabin",
      severity: "hard",
      message: `${cabinLabel(flight.cabin)} is not permitted for this employee policy.`,
      suggestedFix: `Choose ${policy.allowedCabins.map(cabinLabel).join(" or ")}.`,
    });
  }
  if (
    stay &&
    policy.accommodationRestriction &&
    policy.accommodationRestriction !== "either" &&
    stay.kind !== policy.accommodationRestriction
  ) {
    violations.push({
      code: "stay_type",
      severity: "hard",
      message: `${stay.kind} stays are outside the company accommodation restriction.`,
      suggestedFix: `Use a ${policy.accommodationRestriction} stay.`,
    });
  }
  if (stay && majorToCents(stay.nightlyAzn) > majorToAznCents(policy.maxHotelNightly, policy.currency)) {
    violations.push({
      code: "nightly_cap",
      severity: "hard",
      message: `${stay.name} nightly estimate exceeds the ${policy.maxHotelNightly} ${policy.currency} cap.`,
      suggestedFix: `Raise the nightly cap above ${stay.nightlyAzn} AZN or choose a cheaper stay.`,
    });
  }
  if (corporateAznCents > majorToAznCents(request.corporateBudget, request.currency)) {
    violations.push({
      code: "budget",
      severity: "hard",
      message: "Corporate estimate exceeds the request budget.",
      suggestedFix: "Raise the corporate budget or choose a cheaper combination.",
    });
  }
  if (
    policy.maxCorporateBudget !== undefined &&
    corporateAznCents > majorToAznCents(policy.maxCorporateBudget, policy.currency)
  ) {
    violations.push({
      code: "policy_budget",
      severity: "hard",
      message: "Corporate estimate exceeds the company maximum trip budget.",
      suggestedFix: "Lower the estimate or raise the company maximum.",
    });
  }
  return violations;
}

function toPackage(
  request: TravelRequest,
  policy: CorporatePolicy,
  catalog: Catalog,
  candidate: Candidate,
  tier: PackageTier,
  hard: PolicyViolation[] = [],
): TripPackage {
  const scheduled = scheduleAttractions({
    request,
    flight: candidate.flight,
    stay: candidate.stay,
    catalog,
  });
  const flightLine = candidate.lines.find((line) => line.category === "flight");
  const stayLine = candidate.lines.find((line) => line.category === "accommodation");
  const evaluation = evaluateCandidate({ request, policy, candidate, tier });
  if (hard.length > 0) {
    evaluation.compliant = false;
    evaluation.violations = hard;
    evaluation.suggestedFixes = [...hard.map((item) => item.suggestedFix), ...evaluation.suggestedFixes];
    evaluation.explanations = [...hard.map((item) => item.message), ...evaluation.explanations];
  }
  const score =
    tier === "economy"
      ? 1_000_000 - candidate.economyRank / 100
      : tier === "comfort"
        ? candidate.comfortScore
        : candidate.balancedScore;
  return {
    id: `${tier}-${comboKey(candidate)}`,
    tier,
    flight: flightOption(candidate.flight, request, flightLine ? majorToCents(flightLine.amountAzn) : 0),
    accommodation: candidate.stay
      ? stayOption(
          candidate.stay,
          request,
          stayLine ? majorToCents(stayLine.amountAzn) : 0,
          candidate.nights,
        )
      : null,
    itinerary: buildItinerary({
      request,
      flight: candidate.flight,
      stay: candidate.stay,
      catalog,
      attractions: scheduled,
    }),
    costBreakdown: candidate.lines,
    corporateTotal: centsToMajor(fromAznCents(candidate.corporateAznCents, request.currency)),
    personalTotal: centsToMajor(fromAznCents(candidate.personalAznCents, request.currency)),
    overallTotal: centsToMajor(
      fromAznCents(candidate.corporateAznCents + candidate.personalAznCents, request.currency),
    ),
    corporateTotalAzn: centsToMajor(candidate.corporateAznCents),
    personalTotalAzn: centsToMajor(candidate.personalAznCents),
    remainingBudget: centsToMajor(
      fromAznCents(
        majorToAznCents(request.corporateBudget, request.currency) - candidate.corporateAznCents,
        request.currency,
      ),
    ),
    remainingBudgetAzn: centsToMajor(
      majorToAznCents(request.corporateBudget, request.currency) - candidate.corporateAznCents,
    ),
    nights: candidate.nights,
    policyEvaluation: evaluation,
    optimizationScore: score,
    preferenceScore: candidate.preferenceScore,
    explanation: explainPackage(tier, request, policy, candidate),
  };
}

function assignBalanced(candidates: Candidate[], budgetAzn: number) {
  const maxComfort = Math.max(...candidates.map((item) => item.comfortScore), 1);
  for (const candidate of candidates) {
    const costScore =
      budgetAzn <= 0 ? 0 : Math.max(0, 1 - candidate.corporateAznCents / budgetAzn);
    const comfortNorm = candidate.comfortScore / maxComfort;
    candidate.balancedScore =
      costScore * 0.35 + comfortNorm * 0.4 + candidate.preferenceScore * 0.25;
  }
}

function selectDiverse(candidates: Candidate[]): Array<{ tier: PackageTier; candidate: Candidate }> {
  if (candidates.length === 0) return [];
  const byEconomy = [...candidates].sort(
    (a, b) => a.economyRank - b.economyRank || comboKey(a).localeCompare(comboKey(b)),
  );
  const byComfort = [...candidates].sort(
    (a, b) => b.comfortScore - a.comfortScore || comboKey(a).localeCompare(comboKey(b)),
  );
  const byBalanced = [...candidates].sort(
    (a, b) => b.balancedScore - a.balancedScore || comboKey(a).localeCompare(comboKey(b)),
  );
  const economy = byEconomy[0]!;
  const used = new Set<string>([comboKey(economy)]);
  const comfort = byComfort.find((item) => !used.has(comboKey(item))) ?? null;
  if (comfort) used.add(comboKey(comfort));
  const balanced = byBalanced.find((item) => !used.has(comboKey(item))) ?? null;
  const selected: Array<{ tier: PackageTier; candidate: Candidate }> = [
    { tier: "economy", candidate: economy },
  ];
  if (balanced) selected.push({ tier: "balanced", candidate: balanced });
  if (comfort) selected.push({ tier: "comfort", candidate: comfort });
  return selected;
}

function fixesFor(input: {
  request: TravelRequest;
  policy: CorporatePolicy;
  reasons: Map<RejectReason, number>;
  cheapestRejectedBudget?: number;
  cheapestNightly?: number;
  hadFlights: boolean;
  hadStays: boolean;
  nights: number;
}): string[] {
  const fixes: string[] = [];
  const { reasons, request, policy } = input;
  if (!input.hadFlights) {
    fixes.push("No demo flights exist for this route. Use Baku to Istanbul, Tbilisi, or Dubai.");
  }
  if (input.nights > 0 && !input.hadStays) {
    fixes.push(`No demo accommodations are seeded for ${request.destination}. Choose Istanbul, Tbilisi, or Dubai.`);
  }
  if ((reasons.get("cabin") ?? 0) > 0 && (reasons.get("budget") ?? 0) === 0) {
    fixes.push(
      `${cabinLabel(request.cabinPreference)} is not permitted. Choose ${policy.allowedCabins.map(cabinLabel).join(" or ")}.`,
    );
  }
  if ((reasons.get("nightly_cap") ?? 0) > 0) {
    const floor = input.cheapestNightly
      ? ` The cheapest seeded nightly rate on this route is about ${input.cheapestNightly} AZN.`
      : "";
    fixes.push(
      `Raise the hotel nightly cap above ${policy.maxHotelNightly} ${policy.currency}, or pick a destination with cheaper stays.${floor}`,
    );
  }
  if ((reasons.get("budget") ?? 0) > 0 || (reasons.get("policy_budget") ?? 0) > 0) {
    const amount = input.cheapestRejectedBudget
      ? ` at least ${formatMoney(centsToMajor(fromAznCents(input.cheapestRejectedBudget, request.currency)), request.currency)}`
      : "";
    fixes.push(`Raise the corporate budget to${amount || " cover the cheapest compliant combination"}.`);
  }
  if ((reasons.get("preference") ?? 0) > 0 && request.accommodationPreference !== "either") {
    fixes.push(
      `No ${request.accommodationPreference} stays fit the other rules. Switch accommodation preference to either.`,
    );
  }
  if ((reasons.get("stay_type") ?? 0) > 0 && policy.accommodationRestriction) {
    fixes.push(
      `Company policy only reimburses ${policy.accommodationRestriction} stays. Change the policy restriction or the selected stay type.`,
    );
  }
  if ((reasons.get("notice") ?? 0) > 0) {
    fixes.push(
      `Move departure to at least ${policy.minBookingNoticeDays ?? 0} day(s) after the demo planning clock (${DEMO_CLOCK_ISO}).`,
    );
  }
  if (fixes.length === 0) {
    fixes.push("Relax the corporate budget, cabin, or accommodation rules and generate the plan again.");
  }
  return fixes;
}

export function planTrip(input: PlanInput): PlanResult {
  const catalog = input.catalog ?? demoCatalog;
  const policy = input.policy ?? policyForCompany(input.request.companyName);
  const now = input.now ?? DEMO_CLOCK_ISO;
  const request = input.request;
  const baseResult = {
    request,
    policy,
    mode: input.mode ?? "basic",
    interpretationNotes: input.interpretationNotes ?? [
      "Basic planning mode. Structured form values were used because no runtime model response was applied.",
    ],
  } as const;

  if (!request.origin.trim() || !request.destination.trim()) {
    return {
      ...baseResult,
      status: "INVALID_REQUEST",
      packages: [],
      reasons: ["Origin and destination are required."],
      suggestedFixes: ["Enter an origin and a destination."],
    };
  }
  if (!parseDateOnly(request.departureDate) || !parseDateOnly(request.returnDate)) {
    return {
      ...baseResult,
      status: "INVALID_REQUEST",
      packages: [],
      reasons: ["Departure and return must be real YYYY-MM-DD dates."],
      suggestedFixes: ["Correct the trip dates and generate the plan again."],
    };
  }
  const nights = nightsBetween(request.departureDate, request.returnDate);
  if (nights === null || nights < 0) {
    return {
      ...baseResult,
      status: "INVALID_REQUEST",
      packages: [],
      reasons: ["The return date is before the departure date."],
      suggestedFixes: ["Move the return date to the departure date or later."],
    };
  }
  if (request.travelerCount < 1 || request.corporateBudget < 0 || request.personalLeisureBudget < 0) {
    return {
      ...baseResult,
      status: "INVALID_REQUEST",
      packages: [],
      reasons: ["Traveler count and budgets must be valid non-negative numbers."],
      suggestedFixes: ["Set at least one traveler and a corporate budget of zero or more."],
    };
  }

  const days = nights + 1;
  const flights = catalog.flights.filter(
    (flight) => sameCity(flight.origin, request.origin) && sameCity(flight.destination, request.destination),
  );
  const stays = catalog.stays.filter((stay) => sameCity(stay.city, request.destination));
  const reasons = new Map<RejectReason, number>();
  let cheapestBudgetOnly: number | undefined;
  let cheapestNightly: number | undefined;
  for (const stay of stays) {
    if (cheapestNightly === undefined || stay.nightlyAzn < cheapestNightly) {
      cheapestNightly = stay.nightlyAzn;
    }
  }

  const feasible: Candidate[] = [];
  const stayChoices: Array<StayItem | null> = nights === 0 ? [null] : stays;

  for (const flight of flights) {
    for (const stay of stayChoices) {
      const draft = buildCandidate({ request, policy, catalog, flight, stay, nights, days });
      if (!draft) continue;
      const reason = rejection({
        request,
        policy,
        flight,
        stay,
        nights,
        corporateAznCents: draft.corporateAznCents,
        now,
      });
      if (reason) {
        reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
        if (reason === "budget" || reason === "policy_budget") {
          const other = rejection({
            request: { ...request, corporateBudget: 1_000_000_000 },
            policy: { ...policy, maxCorporateBudget: undefined },
            flight,
            stay,
            nights,
            corporateAznCents: draft.corporateAznCents,
            now,
          });
          if (!other && (cheapestBudgetOnly === undefined || draft.corporateAznCents < cheapestBudgetOnly)) {
            cheapestBudgetOnly = draft.corporateAznCents;
          }
        }
        continue;
      }
      feasible.push(draft);
    }
  }

  if (feasible.length === 0) {
    const reasonList: string[] = [];
    if (flights.length === 0) {
      reasonList.push(`No seeded flights from ${request.origin} to ${request.destination}.`);
    }
    if (nights > 0 && stays.length === 0) {
      reasonList.push(`No seeded accommodations in ${request.destination}.`);
    }
    if (reasons.size === 0 && reasonList.length === 0) {
      reasonList.push("No flight and accommodation combination satisfied the hard constraints.");
    }
    for (const [code, count] of reasons) {
      reasonList.push(`${count} combination${count === 1 ? "" : "s"} rejected for ${code.replaceAll("_", " ")}.`);
    }
    const suggestedFixes = fixesFor({
      request,
      policy,
      reasons,
      cheapestRejectedBudget: cheapestBudgetOnly,
      cheapestNightly,
      hadFlights: flights.length > 0,
      hadStays: stays.length > 0,
      nights,
    });
    return {
      ...baseResult,
      status: "NO_FEASIBLE_PLAN",
      packages: [],
      reasons: reasonList,
      suggestedFixes,
    };
  }

  const budgetAzn = majorToAznCents(request.corporateBudget, request.currency);
  assignBalanced(feasible, budgetAzn);
  const selected = selectDiverse(feasible);
  const packages = selected.map((item) =>
    toPackage(request, policy, catalog, item.candidate, item.tier),
  );
  const order: PackageTier[] = ["economy", "balanced", "comfort"];
  packages.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));

  return {
    ...baseResult,
    status: "ok",
    packages,
    reasons: packages.length < 3 ? ["Fewer than three distinct combinations were feasible, so only those are shown."] : [],
    suggestedFixes: [],
  };
}

export function selectedOrFirst(plan: PlanResult, selectedId?: string): TripPackage | undefined {
  return plan.packages.find((pkg) => pkg.id === selectedId) ?? plan.packages.find((pkg) => pkg.tier === "balanced") ?? plan.packages[0];
}

/** Cheapest flight and cheapest stay, chosen independently, then checked against policy. */
export function planCheapestFirst(input: PlanInput): PlanResult {
  const catalog = input.catalog ?? demoCatalog;
  const policy = input.policy ?? policyForCompany(input.request.companyName);
  const now = input.now ?? DEMO_CLOCK_ISO;
  const request = input.request;
  const baseResult = {
    request,
    policy,
    mode: input.mode ?? "basic",
    interpretationNotes: input.interpretationNotes ?? [
      "Cheapest-first baseline. Constraints are checked after the cheapest flight and stay are chosen.",
    ],
  } as const;

  if (!request.origin.trim() || !request.destination.trim()) {
    return { ...baseResult, status: "INVALID_REQUEST", packages: [], reasons: ["Origin and destination are required."], suggestedFixes: ["Enter an origin and a destination."] };
  }
  if (!parseDateOnly(request.departureDate) || !parseDateOnly(request.returnDate)) {
    return { ...baseResult, status: "INVALID_REQUEST", packages: [], reasons: ["Departure and return must be real YYYY-MM-DD dates."], suggestedFixes: ["Correct the trip dates."] };
  }
  const nights = nightsBetween(request.departureDate, request.returnDate);
  if (nights === null || nights < 0) {
    return { ...baseResult, status: "INVALID_REQUEST", packages: [], reasons: ["The return date is before the departure date."], suggestedFixes: ["Move the return date to the departure date or later."] };
  }
  if (request.travelerCount < 1 || request.corporateBudget < 0 || request.personalLeisureBudget < 0) {
    return { ...baseResult, status: "INVALID_REQUEST", packages: [], reasons: ["Traveler count and budgets must be valid non-negative numbers."], suggestedFixes: ["Set at least one traveler and a non-negative corporate budget."] };
  }

  const days = nights + 1;
  const flights = catalog.flights
    .filter((flight) => sameCity(flight.origin, request.origin) && sameCity(flight.destination, request.destination))
    .sort((a, b) => a.priceAzn - b.priceAzn || a.id.localeCompare(b.id));
  const stays = catalog.stays
    .filter((stay) => sameCity(stay.city, request.destination))
    .sort((a, b) => a.nightlyAzn - b.nightlyAzn || a.id.localeCompare(b.id));
  const flight = flights[0];
  const stay = nights === 0 ? null : (stays[0] ?? null);
  if (!flight || (nights > 0 && !stay)) {
    return {
      ...baseResult,
      status: "NO_FEASIBLE_PLAN",
      packages: [],
      reasons: [!flight ? `No seeded flights from ${request.origin} to ${request.destination}.` : `No seeded accommodations in ${request.destination}.`],
      suggestedFixes: ["Use a seeded Baku route to Istanbul, Tbilisi, or Dubai."],
    };
  }

  const candidate = buildCandidate({ request, policy, catalog, flight, stay, nights, days });
  if (!candidate) {
    return { ...baseResult, status: "NO_FEASIBLE_PLAN", packages: [], reasons: ["The cheapest combination could not be priced."], suggestedFixes: ["Check the catalog currencies and dates."] };
  }
  const violations = hardViolations({ request, policy, flight, stay, corporateAznCents: candidate.corporateAznCents, now });
  const pkg = toPackage(request, policy, catalog, candidate, "economy", violations);
  return {
    ...baseResult,
    status: violations.length === 0 ? "ok" : "NO_FEASIBLE_PLAN",
    packages: [pkg],
    reasons: violations.map((item) => item.message),
    suggestedFixes: violations.map((item) => item.suggestedFix),
  };
}
