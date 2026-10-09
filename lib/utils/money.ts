import type { Currency } from "@/types/travel";

/**
 * Fixed demo FX into AZN. These are labeled estimates, not treasury rates.
 * Stored as rational numbers so conversions stay in integer cents.
 */
const TO_AZN_NUM: Record<Currency, number> = {
  AZN: 1,
  USD: 17,
  EUR: 184,
  TRY: 1,
  GEL: 63,
  AED: 463,
};

const TO_AZN_DEN: Record<Currency, number> = {
  AZN: 1,
  USD: 10,
  EUR: 100,
  TRY: 25,
  GEL: 100,
  AED: 1000,
};

export function majorToCents(major: number): number {
  return Math.round(major * 100);
}

export function centsToMajor(cents: number): number {
  return cents / 100;
}

export function toAznCents(amountCents: number, currency: Currency): number {
  return Math.round((amountCents * TO_AZN_NUM[currency]) / TO_AZN_DEN[currency]);
}

export function fromAznCents(aznCents: number, currency: Currency): number {
  return Math.round((aznCents * TO_AZN_DEN[currency]) / TO_AZN_NUM[currency]);
}

export function majorToAznCents(major: number, currency: Currency): number {
  return toAznCents(majorToCents(major), currency);
}

export const FX_NOTE =
  "Currency conversion uses fixed demo rates (1 USD = 1.70 AZN, 1 EUR = 1.84 AZN, 1 TRY = 0.04 AZN, 1 GEL = 0.63 AZN, 1 AED = 0.463 AZN).";
