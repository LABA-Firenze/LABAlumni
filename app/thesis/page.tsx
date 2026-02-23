'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, Plus, FileText, Calendar, User, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import type { ThesisProposal } from '@/types/social'
import type { Student, Profile } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

interface ThesisProposalWithStudent extends ThesisProposal {
  student: Student & { profile: Profile }
}

export default function ThesisPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [thesisProposals, setThesisProposals] = useState<ThesisProposalWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('open')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary-600" />
              Proposte di Tesi
            </h1>
            <p className="text-gray-600 mt-2">Esplora le proposte di tesi degli studenti LABA</p>
          </div>
          <Link href="/thesis/new">
            <Button variant="primary">
              <PlusCircle className="w-5 h-5 mr-2" />
              Nuova Proposta
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
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
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {filterStatus === 'all' 
                ? 'Nessuna proposta di tesi trovata'
                : `Nessuna proposta ${statusLabels[filterStatus as keyof typeof statusLabels].toLowerCase()}`
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'open' 
                ? 'Sii il primo a pubblicare una proposta di tesi!'
                : 'Prova a cambiare filtro o pubblica una nuova proposta'
              }
            </p>
            {filterStatus === 'open' && (
              <Link href="/thesis/new">
                <Button variant="primary">Pubblica la Prima Proposta</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {thesisProposals.map((proposal) => (
              <Card key={proposal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    </div>
                    <Link href={`/thesis/${proposal.id}`}>
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
    </div>
  )
}


