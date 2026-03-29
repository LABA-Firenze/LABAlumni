'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { BriefcaseIcon, MapPinIcon, ClockIcon, BuildingOffice2Icon, BookmarkIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { getJobTypeLabel } from '@/lib/job-type-labels'
import type { JobPost } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'
import { SkeletonJobCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import { useUserRole } from '@/hooks/useUserRole'
import { openFloatingChatWithUser } from '@/components/FloatingChat'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { role: profileRole } = useUserRole(user?.id)
  const [job, setJob] = useState<(JobPost & { company: { id: string; company_name: string; logo_url?: string | null; description?: string | null; website_url?: string | null } }) | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    loadJob()
    if (user) {
      checkApplication()
    }
  }, [params.id, user])

  useEffect(() => {
    if (!user || profileRole !== 'student' || !params.id) return
    ;(async () => {
      const { data } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('student_id', user.id)
        .eq('job_post_id', params.id as string)
        .maybeSingle()
      setSaved(!!data)
    })()
  }, [user, profileRole, params.id])

  const loadJob = async () => {
    const { data } = await supabase
      .from('job_posts')
      .select(`
        *,
        company:companies(id, company_name, logo_url, description, website_url)
      `)
      .eq('id', params.id)
      .single()

    setJob(data)
    setLoading(false)
  }

  const checkApplication = async () => {
    if (!user) return

    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('job_post_id', params.id)
      .eq('student_id', user.id)
      .single()

    setHasApplied(!!data)
  }

  const handleApply = async () => {
    if (!user || !job) return

    setApplying(true)
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_post_id: job.id,
          student_id: user.id,
          message: message || null,
          status: 'pending',
        })

      if (error) throw error

      setHasApplied(true)
      router.push('/candidature')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Errore durante la candidatura'
      alert(msg)
    } finally {
      setApplying(false)
    }
  }

  const toggleSave = async () => {
    if (!user || profileRole !== 'student' || !job) return
    setSaveBusy(true)
    try {
      if (saved) {
        await supabase.from('saved_jobs').delete().eq('student_id', user.id).eq('job_post_id', job.id)
        setSaved(false)
      } else {
        const { error } = await supabase.from('saved_jobs').insert({ student_id: user.id, job_post_id: job.id })
        if (error) throw error
        setSaved(true)
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSaveBusy(false)
    }
  }

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <SkeletonJobCard />
        <div className="rounded-2xl bg-white shadow-md border p-6 animate-pulse">
          <div className="h-6 w-32 rounded-lg bg-gray-200 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <p className="text-gray-600 text-lg">Offerta non trovata</p>
        <Link href="/annunci">
          <Button variant="primary" className="mt-4">Torna a Tirocini</Button>
        </Link>
      </Card>
    )
  }

  return (
      <div className="space-y-6">
        <Link href="/annunci">
          <Button variant="ghost" size="sm" className="mb-6">← Torna a Tirocini</Button>
        </Link>

        <Card variant="elevated" className="mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary-50 text-primary text-sm rounded-full font-medium">
                {getJobTypeLabel(job.type)}
              </span>
              <span className="text-gray-500 text-sm">
                Pubblicato il {new Date(job.created_at).toLocaleDateString('it-IT')}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="w-5 h-5" />
                <span className="font-medium">{job.company.company_name}</span>
              </div>
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.deadline && (
                <div className="flex items-center gap-2 text-amber-800">
                  <ClockIcon className="w-5 h-5 shrink-0" />
                  <span>
                    Scadenza candidature:{' '}
                    {new Date(job.deadline + 'T12:00:00').toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {job.remote && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  Remoto
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {profileRole === 'student' && (
                <>
                  <Button type="button" variant={saved ? 'primary' : 'outline'} size="sm" disabled={saveBusy} onClick={() => void toggleSave()}>
                    <BookmarkIcon className="w-4 h-4 mr-1.5 shrink-0" />
                    {saved ? 'Salvato' : 'Salva annuncio'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openFloatingChatWithUser(job.company.id)}
                  >
                    Scrivi all&apos;azienda
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Corsi richiesti:</span>
              {job.courses.map((course) => (
                <span key={course} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {COURSE_CONFIG[course]?.name || course}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold mb-3">Descrizione</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>
        </Card>

        {/* Company info */}
        <Card variant="elevated" className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Informazioni Azienda</h2>
          <div className="space-y-2">
            <p className="font-medium text-lg">{job.company.company_name}</p>
            {job.company.description && (
              <p className="text-gray-600">{job.company.description}</p>
            )}
            {job.company.website_url && (
              <a
                href={job.company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visita il sito web →
              </a>
            )}
          </div>
        </Card>

        {/* Application form */}
        {user && !hasApplied && (
          <Card variant="elevated">
            <h2 className="text-xl font-semibold mb-4">Candidati per questa posizione</h2>
            <div className="space-y-4">
              <Textarea
                label="Messaggio (opzionale)"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Aggiungi un messaggio per l'azienda..."
              />
              <Button
                variant="primary"
                onClick={handleApply}
                disabled={applying}
                className="w-full"
              >
                {applying ? 'Invio in corso...' : 'Invia Candidatura'}
              </Button>
            </div>
          </Card>
        )}

        {hasApplied && (
          <Card variant="elevated" className="bg-green-50/90 border-green-200/60">
            <p className="text-green-800 font-medium">
              ✓ Hai già inviato la tua candidatura per questa posizione
            </p>
          </Card>
        )}

        {!user && (
          <Card variant="elevated" className="bg-blue-50/90 border-blue-200/60">
            <p className="text-blue-800 mb-4">
              Accedi o registrati per candidarti a questa posizione
            </p>
            <div className="flex gap-3">
              <Link href="/accedi">
                <Button variant="primary">Accedi</Button>
              </Link>
              <Link href="/registrati">
                <Button variant="outline">Registrati</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
  )
}

