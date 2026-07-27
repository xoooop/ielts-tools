// Rate limiter - per IP + per API key hash
// Gentle limits suitable for personal use, even on shared networks

interface RateEntry { count: number; resetAt: number; blocked?: boolean; }

const ipStore = new Map<string, RateEntry>();
const keyStore = new Map<string, RateEntry>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [k, e] of ipStore) { if (now > e.resetAt) ipStore.delete(k); }
  for (const [k, e] of keyStore) { if (now > e.resetAt) keyStore.delete(k); }
}

function check(store: Map<string, RateEntry>, id: string, limit: number, windowMs: number) {
  cleanup();
  const now = Date.now();
  const entry = store.get(id);
  if (!entry || now > entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count++;
  if (entry.count > limit) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limit - entry.count };
}

// Hash API key for tracking (only first 12 chars - enough to identify but not enough to reconstruct)
function hashKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 20) return 'unknown';
  return 'key:' + apiKey.substring(0, 12);
}

export function checkRateLimit(ip: string, apiKey?: string) {
  // Per-IP: generous limit for shared networks (school/office)
  const ipLimit = 60;  // 60 requests per minute per IP
  const ipResult = check(ipStore, ip, ipLimit, 60000);
  if (!ipResult.allowed) {
    return { allowed: false, remaining: 0, reason: 'ip' as const };
  }

  // Per-key: stricter limit to prevent abuse of stolen keys
  if (apiKey) {
    const keyId = hashKey(apiKey);
    const keyLimit = 20;  // 20 requests per minute per key
    const keyResult = check(keyStore, keyId, keyLimit, 60000);
    if (!keyResult.allowed) {
      return { allowed: false, remaining: 0, reason: 'key' as const };
    }
  }

  return { allowed: true, remaining: ipResult.remaining, reason: null };
}

export { hashKey };
