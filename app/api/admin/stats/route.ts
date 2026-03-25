import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { requireAdmin } from '../verify-admin'
import { checkRateLimit } from '@/lib/rate-limit'

type TopJob = { id: string; title: string; count: number }

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request, { maxRequests: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }

  const { admin, error } = await requireAdmin()
  if (error || !admin) {
    return NextResponse.json({ error: error || 'Non autorizzato' }, { status: 401 })
  }

  try {
    const [
      { count: students },
      { count: companies },
      { count: docenti },
      { count: jobPosts },
      { count: applications },
      { data: acceptedApps },
      { data: allApps },
    ] = await Promise.all([
      admin.from('students').select('*', { count: 'exact', head: true }),
      admin.from('companies').select('*', { count: 'exact', head: true }),
      admin.from('docenti').select('*', { count: 'exact', head: true }),
      admin.from('job_posts').select('*', { count: 'exact', head: true }).eq('active', true),
      admin.from('applications').select('*', { count: 'exact', head: true }),
      admin.from('applications').select('job_post_id').eq('status', 'accepted'),
      admin.from('applications').select('job_post_id'),
    ])

    const applicationsAccepted = acceptedApps?.length || 0

    const counts: Record<string, number> = {}
    ;(allApps || []).forEach((a: { job_post_id: string | null }) => {
      if (!a?.job_post_id) return
      counts[a.job_post_id] = (counts[a.job_post_id] || 0) + 1
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    let topJobs: TopJob[] = []

    if (sorted.length > 0) {
      const ids = sorted.map(([id]) => id)
      const { data: jobs } = await admin.from('job_posts').select('id, title').in('id', ids)
      const jobMap = Object.fromEntries((jobs || []).map((j: { id: string; title: string }) => [j.id, j.title]))
      topJobs = sorted.map(([id, count]) => ({ id, title: jobMap[id] || '—', count }))
    }

    return NextResponse.json({
      students: students || 0,
      companies: companies || 0,
      docenti: docenti || 0,
      jobPosts: jobPosts || 0,
      applications: applications || 0,
      applicationsAccepted,
      topJobs,
    })
  } catch (e) {
    console.error('admin/stats error:', e)
    return NextResponse.json({ error: 'Errore caricamento statistiche' }, { status: 500 })
  }
}

