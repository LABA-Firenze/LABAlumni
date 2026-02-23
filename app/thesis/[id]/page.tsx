'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, Calendar, User, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ThesisProposal } from '@/types/social'
import type { Student, Profile } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

interface ThesisProposalWithStudent extends ThesisProposal {
  student: Student & { profile: Profile }
}

export default function ThesisDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const thesisId = params.id as string
  const [proposal, setProposal] = useState<ThesisProposalWithStudent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (thesisId) {
      loadThesisProposal()
    }
  }, [thesisId])

  const loadThesisProposal = async () => {
    try {
      const { data, error } = await supabase
        .from('thesis_proposals')
        .select(`
          *,
          student:students!thesis_proposals_student_id_fkey(
            *,
            profile:profiles!students_id_fkey(id, full_name, email, avatar_url)
          )
        `)
        .eq('id', thesisId)
        .single()

      if (error) throw error
      setProposal(data as ThesisProposalWithStudent)
    } catch (error) {
      console.error('Error loading thesis proposal:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Proposta non trovata</h3>
            <p className="text-gray-600 mb-6">La proposta di tesi richiesta non esiste o è stata rimossa.</p>
            <Link href="/thesis">
              <Button variant="primary">Torna alle Proposte</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Indietro
        </button>

        <Card className="overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{proposal.title}</h1>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{proposal.student?.profile?.full_name || proposal.student?.profile?.email || 'Studente'}</span>
                  </div>
                  {proposal.student?.course && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span>{COURSE_CONFIG[proposal.student.course]?.name || proposal.student.course}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {new Date(proposal.created_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[proposal.status as keyof typeof statusColors]}`}>
                {statusLabels[proposal.status as keyof typeof statusLabels]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary-600" />
                Descrizione
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>
              </div>
            </div>

            {/* Objectives */}
            {proposal.objectives && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Obiettivi</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.objectives}</p>
                </div>
              </div>
            )}

            {/* Methodology */}
            {proposal.methodology && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Metodologia</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.methodology}</p>
                </div>
              </div>
            )}

            {/* Documents */}
            {proposal.documents && proposal.documents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Documenti</h2>
                <div className="space-y-2">
                  {proposal.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">Documento {idx + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {user?.id === proposal.student_id && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <Link href="/thesis">
                  <Button variant="outline">Torna alle Proposte</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


