'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Loader2, Briefcase, FileImage, ArrowRight, ArrowLeft } from 'lucide-react'
import type { PortfolioItem } from '@/types/social'

const requestTypes = [
  { value: 'tirocinio', label: 'Tirocinio' },
  { value: 'lavoro', label: 'Lavoro' },
]

const TOTAL_STEPS = 3

const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

export default function NewCollaborationRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'company' | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [requestType, setRequestType] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [canPost, setCanPost] = useState(true)
  const [nextPostDate, setNextPostDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingLimit, setCheckingLimit] = useState(true)
  const [studentYear, setStudentYear] = useState<number | null | 'loading'>('loading')
  const [loadingLastDraft, setLoadingLastDraft] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    loadRole()
  }, [user, router])

  useEffect(() => {
    if (user && role === 'student') {
      supabase.from('students').select('year').eq('id', user.id).single()
        .then(({ data }) => setStudentYear(data?.year ?? null), () => setStudentYear(null))
      loadPortfolioItems()
      checkMonthlyLimit()
    } else if (user && role === 'company') {
      router.push('/richieste/azienda/nuova')
    }
  }, [user, role, router])

  const loadRole = async () => {
    if (!user) return
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    setRole(data?.role || null)
  }

  const loadPortfolioItems = async () => {
    if (!user) return
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
    setPortfolioItems(data || [])
  }

  const loadLastRequestAsDraft = async () => {
    if (!user) return
    setLoadingLastDraft(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('content, request_type, available_days, portfolio_item_id')
        .eq('user_id', user.id)
        .eq('type', 'collaboration_request')
        .eq('request_from', 'student')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!data) {
        setError('Nessuna richiesta precedente da cui partire.')
        return
      }
      if (data.request_type) setRequestType(data.request_type)
      if (typeof data.content === 'string') setContent(data.content)
      setSelectedPortfolioId(data.portfolio_item_id || '')
      if (data.available_days && typeof data.available_days === 'string') {
        const parts = data.available_days.split(',').map((s) => s.trim()).filter(Boolean)
        setSelectedDays(parts)
      } else {
        setSelectedDays([])
      }
      setCurrentStep(1)
    } catch (err) {
      console.error(err)
      setError('Impossibile caricare l’ultima richiesta.')
    } finally {
      setLoadingLastDraft(false)
    }
  }

  const checkMonthlyLimit = async () => {
    if (!user) return
    setCheckingLimit(true)
    try {
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)

      const { data } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'collaboration_request')
        .eq('request_from', 'student')
        .gte('created_at', monthAgo.toISOString())
        .order('created_at', { ascending: false })

      if (data && data.length >= 1) {
        setCanPost(false)
        const lastPost = new Date(data[0].created_at)
        lastPost.setDate(lastPost.getDate() + 30)
        setNextPostDate(lastPost.toLocaleDateString('it-IT'))
      } else {
        setCanPost(true)
      }
    } catch (err) {
      console.error('Error checking limit:', err)
      setCanPost(true)
    } finally {
      setCheckingLimit(false)
    }
  }

  const validateStep = (step: number): boolean => {
    setError('')
    if (step === 1 && !requestType) {
      setError('Seleziona il tipo di richiesta')
      return false
    }
    if (step === 2 && !content.trim()) {
      setError('Inserisci almeno una nota o descrizione')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(s => s + 1)
  }

  const handlePrev = () => {
    setCurrentStep(s => s - 1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!canPost) {
      setError('Hai già pubblicato una richiesta questo mese. Puoi pubblicare di nuovo dopo il ' + nextPostDate)
      return
    }
    if (!validateStep(1) || !validateStep(2)) return

    setLoading(true)
    setError('')

    try {
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: 'collaboration_request',
          request_from: 'student',
          content: content.trim(),
          request_type: requestType,
          available_days: selectedDays.length > 0 ? selectedDays.join(', ') : null,
          portfolio_item_id: selectedPortfolioId || null,
        })

      if (postError) throw postError

      router.push('/pannello/studente')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating collaboration request:', err)
      setError(err.message || 'Errore durante la creazione della richiesta')
    } finally {
      setLoading(false)
    }
  }

  if (!user || role === null || (role === 'student' && (checkingLimit || studentYear === 'loading'))) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (role === 'company') {
    return null
  }

  if (role === 'student' && studentYear !== 'loading' && (studentYear === null || studentYear < 2)) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-600" />
            Dai visibilità al tuo talento
          </h1>
        </div>
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-lg text-amber-900 mb-4">
            Le richieste di tirocinio sono disponibili dal 2° anno. Al momento non puoi pubblicare una richiesta.
          </p>
          <Link href="/pannello/studente">
            <Button variant="outline">Torna al pannello</Button>
          </Link>
        </div>
      </div>
    )
  }

  const GIORNI_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-600" />
            Dai visibilità al tuo talento
          </h1>
        <p className="text-gray-600 mt-1.5">
          Pubblica la tua disponibilità per tirocinio o lavoro.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingLastDraft}
            onClick={() => void loadLastRequestAsDraft()}
          >
            {loadingLastDraft ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                Caricamento…
              </>
            ) : (
              'Carica ultima richiesta (bozza)'
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2 max-w-xl">
            Copia tipo, testo, giorni e progetto dall’ultima richiesta pubblicata: potrai modificarli prima di inviare.
          </p>
        </div>
      </div>

      {!canPost && (
          <div className="p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-amber-800">
              Hai già pubblicato una richiesta questo mese. Puoi pubblicare di nuovo dopo il {nextPostDate}.
            </p>
            <p className="text-sm text-amber-700 mt-2">Puoi allegare al massimo 1 progetto dal portfolio. Una nuova richiesta è possibile dopo tale data.</p>
          </div>
      )}

      <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="absolute top-6 right-6 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Bozza</span>
          </div>

          <p className="text-center text-gray-500 text-sm mb-6">Step {currentStep} di {TOTAL_STEPS}</p>
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= currentStep ? 'bg-primary-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          <form onSubmit={currentStep === TOTAL_STEPS ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Cosa stai cercando?</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di richiesta *</label>
                  <div className="relative">
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#FAFAFB] border border-gray-200/90 text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white
                        hover:border-gray-300 transition-all duration-[120ms] appearance-none cursor-pointer
                        shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value="">Seleziona tipo di richiesta</option>
                      {requestTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giorni disponibili</label>
                  <div className="flex flex-wrap gap-2">
                    {GIORNI.map((giorno, i) => (
                      <label
                        key={giorno}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all duration-[120ms]
                          ${selectedDays.includes(giorno)
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-transparent border-gray-200/80 text-gray-600 hover:bg-primary-500/6 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(giorno)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedDays(prev => [...prev, giorno])
                            else setSelectedDays(prev => prev.filter(d => d !== giorno))
                          }}
                          className="sr-only"
                        />
                        {GIORNI_SHORT[i]}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Dicci qualcosa di te</h3>
                <p className="text-sm text-gray-600">Come ti presenti alle aziende e cosa stai cercando.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note / Descrizione *</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Descrivi le tue competenze, cosa cerchi, disponibilità extra..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAFB] border border-gray-200/90 text-gray-900 placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white
                      hover:border-gray-300 transition-all duration-[120ms] resize-none min-h-[140px]
                      shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Rafforza la tua richiesta</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileImage className="w-4 h-4 inline mr-1.5 text-primary-500" />
                    Seleziona un progetto dal portfolio (opzionale, max 1 allegato)
                  </label>
                  {portfolioItems.length === 0 ? (
                    <div className="rounded-xl p-4 bg-secondary-50/80 border border-gray-200/80 text-gray-600 text-sm">
                      Non hai ancora caricato lavori nel portfolio.{' '}
                      <Link href="/portfolio/nuovo" className="text-primary-600 hover:underline font-medium transition-colors duration-[120ms]">
                        Aggiungi un lavoro
                      </Link>{' '}
                      per poterlo allegare alla richiesta.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl p-3 bg-secondary-50/60 border border-gray-200/80">
                      <label className="flex items-center gap-3 p-2.5 hover:bg-white/80 rounded-lg cursor-pointer transition-all duration-[120ms]">
                        <input
                          type="radio"
                          name="portfolio"
                          checked={!selectedPortfolioId}
                          onChange={() => setSelectedPortfolioId('')}
                          className="rounded-full border-gray-300 text-primary-600 focus:ring-primary-500/40 w-4 h-4"
                        />
                        <span className="text-sm">Nessun allegato</span>
                      </label>
                      {portfolioItems.map(item => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-white/80 rounded-lg cursor-pointer transition-all duration-[120ms]"
                        >
                          <input
                            type="radio"
                            name="portfolio"
                            checked={selectedPortfolioId === item.id}
                            onChange={() => setSelectedPortfolioId(item.id)}
                            className="rounded-full border-gray-300 text-primary-600 focus:ring-primary-500/40 w-4 h-4"
                          />
                          <span className="text-sm font-medium truncate">{item.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <div>
                {currentStep === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Annulla
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                  </Button>
                )}
              </div>
              {currentStep < TOTAL_STEPS ? (
                <Button type="submit" variant="primary">
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !canPost}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Pubblicando...
                    </>
                  ) : (
                    'Pubblica Richiesta'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
    </div>
  )
}
