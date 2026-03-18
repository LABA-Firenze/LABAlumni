import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '../verify-admin'
import { checkRateLimit } from '@/lib/rate-limit'

/** GET: elenco docenti e aziende per pannello admin */
export async function GET(request: NextRequest) {
  if (!checkRateLimit(request, { maxRequests: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }
  const { admin, error } = await requireAdmin()
  if (error || !admin) {
    return NextResponse.json({ error: error || 'Non autorizzato' }, { status: 401 })
  }

  const { data: docData } = await admin.from('docenti').select('id, bio, courses, can_relatore, can_corelatore')
  const { data: compData } = await admin.from('companies').select('id, company_name, partita_iva, description')
  const docIds = (docData || []).map((d: { id: string }) => d.id)
  const compIds = (compData || []).map((c: { id: string }) => c.id)
  const allIds = [...new Set([...docIds, ...compIds])]
  const { data: profiles } = await admin.from('profiles').select('id, email, full_name').in('id', allIds)
  const profMap = new Map((profiles || []).map((p: { id: string; email: string; full_name: string | null }) => [p.id, p]))

  const docenti = (docData || []).map((d: { id: string; bio: string | null; courses: string[]; can_relatore: boolean; can_corelatore: boolean }) => ({
    ...d,
    role: 'docente' as const,
    email: profMap.get(d.id)?.email,
    full_name: profMap.get(d.id)?.full_name,
  }))
  const companies = (compData || []).map((c: { id: string; company_name: string; partita_iva: string | null; description: string | null }) => ({
    ...c,
    role: 'company' as const,
    email: profMap.get(c.id)?.email,
    full_name: profMap.get(c.id)?.full_name,
  }))

  return NextResponse.json({ docenti, companies })
}
