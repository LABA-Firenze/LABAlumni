import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '../verify-admin'

/** POST: reset password per docente/azienda (non studenti) */
export async function POST(request: NextRequest) {
  const { admin, error } = await requireAdmin()
  if (error || !admin) {
    return NextResponse.json({ error: error || 'Non autorizzato' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const userId = (body.userId ?? body.user_id ?? '').toString()
  const newPassword = (body.newPassword ?? body.new_password ?? body.password ?? '').toString()

  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'userId e newPassword richiesti' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'La password deve essere di almeno 6 caratteri' }, { status: 400 })
  }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).single()
  if (!profile || profile.role === 'student') {
    return NextResponse.json({ error: 'Non puoi reimpostare la password di uno studente (usano LOGOS)' }, { status: 400 })
  }
  if (profile.role === 'admin') {
    return NextResponse.json({ error: 'Operazione non consentita per account admin' }, { status: 400 })
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
