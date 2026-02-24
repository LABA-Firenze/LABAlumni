'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { AppLayout } from '@/components/AppLayout'
import { Navbar } from '@/components/Navbar'

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/accedi')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100/80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isDashboard = pathname === '/pannello/studente' || pathname === '/pannello/azienda'
  const isWidePage = pathname?.startsWith('/profilo') || pathname?.startsWith('/portfolio') ||
    pathname?.startsWith('/annunci') || pathname?.startsWith('/azienda') || pathname?.startsWith('/rete') ||
    pathname?.startsWith('/candidature') || pathname?.startsWith('/messaggi') || pathname?.startsWith('/tesi') ||
    pathname === '/bacheca'

  if (isDashboard) {
    return <AppLayout>{children}</AppLayout>
  }

  return (
    <div className="min-h-screen bg-gray-100/80">
      <Navbar />
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isWidePage ? 'max-w-9xl' : 'max-w-6xl'}`}>
        {children}
      </div>
    </div>
  )
}
