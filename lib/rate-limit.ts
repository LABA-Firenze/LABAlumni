/**
 * Rate limiter in-memory (limitatamente efficace in serverless).
 * Per produzione ad alto traffico considerare @upstash/ratelimit.
 */

const store = new Map<string, number[]>()
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const windowStart = now - 60_000
  for (const [key, timestamps] of store.entries()) {
    const filtered = timestamps.filter((t) => t > windowStart)
    if (filtered.length === 0) store.delete(key)
    else store.set(key, filtered)
  }
}

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

/** Limita a maxRequests per finestra di windowMs. Restituisce true se ok, false se limitato. */
export function checkRateLimit(
  request: Request,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 10, windowMs: 60_000 }
): boolean {
  cleanup()
  const key = getClientIdentifier(request)
  const now = Date.now()
  const windowStart = now - options.windowMs
  const timestamps = store.get(key) || []
  const recent = timestamps.filter((t) => t > windowStart)
  if (recent.length >= options.maxRequests) return false
  recent.push(now)
  store.set(key, recent)
  return true
}
