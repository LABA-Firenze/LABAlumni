import { NextResponse } from 'next/server'
import { requireAdmin } from '../admin/verify-admin'

/**
 * Debug: verifica se le env LOGOS sono disponibili a runtime.
 * Non espone i valori.
 *
 * Per sicurezza:
 * - richiede utente admin
 * - è disabilitato in produzione
 * - richiede ENABLE_DEBUG_ENV_ENDPOINT=true
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  if (process.env.ENABLE_DEBUG_ENV_ENDPOINT !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const { error } = await requireAdmin()
  if (error) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const keys = ['LOGOS_API_URL', 'LOGOS_AUTH_URL', 'LOGOS_CLIENT_ID', 'LOGOS_CLIENT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']
  const env = keys.reduce<Record<string, boolean>>((acc, k) => {
    acc[k] = !!process.env[k]
    return acc
  }, {})
  return NextResponse.json(env)
}
