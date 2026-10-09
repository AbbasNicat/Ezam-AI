export const CURRENCIES = ["AZN", "USD", "EUR", "TRY", "GEL", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CABINS = ["economy", "premium_economy", "business", "first"] as const;
export type CabinClass = (typeof CABINS)[number];

export const STAY_KINDS = ["hotel", "apartment"] as const;
export type StayKind = (typeof STAY_KINDS)[number];

export const ACCOMMODATION_PREFERENCES = ["hotel", "apartment", "either"] as const;
export type AccommodationPreference = (typeof ACCOMMODATION_PREFERENCES)[number];

export const LEVELS = ["budget", "standard", "premium"] as const;
export type AccommodationLevel = (typeof LEVELS)[number];

export const PACKAGE_TIERS = ["economy", "balanced", "comfort"] as const;
export type PackageTier = (typeof PACKAGE_TIERS)[number];

export const DEMO_ROLES = ["employee", "travel_manager", "finance_manager"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export type HandoffTarget = "flights" | "accommodation" | "directions";

export type HandoffStatus =
  | "not_started"
  | "ready_for_booking"
  | "external_search_opened"
  | "booking_confirmation_pending"
  | "confirmed_by_user";

export type ApprovalStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

export type PlanStatus = "ok" | "NO_FEASIBLE_PLAN" | "INVALID_REQUEST";

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface Meeting {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  locationName: string;
  lat: number;
  lng: number;
}

export interface TravelRequest {
  id: string;
  employeeName: string;
  companyName: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  corporateBudget: number;
  currency: Currency;
  purpose: string;
  meetings: Meeting[];
  cabinPreference: CabinClass;
  accommodationPreference: AccommodationPreference;
  accommodationLevel: AccommodationLevel;
  leisureEnabled: boolean;
  personalLeisureBudget: number;
  interests: string[];
  specialRequirements: string;
}

export interface CorporatePolicy {
  id: string;
  companyName: string;
  maxCorporateBudget?: number;
  allowedCabins: CabinClass[];
  maxHotelNightly: number;
  currency: Currency;
  dailyMealAllowance: number;
  dailyGroundTransportAllowance: number;
  minBookingNoticeDays?: number;
  approvalThreshold: number;
  leisureReimbursable: boolean;
  preferredSuppliers?: string[];
  accommodationRestriction?: AccommodationPreference;
  requiredApprovalRoles: string[];
}

export interface PolicyViolation {
  code: string;
  message: string;
  severity: "hard" | "warning";
  suggestedFix: string;
}

export interface PolicyEvaluation {
  compliant: boolean;
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
  approvalRequired: boolean;
  explanations: string[];
  suggestedFixes: string[];
}

export interface TravelOption {
  id: string;
  type: "flight" | "hotel" | "apartment" | "attraction" | "ground" | "meal";
  name: string;
  provider: string;
  price: number;
  currency: Currency;
  estimated: true;
  startDate?: string;
  endDate?: string;
  location?: GeoPoint;
  city: string;
  attributes: Record<string, string | number | boolean>;
  externalUrl?: string;
}

export type CostCategory =
  | "flight"
  | "accommodation"
  | "ground_transport"
  | "meals"
  | "business"
  | "contingency"
  | "leisure"
  | "shopping";

export interface CostLine {
  id: string;
  category: CostCategory;
  label: string;
  amount: number;
  amountAzn: number;
  currency: Currency;
  estimated: true;
  payer: "corporate" | "personal";
}

export type ItineraryCategory =
  | "flight"
  | "hotel"
  | "meeting"
  | "attraction"
  | "meal"
  | "transport"
  | "buffer";

export interface ItineraryStop {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  title: string;
  category: ItineraryCategory;
  location?: GeoPoint;
  estimatedCost?: number;
  currency?: Currency;
  payer?: "corporate" | "personal";
  notes?: string;
}

export interface TripPackage {
  id: string;
  tier: PackageTier;
  flight: TravelOption;
  accommodation: TravelOption | null;
  itinerary: ItineraryStop[];
  costBreakdown: CostLine[];
  corporateTotal: number;
  personalTotal: number;
  overallTotal: number;
  corporateTotalAzn: number;
  personalTotalAzn: number;
  remainingBudget: number;
  remainingBudgetAzn: number;
  nights: number;
  policyEvaluation: PolicyEvaluation;
  optimizationScore: number;
  preferenceScore: number;
  explanation: string;
}

export interface PlanResult {
  status: PlanStatus;
  request: TravelRequest;
  policy: CorporatePolicy;
  packages: TripPackage[];
  reasons: string[];
  suggestedFixes: string[];
  mode: "basic" | "ai";
  interpretationNotes: string[];
}

export interface Approval {
  requestId: string;
  status: ApprovalStatus;
  approverRole: string;
  comment: string;
  decidedAt?: string;
}

export interface AuditEvent {
  id: string;
  tripId: string;
  type: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface BookingHandoff {
  flights: HandoffStatus;
  accommodation: HandoffStatus;
  directions: HandoffStatus;
}

export interface TripRecord {
  request: TravelRequest;
  plan: PlanResult;
  selectedPackageId?: string;
  approval: Approval;
  audit: AuditEvent[];
  handoff: BookingHandoff;
  updatedAt: string;
}

export interface FlightItem {
  id: string;
  name: string;
  provider: string;
  priceAzn: number;
  origin: string;
  destination: string;
  cabin: CabinClass;
  stops: number;
  comfort: number;
  departTime: string;
  returnTime: string;
  durationMinutes: number;
  airportName: string;
  airportLat: number;
  airportLng: number;
}

export interface StayItem {
  id: string;
  name: string;
  provider: string;
  nightlyAzn: number;
  city: string;
  kind: StayKind;
  level: AccommodationLevel;
  quiet: boolean;
  locationScore: number;
  occupancy: number;
  lat: number;
  lng: number;
  neighborhood: string;
}

export interface AttractionItem {
  id: string;
  name: string;
  city: string;
  category: "museum" | "architecture" | "food" | "shopping" | "nature" | "landmark";
  admissionAzn: number;
  lat: number;
  lng: number;
  durationMinutes: number;
  interests: string[];
}

export interface CityProfile {
  name: string;
  mealDailyAzn: number;
  groundDailyAzn: number;
  meeting: { name: string; lat: number; lng: number };
}

export interface Catalog {
  cities: CityProfile[];
  flights: FlightItem[];
  stays: StayItem[];
  attractions: AttractionItem[];
}
