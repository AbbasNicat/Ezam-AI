import type { CorporatePolicy } from "@/types/travel";

export const caspianPolicy: CorporatePolicy = {
  id: "policy-caspian-ventures",
  companyName: "Caspian Ventures",
  maxCorporateBudget: 2500,
  allowedCabins: ["economy", "premium_economy"],
  maxHotelNightly: 280,
  currency: "AZN",
  dailyMealAllowance: 45,
  dailyGroundTransportAllowance: 25,
  minBookingNoticeDays: 0,
  approvalThreshold: 1200,
  leisureReimbursable: false,
  preferredSuppliers: ["Azerbaijan Airlines (demo estimate)"],
  accommodationRestriction: "either",
  requiredApprovalRoles: ["travel_manager"],
};

export const defaultPolicy: CorporatePolicy = {
  ...caspianPolicy,
  id: "policy-default",
  companyName: "Default demo policy",
};

export function policyForCompany(companyName: string): CorporatePolicy {
  if (companyName.trim().toLowerCase() === caspianPolicy.companyName.toLowerCase()) {
    return caspianPolicy;
  }
  return { ...defaultPolicy, companyName: companyName || defaultPolicy.companyName };
}
