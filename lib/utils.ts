import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Currency } from "@/types/travel";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: Currency | string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sameCity(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function titleCaseCity(value: string): string {
  const known = ["Istanbul", "Tbilisi", "Dubai", "Baku", "Paris", "London"];
  const hit = known.find((city) => city.toLowerCase() === value.trim().toLowerCase());
  return hit ?? value.trim();
}
