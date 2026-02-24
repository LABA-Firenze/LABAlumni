'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, Calendar, User, FileText, ArrowLeft, ThumbsUp, Check, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { ThesisProposal } from '@/types/social'
import type { Student, Profile } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useMinimumLoading } from '@/hooks/useMinimumLoading'

interface ThesisProposalWithStudent extends ThesisProposal {
  student: Student & { profile: Profile }
}

interface Invitation {
  id: string
  thesis_id: string
  docente_id: string
  status: 'pending' | 'accepted' | 'rejected'
  docente?: { id: string; profile?: { full_name: string | null } }
}

interface Application {
  id: string
  thesis_id: string
  docente_id: string
  status: 'pending' | 'accepted' | 'rejected'
  docente?: { id: string; profile?: { full_name: string | null } }
}

export default function ThesisDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const thesisId = params.id as string
  const [proposal, setProposal] = useState<ThesisProposalWithStudent | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [relatoreInv, setRelatoreInv] = useState<Invitation | null>(null)
  const [relatoreApps, setRelatoreApps] = useState<Application[]>([])
  const [corelatoreInv, setCorelatoreInv] = useState<Invitation | null>(null)
  const [corelatoreApps, setCorelatoreApps] = useState<Application[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [docenteNames, setDocenteNames] = useState<Record<string, string>>({})
  const showSkeleton = useMinimumLoading(loading)

  const loadAll = useCallback(async () => {
    if (!thesisId) return
    try {
      const { data: proposalData, error: proposalErr } = await supabase
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
      if (proposalErr) throw proposalErr
      setProposal(proposalData as ThesisProposalWithStudent)

      const [riRes, raRes, ciRes, caRes] = await Promise.all([
        supabase.from('thesis_relatore_invitations').select('*, docente:docenti(id)').eq('thesis_id', thesisId).maybeSingle(),
        supabase.from('thesis_relatore_applications').select('*, docente:docenti(id)').eq('thesis_id', thesisId),
        supabase.from('thesis_corelatore_invitations').select('*, docente:docenti(id)').eq('thesis_id', thesisId).maybeSingle(),
        supabase.from('thesis_corelatore_applications').select('*, docente:docenti(id)').eq('thesis_id', thesisId),
      ])

      setRelatoreInv(riRes.data as Invitation | null)
      setRelatoreApps((raRes.data || []) as Application[])
      setCorelatoreInv(ciRes.data as Invitation | null)
      setCorelatoreApps((caRes.data || []) as Application[])

      const docIds = new Set<string>()
      ;[(riRes.data as Invitation)?.docente_id, (ciRes.data as Invitation)?.docente_id]
        .concat((raRes.data as Application[])?.map((a) => a.docente_id) || [])
        .concat((caRes.data as Application[])?.map((a) => a.docente_id) || [])
        .filter(Boolean)
        .forEach((id) => docIds.add(id as string))
      if (docIds.size > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', [...docIds])
        setDocenteNames(Object.fromEntries((profs || []).map((p) => [p.id, p.full_name || 'Docente'])))
      }

      if (user?.id) {
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => setRole(data?.role || null))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [thesisId, user?.id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (user?.id && role === 'company') {
      router.replace('/pannello/azienda')
    }
  }, [user?.id, role, router])

  const isOwner = user?.id === proposal?.student_id
  const isDocente = role === 'docente'
  const currentDocenteRelatoreApp = relatoreApps.find((a) => a.docente_id === user?.id)
  const currentDocenteCorelatoreApp = corelatoreApps.find((a) => a.docente_id === user?.id)
  const relatoreInvitationForMe = relatoreInv?.docente_id === user?.id
  const corelatoreInvitationForMe = corelatoreInv?.docente_id === user?.id

  const handleApplyRelatore = async () => {
    if (!user || !thesisId || actionLoading) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from('thesis_relatore_applications').insert({ thesis_id: thesisId, docente_id: user.id })
      if (error) throw error
      await loadAll()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyCorelatore = async () => {
    if (!user || !thesisId || actionLoading) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from('thesis_corelatore_applications').insert({ thesis_id: thesisId, docente_id: user.id })
      if (error) throw error
      await loadAll()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleInvitationResponse = async (table: 'thesis_relatore_invitations' | 'thesis_corelatore_invitations', invId: string, accept: boolean) => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from(table).update({ status: accept ? 'accepted' : 'rejected' }).eq('id', invId)
      if (error) throw error
      // Trigger DB aggiorna thesis_proposals.relatore_id/corelatore_id automaticamente
      await loadAll()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplicationResponse = async (
    table: 'thesis_relatore_applications' | 'thesis_corelatore_applications',
    appId: string,
    accept: boolean
  ) => {
    if (!isOwner || actionLoading) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from(table).update({ status: accept ? 'accepted' : 'rejected' }).eq('id', appId)
      if (error) throw error
      if (accept) {
        const app = table === 'thesis_relatore_applications' ? relatoreApps.find((a) => a.id === appId) : corelatoreApps.find((a) => a.id === appId)
        const col = table === 'thesis_relatore_applications' ? 'relatore_id' : 'corelatore_id'
        if (app?.docente_id) {
          await supabase.from('thesis_proposals').update({ [col]: app.docente_id }).eq('id', thesisId)
        }
      }
      await loadAll()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !thesisId || !isOwner || actionLoading) return
    if (!confirm('Vuoi eliminare questa proposta? Potrai crearne una nuova dopo.')) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from('thesis_proposals').delete().eq('id', thesisId)
      if (error) throw error
      router.push('/tesi')
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
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

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 rounded-lg bg-gray-200 animate-pulse" />
        <SkeletonCard lines={5} />
      </div>
    )
  }

  if (!proposal) {
    return (
      <Card variant="elevated" className="p-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Proposta non trovata</h3>
        <p className="text-gray-600 mb-6">La proposta di tesi richiesta non esiste o è stata rimossa.</p>
        <Link href="/tesi">
          <Button variant="primary">Torna alle Proposte</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Indietro
        </button>

        <Card variant="elevated" className="overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 rounded-t-2xl">
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

            {/* Docente: Inviti in attesa (relatore/corelatore) */}
            {isDocente && (relatoreInvitationForMe || corelatoreInvitationForMe) && (
              <div className="space-y-4 p-4 rounded-lg bg-primary-50 border border-primary-200">
                <h2 className="text-lg font-bold text-gray-900">Inviti in attesa</h2>
                {relatoreInvitationForMe && relatoreInv?.status === 'pending' && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span>Invito come <strong>relatore</strong></span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_relatore_invitations', relatoreInv.id, true)} disabled={actionLoading}>
                        <Check className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_relatore_invitations', relatoreInv.id, false)} disabled={actionLoading}>
                        <X className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                )}
                {corelatoreInvitationForMe && corelatoreInv?.status === 'pending' && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span>Invito come <strong>corelatore</strong></span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_corelatore_invitations', corelatoreInv.id, true)} disabled={actionLoading}>
                        <Check className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_corelatore_invitations', corelatoreInv.id, false)} disabled={actionLoading}>
                        <X className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Docente: Mi interessa (candidatura) per tesi senza relatore/corelatore - solo se nessun invito pendente */}
            {isDocente && proposal.status === 'open' && (
              <div className="space-y-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                {!proposal.relatore_id && (!relatoreInv || relatoreInv.status !== 'pending') && !currentDocenteRelatoreApp && (
                  <Button variant="primary" onClick={handleApplyRelatore} disabled={actionLoading}>
                    <ThumbsUp className="w-4 h-4 mr-2" /> Mi interessa come relatore
                  </Button>
                )}
                {!proposal.relatore_id && currentDocenteRelatoreApp && currentDocenteRelatoreApp.status === 'pending' && (
                  <p className="text-amber-800 text-sm">Candidatura come relatore in attesa di risposta dallo studente</p>
                )}
                {!proposal.corelatore_id && (!corelatoreInv || corelatoreInv.status !== 'pending') && !currentDocenteCorelatoreApp && (
                  <Button variant="outline" onClick={handleApplyCorelatore} disabled={actionLoading}>
                    <ThumbsUp className="w-4 h-4 mr-2" /> Mi interessa come corelatore
                  </Button>
                )}
                {!proposal.corelatore_id && currentDocenteCorelatoreApp && currentDocenteCorelatoreApp.status === 'pending' && (
                  <p className="text-amber-800 text-sm">Candidatura come corelatore in attesa di risposta dallo studente</p>
                )}
              </div>
            )}

            {/* Studente: Candidature in attesa */}
            {isOwner && (relatoreApps.some((a) => a.status === 'pending') || corelatoreApps.some((a) => a.status === 'pending')) && (
              <div className="space-y-4 p-4 rounded-lg bg-green-50 border border-green-200">
                <h2 className="text-lg font-bold text-gray-900">Candidature in attesa</h2>
                {relatoreApps.filter((a) => a.status === 'pending').map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span><strong>Relatore:</strong> {docenteNames[app.docente_id] || 'Docente'}</span>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleApplicationResponse('thesis_relatore_applications', app.id, true)} disabled={actionLoading}>
                        <Check className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleApplicationResponse('thesis_relatore_applications', app.id, false)} disabled={actionLoading}>
                        <X className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                ))}
                {corelatoreApps.filter((a) => a.status === 'pending').map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span><strong>Corelatore:</strong> {docenteNames[app.docente_id] || 'Docente'}</span>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleApplicationResponse('thesis_corelatore_applications', app.id, true)} disabled={actionLoading}>
                        <Check className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleApplicationResponse('thesis_corelatore_applications', app.id, false)} disabled={actionLoading}>
                        <X className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {(isOwner || isDocente) && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap justify-between items-center gap-3">
                {isOwner && (
                  <Button variant="outline" onClick={handleDelete} disabled={actionLoading} className="text-red-600 border-red-300 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina proposta
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <Link href="/tesi">
                    <Button variant="outline">Torna alle Proposte</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Card>
    </div>
  )
}


