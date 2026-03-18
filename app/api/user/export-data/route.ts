import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkCorsOrigin } from '@/lib/cors'

const PRIVACY_POLICY_URL = 'https://www.laba.biz/privacy-policy'

/** GET: esporta tutti i dati dell'utente (diritto di portabilità GDPR art. 20). */
export async function GET(request: NextRequest) {
  const cors = checkCorsOrigin(request)
  if (!cors.allowed) {
    return NextResponse.json({ error: 'Origine non consentita' }, { status: cors.status })
  }
  if (!checkRateLimit(request, { maxRequests: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [
      { data: profile },
      { data: preferences },
      { data: notifications },
      { data: messagesSent },
      { data: messagesReceived },
      { data: posts },
      { data: postLikes },
      { data: postComments },
      { data: eventRegistrations },
      { data: badges },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('sender_id', userId).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('recipient_id', userId).order('created_at', { ascending: false }),
      supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('post_likes').select('*').eq('user_id', userId),
      supabase.from('post_comments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('event_registrations').select('*').eq('user_id', userId),
      supabase.from('user_badges').select('*').eq('user_id', userId),
    ])

    const role = profile?.role
    let roleProfile: unknown = null
    let applications: unknown[] = []
    let portfolioItems: unknown[] = []
    let thesisProposals: unknown[] = []
    let savedJobs: unknown[] = []
    let connections: unknown[] = []
    let companyFollows: unknown[] = []
    let jobPosts: unknown[] = []

    if (role === 'student') {
      const [s, a, p, t, sj, sc, cf] = await Promise.all([
        supabase.from('students').select('*').eq('id', userId).single(),
        supabase.from('applications').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
        supabase.from('portfolio_items').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
        supabase.from('thesis_proposals').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
        supabase.from('saved_jobs').select('*').eq('student_id', userId),
        supabase
          .from('student_connections')
          .select('*')
          .or(`student1_id.eq.${userId},student2_id.eq.${userId}`)
          .order('created_at', { ascending: false }),
        supabase.from('company_follows').select('*').eq('student_id', userId),
      ])
      roleProfile = s.data
      applications = a.data ?? []
      portfolioItems = p.data ?? []
      thesisProposals = t.data ?? []
      savedJobs = sj.data ?? []
      connections = sc.data ?? []
      companyFollows = cf.data ?? []
    } else if (role === 'company') {
      const [c, jp] = await Promise.all([
        supabase.from('companies').select('*').eq('id', userId).single(),
        supabase.from('job_posts').select('*').eq('company_id', userId).order('created_at', { ascending: false }),
      ])
      roleProfile = c.data
      jobPosts = jp.data ?? []
    } else if (role === 'docente') {
      const [d] = await Promise.all([supabase.from('docenti').select('*').eq('id', userId).single()])
      roleProfile = d.data
    }

    const exportPayload = {
      exported_at: new Date().toISOString(),
      privacy_policy_url: PRIVACY_POLICY_URL,
      profile,
      role_profile: roleProfile,
      preferences: preferences ?? null,
      notifications: notifications ?? [],
      messages_sent: messagesSent ?? [],
      messages_received: messagesReceived ?? [],
      posts: posts ?? [],
      post_likes: postLikes ?? [],
      post_comments: postComments ?? [],
      event_registrations: eventRegistrations ?? [],
      user_badges: badges ?? [],
      applications,
      portfolio_items: portfolioItems,
      thesis_proposals: thesisProposals,
      saved_jobs: savedJobs,
      student_connections: connections,
      company_follows: companyFollows,
      job_posts: jobPosts,
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="labalumni-dati-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (e) {
    console.error('export-data error:', e)
    return NextResponse.json(
      { error: 'Errore durante l\'export dei dati' },
      { status: 500 }
    )
  }
}
