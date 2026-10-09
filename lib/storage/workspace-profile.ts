import type { CorporatePolicy, Currency } from "@/types/travel";

const STORAGE_KEY = "atlasflow-workspace-profile-v1";

export type WorkspaceProfile =
  | {
      kind: "personal";
      fullName: string;
      email: string;
      homeCity: string;
      currency: Currency;
      travelBudget: number;
      travelStyle: "value" | "balanced" | "comfort";
      accommodationPreference: "hotel" | "apartment" | "either";
      interests: string[];
    }
  | {
      kind: "business";
      administratorName: string;
      workEmail: string;
      companyName: string;
      companySize: string;
      companyCountry: string;
      currency: Currency;
      tripBudgetLimit: number;
      hotelNightlyLimit: number;
      allowedCabins: CorporatePolicy["allowedCabins"];
      approvalThreshold: number;
      employeeRoles: string[];
    };

export function saveWorkspaceProfile(profile: WorkspaceProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadWorkspaceProfile(): WorkspaceProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as WorkspaceProfile;
    return parsed?.kind === "personal" || parsed?.kind === "business" ? parsed : null;
  } catch {
    return null;
  }
}

export function policyForWorkspace(profile: WorkspaceProfile): CorporatePolicy | undefined {
  if (profile.kind !== "business") return undefined;
  return {
    id: `policy-${profile.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    companyName: profile.companyName,
    maxCorporateBudget: profile.tripBudgetLimit,
    allowedCabins: profile.allowedCabins,
    maxHotelNightly: profile.hotelNightlyLimit,
    currency: profile.currency,
    dailyMealAllowance: 45,
    dailyGroundTransportAllowance: 25,
    minBookingNoticeDays: 0,
    approvalThreshold: profile.approvalThreshold,
    leisureReimbursable: false,
    accommodationRestriction: "either",
    requiredApprovalRoles: ["travel_manager"],
  };
}
