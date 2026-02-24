'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function DashboardRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Get user role from profile
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.role === 'company') {
            router.push('/pannello/azienda')
          } else if (data?.role === 'docente') {
            router.push('/tesi')
          } else {
            router.push('/pannello/studente')
          }
        })
    } else if (!loading && !user) {
      router.push('/accedi')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento...</p>
      </div>
    </div>
  )
}


