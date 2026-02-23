'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
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

const DAYS_OPTIONS = [
  { value: 'Lun-Ven', label: 'Lun-Ven' },
  { value: '2-3 giorni/settimana', label: '2-3 giorni/settimana' },
  { value: 'Flessibile', label: 'Flessibile' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'altro', label: 'Altro (specifica nella descrizione)' },
]

export default function NewCompanyCollaborationRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'company' | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/accedi')
      return
    }
    loadRole()
  }, [user, router])

  useEffect(() => {
    if (user && role === 'student') {
      router.push('/richieste/nuova')
    }
  }, [user, role, router])

  const loadRole = async () => {
    if (!user) return
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    setRole(data?.role || null)
  }
  const [requestType, setRequestType] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [workHours, setWorkHours] = useState('')
  const [interestedDays, setInterestedDays] = useState('')
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
      setError('Seleziona il tipo di offerta')
      return
    }

    if (selectedCourses.length === 0) {
      setError('Seleziona almeno un corso a cui rivolgere l\'offerta')
      return
    }

    if (!content.trim()) {
      setError('Descrivi l\'offerta di collaborazione')
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
          request_from: 'company',
          content: content.trim(),
          request_type: requestType,
          request_courses: selectedCourses,
          work_hours: workHours ? parseInt(workHours, 10) : null,
          interested_days: interestedDays || null,
        })

      if (postError) throw postError

      router.push('/pannello/azienda')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating collaboration offer:', err)
      setError(err.message || 'Errore durante la creazione dell\'offerta')
    } finally {
      setLoading(false)
    }
  }

  if (!user || role === null) {
    return (
      <div className="min-h-screen bg-gray-100/80">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  if (role === 'student') {
    return null
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
            Pubblica Offerta di Collaborazione
          </h1>
          <p className="text-gray-600 mt-2">
            Rivolgiti agli studenti del corso che ti interessa con tirocini, stage o collaborazioni.
          </p>
        </div>

        <Card variant="elevated" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di Offerta *</label>
              <Select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                required
              >
                <option value="">Seleziona tipo</option>
                {requestTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corsi di interesse * (a quali studenti vuoi rivolgerti)
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

            <div>
              <Textarea
                label="Descrizione offerta *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descrivi l'offerta: progetto, mansioni, durata prevista, cosa offrite..."
                rows={6}
                required
              />
            </div>

            <div>
              <Input
                label="Ore lavorative (tirocinio / stage)"
                type="number"
                min={1}
                placeholder="es. 300"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giorni interessati</label>
              <Select
                value={interestedDays}
                onChange={(e) => setInterestedDays(e.target.value)}
              >
                <option value="">Seleziona</option>
                {DAYS_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </div>

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
                disabled={loading || !requestType || selectedCourses.length === 0 || !content.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Pubblicando...
                  </>
                ) : (
                  'Pubblica Offerta'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
