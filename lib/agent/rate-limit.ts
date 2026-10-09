const buckets = new Map<string, { count: number; resetAt: number }>();
export function checkAgentRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const limit = 12; const windowMs = 60_000; const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, retryAfterSeconds: 0 }; }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count += 1; return { allowed: true, retryAfterSeconds: 0 };
}
export function resetAgentRateLimitsForTests(): void { buckets.clear(); }
