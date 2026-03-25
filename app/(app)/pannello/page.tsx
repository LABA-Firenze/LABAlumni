'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'

export default function DashboardRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { role } = useUserRole(user?.id)

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') router.push('/pannello/admin')
      else if (role === 'company') router.push('/pannello/azienda')
      else if (role === 'docente') router.push('/tesi')
      else if (role) router.push('/pannello/studente')
    } else if (!loading && !user) {
      router.push('/accedi')
    }
  }, [user, loading, router, role])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento...</p>
      </div>
    </div>
  )
}


