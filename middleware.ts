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

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return res
  }

  const supabase = createMiddlewareClient({ req: request, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    const redirectUrl = new URL('/accedi', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
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
  ],
}
