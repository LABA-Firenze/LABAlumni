'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, User, Mail } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_CONFIG } from '@/lib/application-status'
import type { Application, JobPost, Student } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

export default function ManageApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<(Application & { job_post: JobPost; student: Student & { profile: any } })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

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

      // Get applications for these jobs
      let query = supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(*),
          student:students(*)
        `)
        .in('job_post_id', jobPosts.map((j: any) => j.id))

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data: applicationsData, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching applications:', error)
        setApplications([])
        setLoading(false)
        return
      }

      // Load profiles for students
      if (applicationsData) {
        const studentIds = applicationsData.map((app: any) => app.student_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', studentIds)

        const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || [])

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
    if (user) {
      loadApplications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestisci Candidature</h1>
          <p className="text-gray-600 mt-2">Rivedi e gestisci tutte le candidature ricevute</p>
        </div>

        {/* Filters */}
        <Card variant="elevated" className="mb-6">
          <div className="flex gap-2">
            {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Tutte' : APPLICATION_STATUS_CONFIG[f].label}
              </button>
            ))}
          </div>
        </Card>

        {/* Applications list */}
        {filteredApplications.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filter === 'all' 
                ? 'Nessuna candidatura ricevuta' 
                : `Nessuna candidatura ${APPLICATION_STATUS_CONFIG[filter].label.toLowerCase()}`
              }
            </p>
          </Card>
        ) : (
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
                            <span className="font-medium">{COURSE_CONFIG[app.student.course]?.name || app.student.course}</span>
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
                        <Link href={`/messaggi?user=${app.student.id}`}>
                          <Button variant="ghost" size="sm" className="w-full">
                            <Mail className="w-4 h-4 shrink-0" />
                            Contatta
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
  )
}

