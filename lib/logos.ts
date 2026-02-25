/**
 * Client per le API LOGOS (gestionale LABA).
 * Variabili d'ambiente:
 * - LOGOS_API_URL: base URL API LOGOS (es. https://logos.laba.it/api)
 * - LOGOS_AUTH_URL: (opzionale) URL per login, es. POST che riceve email/password e restituisce token
 * - LOGOS_API_KEY: (opzionale) API key fissa se le API usano quella invece di user token
 */

import type { LogosAuthResponse, LogosStudentsResponse, LogosStudentPayload } from '@/types/logos'

function getLogosApiUrl(): string {
  const url = process.env.LOGOS_API_URL
  if (!url) throw new Error('LOGOS_API_URL non configurato')
  return url.replace(/\/$/, '')
}

function getLogosAuthUrl(): string | null {
  const url = process.env.LOGOS_AUTH_URL
  return url ? url.replace(/\/$/, '') : null
}

/**
 * Esegue il login su LOGOS e restituisce un token da usare per le chiamate successive.
 * Se LOGOS_AUTH_URL non è impostato, restituisce null (si può usare Basic Auth con email:password).
 */
export async function logosLogin(email: string, password: string): Promise<string | null> {
  const authUrl = getLogosAuthUrl()
  if (!authUrl) return null

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) return null
  const data: LogosAuthResponse = await res.json()
  const token = data.token ?? data.accessToken ?? null
  return token
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

  if (!res.ok) return null
  const data: LogosStudentsResponse = await res.json()
  if (!data.success || !data.payload) return null
  return data.payload
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
