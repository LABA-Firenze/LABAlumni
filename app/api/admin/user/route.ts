import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '../verify-admin'
import { checkRateLimit } from '@/lib/rate-limit'

/** PATCH: rinomina utente (docente/azienda) */
export async function PATCH(request: NextRequest) {
  if (!checkRateLimit(request, { maxRequests: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }
  const { admin, error } = await requireAdmin()
  if (error || !admin) {
    return NextResponse.json({ error: error || 'Non autorizzato' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const userId = (body.userId || body.user_id || '').toString()
  const fullName = (body.fullName ?? body.full_name ?? '').toString().trim()

  if (!userId || !fullName) {
    return NextResponse.json({ error: 'userId e fullName richiesti' }, { status: 400 })
  }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).single()
  if (!profile || (profile.role !== 'docente' && profile.role !== 'company')) {
    return NextResponse.json({ error: 'Utente non trovato o non modificabile (solo docenti/aziende)' }, { status: 400 })
  }

  const { error: updError } = await admin.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', userId)
  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE: elimina utente (solo docenti/aziende, mai studenti) */
export async function DELETE(request: NextRequest) {
  if (!checkRateLimit(request, { maxRequests: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }
  const { admin, error } = await requireAdmin()
  if (error || !admin) {
    return NextResponse.json({ error: error || 'Non autorizzato' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = (searchParams.get('userId') || searchParams.get('user_id') || '').toString()
  if (!userId) return NextResponse.json({ error: 'userId richiesto' }, { status: 400 })

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).single()
  if (!profile || profile.role === 'student' || profile.role === 'admin') {
    return NextResponse.json({ error: 'Non puoi eliminare questo utente (solo docenti/aziende)' }, { status: 400 })
  }

  // Elimina dalla tabella di ruolo (docenti/companies) e da profiles
  if (profile.role === 'docente') {
    await admin.from('docenti').delete().eq('id', userId)
  } else if (profile.role === 'company') {
    await admin.from('companies').delete().eq('id', userId)
  }
  await admin.from('profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)

  return NextResponse.json({ ok: true })
}
