'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'
import { HomeFeedDashboard } from '@/components/dashboard/HomeFeedDashboard'

export default function DocenteDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useUserRole(user?.id)
  const router = useRouter()

  useEffect(() => {
    if (authLoading || roleLoading || !user) return
    if (role === 'admin') router.replace('/pannello/admin')
    else if (role === 'company') router.replace('/pannello/azienda')
    else if (role === 'student') router.replace('/pannello/studente')
    else if (role !== 'docente') router.replace('/pannello/studente')
  }, [user, authLoading, roleLoading, role, router])

  if (authLoading || roleLoading || role !== 'docente') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  return <HomeFeedDashboard variant="docente" />
}
