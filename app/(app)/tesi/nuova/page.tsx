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
import { Loader2, BookOpen, FileText, User, Users } from 'lucide-react'
import { COURSE_CONFIG } from '@/types/database'
import type { Docente } from '@/types/database'
import type { Profile } from '@/types/database'

interface DocenteWithProfile extends Docente {
  profile: Profile
}

export default function NewThesisProposalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [methodology, setMethodology] = useState('')
  const [relatoreId, setRelatoreId] = useState('')
  const [corelatoreId, setCorelatoreId] = useState('')
  const [docenti, setDocenti] = useState<DocenteWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!title.trim()) {
      setError('Il titolo è obbligatorio')
      return
    }

    if (!description.trim()) {
      setError('La descrizione è obbligatoria')
      return
    }

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
      if (!thesisId) throw new Error('Errore creazione proposta')

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
      setError(err.message || 'Errore durante la creazione della proposta')
    } finally {
      setLoading(false)
    }
  }

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
            <BookOpen className="w-8 h-8 text-primary-600" />
            Nuova Proposta di Tesi
          </h1>
          <p className="text-gray-600 mt-2">Pubblica la tua proposta di tesi per trovare un relatore</p>
        </div>

        <Card variant="elevated" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Relatore (opzionale) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1.5 text-primary-600" />
                Relatore
              </label>
              <Select value={relatoreId} onChange={(e) => { setRelatoreId(e.target.value); if (e.target.value === corelatoreId) setCorelatoreId(''); }}>
                <option value="">Nessun relatore (i docenti potranno candidarsi)</option>
                {relatori.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profile?.full_name || d.profile?.email} {d.courses?.length ? `· ${d.courses.map((c: string) => COURSE_CONFIG[c as keyof typeof COURSE_CONFIG]?.name).filter(Boolean).join(', ')}` : ''}
                  </option>
                ))}
              </Select>
              <p className="text-sm text-gray-500 mt-1">Opzionale. Se selezioni un relatore, riceverà un invito da accettare. Altrimenti i docenti potranno candidarsi.</p>
            </div>

            {/* Corelatore (opzionale) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1.5 text-primary-600" />
                Corelatore
              </label>
              <Select value={corelatoreId} onChange={(e) => setCorelatoreId(e.target.value)}>
                <option value="">Nessun corelatore</option>
                {correlatori.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profile?.full_name || d.profile?.email} {d.courses?.length ? `· ${d.courses.map((c: string) => COURSE_CONFIG[c as keyof typeof COURSE_CONFIG]?.name).filter(Boolean).join(', ')}` : ''}
                  </option>
                ))}
              </Select>
              <p className="text-sm text-gray-500 mt-1">Opzionale. Max 1 relatore + 1 corelatore.</p>
            </div>

            {/* Title */}
            <div>
              <Input
                label="Titolo della Proposta *"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: La comunicazione visiva nel design contemporaneo"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Textarea
                label="Descrizione *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi in dettaglio la tua proposta di tesi, il tema centrale, le motivazioni e il contesto..."
                rows={6}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Fornisci una descrizione dettagliata che permetta ai relatori di capire l&apos;argomento e lo scope della tua tesi.
              </p>
            </div>

            {/* Objectives */}
            <div>
              <Textarea
                label="Obiettivi"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Elenca gli obiettivi principali della tua ricerca (opzionale ma consigliato)..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-2">
                Descrivi cosa vuoi ottenere con questa ricerca e quali risultati ti aspetti.
              </p>
            </div>

            {/* Methodology */}
            <div>
              <Textarea
                label="Metodologia"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="Descrivi l'approccio metodologico che intendi utilizzare (opzionale)..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-2">
                Indica come procederai nella ricerca: metodi di analisi, strumenti, fasi del lavoro.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Annulla
              </Button>
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
                    <FileText className="w-4 h-4 mr-2" />
                    Pubblica Proposta
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

