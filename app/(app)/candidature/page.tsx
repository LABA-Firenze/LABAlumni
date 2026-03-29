'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BriefcaseIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { APPLICATION_STATUS_CONFIG } from '@/lib/application-status'
import { openFloatingChatWithUser } from '@/components/FloatingChat'
import { SkeletonApplicationCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import type { Application, JobPost } from '@/types/database'

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<
    (Application & { job_post: JobPost & { company: { id: string; company_name: string; logo_url?: string | null } } })[]
  >([])
  const [loading, setLoading] = useState(true)
  const showSkeleton = useMinimumLoading(loading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadApplications()
    }
  }, [user, authLoading, router])

  const loadApplications = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(
            *,
            company:companies(id, company_name, logo_url)
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (showSkeleton || authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-56 rounded-lg bg-gray-200 animate-pulse mb-2" />
          <div className="h-5 w-72 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonApplicationCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Le tue candidature</h1>
            <p className="text-gray-600 mt-2">Stato delle candidature e scadenze annuncio</p>
          </div>
          <Link href="/annunci/salvati">
            <Button variant="outline" size="sm">
              Annunci salvati
            </Button>
          </Link>
        </div>

        {applications.length === 0 ? (
          <Card variant="elevated" className="text-center py-12 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
              <BriefcaseIcon className="w-12 h-12 text-primary-600" />
            </div>
            <p className="text-gray-600 text-lg mb-4">Non hai ancora inviato candidature</p>
            <Link href="/annunci">
              <Button variant="primary">Cerca Tirocini</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = APPLICATION_STATUS_CONFIG[app.status as keyof typeof APPLICATION_STATUS_CONFIG]
              const StatusIcon = config.icon
              return (
                <Card key={app.id} variant="elevated" className="hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 className="text-xl font-semibold">{app.job_post.title}</h2>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                          <StatusIcon className={`w-4 h-4 shrink-0 ${config.color}`} />
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-2">
                        {app.job_post.company.company_name} • {app.job_post.type}
                      </p>

                      {app.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.message}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>Candidato il {new Date(app.created_at).toLocaleDateString('it-IT')}</span>
                        {app.updated_at !== app.created_at && (
                          <span>Aggiornato il {new Date(app.updated_at).toLocaleDateString('it-IT')}</span>
                        )}
                        {app.job_post.deadline && (
                          <span className="inline-flex items-center gap-1 text-amber-800">
                            <ClockIcon className="w-4 h-4 shrink-0" />
                            Scadenza annuncio:{' '}
                            {new Date(app.job_post.deadline + 'T12:00:00').toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/annunci/${app.job_post.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Vedi offerta
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => openFloatingChatWithUser(app.job_post.company.id)}
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1.5 shrink-0" />
                        Scrivi all&apos;azienda
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
  )
}



