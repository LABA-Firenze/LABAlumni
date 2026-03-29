'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, User, Mail, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_CONFIG } from '@/lib/application-status'
import type { Application, JobPost, Student } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'
import { getStudentDisplayLabel } from '@/lib/staff-labels'
import { SkeletonApplicationCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'
import { openFloatingChatWithUser } from '@/components/FloatingChat'

export default function ManageApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<(Application & { job_post: JobPost; student: Student & { profile: any } })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [roleOk, setRoleOk] = useState<boolean | null>(null)
  const showSkeleton = useMinimumLoading(loading)

  const counts = useMemo(
    () => ({
      pending: applications.filter((a) => a.status === 'pending').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    }),
    [applications]
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role !== 'company') {
            router.replace('/candidature')
            return
          }
          setRoleOk(true)
          loadApplications()
        })
    }
  }, [user, authLoading, router])

  const loadApplications = async () => {
    if (!user) return

    try {
      // Get all job posts by this company
      const { data: jobPosts } = await supabase
        .from('job_posts')
        .select('id')
        .eq('company_id', user.id)

      if (!jobPosts || jobPosts.length === 0) {
        setApplications([])
        setLoading(false)
        return
      }

      // Tutte le candidature (filtro solo lato client per la vista lista)
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(*),
          student:students(*)
        `)
        .in('job_post_id', jobPosts.map((j: { id: string }) => j.id))
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching applications:', error)
        setApplications([])
        setLoading(false)
        return
      }

      // Load profiles for students
      if (applicationsData) {
        const studentIds = [...new Set(applicationsData.map((app: any) => app.student_id))]
        const profilesMap = studentIds.length > 0
          ? new Map((await supabase.from('profiles').select('*').in('id', studentIds)).data?.map((p: any) => [p.id, p]) || [])
          : new Map()

        const applicationsWithProfiles = applicationsData.map((app: any) => ({
          ...app,
          student: {
            ...app.student,
            profile: profilesMap.get(app.student_id),
          },
        }))

        setApplications(applicationsWithProfiles)
      } else {
        setApplications([])
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && roleOk) {
      loadApplications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleOk])

  const handleStatusChange = async (applicationId: string, status: 'accepted' | 'rejected') => {
    if (!confirm(`Sei sicuro di voler ${status === 'accepted' ? 'accettare' : 'rifiutare'} questa candidatura?`)) {
      return
    }

    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)

    if (!error) {
      loadApplications()
    }
  }

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter)

  if (roleOk === null && !authLoading && user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (showSkeleton || authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-56 rounded-lg bg-gray-200 animate-pulse mb-2" />
          <div className="h-5 w-80 rounded-lg bg-gray-200 animate-pulse" />
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
            <h1 className="text-3xl font-bold text-gray-900">Pipeline candidature</h1>
            <p className="text-gray-600 mt-2">Vista colonne o lista: gestisci le candidature agli annunci della tua azienda</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={view === 'pipeline' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('pipeline')}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5 shrink-0" />
              Pipeline
            </Button>
            <Button
              type="button"
              variant={view === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="w-4 h-4 mr-1.5 shrink-0" />
              Lista
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card variant="elevated" className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            <p className="text-sm text-gray-600">Totale</p>
          </Card>
          <Card variant="elevated" className="p-4 text-center border-amber-100 bg-amber-50/40">
            <p className="text-2xl font-bold text-amber-900">{counts.pending}</p>
            <p className="text-sm text-amber-800">In valutazione</p>
          </Card>
          <Card variant="elevated" className="p-4 text-center border-green-100 bg-green-50/40">
            <p className="text-2xl font-bold text-green-900">{counts.accepted}</p>
            <p className="text-sm text-green-800">Accettate</p>
          </Card>
          <Card variant="elevated" className="p-4 text-center border-gray-200 bg-gray-50/60">
            <p className="text-2xl font-bold text-gray-800">{counts.rejected}</p>
            <p className="text-sm text-gray-600">Rifiutate</p>
          </Card>
        </div>

        {/* Filters (lista) */}
        {view === 'list' && (
          <Card variant="elevated" className="mb-6">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'Tutte' : APPLICATION_STATUS_CONFIG[f].label}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Pipeline columns */}
        {view === 'pipeline' && applications.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-4">
            {(['pending', 'accepted', 'rejected'] as const).map((status) => (
              <div key={status} className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {APPLICATION_STATUS_CONFIG[status].label} ({applications.filter((a) => a.status === status).length})
                </h2>
                <div className="space-y-3 min-h-[120px]">
                  {applications
                    .filter((a) => a.status === status)
                    .map((app) => (
                      <Card key={app.id} variant="elevated" className="p-4">
                        <p className="font-medium text-gray-900 line-clamp-2">{app.job_post.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {app.student.profile?.full_name || 'Studente'}
                        </p>
                        {app.status === 'pending' && (
                          <div className="flex flex-col gap-2 mt-3">
                            <Button variant="primary" size="sm" onClick={() => handleStatusChange(app.id, 'accepted')}>
                              Accetta
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(app.id, 'rejected')}>
                              Rifiuta
                            </Button>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => openFloatingChatWithUser(app.student_id)}
                        >
                          <Mail className="w-4 h-4 mr-1 shrink-0" />
                          Messaggio
                        </Button>
                        <Link href={`/profilo/${app.student_id}`} className="block mt-1 text-center text-xs text-primary-600 hover:underline">
                          Profilo studente
                        </Link>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'pipeline' && applications.length === 0 && (
          <Card variant="elevated" className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessuna candidatura ricevuta</p>
            <Link href="/annunci/gestisci" className="inline-block mt-4">
              <Button variant="primary">Pubblica un annuncio</Button>
            </Link>
          </Card>
        )}

        {/* Applications list */}
        {view === 'list' && filteredApplications.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filter === 'all' 
                ? 'Nessuna candidatura ricevuta' 
                : `Nessuna candidatura ${APPLICATION_STATUS_CONFIG[filter].label.toLowerCase()}`
              }
            </p>
          </Card>
        ) : view === 'list' ? (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const config = APPLICATION_STATUS_CONFIG[app.status as keyof typeof APPLICATION_STATUS_CONFIG]
              const StatusIcon = config.icon
              return (
                <Card key={app.id} variant="elevated">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">
                            {app.student.profile?.full_name || 'Studente'}
                          </h2>
                          <p className="text-gray-600 text-sm">{app.student.profile?.email}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                          <StatusIcon className={`w-4 h-4 shrink-0 ${config.color}`} />
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </div>

                      <div className="ml-16 space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Posizione</p>
                          <p className="font-medium">{app.job_post.title}</p>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Corso: </span>
                            <span className="font-medium">{getStudentDisplayLabel(app.student)}</span>
                          </div>
                          {app.student.year && (
                            <div>
                              <span className="text-gray-600">Anno: </span>
                              <span className="font-medium">{app.student.year}°</span>
                            </div>
                          )}
                        </div>

                        {app.message && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-2">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.message}</p>
                          </div>
                        )}

                        {app.student.portfolio_url && (
                          <div className="mt-2">
                            <a
                              href={app.student.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              Vedi Portfolio →
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                          <span>
                            Ricevuta il {new Date(app.created_at).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusChange(app.id, 'accepted')}
                        >
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          Accetta
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(app.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 shrink-0" />
                          Rifiuta
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => openFloatingChatWithUser(app.student_id)}
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                          Contatta
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : null}
      </div>
  )
}

