import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkCorsOrigin } from '@/lib/cors'
import { logosGetStudent, logosGetEnrollment, logosPreferredEmail, logosFullName, logosCourseFromPianoStudi, logosYearFromEnrollment, logosAcademicYearFromPianoStudi } from '@/lib/logos'
import { getStaffLabel } from '@/lib/staff-labels'

export async function POST(request: Request) {
  const cors = checkCorsOrigin(request)
  if (!cors.allowed) {
    return NextResponse.json({ error: 'Origine non consentita' }, { status: cors.status })
  }
  if (!checkRateLimit(request, { maxRequests: 15, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra un minuto.' }, { status: 429 })
  }
  try {
    const body = await request.json()
    const email = (body.email ?? '').toString().trim()
    const password = (body.password ?? '').toString()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password richiesti' },
        { status: 400 }
      )
    }

    const [payload, enrollment] = await Promise.all([
      logosGetStudent(email, password),
      logosGetEnrollment(email, password),
    ])
    if (!payload) {
      console.warn('[logos-login] 401 — vedi log [Logos] sopra per token/Students/body')
      return NextResponse.json(
        { error: 'Credenziali non valide o studente non trovato' },
        { status: 401 }
      )
    }

    const preferredEmail = logosPreferredEmail(payload)
    const staffLabel = getStaffLabel(preferredEmail)
    const course = staffLabel ? null : logosCourseFromPianoStudi(enrollment?.pianoStudi)
    const year = staffLabel ? null : logosYearFromEnrollment(enrollment)
    const academicYear = staffLabel ? null : logosAcademicYearFromPianoStudi(enrollment?.pianoStudi)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Configurazione server mancante' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const fullName = logosFullName(payload)
    const matricola = (payload.numMatricola ?? '').toString().trim()
    const phone = (payload.cellulare || payload.telefono || '').toString().trim() || null

    let existingId: string | null = null
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page: 0 })
    const existing = listData?.users?.find((u) => u.email?.toLowerCase() === preferredEmail.toLowerCase())
    if (existing) existingId = existing.id

    if (existingId) {
      await supabaseAdmin.auth.admin.updateUserById(existingId, { password })
      await supabaseAdmin.from('profiles').update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      }).eq('id', existingId)
      await supabaseAdmin.from('students').upsert({
        id: existingId,
        course,
        year,
        academic_year: academicYear,
        display_label: staffLabel || null,
        phone,
        matricola: matricola || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: preferredEmail,
        password,
        email_confirm: true,
        user_metadata: { role: 'student', full_name: fullName },
      })

      if (createError) {
        console.error('Supabase createUser error:', createError)
        return NextResponse.json(
          { error: createError.message || 'Errore creazione utente' },
          { status: 400 }
        )
      }
      if (!newUser.user) {
        return NextResponse.json({ error: 'Utente non creato' }, { status: 500 })
      }

      await supabaseAdmin.from('students').upsert({
        id: newUser.user.id,
        course,
        year,
        academic_year: academicYear,
        display_label: staffLabel || null,
        phone,
        matricola: matricola || null,
        last_year_update: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('logos-login error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Errore durante l\'accesso' },
      { status: 500 }
    )
  }
}
