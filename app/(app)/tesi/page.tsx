'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, Plus, FileText, Calendar, User, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import type { ThesisProposal } from '@/types/social'
import type { Student, Profile } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface ThesisProposalWithStudent extends ThesisProposal {
  student: Student & { profile: Profile }
}

export default function ThesisPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [thesisProposals, setThesisProposals] = useState<ThesisProposalWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('open')
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        const r = data?.role || null
        setRole(r)
        if (r === 'company') {
          router.replace('/pannello/azienda')
          return
        }
      })
      loadThesisProposals()
    }
  }, [user, authLoading, router, filterStatus])

  const loadThesisProposals = async () => {
    try {
      let query = supabase
        .from('thesis_proposals')
        .select(`
          *,
          student:students!thesis_proposals_student_id_fkey(
            *,
            profile:profiles!students_id_fkey(id, full_name, email, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setThesisProposals((data || []) as ThesisProposalWithStudent[])
    } catch (error) {
      console.error('Error loading thesis proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusLabels = {
    open: 'Aperta',
    in_progress: 'In corso',
    completed: 'Completata',
    cancelled: 'Annullata',
  }

  const statusColors = {
    open: 'bg-green-100 text-green-700 border-green-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <div className="h-9 w-56 rounded-lg bg-gray-200 animate-pulse mb-2" />
            <div className="h-5 w-80 rounded-lg bg-gray-200 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
        </div>
      </div>
    )
  }

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary-600" />
              Proposte di Tesi
            </h1>
            <p className="text-gray-600 mt-2">
              {role === 'student' ? 'Pubblica la tua proposta o esplora quelle esistenti' : 'Esplora le proposte aperte e candidati come relatore'}
            </p>
          </div>
          {role === 'student' && (
            <Link href="/tesi/nuova">
              <Button variant="primary">
                <PlusCircle className="w-5 h-5 mr-2" />
                Nuova Proposta
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card variant="elevated" className="p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'open', 'in_progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Tutte' : statusLabels[status]}
              </button>
            ))}
          </div>
        </Card>

        {/* Thesis Proposals Grid */}
        {thesisProposals.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {filterStatus === 'all' 
                ? 'Nessuna proposta di tesi trovata'
                : `Nessuna proposta ${statusLabels[filterStatus as keyof typeof statusLabels].toLowerCase()}`
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {role === 'student'
                ? (filterStatus === 'open' ? 'Sii il primo a pubblicare una proposta di tesi!' : 'Prova a cambiare filtro o pubblica una nuova proposta')
                : 'Nessuna proposta al momento. Potrai candidarti come relatore quando gli studenti ne pubblicheranno.'
              }
            </p>
            {filterStatus === 'open' && role === 'student' && (
              <Link href="/tesi/nuova">
                <Button variant="primary">Pubblica la Prima Proposta</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {thesisProposals.map((proposal) => (
              <Card key={proposal.id} variant="elevated" className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{proposal.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{proposal.student?.profile?.full_name || proposal.student?.profile?.email || 'Studente'}</span>
                        </div>
                        {proposal.student?.course && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{COURSE_CONFIG[proposal.student.course]?.name || proposal.student.course}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[proposal.status as keyof typeof statusColors]}`}>
                      {statusLabels[proposal.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Descrizione</h4>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{proposal.description}</p>
                  </div>

                  {proposal.objectives && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Obiettivi</h4>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{proposal.objectives}</p>
                    </div>
                  )}

                  {proposal.methodology && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Metodologia</h4>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{proposal.methodology}</p>
                    </div>
                  )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Pubblicata il {new Date(proposal.created_at).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      {!proposal.relatore_id && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Senza relatore</span>
                      )}
                    </div>
                    <Link href={`/tesi/${proposal.id}`}>
                      <Button variant="outline" size="sm">
                        Dettagli
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
  )
}


