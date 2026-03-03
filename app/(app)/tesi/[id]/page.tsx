'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpenIcon, CalendarIcon, UserIcon, DocumentTextIcon, ArrowLeftIcon, HandThumbUpIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import type { ThesisProposal } from '@/types/social'
import type { Student, Profile } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'
import { getStudentDisplayLabel } from '@/lib/staff-labels'
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
    if (!confirm('Vuoi eliminare questa tesi di laurea? Potrai crearne una nuova dopo.')) return
    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('thesis_proposals')
        .delete()
        .eq('id', thesisId)
        .eq('student_id', user.id)
        .select('id')
      if (error) throw error
      if (!data?.length) {
        alert('Impossibile eliminare la tesi di laurea. Verifica di essere il proprietario o riprova.')
        return
      }
      router.push('/tesi')
      router.refresh()
    } catch (e: unknown) {
      console.error(e)
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Errore durante l\'eliminazione.'
      alert(msg)
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
      <Card variant="elevated" className="p-12 text-center bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
              <BookOpenIcon className="w-12 h-12 text-primary-600" />
            </div>
        <h3 className="text-xl font-semibold mb-2">Tesi di laurea non trovata</h3>
        <p className="text-gray-600 mb-6">La tesi di laurea richiesta non esiste o è stata rimossa.</p>
        <Link href="/tesi">
          <Button variant="primary">Torna alle Tesi di laurea</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Indietro
        </button>

        <Card variant="elevated" className="overflow-hidden border border-gray-100 shadow-sm">
          {/* Header: titolo e meta, pulito */}
          <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-100">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">{proposal.title}</h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    {proposal.student?.profile?.full_name || proposal.student?.profile?.email || 'Studente'}
                  </span>
                  {getStudentDisplayLabel(proposal.student) && (
                    <span className="flex items-center gap-1.5">
                      <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                      {getStudentDisplayLabel(proposal.student)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    {new Date(proposal.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[proposal.status as keyof typeof statusColors]}`}>
                {statusLabels[proposal.status as keyof typeof statusLabels]}
              </span>
            </div>
          </div>

          {/* Contenuto: sezioni con bordo laterale e meno peso visivo */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-8">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 text-primary-500" />
                Descrizione
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>
            </section>

            {proposal.objectives && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Obiettivi</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.objectives}</p>
              </section>
            )}

            {proposal.methodology && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Metodologia</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.methodology}</p>
              </section>
            )}

            {proposal.documents && proposal.documents.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Documenti</h2>
                <div className="space-y-2">
                  {proposal.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2.5 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <DocumentTextIcon className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>Documento {idx + 1}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Docente: Inviti in attesa (relatore/corelatore) */}
            {isDocente && (relatoreInvitationForMe || corelatoreInvitationForMe) && (
              <section className="space-y-3 p-4 rounded-xl bg-primary-50/80 border border-primary-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Inviti in attesa</h2>
                {relatoreInvitationForMe && relatoreInv?.status === 'pending' && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span>Invito come <strong>relatore</strong></span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_relatore_invitations', relatoreInv.id, true)} disabled={actionLoading}>
                        <CheckIcon className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_relatore_invitations', relatoreInv.id, false)} disabled={actionLoading}>
                        <XMarkIcon className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                )}
                {corelatoreInvitationForMe && corelatoreInv?.status === 'pending' && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span>Invito come <strong>corelatore</strong></span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_corelatore_invitations', corelatoreInv.id, true)} disabled={actionLoading}>
                        <CheckIcon className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleInvitationResponse('thesis_corelatore_invitations', corelatoreInv.id, false)} disabled={actionLoading}>
                        <XMarkIcon className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Docente: Mi interessa (candidatura) */}
            {isDocente && proposal.status === 'open' && (
              <section className="space-y-3 p-4 rounded-xl bg-amber-50/80 border border-amber-100">
                {!proposal.relatore_id && (!relatoreInv || relatoreInv.status !== 'pending') && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      onClick={handleApplyRelatore}
                      disabled={actionLoading || !!currentDocenteRelatoreApp}
                      className={currentDocenteRelatoreApp ? 'opacity-70 cursor-not-allowed' : ''}
                    >
                      <HandThumbUpIcon className="w-4 h-4 mr-2" /> Mi interessa come relatore
                    </Button>
                    {currentDocenteRelatoreApp && (
                      <span className="text-amber-800 text-sm">
                        {currentDocenteRelatoreApp.status === 'pending'
                          ? 'Richiesta già inviata, in attesa di risposta dallo studente'
                          : currentDocenteRelatoreApp.status === 'accepted'
                            ? 'Candidatura accettata'
                            : 'Candidatura rifiutata'}
                      </span>
                    )}
                  </div>
                )}
                {!proposal.corelatore_id && (!corelatoreInv || corelatoreInv.status !== 'pending') && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleApplyCorelatore}
                      disabled={actionLoading || !!currentDocenteCorelatoreApp}
                      className={currentDocenteCorelatoreApp ? 'opacity-70 cursor-not-allowed' : ''}
                    >
                      <HandThumbUpIcon className="w-4 h-4 mr-2" /> Mi interessa come corelatore
                    </Button>
                    {currentDocenteCorelatoreApp && (
                      <span className="text-amber-800 text-sm">
                        {currentDocenteCorelatoreApp.status === 'pending'
                          ? 'Richiesta già inviata, in attesa di risposta dallo studente'
                          : currentDocenteCorelatoreApp.status === 'accepted'
                            ? 'Candidatura accettata'
                            : 'Candidatura rifiutata'}
                      </span>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Studente: Candidature in attesa */}
            {isOwner && (relatoreApps.some((a) => a.status === 'pending') || corelatoreApps.some((a) => a.status === 'pending')) && (
              <section className="space-y-3 p-4 rounded-xl bg-green-50/80 border border-green-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Candidature in attesa</h2>
                {relatoreApps.filter((a) => a.status === 'pending').map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span><strong>Relatore:</strong> {docenteNames[app.docente_id] || 'Docente'}</span>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleApplicationResponse('thesis_relatore_applications', app.id, true)} disabled={actionLoading}>
                        <CheckIcon className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleApplicationResponse('thesis_relatore_applications', app.id, false)} disabled={actionLoading}>
                        <XMarkIcon className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                ))}
                {corelatoreApps.filter((a) => a.status === 'pending').map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span><strong>Corelatore:</strong> {docenteNames[app.docente_id] || 'Docente'}</span>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleApplicationResponse('thesis_corelatore_applications', app.id, true)} disabled={actionLoading}>
                        <CheckIcon className="w-4 h-4 mr-1" /> Accetta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleApplicationResponse('thesis_corelatore_applications', app.id, false)} disabled={actionLoading}>
                        <XMarkIcon className="w-4 h-4 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Footer azioni: elimina sobrio + torna indietro */}
          {(isOwner || isDocente) && (
            <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    {actionLoading ? 'Eliminazione...' : 'Elimina tesi di laurea'}
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Link href="/tesi">
                    <span className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors">
                      Torna alle Tesi di laurea
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Card>
    </div>
  )
}


