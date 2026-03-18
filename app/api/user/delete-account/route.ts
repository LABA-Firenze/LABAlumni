import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkCorsOrigin } from '@/lib/cors'

/** POST: l'utente elimina il proprio account. Richiede conferma esplicita. */
export async function POST(request: NextRequest) {
  const cors = checkCorsOrigin(request)
  if (!cors.allowed) {
    return NextResponse.json({ error: 'Origine non consentita' }, { status: cors.status })
  }
  if (!checkRateLimit(request, { maxRequests: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const confirmText = (body.confirm ?? '').toString().trim().toLowerCase()

  if (confirmText !== 'elimina') {
    return NextResponse.json(
      { error: 'Scrivi "elimina" per confermare' },
      { status: 400 }
    )
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const userId = session.user.id
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Configurazione mancante' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).single()
    if (!profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })
    }
    if (profile.role === 'admin') {
      return NextResponse.json(
        { error: 'Gli account admin non possono essere eliminati da qui' },
        { status: 403 }
      )
    }

    // 1. Elimina da students / companies / docenti (FK verso profiles)
    if (profile.role === 'student') {
      await admin.from('students').delete().eq('id', userId)
    } else if (profile.role === 'company') {
      await admin.from('companies').delete().eq('id', userId)
    } else if (profile.role === 'docente') {
      await admin.from('docenti').delete().eq('id', userId)
    }

    // 2. Elimina profilo (cascade su messages, posts, user_preferences, ecc.)
    await admin.from('profiles').delete().eq('id', userId)

    // 3. Elimina utente da auth
    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    if (authErr) {
      console.error('auth.admin.deleteUser error:', authErr)
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione dell\'account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('delete-account error:', e)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione' },
      { status: 500 }
    )
  }
}
