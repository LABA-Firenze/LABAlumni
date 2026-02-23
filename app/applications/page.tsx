'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_CONFIG } from '@/lib/application-status'
import type { Application, JobPost } from '@/types/database'

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<(Application & { job_post: JobPost & { company: any } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Le Tue Candidature</h1>
          <p className="text-gray-600 mt-2">Tutte le posizioni per cui ti sei candidato</p>
        </div>

        {applications.length === 0 ? (
          <Card className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">Non hai ancora inviato candidature</p>
            <Link href="/jobs">
              <Button variant="primary">Cerca Annunci</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = APPLICATION_STATUS_CONFIG[app.status as keyof typeof APPLICATION_STATUS_CONFIG]
              const StatusIcon = config.icon
              return (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
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

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Candidato il {new Date(app.created_at).toLocaleDateString('it-IT')}
                        </span>
                        {app.updated_at !== app.created_at && (
                          <span>
                            Aggiornato il {new Date(app.updated_at).toLocaleDateString('it-IT')}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href={`/jobs/${app.job_post.id}`}>
                      <Button variant="outline" size="sm">Vedi Annuncio</Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}



