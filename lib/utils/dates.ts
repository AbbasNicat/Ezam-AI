/** Demo planning clock so the seeded October 2026 trip stays reproducible. */
export const DEMO_CLOCK_ISO = "2026-10-09";

export function parseDateOnly(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function nightsBetween(departure: string, ret: string): number | null {
  const start = parseDateOnly(departure);
  const end = parseDateOnly(ret);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function listDates(departure: string, ret: string): string[] {
  const nights = nightsBetween(departure, ret);
  if (nights === null || nights < 0) return [];
  const start = parseDateOnly(departure);
  if (!start) return [];
  const dates: string[] = [];
  for (let i = 0; i <= nights; i += 1) {
    const next = new Date(start.getTime() + i * 86_400_000);
    dates.push(next.toISOString().slice(0, 10));
  }
  return dates;
}

export function addDays(iso: string, days: number): string {
  const start = parseDateOnly(iso);
  if (!start) return iso;
  return new Date(start.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

export function minutesOf(hhmm: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(total, 23 * 60 + 59));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
