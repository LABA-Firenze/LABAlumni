'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Briefcase, MapPin, Clock, Building2 } from 'lucide-react'
import Link from 'next/link'
import type { JobPost } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'
import { SkeletonJobCard } from '@/components/ui/Skeleton'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [job, setJob] = useState<(JobPost & { company: any }) | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    loadJob()
    if (user) {
      checkApplication()
    }
  }, [params.id, user])

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
      router.push('/pannello/studente')
    } catch (error: any) {
      alert(error.message || 'Errore durante la candidatura')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
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
          <Button variant="primary" className="mt-4">Torna a Tirocini e Stage</Button>
        </Link>
      </Card>
    )
  }

  return (
      <div className="space-y-6">
        <Link href="/annunci">
          <Button variant="ghost" size="sm" className="mb-6">← Torna a Tirocini e Stage</Button>
        </Link>

        <Card variant="elevated" className="mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary-50 text-primary text-sm rounded-full font-medium">
                {job.type}
              </span>
              <span className="text-gray-500 text-sm">
                Pubblicato il {new Date(job.created_at).toLocaleDateString('it-IT')}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{job.company.company_name}</span>
              </div>
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.remote && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  Remoto
                </span>
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

