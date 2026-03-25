import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rate-limit'

export async function DELETE(request: NextRequest) {
  if (!checkRateLimit(request, { maxRequests: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const otherUserId = (body.otherUserId ?? '').toString().trim()
  if (!otherUserId) {
    return NextResponse.json({ error: 'Destinatario mancante' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Configurazione server mancante' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const me = session.user.id

  try {
    const { error, count } = await admin
      .from('messages')
      .delete({ count: 'exact' })
      .or(`and(sender_id.eq.${me},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${me})`)

    if (error) {
      return NextResponse.json({ error: 'Errore eliminazione conversazione' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: count ?? 0 })
  } catch (e) {
    console.error('delete conversation error:', e)
    return NextResponse.json({ error: 'Errore eliminazione conversazione' }, { status: 500 })
  }
}

