import { NextResponse } from 'next/server'

/** Debug: verifica se le env LOGOS sono disponibili a runtime. Non espone i valori. */
export async function GET() {
  const keys = ['LOGOS_API_URL', 'LOGOS_AUTH_URL', 'LOGOS_CLIENT_ID', 'LOGOS_CLIENT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']
  const env = keys.reduce<Record<string, boolean>>((acc, k) => {
    acc[k] = !!process.env[k]
    return acc
  }, {})
  return NextResponse.json(env)
}
