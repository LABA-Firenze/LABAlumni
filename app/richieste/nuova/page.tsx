'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Loader2, Briefcase } from 'lucide-react'
import { COURSE_CONFIG, type CourseType } from '@/types/database'

const requestTypes = [
  { value: 'tirocinio', label: 'Tirocinio' },
  { value: 'stage', label: 'Stage' },
  { value: 'collaborazione', label: 'Collaborazione' },
  { value: 'lavoro', label: 'Lavoro' },
  { value: 'tesi', label: 'Tesi' },
]

const COURSES = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
  value: value as CourseType,
  label: config.name,
}))

export default function NewCollaborationRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requestType, setRequestType] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCourseToggle = (courseValue: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseValue)
        ? prev.filter(c => c !== courseValue)
        : [...prev, courseValue]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!requestType) {
      setError('Seleziona il tipo di richiesta')
      return
    }

    if (!content.trim()) {
      setError('Descrivi la tua richiesta di collaborazione')
      return
    }

    if (selectedCourses.length === 0) {
      setError('Seleziona almeno un corso di interesse')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create collaboration request post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: 'collaboration_request',
          content: content.trim(),
          request_type: requestType,
          request_courses: selectedCourses,
        })

      if (postError) throw postError

      // Redirect to dashboard
      router.push('/pannello/studente')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating collaboration request:', err)
      setError(err.message || 'Errore durante la creazione della richiesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100/80">
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
            <Briefcase className="w-8 h-8 text-primary-600" />
            Pubblica Richiesta di Collaborazione
          </h1>
          <p className="text-gray-600 mt-2">Descrivi l&apos;opportunità che stai cercando</p>
        </div>

        <Card variant="elevated" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di Richiesta *
              </label>
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

            {/* Courses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corsi di Interesse * (seleziona tutti quelli rilevanti)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                {COURSES.map(course => (
                  <label
                    key={course.value}
                    className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.value)}
                      onChange={() => handleCourseToggle(course.value)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{course.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <Textarea
                label="Descrizione della Richiesta *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descrivi l&apos;opportunità che stai cercando, le tue competenze, la disponibilità, e qualsiasi altro dettaglio rilevante..."
                rows={8}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Esempio: &quot;Cerco un tirocinio in graphic design. Sono al 3° anno di Graphic Design &amp; Multimedia, 
                ho competenze in Adobe Creative Suite e sono disponibile per 3-6 mesi part-time. 
                Interessato a progetti di branding e comunicazione visiva.&quot;
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
                disabled={loading || !requestType || !content.trim() || selectedCourses.length === 0}
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

