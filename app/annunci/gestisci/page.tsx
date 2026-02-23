'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Plus, Edit, Trash2, Eye, EyeOff, Briefcase } from 'lucide-react'
import Link from 'next/link'
import type { JobPost, CourseType } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

const JOB_TYPES = ['tirocinio', 'stage', 'collaborazione', 'lavoro']

export default function ManageJobsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<JobPost | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('tirocinio')
  const [courses, setCourses] = useState<CourseType[]>([])
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/accedi')
      return
    }

    if (user) {
      loadJobs()
    }
  }, [user, authLoading, router])

  const loadJobs = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('job_posts')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })

      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (jobId: string, currentActive: boolean) => {
    await supabase
      .from('job_posts')
      .update({ active: !currentActive })
      .eq('id', jobId)

    loadJobs()
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa offerta?')) return

    await supabase
      .from('job_posts')
      .delete()
      .eq('id', jobId)

    loadJobs()
  }

  const handleEdit = (job: JobPost) => {
    setEditingJob(job)
    setTitle(job.title)
    setDescription(job.description)
    setType(job.type)
    setCourses(job.courses)
    setLocation(job.location || '')
    setRemote(job.remote)
    setActive(job.active)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingJob(null)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setType('tirocinio')
    setCourses([])
    setLocation('')
    setRemote(false)
    setActive(true)
  }

  const toggleCourse = (course: CourseType) => {
    setCourses(prev =>
      prev.includes(course)
        ? prev.filter(c => c !== course)
        : [...prev, course]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || courses.length === 0) {
      alert('Seleziona almeno un corso')
      return
    }

    setSaving(true)
    try {
      const jobData = {
        company_id: user.id,
        title,
        description,
        type,
        courses,
        location: location || null,
        remote,
        active,
      }

      if (editingJob) {
        await supabase
          .from('job_posts')
          .update(jobData)
          .eq('id', editingJob.id)
      } else {
        await supabase
          .from('job_posts')
          .insert(jobData)
      }

      loadJobs()
      handleCancel()
    } catch (error: any) {
      alert(error.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100/80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary-600" />
              Tirocini e Stage
            </h1>
            <p className="text-gray-600 mt-2">Crea e gestisci le tue offerte di tirocinio e stage</p>
          </div>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Nuova Offerta
            </Button>
          )}
        </div>

        {showForm && (
          <Card variant="elevated" className="mb-6">
            <h2 className="text-xl font-semibold mb-6">
              {editingJob ? 'Modifica Offerta' : 'Nuova Offerta'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Titolo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Es: Tirocinio in Graphic Design"
              />

              <Select
                label="Tipo"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>

              <Textarea
                label="Descrizione"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Descrivi la posizione, i requisiti, le responsabilità..."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corsi Richiesti *
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(COURSE_CONFIG).map(([value, config]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleCourse(value as CourseType)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        courses.includes(value as CourseType)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {config.name}
                    </button>
                  ))}
                </div>
                {courses.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">Seleziona almeno un corso</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Es: Firenze, Italia"
                />

                <div className="flex items-center gap-4 pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remote}
                      onChange={(e) => setRemote(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Lavoro remoto</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Offerta attiva</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Salvataggio...' : editingJob ? 'Salva Modifiche' : 'Crea Offerta'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annulla
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Jobs list */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card variant="elevated" className="text-center py-12">
              <p className="text-gray-600">Non hai ancora creato offerte</p>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} variant="elevated">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{job.title}</h2>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        job.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {job.active ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{job.type} • {job.location || 'Remoto'}</p>
                    <p className="text-gray-700 line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.courses.map((course) => (
                        <span key={course} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {COURSE_CONFIG[course]?.name || course}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(job.id, job.active)}
                    >
                      {job.active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(job)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

