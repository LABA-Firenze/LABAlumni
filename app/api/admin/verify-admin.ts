import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing Supabase config')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function requireAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { user: null, error: 'Non autenticato' as const }
  const admin = await getAdminSupabase()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') return { user: null, error: 'Accesso negato' as const }
  return { user: session.user, admin }
}
