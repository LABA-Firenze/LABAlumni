/**
 * Controllo CORS opzionale per route sensibili (login, delete-account).
 * Se CORS_ORIGINS è impostato (es. https://alumni.laba.biz,https://www.laba.biz),
 * le richieste con Origin non in lista vengono rifiutate.
 * Se CORS_ORIGINS non è impostato, il controllo non viene applicato (stesso comportamento di prima).
 */
export function checkCorsOrigin(request: Request): { allowed: true } | { allowed: false; status: number } {
  const origins = process.env.CORS_ORIGINS
  if (!origins || typeof origins !== 'string') return { allowed: true }

  const origin = request.headers.get('origin')
  if (!origin) return { allowed: true } // Same-origin o richieste senza Origin (es. Postman)

  const allowList = origins.split(',').map((o) => o.trim().toLowerCase()).filter(Boolean)
  if (allowList.length === 0) return { allowed: true }

  const originLower = origin.toLowerCase()
  if (allowList.includes(originLower)) return { allowed: true }
  return { allowed: false, status: 403 }
}
