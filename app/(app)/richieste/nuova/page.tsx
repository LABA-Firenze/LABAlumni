'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Loader2, Briefcase, FileImage } from 'lucide-react'
import { COURSE_CONFIG, type CourseType } from '@/types/database'
import type { PortfolioItem } from '@/types/social'

const requestTypes = [
  { value: 'tirocinio', label: 'Tirocinio' },
  { value: 'stage', label: 'Stage' },
  { value: 'collaborazione', label: 'Collaborazione' },
  { value: 'lavoro', label: 'Lavoro' },
  { value: 'tesi', label: 'Tesi' },
]

const DAYS_OPTIONS = [
  { value: 'Lun-Ven', label: 'Lun-Ven' },
  { value: 'Lun-Sab', label: 'Lun-Sab' },
  { value: 'Lunedì e Mercoledì', label: 'Lunedì e Mercoledì' },
  { value: 'Martedì e Giovedì', label: 'Martedì e Giovedì' },
  { value: 'Flessibile', label: 'Flessibile' },
  { value: 'altro', label: 'Altro (specifica nelle note)' },
]

export default function NewCollaborationRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'company' | null>(null)
  const [requestType, setRequestType] = useState('')
  const [availableDays, setAvailableDays] = useState('')
  const [availableHoursTotal, setAvailableHoursTotal] = useState('')
  const [content, setContent] = useState('')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [canPost, setCanPost] = useState(true)
  const [nextPostDate, setNextPostDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingLimit, setCheckingLimit] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    loadRole()
  }, [user, router])

  useEffect(() => {
    if (user && role === 'student') {
      loadPortfolioItems()
      checkWeeklyLimit()
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

  const checkWeeklyLimit = async () => {
    if (!user) return
    setCheckingLimit(true)
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'collaboration_request')
        .eq('request_from', 'student')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })

      if (data && data.length >= 1) {
        setCanPost(false)
        const lastPost = new Date(data[0].created_at)
        lastPost.setDate(lastPost.getDate() + 7)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!canPost) {
      setError('Hai già pubblicato una richiesta questa settimana. Puoi pubblicare di nuovo dopo il ' + nextPostDate)
      return
    }

    if (!requestType) {
      setError('Seleziona il tipo di richiesta')
      return
    }

    if (!content.trim()) {
      setError('Inserisci almeno una nota o descrizione')
      return
    }

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
          available_days: availableDays || null,
          available_hours_total: availableHoursTotal ? parseInt(availableHoursTotal, 10) : null,
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

  if (!user || role === null || (role === 'student' && checkingLimit)) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (role === 'company') {
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
            <Briefcase className="w-8 h-8 text-primary-600" />
            Mettiti in Vetrina
          </h1>
          <p className="text-gray-600 mt-2">
            Pubblica una richiesta diretta alle aziende. Il tuo corso è già visibile nel profilo.
          </p>
        </div>

        {!canPost && (
          <Card variant="elevated" className="p-4 mb-6 bg-amber-50 border-amber-200">
            <p className="text-amber-800">
              Hai già pubblicato una richiesta questa settimana. Puoi pubblicare di nuovo dopo il {nextPostDate}.
            </p>
            <p className="text-sm text-amber-700 mt-2">Max 1 richiesta di collaborazione a settimana per studente.</p>
          </Card>
        )}

        <Card variant="elevated" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di Richiesta *</label>
              <Select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                required
              >
                <option value="">Seleziona tipo di richiesta</option>
                {requestTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giorni disponibili</label>
              <Select
                value={availableDays}
                onChange={(e) => setAvailableDays(e.target.value)}
              >
                <option value="">Seleziona</option>
                {DAYS_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Input
                label="Ore disponibili totali"
                type="number"
                min={1}
                placeholder="es. 150"
                value={availableHoursTotal}
                onChange={(e) => setAvailableHoursTotal(e.target.value)}
              />
            </div>

            <div>
              <Textarea
                label="Note / Descrizione *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descrivi le tue competenze, cosa cerchi, disponibilità extra..."
                rows={6}
                required
              />
            </div>

            {portfolioItems.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileImage className="w-4 h-4 inline mr-1" />
                  Allega un progetto dal tuo portfolio (opzionale, max 1)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <label className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <input
                      type="radio"
                      name="portfolio"
                      checked={!selectedPortfolioId}
                      onChange={() => setSelectedPortfolioId('')}
                      className="rounded-full border-gray-300 text-primary-600"
                    />
                    <span className="text-sm">Nessun allegato</span>
                  </label>
                  {portfolioItems.map(item => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="portfolio"
                        checked={selectedPortfolioId === item.id}
                        onChange={() => setSelectedPortfolioId(item.id)}
                        className="rounded-full border-gray-300 text-primary-600"
                      />
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Annulla
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !requestType || !content.trim() || !canPost}
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
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
