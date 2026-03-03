'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { BookOpenIcon, DocumentTextIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/solid'
import { COURSE_CONFIG } from '@/types/database'
import type { Docente } from '@/types/database'
import type { Profile } from '@/types/database'

interface DocenteWithProfile extends Docente {
  profile: Profile
}

const TOTAL_STEPS = 3

export default function NewThesisProposalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [methodology, setMethodology] = useState('')
  const [relatoreId, setRelatoreId] = useState('')
  const [corelatoreId, setCorelatoreId] = useState('')
  const [relatorePreference, setRelatorePreference] = useState<'si' | 'no' | null>(null)
  const [corelatorePreference, setCorelatorePreference] = useState<'si' | 'no' | null>(null)
  const [docenti, setDocenti] = useState<DocenteWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingProposal, setExistingProposal] = useState<{ id: string; title: string } | null>(null)
  const [studentYear, setStudentYear] = useState<number | null | 'loading'>('loading')

  useEffect(() => {
    if (user && role === 'student') {
      supabase.from('students').select('year').eq('id', user.id).single()
        .then(({ data }) => setStudentYear(data?.year ?? null), () => setStudentYear(null))
    } else if (role !== 'student') {
      setStudentYear('loading')
    }
  }, [user, role])

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => setRole(data?.role || null))
    }
  }, [user])

  useEffect(() => {
    loadDocenti()
  }, [])

  useEffect(() => {
    if (role && role !== 'student') {
      router.replace(role === 'company' ? '/pannello/azienda' : '/tesi')
    }
  }, [role, router])

  useEffect(() => {
    if (user && role === 'student') {
      supabase
        .from('thesis_proposals')
        .select('id, title')
        .eq('student_id', user.id)
        .in('status', ['open', 'in_progress'])
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setExistingProposal(data || null))
    }
  }, [user, role])

  const loadDocenti = async () => {
    const { data: docData } = await supabase
      .from('docenti')
      .select('*')
      .or('can_relatore.eq.true,can_corelatore.eq.true')
    if (!docData?.length) {
      setDocenti([])
      return
    }
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', docData.map((d: { id: string }) => d.id))
    const profMap = new Map((profData || []).map((p: { id: string }) => [p.id, p]))
    setDocenti(docData.map((d: Docente & { id: string }) => ({
      ...d,
      profile: profMap.get(d.id) || { id: d.id, full_name: null, email: null },
    })) as DocenteWithProfile[])
  }

  const relatori = docenti.filter((d) => d.can_relatore)
  const correlatori = docenti.filter((d) => d.can_corelatore && d.id !== relatoreId)

  const validateStep = (step: number): boolean => {
    setError('')
    if (step === 1) {
      if (!title?.trim()) {
        setError('Il titolo è obbligatorio')
        return false
      }
      if (!description?.trim()) {
        setError('La descrizione è obbligatoria')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!validateStep(1)) return

    setLoading(true)
    setError('')

    try {
      const { data: thesisData, error: insertError } = await supabase
        .from('thesis_proposals')
        .insert({
          student_id: user.id,
          title: title.trim(),
          description: description.trim(),
          objectives: objectives.trim() || null,
          methodology: methodology.trim() || null,
          status: 'open',
          relatore_id: null,
          corelatore_id: null,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      const thesisId = thesisData?.id
      if (!thesisId) throw new Error('Errore creazione tesi di laurea')

      if (relatoreId) {
        await supabase.from('thesis_relatore_invitations').insert({
          thesis_id: thesisId,
          docente_id: relatoreId,
          status: 'pending',
        })
      }
      if (corelatoreId) {
        await supabase.from('thesis_corelatore_invitations').insert({
          thesis_id: thesisId,
          docente_id: corelatoreId,
          status: 'pending',
        })
      }

      router.push('/tesi')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating thesis proposal:', err)
      setError(err.message || 'Errore durante la creazione della tesi di laurea')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="Titolo della tesi di laurea *"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es: La comunicazione visiva nel design contemporaneo"
              required
            />
            <Textarea
              label="Descrizione *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi in dettaglio la tua tesi di laurea, il tema centrale, le motivazioni e il contesto..."
              rows={6}
              required
            />
            <p className="text-sm text-gray-500">
              Fornisci una descrizione dettagliata che permetta ai relatori di capire l&apos;argomento e lo scope della tua tesi.
            </p>
          </div>
        )
      case 2:
        return (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <UserCircleIcon className="w-4 h-4 text-primary-600" />
                Hai già in mente il tuo relatore?
              </p>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => { setRelatorePreference('si'); setRelatoreId(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${relatorePreference === 'si' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Sì
                </button>
                <button
                  type="button"
                  onClick={() => { setRelatorePreference('no'); setRelatoreId(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${relatorePreference === 'no' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  No
                </button>
              </div>
              {relatorePreference === 'si' && (
                <>
                  <Select value={relatoreId} onChange={(e) => { setRelatoreId(e.target.value); if (e.target.value === corelatoreId) setCorelatoreId(''); }}>
                    <option value="">Seleziona un relatore</option>
                    {relatori.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.profile?.full_name || d.profile?.email} {d.courses?.length ? `· ${d.courses.map((c: string) => COURSE_CONFIG[c as keyof typeof COURSE_CONFIG]?.name).filter(Boolean).join(', ')}` : ''}
                      </option>
                    ))}
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">Riceverà un invito da accettare.</p>
                </>
              )}
              {relatorePreference === 'no' && (
                <p className="text-sm text-gray-600 bg-primary-50 rounded-lg p-3 border border-primary-100">
                  La proposta è aperta a tutti i docenti: potranno candidarsi come relatore.
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-primary-600" />
                Hai già in mente il tuo corelatore?
              </p>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => { setCorelatorePreference('si'); setCorelatoreId(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${corelatorePreference === 'si' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Sì
                </button>
                <button
                  type="button"
                  onClick={() => { setCorelatorePreference('no'); setCorelatoreId(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${corelatorePreference === 'no' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  No
                </button>
              </div>
              {corelatorePreference === 'si' && (
                <>
                  <Select value={corelatoreId} onChange={(e) => setCorelatoreId(e.target.value)}>
                    <option value="">Seleziona un corelatore</option>
                    {correlatori.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.profile?.full_name || d.profile?.email} {d.courses?.length ? `· ${d.courses.map((c: string) => COURSE_CONFIG[c as keyof typeof COURSE_CONFIG]?.name).filter(Boolean).join(', ')}` : ''}
                      </option>
                    ))}
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">Max 1 relatore + 1 corelatore.</p>
                </>
              )}
              {corelatorePreference === 'no' && (
                <p className="text-sm text-gray-600 bg-primary-50 rounded-lg p-3 border border-primary-100">
                  La proposta è aperta a tutti i docenti: potranno candidarsi come corelatore.
                </p>
              )}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <Textarea
              label="Obiettivi"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Elenca gli obiettivi principali della tua ricerca (opzionale ma consigliato)..."
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Descrivi cosa vuoi ottenere con questa ricerca e quali risultati ti aspetti.
            </p>

            <Textarea
              label="Metodologia"
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              placeholder="Descrivi l'approccio metodologico che intendi utilizzare (opzionale)..."
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Indica come procederai nella ricerca: metodi di analisi, strumenti, fasi del lavoro.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  const isLastStep = currentStep === TOTAL_STEPS
  if (role && role !== 'student') {
    return null
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Indietro
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-primary-600" />
            Nuova Tesi di laurea
          </h1>
          <p className="text-gray-600 mt-2">Pubblica la tua tesi di laurea per trovare un relatore</p>
        </div>

        {role === 'student' && studentYear === 'loading' ? (
          <Card variant="elevated" className="p-6 text-center">
            <div className="flex justify-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          </Card>
        ) : role === 'student' && typeof studentYear === 'number' && studentYear < 3 ? (
          <Card variant="elevated" className="p-6 text-center">
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                La tesi di laurea è disponibile solo dal 3° anno (o fuori corso). Al momento non puoi inviare una tesi di laurea.
              </p>
              <Button variant="outline" onClick={() => router.push('/tesi')}>
                Torna alle tesi di laurea
              </Button>
            </div>
          </Card>
        ) : existingProposal ? (
          <Card variant="elevated" className="p-6 text-center">
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Hai già una tesi di laurea attiva. Per crearne una nuova, elimina prima quella esistente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/tesi/${existingProposal.id}`} className="inline-flex">
                  <Button variant="primary">Vai alla tua tesi di laurea</Button>
                </Link>
                <Button variant="outline" onClick={() => router.push('/tesi')}>
                  Torna alle tesi di laurea
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" className="p-6">
            <p className="text-center text-gray-500 text-sm mb-6">Step {currentStep} di {TOTAL_STEPS}</p>
            <div className="flex gap-1 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${s <= currentStep ? 'bg-primary-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>

            <form onSubmit={isLastStep ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
              {renderStep()}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
                {!isLastStep ? (
                  <Button type="submit" variant="primary">
                    Avanti
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !title.trim() || !description.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pubblicando...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Pubblica Tesi di laurea
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
