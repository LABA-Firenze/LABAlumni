'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BriefcaseIcon, BuildingOffice2Icon, TrashIcon } from '@heroicons/react/24/solid'
import type { JobPost } from '@/types/database'
import { getJobTypeLabel } from '@/lib/job-type-labels'
import { SkeletonJobCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

type Row = { job_post_id: string; job_post: JobPost & { company: { company_name: string; logo_url?: string | null } } }

export default function SavedJobsPage() {
  const { user, loading: authLoading } = useAuth()
  const { role } = useUserRole(user?.id)
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }
    if (authLoading || !user) return
    if (role && role !== 'student') {
      router.replace('/annunci')
      return
    }
    loadSaved()
  }, [user, authLoading, role, router])

  const loadSaved = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select(
          `
          job_post_id,
          job_post:job_posts(
            *,
            company:companies(company_name, logo_url)
          )
        `
        )
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      const list = (data || []).filter((r: any) => r.job_post) as Row[]
      setRows(list)
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const remove = async (jobPostId: string) => {
    if (!user) return
    await supabase.from('saved_jobs').delete().eq('student_id', user.id).eq('job_post_id', jobPostId)
    setRows((prev) => prev.filter((r) => r.job_post_id !== jobPostId))
  }

  if (showSkeleton || authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <SkeletonJobCard />
        <SkeletonJobCard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Annunci salvati</h1>
          <p className="text-gray-600 mt-2">Tirocini e opportunità che hai messo da parte</p>
        </div>
        <Link href="/annunci">
          <Button variant="outline">Tutti gli annunci</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card variant="elevated" className="text-center py-14 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
          <BriefcaseIcon className="w-14 h-14 text-primary-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">Non hai ancora salvato nessun annuncio.</p>
          <Link href="/annunci">
            <Button variant="primary">Sfoglia tirocini</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const j = r.job_post
            if (!j?.id) return null
            return (
              <Card key={r.job_post_id} variant="elevated" className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {j.company?.logo_url ? (
                      <img src={j.company.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BuildingOffice2Icon className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary-600">{getJobTypeLabel(j.type)}</p>
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{j.title}</h2>
                    <p className="text-sm text-gray-600 truncate">{j.company?.company_name}</p>
                    {j.deadline && (
                      <p className="text-xs text-amber-800 mt-1">
                        Scadenza: {new Date(j.deadline + 'T12:00:00').toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/annunci/${j.id}`}>
                    <Button variant="primary" size="sm">
                      Apri
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => void remove(j.id)} aria-label="Rimuovi dai salvati">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
