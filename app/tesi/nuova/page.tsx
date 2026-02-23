'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Loader2, BookOpen, FileText } from 'lucide-react'

export default function NewThesisProposalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [methodology, setMethodology] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const { error: insertError } = await supabase
        .from('thesis_proposals')
        .insert({
          student_id: user.id,
          title: title.trim(),
          description: description.trim(),
          objectives: objectives.trim() || null,
          methodology: methodology.trim() || null,
          status: 'open',
        })

      if (insertError) throw insertError

      router.push('/tesi')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating thesis proposal:', err)
      setError(err.message || 'Errore durante la creazione della proposta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
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

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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

