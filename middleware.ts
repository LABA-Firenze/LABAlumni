import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

/** Route che richiedono sessione (redirect a /accedi se non autenticati) */
const PROTECTED_PREFIXES = [
  '/pannello',
  '/profilo',
  '/impostazioni',
  '/rete',
  '/messaggi',
  '/tesi',
  '/candidature',
  '/annunci',
  '/portfolio',
  '/storie',
]

/** Route che richiedono ruolo admin */
const ADMIN_ONLY_PREFIXES = ['/pannello/admin', '/api/admin', '/api/debug-env']

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname
  const needsSession = isProtectedPath(pathname) || isAdminOnlyPath(pathname)
  if (!needsSession) {
    return res
  }

  const supabase = createMiddlewareClient({ req: request, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    const redirectUrl = new URL('/accedi', request.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Extra guard: admin-only routes
  if (isAdminOnlyPath(pathname)) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Se RLS blocca o ruolo != admin → 403/redirect
    if (error || profile?.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/pannello', request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/pannello/:path*',
    '/profilo/:path*',
    '/impostazioni/:path*',
    '/rete/:path*',
    '/messaggi/:path*',
    '/tesi/:path*',
    '/candidature/:path*',
    '/annunci/:path*',
    '/portfolio/:path*',
    '/storie/:path*',
    '/api/admin/:path*',
    '/api/debug-env',
  ],
}
