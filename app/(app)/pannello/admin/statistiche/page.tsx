'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import {
  ChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/solid'

export default function AdminStatistichePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    students: number
    companies: number
    docenti: number
    jobPosts: number
    applications: number
    applicationsAccepted: number
    topJobs: { id: string; title: string; count: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }: any) => {
      setRole(data?.role || null)
      if (data?.role !== 'admin') router.replace('/pannello')
    })
  }, [user, router])

  useEffect(() => {
    if (role !== 'admin') return
    const load = async () => {
      const [
        { count: students },
        { count: companies },
        { count: docenti },
        { count: jobPosts },
        { count: applications },
        { data: apps },
        { data: allApps },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('docenti').select('*', { count: 'exact', head: true }),
        supabase.from('job_posts').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('job_post_id').eq('status', 'accepted'),
        supabase.from('applications').select('job_post_id'),
      ])
      const applicationsAccepted = apps?.length || 0
      const counts: Record<string, number> = {}
      ;(allApps || []).forEach((a: { job_post_id: string }) => {
        counts[a.job_post_id] = (counts[a.job_post_id] || 0) + 1
      })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      let topJobs: { id: string; title: string; count: number }[] = []
      if (sorted.length > 0) {
        const { data: jobs } = await supabase
          .from('job_posts')
          .select('id, title')
          .in('id', sorted.map(([id]) => id))
        const jobMap = Object.fromEntries((jobs || []).map((j: { id: string; title: string }) => [j.id, j.title]))
        topJobs = sorted.map(([id, count]) => ({ id, title: jobMap[id] || '—', count }))
      }
      setStats({
        students: students || 0,
        companies: companies || 0,
        docenti: docenti || 0,
        jobPosts: jobPosts || 0,
        applications: applications || 0,
        applicationsAccepted,
        topJobs,
      })
      setLoading(false)
    }
    load()
  }, [role])

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiche</h1>
            <p className="text-gray-600">Panoramica della piattaforma</p>
          </div>
        </div>
        <Link href="/pannello/admin" className="text-primary-600 hover:underline text-sm">
          ← Torna al pannello
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-6">
          <UserGroupIcon className="w-8 h-8 text-primary-600 mb-2" />
          <p className="text-2xl font-bold">{stats.students}</p>
          <p className="text-sm text-gray-600">Studenti</p>
        </Card>
        <Card variant="elevated" className="p-6">
          <BriefcaseIcon className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold">{stats.companies}</p>
          <p className="text-sm text-gray-600">Aziende</p>
        </Card>
        <Card variant="elevated" className="p-6">
          <BriefcaseIcon className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-2xl font-bold">{stats.jobPosts}</p>
          <p className="text-sm text-gray-600">Annunci attivi</p>
        </Card>
        <Card variant="elevated" className="p-6">
          <DocumentCheckIcon className="w-8 h-8 text-indigo-600 mb-2" />
          <p className="text-2xl font-bold">{stats.applications}</p>
          <p className="text-sm text-gray-600">Candidature totali</p>
        </Card>
      </div>

      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tasso di successo</h2>
        <p className="text-3xl font-bold text-primary-600">
          {stats.applications > 0
            ? Math.round((stats.applicationsAccepted / stats.applications) * 100)
            : 0}
          %
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {stats.applicationsAccepted} candidature accettate su {stats.applications}
        </p>
      </Card>

      {stats.topJobs.length > 0 && (
        <Card variant="elevated" className="p-6">
          <h2 className="text-lg font-semibold mb-4">Annunci con più candidature</h2>
          <ul className="space-y-2">
            {stats.topJobs.map((j) => (
              <li key={j.id} className="flex justify-between items-center">
                <Link href={`/annunci/${j.id}`} className="text-primary-600 hover:underline truncate">
                  {j.title}
                </Link>
                <span className="font-semibold">{j.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
