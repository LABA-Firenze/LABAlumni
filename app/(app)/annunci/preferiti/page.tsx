'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BriefcaseIcon, MapPinIcon, ClockIcon, StarIcon } from '@heroicons/react/24/solid'
import { getJobTypeLabel } from '@/lib/job-type-labels'
import Link from 'next/link'
import type { JobPost } from '@/types/database'

export default function PreferitiPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<(JobPost & { company: any })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    loadSavedJobs()
  }, [user, router])

  const loadSavedJobs = async () => {
    if (!user) return
    try {
      const { data: saved } = await supabase
        .from('saved_jobs')
        .select('job_post_id')
        .eq('student_id', user.id)

      const ids = (saved || []).map((s: { job_post_id: string }) => s.job_post_id)
      if (ids.length === 0) {
        setJobs([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('job_posts')
        .select(`*, company:companies(id, company_name, logo_url)`)
        .in('id', ids)
        .eq('active', true)

      setJobs(data || [])
    } catch (error) {
      console.error('Error loading saved jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (jobId: string) => {
    if (!user) return
    await supabase.from('saved_jobs').delete().eq('student_id', user.id).eq('job_post_id', jobId)
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card variant="elevated" className="p-6">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6 bg-gradient-to-br from-amber-50/60 to-white border-amber-100/60">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <StarIcon className="w-8 h-8 text-amber-500" />
          Annunci salvati
        </h1>
        <p className="text-gray-600 mt-2">I tirocini che hai salvato per rivederli dopo</p>
      </Card>

      {jobs.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <p className="text-gray-600 mb-4">Non hai ancora salvato nessun annuncio.</p>
          <Link href="/annunci">
            <Button variant="primary">Esplora i tirocini</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} variant="elevated" className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <span className="px-3 py-1 bg-primary-50 text-primary text-sm rounded-full font-medium">
                      {getJobTypeLabel(job.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                    <span>{job.company?.company_name}</span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {job.location}
                      </span>
                    )}
                    {job.remote && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Remoto</span>
                    )}
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(job.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex gap-2">
                    <Link href={`/annunci/${job.id}`}>
                      <Button variant="primary">Dettagli</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleUnsave(job.id)}>
                      Rimuovi
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(job.id)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="Rimuovi dai preferiti"
                >
                  <StarIcon className="w-6 h-6 text-amber-500 fill-amber-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
