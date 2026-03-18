/**
 * Client per le API LOGOS (LogosUni Laba API).
 * Swagger: https://logosuni.laba.biz/api-prod/swagger/v1/swagger.json — server base = /api-prod.
 * Variabili d'ambiente:
 * - LOGOS_API_URL: base URL API (deve essere https://logosuni.laba.biz/api-prod, non logosuni.servicesv2)
 * - LOGOS_AUTH_URL: (opzionale) URL token OAuth2 = https://logosuni.laba.biz/identityserver/connect/token
 * - LOGOS_CLIENT_ID / LOGOS_CLIENT_SECRET: per Identity Server (password grant)
 */

import type { CourseType } from '@/types/database'
import type { LogosEnrollmentPayload, LogosEnrollmentsResponse, LogosOAuth2TokenResponse, LogosStudentsResponse, LogosStudentPayload } from '@/types/logos'

/** Lettura runtime delle env (evita inlining a build time su Railway) */
function env(key: string): string | undefined {
  return process.env[key]
}

/** Fallback per Railway: alcune env possono non essere disponibili a runtime. CLIENT_ID: in produzione non usare default (impostare LOGOS_CLIENT_ID). */
const LOGOS_DEFAULTS = {
  API_URL: 'https://logosuni.laba.biz/api-prod',
  AUTH_URL: 'https://logosuni.laba.biz/identityserver/connect/token',
  CLIENT_ID_DEV: '98C96373243D',
} as const

function getLogosApiUrl(): string {
  const url = env('LOGOS_API_URL') || LOGOS_DEFAULTS.API_URL
  return url.replace(/\/$/, '')
}

function getLogosAuthUrl(): string | null {
  const url = env('LOGOS_AUTH_URL') || LOGOS_DEFAULTS.AUTH_URL
  return url ? url.replace(/\/$/, '') : null
}

/**
 * Ottiene un token da IdentityServer (OAuth2 password grant).
 * Swagger: securityDefinitions.AccountsOauth.tokenUrl
 */
async function logosGetOAuth2Token(email: string, password: string): Promise<string | null> {
  const authUrl = getLogosAuthUrl()
  if (!authUrl) return null

  const body = new URLSearchParams({
    grant_type: 'password',
    username: email,
    password,
    scope: 'LogosUni.Laba.Api',
  })
  // In prod preferisci env; se manca usa il default per non rompere deploy esistenti (impostare LOGOS_CLIENT_ID è comunque consigliato).
  const clientId = env('LOGOS_CLIENT_ID') ?? LOGOS_DEFAULTS.CLIENT_ID_DEV
  if (process.env.NODE_ENV === 'production' && env('LOGOS_CLIENT_ID') === undefined) {
    console.warn('LOGOS_CLIENT_ID non impostato in produzione: usato default. Per chiarezza imposta LOGOS_CLIENT_ID in env.')
  }
  const clientSecret = env('LOGOS_CLIENT_SECRET')
  if (clientId) body.set('client_id', clientId)
  if (clientSecret) body.set('client_secret', clientSecret)

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    console.warn('[Logos] Identity Server token:', res.status, res.statusText)
    return null
  }
  const data: LogosOAuth2TokenResponse = await res.json()
  if (data.error || !data.access_token) {
    console.warn('[Logos] Identity Server response:', data.error || 'no access_token')
    return null
  }
  return data.access_token
}

/**
 * Esegue il login su LOGOS e restituisce un token per le chiamate successive.
 * Se LOGOS_AUTH_URL è impostato: OAuth2 password grant (IdentityServer connect/token).
 * Altrimenti null → GET /api/Students con Basic Auth.
 */
export async function logosLogin(email: string, password: string): Promise<string | null> {
  return logosGetOAuth2Token(email, password)
}

/**
 * Recupera i dati dello studente corrente da LOGOS.
 * - Se LOGOS_AUTH_URL è impostato: prima fa login con email/password, poi GET /api/Students con Bearer.
 * - Altrimenti: GET /api/Students con Authorization: Basic base64(email:password).
 */
export async function logosGetStudent(email: string, password: string): Promise<LogosStudentPayload | null> {
  const baseUrl = getLogosApiUrl()
  const url = `${baseUrl}/api/Students`
  let authHeader: string

  const token = await logosLogin(email, password)
  if (token) {
    authHeader = `Bearer ${token}`
  } else {
    // Fallback: Basic Auth (se le API LOGOS lo supportano)
    authHeader = `Basic ${Buffer.from(`${email}:${password}`, 'utf-8').toString('base64')}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    console.warn('[Logos] Students API:', res.status, res.statusText, 'baseUrl:', baseUrl)
    return null
  }
  const data: LogosStudentsResponse = await res.json()
  if (!data.success || !data.payload) {
    console.warn('[Logos] Students API body: success=', data.success, 'payload=', !!data.payload)
    return null
  }
  return data.payload
}

/**
 * Recupera l'iscrizione (piano di studi, anno) dello studente da LOGOS.
 */
export async function logosGetEnrollment(email: string, password: string): Promise<LogosEnrollmentPayload | null> {
  const baseUrl = getLogosApiUrl()
  const url = `${baseUrl}/api/Enrollments`
  let authHeader: string

  const token = await logosLogin(email, password)
  if (token) {
    authHeader = `Bearer ${token}`
  } else {
    authHeader = `Basic ${Buffer.from(`${email}:${password}`, 'utf-8').toString('base64')}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: authHeader, Accept: 'application/json' },
  })

  if (!res.ok) return null
  const data: LogosEnrollmentsResponse = await res.json()
  if (!data.success || !data.payload) return null
  return data.payload
}

/** Mappa pianoStudi LOGOS al nostro CourseType */
export function logosCourseFromPianoStudi(pianoStudi?: string | null): CourseType {
  if (!pianoStudi || typeof pianoStudi !== 'string') return 'graphic-design-multimedia'
  const s = pianoStudi.toUpperCase()
  if ((s.includes('GRAPHIC') && (s.includes('DESIGN') || s.includes('MULTIMEDIA'))) || s.includes('GRAPHIC DESIGN')) return 'graphic-design-multimedia'
  if (s.includes('REGIA') || s.includes('VIDEOMAKING')) return 'regia-videomaking'
  if (s.includes('FOTOGRAFIA')) return 'fotografia'
  if (s.includes('FASHION')) return 'fashion-design'
  if (s.includes('PITTURA')) return 'pittura'
  if (s.includes('INTERIOR')) return 'interior-design'
  if (s.includes('CINEMA') || s.includes('AUDIOVISIVI')) return 'cinema-audiovisivi'
  if (s.includes('DESIGN')) return 'design'
  return 'graphic-design-multimedia'
}

/** Anno corrente da enrollment */
export function logosYearFromEnrollment(payload: LogosEnrollmentPayload | null): number | null {
  const y = payload?.annoAttuale
  return typeof y === 'number' && y >= 1 && y <= 5 ? y : null
}

/** Formatta anno accademico da pianoStudi: "A.A. 24/25" o "A.A. 25/26". Es. "A.A. 2019-2020" -> "A.A. 19/20", "2024-2025" -> "A.A. 24/25" */
export function logosAcademicYearFromPianoStudi(pianoStudi?: string | null): string | null {
  if (!pianoStudi || typeof pianoStudi !== 'string') return null
  // Match: 2019-2020, 2019/2020, 20242025 (es. Anno accademico 20242025)
  const m = pianoStudi.match(/(\d{4})\s*[-/]?\s*(\d{4})/) ?? pianoStudi.match(/(\d{4})(\d{4})/)
  if (!m) return null
  const y1 = m[1].slice(-2) // 2019 -> 19, 2024 -> 24
  const y2 = m[2].slice(-2) // 2020 -> 20, 2025 -> 25
  return `A.A. ${y1}/${y2}`
}

/** Email da usare per Supabase: preferisce email LABA se presente */
export function logosPreferredEmail(payload: LogosStudentPayload): string {
  const email = payload.emailLABA || payload.emailPersonale || ''
  if (!email) throw new Error('Nessuna email nello studente LOGOS')
  return email.trim()
}

export function logosFullName(payload: LogosStudentPayload): string {
  const n = (payload.nome || '').trim()
  const c = (payload.cognome || '').trim()
  return [n, c].filter(Boolean).join(' ') || 'Studente'
}
